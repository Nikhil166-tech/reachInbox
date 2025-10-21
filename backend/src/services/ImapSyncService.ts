import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { Email, Attachment, SyncResult } from '../types/email';

// Type assertion for IMAP with IDLE methods
interface ImapWithIdle extends Imap {
    idle(callback: (err: Error) => void): void;
    idleStop(): void;
}

export class ImapSyncService {
    private imap: ImapWithIdle;
    private isIdle: boolean = false;
    private reconnectTimer: NodeJS.Timeout | null = null;

    constructor(config: Imap.Config) {
        // Type assertion to bypass TypeScript checks
        this.imap = new Imap(config) as ImapWithIdle;
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.imap.once('ready', () => resolve());
            this.imap.once('error', (err: Error) => reject(err));
            this.imap.connect();
        });
    }

    async startRealTimeSync(): Promise<void> {
        await this.connect();
        
        this.imap.openBox('INBOX', true, (err) => {
            if (err) {
                console.error('Error opening inbox:', err);
                return;
            }

            console.log('🔄 Starting IMAP IDLE mode...');
            
            // Use type assertion for IDLE method
            (this.imap as any).idle((idleErr: Error) => {
                if (idleErr) {
                    console.error('IDLE error:', idleErr);
                }
            });

            this.isIdle = true;

            // Set up reconnect timer (29 minutes)
            this.reconnectTimer = setTimeout(() => {
                this.restartIdle();
            }, 29 * 60 * 1000);
        });

        // Listen for new emails
        this.imap.on('mail', async (numNewMsgs: number) => {
            console.log(`📧 New email detected: ${numNewMsgs} new messages`);
            await this.fetchNewEmails();
        });
    }

    private async restartIdle(): Promise<void> {
        if (this.imap && this.isIdle) {
            console.log('🔄 Restarting IDLE mode...');
            // Use type assertion for idleStop
            (this.imap as any).idleStop();
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.startRealTimeSync();
        }
    }

    private async fetchNewEmails(): Promise<void> {
        try {
            const fetch = this.imap.seq.fetch('1:*', {
                bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
                struct: true
            });

            fetch.on('message', (msg) => {
                let emailData: any = {};

                msg.on('body', (stream, info) => {
                    let buffer = '';
                    stream.on('data', (chunk) => {
                        buffer += chunk.toString('utf8');
                    });
                    stream.on('end', () => {
                        if (info.which === 'TEXT') {
                            emailData.body = buffer;
                        } else {
                            // Parse headers
                            const lines = buffer.split('\r\n');
                            lines.forEach(line => {
                                if (line.startsWith('From:')) emailData.from = line.substring(5).trim();
                                else if (line.startsWith('To:')) emailData.to = [line.substring(3).trim()];
                                else if (line.startsWith('Subject:')) emailData.subject = line.substring(8).trim();
                                else if (line.startsWith('Date:')) emailData.date = new Date(line.substring(5).trim());
                            });
                        }
                    });
                });

                msg.once('end', () => {
                    if (emailData.subject && emailData.from) {
                        const email: Email = {
                            id: `imap-${Date.now()}-${Math.random()}`,
                            subject: emailData.subject,
                            from: emailData.from,
                            to: emailData.to || ['unknown@example.com'],
                            body: emailData.body || '',
                            date: emailData.date || new Date(),
                            read: false,
                            starred: false
                        };
                        console.log(`✅ New email processed: ${email.subject}`);
                    }
                });
            });

        } catch (error) {
            console.error('Error fetching emails:', error);
        }
    }

    async syncEmails(): Promise<SyncResult> {
        const result: SyncResult = {
            success: true,
            processed: 0,
            failed: 0,
            newEmails: [],
            errors: []
        };

        try {
            await this.connect();

            return new Promise((resolve) => {
                this.imap.openBox('INBOX', false, (err: Error | null, box: Imap.Box) => {
                    if (err) {
                        result.success = false;
                        result.errors.push(err.message);
                        resolve(result);
                        return;
                    }

                    const fetch = this.imap.seq.fetch('1:10', {
                        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
                        struct: true
                    });

                    fetch.on('message', (msg: Imap.ImapMessage) => {
                        let emailData: any = {};

                        msg.on('body', (stream: NodeJS.ReadableStream, info: any) => {
                            let buffer = '';
                            stream.on('data', (chunk: Buffer) => {
                                buffer += chunk.toString('utf8');
                            });
                            stream.on('end', () => {
                                if (info.which === 'TEXT') {
                                    emailData.body = buffer;
                                } else {
                                    // Parse headers
                                    const lines = buffer.split('\r\n');
                                    lines.forEach(line => {
                                        if (line.startsWith('From:')) {
                                            emailData.from = line.substring(5).trim();
                                        } else if (line.startsWith('To:')) {
                                            emailData.to = [line.substring(3).trim()];
                                        } else if (line.startsWith('Subject:')) {
                                            emailData.subject = line.substring(8).trim();
                                        } else if (line.startsWith('Date:')) {
                                            emailData.date = new Date(line.substring(5).trim());
                                        }
                                    });
                                }
                            });
                        });

                        msg.once('end', () => {
                            if (emailData.subject && emailData.from) {
                                const email: Email = {
                                    id: `imap-${Date.now()}-${result.processed}`,
                                    subject: emailData.subject,
                                    from: emailData.from,
                                    to: emailData.to || ['unknown@example.com'],
                                    body: emailData.body || '',
                                    date: emailData.date || new Date(),
                                    read: false,
                                    starred: false
                                };
                                result.newEmails.push(email);
                                result.processed++;
                            } else {
                                result.failed++;
                            }
                        });
                    });

                    fetch.once('error', (err: Error) => {
                        result.success = false;
                        result.errors.push(err.message);
                        resolve(result);
                    });

                    fetch.once('end', () => {
                        this.disconnect();
                        resolve(result);
                    });
                });
            });
        } catch (error: any) {
            result.success = false;
            result.errors.push(error.message);
            return result;
        }
    }

    disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        if (this.imap && this.isIdle) {
            // Use type assertion for idleStop
            (this.imap as any).idleStop();
            this.isIdle = false;
        }

        this.imap.end();
    }

    // Helper method to get email addresses
    private getAddresses(addresses: any): string[] {
        if (!addresses) return [];
        if (Array.isArray(addresses)) {
            return addresses.map(addr =>
                typeof addr === 'string' ? addr : addr.address
            );
        }
        return [addresses.address];
    }
}