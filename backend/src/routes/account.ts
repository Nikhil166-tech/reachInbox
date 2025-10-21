import express from 'express';
import { EmailAccount } from '../types/account';

const router = express.Router();

// Mock data matching your frontend mockup
const mockAccounts: EmailAccount[] = [
    {
        id: '1',
        name: 'joe',
        email: 'joe@company.com',
        folders: ['INBOX', 'Sent', 'Archive'],
        type: 'primary'
    },
    {
        id: '2', 
        name: 'support',
        email: 'support@company.com',
        folders: ['INBOX', 'Archive'],
        type: 'support'
    },
    {
        id: '3',
        name: 'sales', 
        email: 'sales@company.com',
        folders: ['Sent', 'INBOX'],
        type: 'sales'
    }
];

// Get all accounts
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: mockAccounts
    });
});

// Get account by ID
router.get('/:id', (req, res) => {
    const account = mockAccounts.find(acc => acc.id === req.params.id);
    if (!account) {
        return res.status(404).json({
            success: false,
            error: 'Account not found'
        });
    }
    res.json({
        success: true,
        data: account
    });
});

export default router;