import { EventEmitter } from 'events';
import { ImapSyncService } from './ImapSyncService';
import { ElasticsearchService } from './ElasticsearchService';
import { AICategorizationService } from './AICategorizationService';
import { Email } from '../types/email';

export class EmailProcessingPipeline extends EventEmitter {
    private imapService: ImapSyncService;
    private esService: ElasticsearchService;
    private aiService: AICategorizationService;
    private isProcessing: boolean = false;

    constructor(
        imapService: ImapSyncService,
        esService: ElasticsearchService,
        aiService: AICategorizationService
    ) {
        super();
        this.imapService = imapService;
        this.esService = esService;
        this.aiService = aiService;
    }

    async start(): Promise<void> {
        console.log('🚀 Starting Email Processing Pipeline...');
        
        // Initialize Elasticsearch
        await this.esService.initialize();
        
        // Start IMAP real-time sync
        await this.startIMAPSync();
        
        console.log('✅ Email Processing Pipeline started');
    }

    private async startIMAPSync(): Promise<void> {
        // We need to modify ImapSyncService to emit events for new emails
        // For now, let's create a simple integration
        
        console.log('📧 Starting IMAP real-time sync...');
        
        // This is a temporary integration - we'll improve it
        setInterval(async () => {
            if (!this.isProcessing) {
                await this.syncAndProcessEmails();
            }
        }, 30000); // Check every 30 seconds initially
    }

    async syncAndProcessEmails(): Promise<void> {
        this.isProcessing = true;
        try {
            console.log('🔄 Syncing and processing emails...');
            
            // Use the sync method from ImapSyncService
            const syncResult = await this.imapService.syncEmails();
            
            if (syncResult.success && syncResult.newEmails.length > 0) {
                console.log(`📨 Processing ${syncResult.newEmails.length} new emails...`);
                
                for (const rawEmail of syncResult.newEmails) {
                    await this.processSingleEmail(rawEmail);
                }
            }
            
        } catch (error) {
            console.error('❌ Error in email sync:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async processSingleEmail(rawEmail: any): Promise<void> {
        try {
            console.log(`🔄 Processing email: "${rawEmail.subject}"`);
            
            // 1. Convert to standardized format
            const email: Email = this.mapToEmailFormat(rawEmail);
            
            // 2. AI Categorization
            console.log(`🤖 Analyzing with AI...`);
            const aiResult = await this.aiService.categorizeEmail(email);
            email.category = aiResult.category;
            
            // 3. Index in Elasticsearch
            console.log(`💾 Indexing in Elasticsearch...`);
            await this.esService.indexEmail(email);
            
            console.log(`✅ Processed: "${email.subject}" → ${email.category}`);
            
            // Emit event for real-time updates
            this.emit('emailProcessed', email);
            
        } catch (error) {
            console.error(`❌ Failed to process email:`, error);
        }
    }

    private mapToEmailFormat(rawEmail: any): Email {
        return {
            id: rawEmail.id || `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            subject: rawEmail.subject || 'No Subject',
            from: typeof rawEmail.from === 'string' ? rawEmail.from : 'unknown@example.com',
            to: Array.isArray(rawEmail.to) ? rawEmail.to : [rawEmail.to || 'unknown@example.com'],
            body: rawEmail.body || '',
            date: rawEmail.date || new Date(),
            read: rawEmail.read || false,
            starred: rawEmail.starred || false,
            category: 'Uncategorized'
        };
    }

    async stop(): Promise<void> {
        this.imapService.disconnect();
        console.log('🛑 Email Processing Pipeline stopped');
    }
}