import { Email } from '../types/email';

export class TestEmailGenerator {
    static generateTestEmails(count: number = 10): Email[] {
        const categories: any[] = ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office'];
        const senders = [
            'alice.johnson@company.com', 
            'bob.smith@startup.io', 
            'charlie.brown@tech.org',
            'diana.ross@consulting.com', 
            'evan.wright@enterprise.net'
        ];
        
        const subjects = [
            'Quick question about your RAG implementation',
            'Your meeting is confirmed for Tuesday', 
            'Following up on our recent conversation',
            'Win a free tablet! Urgent Limited time offer!',
            'Out of Office: Vacation Notice',
            'Not interested in your services',
            'Demo request for next week',
            'Pricing information needed',
            'Calendar invite: Product Review',
            'Auto-reply: Away from desk'
        ];
        
        const emails: Email[] = [];
        
        for (let i = 0; i < count; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const sender = senders[Math.floor(Math.random() * senders.length)];
            const subject = subjects[Math.floor(Math.random() * subjects.length)];
            
            emails.push({
                id: `email-${Date.now()}-${i}`,
                subject: subject,
                from: sender,
                to: ['team@reachinbox.com'],
                body: this.generateBody(category, subject),
                date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                read: Math.random() > 0.3,
                starred: Math.random() > 0.8,
                category: category
            });
        }
        
        return emails;
    }
    
    private static generateBody(category: string, subject: string): string {
        const bodies: { [key: string]: string } = {
            'Interested': `Hi team,\n\n${subject}\n\nI would like to learn more about your RAG implementation and how it could benefit our organization. Can we schedule a call to discuss this further?\n\nBest regards,\nSender`,
            'Meeting Booked': `Hello,\n\n${subject}\n\nPlease find the meeting details below:\n- Date: Tuesday, 2:00 PM EST\n- Duration: 30 minutes\n- Meeting Link: https://meet.google.com/abc-def-ghi\n\nLooking forward to our discussion!\n\nBest,\nSender`,
            'Not Interested': `Hi,\n\n${subject}\n\nThank you for reaching out, but we are not interested in your services at this time. Please remove us from your mailing list.\n\nRegards,\nSender`,
            'Spam': `URGENT NOTIFICATION!\n\n${subject}\n\nCongratulations! You have been selected to receive a FREE tablet. This is a limited time offer. Click here to claim now: http://bit.ly/fake-link\n\nDon't miss out!\nSpam Team`,
            'Out of Office': `Auto-reply: ${subject}\n\nI am currently out of the office with limited email access. I will respond to your message when I return.\n\nExpected return: Next Monday\n\nThank you,\nSender`
        };
        
        return bodies[category] || `This is a test email about: ${subject}`;
    }
}