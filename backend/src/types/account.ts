export interface EmailAccount {
    id: string;
    name: string;
    email: string;
    folders: string[];
    type: 'primary' | 'support' | 'sales';
}

export interface Folder {
    id: string;
    name: string;
    accountId: string;
    emailCount: number;
}

export interface AICategoryStats {
    interested: number;
    spam: number;
    outOfOffice: number;
    meetingBooked: number;
    notInterested: number;
}