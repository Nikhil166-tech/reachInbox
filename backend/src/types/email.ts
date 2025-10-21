export interface Email {
    id: string;
    subject: string;
    from: string;
    to: string[];
    body: string;
    date: Date;
    read: boolean;
    starred: boolean;
    category?: string;
    priority?: string;
    labels?: string[];
    cc?: string[];
    bcc?: string[];
    attachments?: Attachment[];
}

export interface Attachment {
    filename: string;
    content: Buffer;
    contentType: string;
    size: number;
}

export interface EmailSearchParams {
    query: string;
    category?: string;
    priority?: string;
    limit?: number;
    offset?: number;
}

export interface EmailFilter {
    category?: string;
    priority?: string;
    read?: boolean;
    starred?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface EmailSearchCriteria {
    query?: string;
    filters?: EmailFilter;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface SyncResult {
    success: boolean;
    processed: number;
    failed: number;
    newEmails: Email[];
    errors: string[];
}

export interface AICategorizationResult {
    category: string;
    priority: string;
    confidence: number;
    labels: string[];
}

// ==================== ANALYTICS TYPES ====================

export type EmailCategory = 'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office' | 'Uncategorized';

export interface AnalyticsOverview {
    totalEmails: number;
    categorizedEmails: number;
    interestedLeads: number;
    responseRate: number;
    avgResponseTime: number;
    spamCount: number;
    meetingCount: number;
    oooCount: number;
    notInterestedCount: number;
}

export interface CategoryDistribution {
    category: EmailCategory;
    count: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    change?: number;
}

export interface EmailTrends {
    date: string;
    total: number;
    interested: number;
    meetings: number;
    spam: number;
    notInterested: number;
    ooo: number;
}

export interface PerformanceMetrics {
    period: string;
    emailsProcessed: number;
    leadsGenerated: number;
    meetingsScheduled: number;
    avgCategorizationTime: number;
    categorizationAccuracy?: number;
}

export interface AnalyticsResponse {
    overview: AnalyticsOverview;
    categories: CategoryDistribution[];
    trends: EmailTrends[];
    performance: PerformanceMetrics[];
    period: string;
}

// Email Document for Database/Storage
export interface EmailDocument {
    id: string;
    accountId?: string;
    folder?: string;
    subject: string;
    body: string;
    from: { name: string; address: string };
    to: { name: string; address: string }[];
    date: Date;
    aiCategory?: EmailCategory;
    threadId?: string;
    messageId?: string;
    indexedAt?: Date;
    read?: boolean;
    starred?: boolean;
    priority?: string;
    labels?: string[];
}

// Email Account for IMAP
export interface EmailAccount {
    id: string;
    email: string;
    password: string;
    imapConfig: {
        host: string;
        port: number;
        useSSL: boolean;
    };
}

// Search and Filter Types
export interface SearchFilters {
    accountId?: string;
    folder?: string;
    category?: EmailCategory;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
    query?: string;
}

export interface SearchResponse {
    emails: EmailDocument[];
    total: number;
    page: number;
    pageSize: number;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}