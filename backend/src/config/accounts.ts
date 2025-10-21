import { EmailAccount } from '../types/account';

export const emailAccounts: EmailAccount[] = [
  {
    id: 'account_1',
    name: 'Primary Gmail',
    email: process.env.EMAIL_1 || 'your.first.email@gmail.com',
    provider: 'gmail',
    imapConfig: {
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT || '993'),
      secure: process.env.IMAP_USE_SSL === 'true',
      auth: {
        user: process.env.EMAIL_1 || 'your.first.email@gmail.com',
        pass: process.env.PASSWORD_1
      }
    },
    smtpConfig: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_1 || 'your.first.email@gmail.com',
        pass: process.env.PASSWORD_1
      }
    },
    syncEnabled: true,
    lastSync: new Date('2024-01-01'),
    labels: ['inbox', 'sent', 'drafts', 'important'],
    categories: ['primary', 'social', 'promotions', 'updates']
  },
  {
    id: 'account_2',
    name: 'Secondary Gmail',
    email: process.env.EMAIL_2 || '',
    provider: 'gmail',
    imapConfig: {
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT || '993'),
      secure: process.env.IMAP_USE_SSL === 'true',
      auth: {
        user: process.env.EMAIL_2 || '',
        pass: process.env.PASSWORD_2
      }
    },
    smtpConfig: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_2 || '',
        pass: process.env.PASSWORD_2
      }
    },
    syncEnabled: !!process.env.EMAIL_2 && !!process.env.PASSWORD_2,
    lastSync: new Date('2024-01-01'),
    labels: ['inbox', 'sent', 'drafts'],
    categories: ['primary', 'work']
  }
];

// ... rest of your existing functions remain the same
export function getAccountById(id: string): EmailAccount | undefined {
  return emailAccounts.find(account => account.id === id);
}

export function getAccountByEmail(email: string): EmailAccount | undefined {
  return emailAccounts.find(account => account.email === email);
}

export function addAccount(account: EmailAccount): void {
  const existing = emailAccounts.find(acc => acc.id === account.id || acc.email === account.email);
  if (existing) {
    throw new Error('Account with this ID or email already exists');
  }
  
  emailAccounts.push(account);
}

export function updateAccount(id: string, updates: Partial<EmailAccount>): EmailAccount | null {
  const index = emailAccounts.findIndex(account => account.id === id);
  if (index === -1) {
    return null;
  }

  emailAccounts[index] = { ...emailAccounts[index], ...updates };
  return emailAccounts[index];
}

export function deleteAccount(id: string): boolean {
  const index = emailAccounts.findIndex(account => account.id === id);
  if (index === -1) {
    return false;
  }

  emailAccounts.splice(index, 1);
  return true;
}

export function getSyncEnabledAccounts(): EmailAccount[] {
  return emailAccounts.filter(account => account.syncEnabled);
}

export const getEmailAccounts = getSyncEnabledAccounts;

export function validateAccountConfig(account: EmailAccount): string[] {
  const errors: string[] = [];

  if (!account.id) {
    errors.push('Account ID is required');
  }

  if (!account.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(account.email)) {
    errors.push('Invalid email format');
  }

  if (!account.name) {
    errors.push('Account name is required');
  }

  if (!account.provider) {
    errors.push('Provider is required');
  }

  if (account.imapConfig) {
    if (!account.imapConfig.host) {
      errors.push('IMAP host is required');
    }
    if (!account.imapConfig.port) {
      errors.push('IMAP port is required');
    }
    if (!account.imapConfig.auth.user) {
      errors.push('IMAP username is required');
    }
  }

  return errors;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}