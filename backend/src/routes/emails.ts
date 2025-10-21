import express from 'express';
import { ElasticsearchService } from '../services/ElasticsearchService';
import { TestEmailGenerator } from '../utils/TestEmailGenerator';
import { EmailSearchParams } from '../types/email';
import { DemoDataGenerator } from '../utils/DemoDataGenerator';


const router = express.Router();
const esService = new ElasticsearchService();

router.post('/demo/setup', async (req, res) => {
    try {
        const demoEmails = DemoDataGenerator.generateMockupEmails();
        
        console.log('📧 Setting up demo data...');
        
        // Index demo emails in Elasticsearch
        for (const email of demoEmails) {
            await esService.indexEmail(email);
        }
        
        res.json({
            success: true,
            message: 'Demo data setup completed',
            emails: demoEmails
        });
    } catch (error: any) {
        console.error('Demo setup error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to setup demo data: ' + error.message
        });
    }
});

// Get all emails
router.get('/', async (req, res) => {
    try {
        const searchParams: EmailSearchParams = {
            query: '',
            limit: 100
        };
        const emails = await esService.searchEmails(searchParams);
        
        res.json({
            success: true,
            data: emails,
            total: emails.length
        });
    } catch (error: any) {
        console.error('Get emails error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get emails: ' + error.message
        });
    }
});

// Search emails
router.get('/search', async (req, res) => {
    try {
        const { q, category, limit, offset } = req.query;
        
        const searchParams: EmailSearchParams = {
            query: q as string,
            category: category as string,
            limit: limit ? parseInt(limit as string) : 50,
            offset: offset ? parseInt(offset as string) : 0
        };

        console.log(`🔍 Searching emails:`, searchParams);

        const emails = await esService.searchEmails(searchParams);
        
        res.json({
            success: true,
            data: emails,
            total: emails.length,
            searchParams
        });
    } catch (error: any) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            error: 'Search failed: ' + error.message
        });
    }
});

// Generate test emails
router.post('/test/generate', async (req, res) => {
    try {
        const { count = 10 } = req.body;
        const testEmails = TestEmailGenerator.generateTestEmails(count);
        
        console.log(`📧 Generating ${testEmails.length} test emails...`);
        
        // Index test emails in Elasticsearch
        for (const email of testEmails) {
            await esService.indexEmail(email);
        }
        
        res.json({
            success: true,
            message: `Generated and indexed ${testEmails.length} test emails`,
            emails: testEmails
        });
    } catch (error: any) {
        console.error('Error generating test emails:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate test emails: ' + error.message
        });
    }
});

// Sync emails (force sync)
router.post('/sync', async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Sync triggered',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Sync error:', error);
        res.status(500).json({
            success: false,
            error: 'Sync failed: ' + error.message
        });
    }
});

// Get email by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        res.json({
            success: true,
            data: {
                id,
                subject: 'Sample Email',
                from: 'sender@example.com',
                body: 'This is a sample email body',
                date: new Date().toISOString(),
                category: 'Uncategorized'
            }
        });
    } catch (error: any) {
        console.error('Get email error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get email: ' + error.message
        });
    }
});

// Update email (mark as read, starred, etc.)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        await esService.updateEmail(id, updates);
        
        res.json({
            success: true,
            message: 'Email updated successfully',
            id,
            updates
        });
    } catch (error: any) {
        console.error('Update email error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update email: ' + error.message
        });
    }
});

// Delete email
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await esService.deleteEmail(id);
        
        res.json({
            success: true,
            message: 'Email deleted successfully',
            id
        });
    } catch (error: any) {
        console.error('Delete email error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete email: ' + error.message
        });
    }
});

export default router;