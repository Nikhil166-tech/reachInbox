import express from 'express';
import { RAGService } from '../services/RAGService';

const router = express.Router();
const ragService = new RAGService();

// Generate RAG-powered reply
router.post('/suggest-reply', async (req, res) => {
    try {
        const { emailContent, originalQuery } = req.body;

        if (!emailContent) {
            return res.status(400).json({
                success: false,
                error: 'Email content is required'
            });
        }

        console.log('🔄 Starting RAG pipeline for email reply generation...');

        const reply = await ragService.generateContextualReply(
            emailContent,
            originalQuery || emailContent.substring(0, 100)
        );

        res.json({
            success: true,
            data: {
                reply,
                generatedAt: new Date().toISOString(),
                contextUsed: true
            }
        });

    } catch (error: any) {
        console.error('RAG route error:', error);
        res.status(500).json({
            success: false,
            error: 'RAG reply generation failed: ' + error.message
        });
    }
});

// Simple context endpoint that works with our current service
router.get('/context', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter is required'
            });
        }

        // For now, return a simple context since retrieveRelevantContext doesn't exist
        const context = ["Meeting link: https://calendly.com/reachinbox/quick-chat"];

        res.json({
            success: true,
            data: {
                query,
                contextChunks: context,
                totalChunks: context.length
            }
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: 'Context retrieval failed: ' + error.message
        });
    }
});

export default router;