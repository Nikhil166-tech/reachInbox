import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST - before any other imports
const envPath = path.resolve(process.cwd(), '.env');
console.log('🔧 Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Debug environment variables
console.log('🔧 Environment check:');
console.log('   GOOGLE_AI_API_KEY exists:', !!process.env.GOOGLE_AI_API_KEY);
console.log('   GOOGLE_AI_API_KEY length:', process.env.GOOGLE_AI_API_KEY?.length);
console.log('');

// Now import other modules
import { AICategorizationService } from './services/AICategorizationService';
import { ElasticsearchService } from './services/ElasticsearchService';
import { WebhookService } from './services/WebhookService';
import { Email } from './types/email';

class ReachInboxCLI {
    private aiService: AICategorizationService;
    public esService: ElasticsearchService;
    private webhookService: WebhookService;

    constructor() {
        this.aiService = new AICategorizationService();
        this.esService = new ElasticsearchService();
        this.webhookService = new WebhookService();
    }

    async initialize() {
        console.log('🚀 Initializing ReachInbox CLI...\n');
        await this.esService.initialize();
        console.log('✅ Services initialized\n');
    }

    async processSampleEmails() {
        console.log('📧 Processing Sample Emails...\n');

        const sampleEmails: Email[] = [
            {
                id: '1',
                subject: 'Urgent: Quarterly Review Meeting',
                from: 'ceo@company.com',
                to: ['team@company.com'],
                body: 'We need to schedule the quarterly review meeting. Please prepare your reports. This is very important and requires your immediate attention.',
                date: new Date(),
                read: false,
                starred: false
            },
            {
                id: '2',
                subject: '50% OFF - Limited Time Deal!',
                from: 'promotions@store.com',
                to: ['customer@email.com'],
                body: 'Get 50% off all items this weekend. Limited stock available! Shop now and save big on our entire collection.',
                date: new Date(),
                read: false,
                starred: false
            },
            {
                id: '3',
                subject: 'Lunch Meeting Tomorrow',
                from: 'colleague@company.com',
                to: ['you@company.com'],
                body: 'Are you available for lunch tomorrow to discuss the project? Let me know what time works for you.',
                date: new Date(),
                read: false,
                starred: false
            },
            {
                id: '4',
                subject: 'Your LinkedIn connection request',
                from: 'linkedin@linkedin.com',
                to: ['user@example.com'],
                body: 'You have a new connection request from Jane Smith at Tech Corp.',
                date: new Date(),
                read: false,
                starred: false
            },
            {
                id: '5',
                subject: 'Invoice #INV-2024-001 from Web Services Inc',
                from: 'billing@webservices.com',
                to: ['user@example.com'],
                body: 'Please find your invoice attached. Payment is due within 30 days.',
                date: new Date(),
                read: false,
                starred: false
            }
        ];

        for (const email of sampleEmails) {
            console.log(`\n--- Processing: "${email.subject}" ---`);
            
            // AI Categorization
            const categorization = await this.aiService.categorizeEmail(email);
            console.log(`🤖 AI Analysis:`);
            console.log(`   Category: ${categorization.category}`);
            console.log(`   Priority: ${categorization.priority}`);
            console.log(`   Confidence: ${categorization.confidence}`);
            console.log(`   Labels: ${categorization.labels.join(', ') || 'none'}`);

            // Create a new email object with AI results
            const processedEmail: Email = {
                ...email,
                category: categorization.category,
                priority: categorization.priority,
                labels: categorization.labels
            };

            // Index in Elasticsearch
            try {
                await this.esService.indexEmail(processedEmail);
                console.log(`💾 Indexed in Elasticsearch`);
            } catch (error: any) {
                console.log(`💾 Elasticsearch: ${error.message}`);
            }

            // Send webhook notification
            try {
                await this.webhookService.sendEmailNotification(processedEmail, 'processed');
                console.log(`🔗 Webhook notification sent`);
            } catch (error: any) {
                console.log(`🔗 Webhook: ${error.message}`);
            }
        }

        console.log('\n✅ All sample emails processed!');
    }

    async searchEmails(query: string = '') {
        console.log(`🔍 Searching emails: "${query}"\n`);
        
        try {
            const results = await this.esService.searchEmails({
                query: query,
                limit: 10
            });

            if (results.length === 0) {
                console.log('No emails found matching your search.');
                return;
            }

            console.log(`Found ${results.length} emails:\n`);
            
            results.forEach((email, index) => {
                console.log(`${index + 1}. ${email.subject}`);
                console.log(`   From: ${email.from}`);
                console.log(`   Category: ${email.category || 'Uncategorized'}`);
                
                // Handle date properly
                let dateStr = 'Unknown date';
                if (email.date) {
                    try {
                        const date = typeof email.date === 'string' ? new Date(email.date) : email.date;
                        dateStr = date.toLocaleDateString();
                    } catch (e) {
                        dateStr = 'Invalid date';
                    }
                }
                console.log(`   Date: ${dateStr}`);
                
                console.log(`   Priority: ${email.priority || 'normal'}`);
                console.log('   ---');
            });
        } catch (error: any) {
            console.log(`Search failed: ${error.message}`);
        }
    }

    async showStats() {
        console.log('📊 System Statistics:\n');
        
        // Try to get email count from Elasticsearch
        try {
            const recentEmails = await this.esService.searchEmails({ 
                query: '',
                limit: 1000 
            });
            console.log(`📨 Total Emails: ${recentEmails.length}`);
            
            // Count by category
            const categoryCount: { [key: string]: number } = {};
            const priorityCount: { [key: string]: number } = {};
            
            recentEmails.forEach(email => {
                const category = email.category || 'uncategorized';
                const priority = email.priority || 'normal';
                
                categoryCount[category] = (categoryCount[category] || 0) + 1;
                priorityCount[priority] = (priorityCount[priority] || 0) + 1;
            });

            console.log('\n📂 Emails by Category:');
            Object.entries(categoryCount).forEach(([category, count]) => {
                console.log(`   - ${category}: ${count}`);
            });

            console.log('\n🎯 Emails by Priority:');
            Object.entries(priorityCount).forEach(([priority, count]) => {
                console.log(`   - ${priority}: ${count}`);
            });
        } catch (error: any) {
            console.log(`📨 Unable to connect to Elasticsearch for statistics`);
        }
    }

    async cleanupIndex() {
        console.log('🧹 Cleaning up Elasticsearch index...\n');
        
        try {
            const exists = await this.esService.client.indices.exists({ 
                index: this.esService.indexName 
            });
            
            if (exists) {
                await this.esService.client.indices.delete({ 
                    index: this.esService.indexName 
                });
                console.log('✅ Index deleted');
            }
            
            // Reinitialize with new mapping
            await this.esService.initialize();
            console.log('✅ Index recreated with proper mapping');
            
        } catch (error: any) {
            console.log('Cleanup error:', error.message);
        }
    }

    async testAICategorization() {
        console.log('🧠 Testing AI Categorization...\n');
        
        const testEmails = [
            {
                subject: 'URGENT: Server Down - Production Issue',
                from: 'alerts@company.com',
                body: 'The production server is down. Immediate action required.'
            },
            {
                subject: 'Weekly Newsletter - Tech Updates',
                from: 'newsletter@tech.com',
                body: 'Check out the latest tech news and updates in our weekly newsletter.'
            },
            {
                subject: 'Meeting: Project Kickoff',
                from: 'pm@company.com',
                body: 'Lets schedule a project kickoff meeting for next week.'
            }
        ];

        for (const testEmail of testEmails) {
            const email: Email = {
                id: `test-${Date.now()}`,
                ...testEmail,
                to: ['test@example.com'],
                date: new Date(),
                read: false,
                starred: false
            };

            console.log(`Testing: "${email.subject}"`);
            const result = await this.aiService.categorizeEmail(email);
            console.log(`   → Category: ${result.category}, Priority: ${result.priority}, Confidence: ${result.confidence}`);
            console.log('   ---');
        }
    }
}

// CLI Handler
async function main() {
    const cli = new ReachInboxCLI();
    
    const command = process.argv[2] || 'demo';
    
    try {
        await cli.initialize();

        switch (command) {
            case 'demo':
                await cli.processSampleEmails();
                break;
                
            case 'search':
                const query = process.argv[3] || '';
                await cli.searchEmails(query);
                break;
                
            case 'stats':
                await cli.showStats();
                break;

            case 'cleanup':
                await cli.cleanupIndex();
                break;

            case 'test-ai':
                await cli.testAICategorization();
                break;
                
            case 'help':
                showHelp();
                break;
                
            default:
                console.log(`Unknown command: ${command}`);
                showHelp();
        }
        
    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

function showHelp() {
    console.log(`
🤖 ReachInbox CLI Commands:

npm run cli demo      - Process sample emails with AI categorization
npm run cli search    - Search emails (add query as second argument)
npm run cli stats     - Show system statistics
npm run cli cleanup   - Clean up and recreate Elasticsearch index
npm run cli test-ai   - Test AI categorization with sample emails
npm run cli help      - Show this help message

Examples:
  npm run cli demo
  npm run cli search "urgent meeting"
  npm run cli stats
  npm run cli cleanup
  npm run cli test-ai
    `);
}

if (require.main === module) {
    main().catch(console.error);
}

export { ReachInboxCLI };