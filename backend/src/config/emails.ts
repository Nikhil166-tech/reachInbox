import { EmailFilter, EmailSearchCriteria, Email } from '../types/email';

// Sample email configuration and templates
export const sampleEmails: Email[] = [
    {
        id: 'sample-1',
        subject: 'Welcome to ReachInbox',
        from: 'support@reachinbox.com',
        to: ['user@example.com'],
        body: 'Thank you for choosing ReachInbox. We are excited to have you on board!',
        date: new Date(),
        read: false,
        starred: false,
        category: 'primary',
        priority: 'normal'
    },
    {
        id: 'sample-2',
        subject: 'Your Weekly Report',
        from: 'reports@company.com',
        to: ['user@example.com'],
        body: 'Here is your weekly activity report. Please review and let us know if you have any questions.',
        date: new Date(),
        read: false,
        starred: false,
        category: 'updates',
        priority: 'normal'
    }
];

// Default search criteria
export const defaultSearchCriteria: EmailSearchCriteria = {
    query: '',
    limit: 20,
    offset: 0,
    sortBy: 'date',
    sortOrder: 'desc'
};

// Common email filters
export const commonFilters: { [key: string]: EmailFilter } = {
    unread: { read: false },
    starred: { starred: true },
    important: { priority: 'high' },
    promotions: { category: 'promotions' },
    social: { category: 'social' }
};