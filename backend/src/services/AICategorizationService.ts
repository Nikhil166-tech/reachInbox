import { GoogleGenerativeAI } from '@google/generative-ai';
import { WebhookService } from './WebhookService';

export class AICategorizationService {
    private genAI: GoogleGenerativeAI;
    private webhookService: WebhookService;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
        this.webhookService = new WebhookService();
    }

    async categorizeEmail(email: any): Promise<any> {
        try {
            const model = this.genAI.getGenerativeModel({ 
                model: "gemini-pro",
                generationConfig: {
                    temperature: 0.1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            });

            const prompt = `
Analyze this email and categorize it into exactly one of these categories:
- Interested: Shows interest in product/service, asks for meeting/demo, requests pricing
- Meeting Booked: Confirms scheduled meeting, calendar invites, appointment confirmations  
- Not Interested: Explicitly declines, unsubscribes, requests removal
- Spam: Promotional content, scams, irrelevant offers
- Out of Office: Auto-replies, vacation notices, away messages

Email Subject: ${email.subject}
Email From: ${email.from}
Email Body: ${email.body}

Respond ONLY with the category name, nothing else.
`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const category = response.text().trim();

            // Validate category
            const validCategories = ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office'];
            const finalCategory = validCategories.includes(category) ? category : 'Uncategorized';

            console.log(`🏷️ AI Categorized email as: ${finalCategory}`);

            // Trigger webhooks if category is "Interested"
            if (finalCategory === 'Interested') {
                await this.webhookService.triggerInterestedLead({
                    ...email,
                    aiCategory: finalCategory
                });
            }

            return {
                category: finalCategory,
                confidence: 'high',
                analyzedAt: new Date().toISOString()
            };

        } catch (error: any) {
            console.error('AI Categorization error:', error);
            return {
                category: 'Uncategorized',
                confidence: 'low', 
                error: error.message
            };
        }
    }
}