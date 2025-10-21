import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ImapSyncService } from './services/ImapSyncService';

import { ElasticsearchService } from './services/ElasticsearchService';
import { AICategorizationService } from './services/AICategorizationService';
import { EmailProcessingPipeline } from './services/EmailProcessingPipeline';


// Import routes
import analyticsRoutes from './routes/analytics';
import emailRoutes from './routes/emails';
import accountRoutes from './routes/account';
import ragRoutes from './routes/rag';

// Load environment variables
dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://0.0.0.0:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());
app.use('/api/accounts', accountRoutes);

// Initialize services
const imapService = new ImapSyncService({
    user: process.env.IMAP_USER!,
    password: process.env.IMAP_PASSWORD!,
    host: process.env.IMAP_HOST!,
    port: parseInt(process.env.IMAP_PORT || '993'),
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
});

const esService = new ElasticsearchService();
const aiService = new AICategorizationService();

// Create processing pipeline
const emailPipeline = new EmailProcessingPipeline(imapService, esService, aiService);

// Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/rag', ragRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        services: {
            elasticsearch: 'Connected',
            ai: 'Ready',
            imap: 'Configured'
        }
    });
});

// Start server and pipeline
async function startServer() {
    try {
        // Start the server
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`🚀 ReachInbox server running on http://0.0.0.0:${port}`);
            console.log(`📊 Analytics API: http://localhost:${port}/api/analytics`);
            console.log(`📧 Emails API: http://localhost:${port}/api/emails`);
            console.log(`👤 Accounts API: http://localhost:${port}/api/accounts`);
            console.log(`🤖 RAG API: http://localhost:${port}/api/rag`);
            console.log(`🔍 Elasticsearch: ${process.env.ELASTICSEARCH_URL}`);
            console.log(`🧠 Google AI: ${process.env.GOOGLE_AI_API_KEY ? 'Configured' : 'Not configured'}`);
        });

        // Start email processing pipeline
        await emailPipeline.start();
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();