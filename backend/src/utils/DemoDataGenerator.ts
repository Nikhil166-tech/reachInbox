import { Email } from '../types/email';

export class DemoDataGenerator {
    static generateMockupEmails(): Email[] {
        return [
            {
                id: 'demo-1',
                subject: 'Quick question about your RAG implementation',
                from: 'Alice Johnson',
                to: ['joe@company.com'],
                body: 'Hi, I have some questions about your RAG implementation and would like to learn more about how it works.',
                date: new Date('2024-10-18T19:36:00'),
                read: false,
                starred: false,
                category: 'Interested',
                labels: ['work']
            },
            {
                id: 'demo-2',
                subject: 'FWD: Your meeting is confirmed for Tuesday',
                from: 'Calendar Bot',
                to: ['support@company.com'],
                body: 'Your meeting has been confirmed for Tuesday at 2:00 PM. Please find the details attached.',
                date: new Date('2024-10-20T07:36:00'),
                read: true,
                starred: false,
                category: 'Interested',
                labels: ['meeting']
            },
            {
                id: 'demo-3',
                subject: 'Following up on our recent conversation',
                from: 'sales@reach.io',
                to: ['sales@company.com'],
                body: 'Just following up on our conversation from last week. Let me know if you have any questions!',
                date: new Date('2024-10-17T19:36:00'),
                read: true,
                starred: false,
                category: 'Spam',
                labels: []
            },
            {
                id: 'demo-4',
                subject: 'Win a free tablet! Urgent! Limited time offer!',
                from: 'Spammy Sender',
                to: ['joe@company.com'],
                body: 'Congratulations! You have been selected to win a FREE tablet. Click here to claim now!',
                date: new Date('2024-10-19T19:36:00'),
                read: false,
                starred: false,
                category: 'Spam',
                labels: []
            },
            {
                id: 'demo-5',
                subject: 'Out of Office: Vacation Notice',
                from: 'Bob',
                to: ['support@company.com'],
                body: 'I am currently out of the office on vacation and will return next Monday.',
                date: new Date('2024-10-15T19:36:00'),
                read: true,
                starred: false,
                category: 'Out of Office',
                labels: []
            },
            {
                id: 'demo-6',
                subject: 'Not interested in your services',
                from: 'John Doe',
                to: ['joe@company.com'],
                body: 'Thank you for reaching out, but we are not interested in your services at this time.',
                date: new Date('2024-10-16T19:36:00'),
                read: true,
                starred: false,
                category: 'Interested',
                labels: []
            }
        ];
    }
}