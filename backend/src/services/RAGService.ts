import { GoogleGenerativeAI } from '@google/generative-ai';

export class RAGService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
    }

    async retrieveRelevantContext(emailContent: string): Promise<string[]> {
        console.log('🔍 RAG: Analyzing email for context...');
        const emailText = emailContent.toLowerCase();
        console.log(`📧 Email: "${emailText.substring(0, 80)}..."`);
        
        const contexts: string[] = [];
        
        if (emailText.includes('meeting') || emailText.includes('schedule') || emailText.includes('call') || emailText.includes('discuss')) {
            contexts.push("MEETING CONTEXT: Standard meeting link: https://calendly.com/reachinbox/quick-chat (15-minute introductory calls)");
            console.log('✅ Found meeting context');
        }
        
        if (emailText.includes('price') || emailText.includes('cost') || emailText.includes('pricing') || emailText.includes('$')) {
            contexts.push("PRICING CONTEXT: Enterprise pricing - Tier 1 (1-10 users): $49/user/month, Tier 2 (11-50): $39/user/month, Tier 3 (51+): $29/user/month");
            console.log('✅ Found pricing context');
        }
        
        if (emailText.includes('technical') || emailText.includes('help') || emailText.includes('support') || emailText.includes('issue')) {
            contexts.push("SUPPORT CONTEXT: Technical support available Mon-Fri 9AM-6PM PST. Documentation: https://docs.reachinbox.com");
            console.log('✅ Found support context');
        }
        
        console.log(`🎯 Selected ${contexts.length} context chunks`);
        return contexts;
    }

    async generateContextualReply(emailContent: string, originalQuery: string): Promise<string> {
        console.log('\n🚀 === RAG PIPELINE STARTING ===');
        
        try {
            // Step 1: Get relevant context
            const contextChunks = await this.retrieveRelevantContext(emailContent);
            
            if (contextChunks.length === 0) {
                console.log('❌ No relevant context found - using fallback');
                return this.generateFallbackReply();
            }

            console.log('📝 Constructing prompt with context...');
            
            // Step 2: Construct RAG prompt
            const prompt = this.constructRAGPrompt(emailContent, contextChunks);
            
            // Step 3: Generate reply using Gemini - WITH CORRECT MODEL
            console.log('🤖 Calling Gemini API...');
            const model = this.genAI.getGenerativeModel({ 
                model: "gemini-1.5-pro", // Updated model name
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                }
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const reply = response.text();

            console.log('✅ Generated context-aware reply');
            return reply;

        } catch (error: any) {
            console.error('❌ RAG generation error:', error.message);
            // Fallback to mock generation
            return this.mockAIGeneration(emailContent);
        }
    }

    private constructRAGPrompt(emailContent: string, contextChunks: string[]): string {
        return `You are a professional email assistant for ReachInbox. Generate a helpful, context-aware reply to the following email.

BUSINESS CONTEXT (Use this information in your response):
${contextChunks.join('\n\n')}

ORIGINAL EMAIL TO REPLY TO:
${emailContent}

Write a professional, helpful reply that uses the relevant business context. Be specific and include any relevant links or information from the context. Keep it concise and friendly.`;
    }

    private mockAIGeneration(emailContent: string): string {
        // Fallback mock generation
        const emailText = emailContent.toLowerCase();
        
        if (emailText.includes('meeting') || emailText.includes('schedule') || emailText.includes('call')) {
            return `Thank you for your interest in scheduling a meeting!

You can book a 15-minute introductory call directly using our scheduling link:
https://calendly.com/reachinbox/quick-chat

Looking forward to connecting!

Best regards,
The ReachInbox Team`;
        }
        
        if (emailText.includes('price') || emailText.includes('cost') || emailText.includes('pricing')) {
            return `Thank you for your inquiry about our pricing!

Our enterprise plans:
• 1-10 users: $49/user/month
• 11-50 users: $39/user/month  
• 51+ users: $29/user/month

14-day free trial available.

Best regards,
The ReachInbox Team`;
        }
        
        return this.generateFallbackReply();
    }

    private generateFallbackReply(): string {
        return `Thank you for your email. We appreciate you reaching out to ReachInbox.

One of our specialists will review your inquiry and get back to you shortly.

Best regards,
The ReachInbox Team`;
    }
}