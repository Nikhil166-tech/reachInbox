import axios from 'axios';

export class WebhookService {
    private slackWebhookUrl: string;
    private genericWebhookUrl: string;

    constructor() {
        this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/demo/demo/demo';
        this.genericWebhookUrl = process.env.GENERIC_WEBHOOK_URL || 'https://webhook.site/demo';
    }

    async triggerInterestedLead(emailData: any): Promise<void> {
        try {
            console.log('🚀 Triggering webhooks for Interested lead:', emailData.subject);
            await this.triggerSlackWebhook(emailData);
            await this.triggerGenericWebhook(emailData);
            console.log('✅ Webhooks triggered successfully');
        } catch (error) {
            console.error('❌ Webhook trigger failed:', error);
        }
    }

    async sendEmailNotification(emailData: any, type: string): Promise<void> {
        console.log(`📧 ${type} notification for: ${emailData.subject}`);
        // Stub implementation for compilation
        return Promise.resolve();
    }

    private async triggerSlackWebhook(emailData: any): Promise<void> {
        // Existing implementation...
        const slackMessage = {
            text: `🎯 *New Interested Lead Found!*`,
            attachments: [
                {
                    color: "good",
                    fields: [
                        {
                            title: "Subject",
                            value: emailData.subject,
                            short: true
                        },
                        {
                            title: "From", 
                            value: emailData.from,
                            short: true
                        }
                    ]
                }
            ]
        };

        await axios.post(this.slackWebhookUrl, slackMessage, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    private async triggerGenericWebhook(emailData: any): Promise<void> {
        const webhookPayload = {
            event: 'interested_lead_detected',
            timestamp: new Date().toISOString(),
            source: 'reachinbox_ai',
            data: {
                email_id: emailData.id,
                subject: emailData.subject,
                from: emailData.from
            }
        };

        await axios.post(this.genericWebhookUrl, webhookPayload, {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}