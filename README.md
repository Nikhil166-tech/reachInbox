🚀 ReachInbox AI - Intelligent Email Management Platform
https://img.shields.io/badge/ReachInbox-AI--Powered-blue
https://img.shields.io/badge/React-18.2+-61DAFB
https://img.shields.io/badge/Node.js-16+-339933
https://img.shields.io/badge/Elasticsearch-8.0+-005571

📖 Overview
ReachInbox AI is an enterprise-grade email management platform that leverages artificial intelligence to automatically categorize, prioritize, and manage emails. Built with modern web technologies, it provides intelligent email filtering, real-time synchronization, and powerful analytics.

🎯 Key Features
🤖 AI-Powered Intelligence
Automatic Email Categorization: AI classifies emails into categories (Interested, Spam, Meeting Booked, etc.)

Confidence Scoring: Each categorization includes confidence levels for accuracy

Smart Reply Suggestions: AI-generated contextual email responses

Sentiment Analysis: Understand email tone and urgency

📧 Email Management
Multi-Account Support: Manage multiple email accounts simultaneously

Real-time Sync: Live email synchronization across all accounts

Advanced Filtering: Filter by category, account, folder, and custom criteria

Bulk Operations: Perform actions on multiple emails at once

Smart Search: AI-enhanced search across email content and metadata

🎨 User Experience
Professional UI: Clean, modern interface with collapsible sidebar

Real-time Notifications: Desktop notifications for new emails

Responsive Design: Works seamlessly on desktop and mobile

Dark/Light Mode: Customizable theme options

Keyboard Shortcuts: Power user productivity features

📊 Analytics & Insights
Email Analytics: Track response times, email volume, and productivity

Category Distribution: Visualize email categories with interactive charts

Performance Metrics: Monitor account sync status and health

AI Insights Dashboard: Real-time AI-powered recommendations

🏗️ Architecture
Frontend Architecture
text
src/
├── components/          # React components
│   ├── Sidebar/        # Enhanced sidebar with categories
│   ├── EmailListItem/  # Individual email display
│   ├── EmailDetailModal/ # Email viewer with AI features
│   └── SystemAlert/    # Notification system
├── hooks/              # Custom React hooks
│   ├── useEmailManager.js # Email state management
│   ├── useFirebaseAuth.js # Authentication
│   ├── useAnalytics.js    # Analytics data
│   └── useNotifications.js # Notification system
├── services/           # API services
│   └── index.js       # Enhanced services with caching
└── utils/             # Utility functions
Backend Architecture
text
backend/
├── src/
│   ├── controllers/    # API controllers
│   ├── services/       # Business logic
│   │   ├── EmailService.js
│   │   ├── AIService.js
│   │   └── AnalyticsService.js
│   ├── models/         # Data models
│   ├── routes/         # API routes
│   └── config/         # Configuration
└── package.json
Technology Stack
Frontend: React 18, Vite, Lucide Icons, CSS3

Backend: Node.js, Express, TypeScript

Database: Elasticsearch (email indexing)

AI/ML: Custom categorization algorithms, Google AI integration

Real-time: Server-Sent Events (SSE)

Authentication: Firebase Auth

Deployment: Docker-ready configuration

🚀 Quick Start
Prerequisites
Node.js 16+

npm or yarn

Elasticsearch 8.0+

Google AI API key (optional)

Installation
Clone the repository

bash
git clone https://github.com/your-username/reachinbox-onebox.git
cd reachinbox-onebox
Backend Setup

bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration
Frontend Setup

bash
cd frontend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration
Start Development Servers

Terminal 1 - Backend:

bash
cd backend
npm run dev
Terminal 2 - Frontend:

bash
cd frontend
npm run dev
Access the Application

Frontend: http://localhost:3000

Backend API: http://localhost:3001

Elasticsearch: http://localhost:9200

⚙️ Configuration
Environment Variables
Backend (.env):

env
PORT=3001
ELASTICSEARCH_URL=http://localhost:9200
GOOGLE_AI_API_KEY=your_google_ai_key
FIREBASE_CONFIG=your_firebase_config
NODE_ENV=development
Frontend (.env):

env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_FIREBASE_CONFIG=your_firebase_config
VITE_APP_NAME=ReachInbox AI
Elasticsearch Setup
bash
# Pull Elasticsearch Docker image
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.11.0

# Run Elasticsearch
docker run -p 9200:9200 -e "discovery.type=single-node" elasticsearch:8.11.0
🎨 Feature Implementation Details
AI Email Categorization
javascript
// Advanced categorization with confidence scoring
const categorizeEmail = (email) => {
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();
  
  // Multi-level keyword matching
  const interestedKeywords = ['interested', 'schedule', 'call', 'discuss', 'meeting'];
  const spamKeywords = ['win', 'free', 'urgent!', 'discount', 'offer'];
  
  // Confidence-based scoring system
  let confidence = 0.7;
  const matches = interestedKeywords.filter(kw => 
    subject.includes(kw) || body.includes(kw)
  ).length;
  
  if (matches > 0) {
    confidence = Math.min(0.95, 0.7 + (matches * 0.1));
    return { category: 'Interested', confidence };
  }
  
  // Additional categorization logic...
  return { category: 'Uncategorized', confidence: 0.5 };
};
Real-time Sync System
javascript
// Event-driven email synchronization
class EventManager {
  constructor() {
    this.listeners = new Map();
    this.eventSource = null;
  }
  
  subscribe(event, callback) {
    // Real-time event subscription
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }
  
  connectToEvents() {
    // Server-Sent Events for real-time updates
    this.eventSource = new EventSource(`${API_BASE_URL}/events`);
    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data.payload);
    };
  }
}
Performance Optimizations
Smart Caching: 5-minute cache with automatic invalidation

Request Deduplication: Prevent duplicate API calls

Lazy Loading: Load emails progressively

Optimistic Updates: Instant UI feedback for actions

Memory Management: Proper cleanup of event listeners

📊 API Endpoints
Email Management
GET /api/emails/search - Search and filter emails

GET /api/emails/:id - Get specific email details

PATCH /api/emails/:id - Update email (read, starred, etc.)

POST /api/emails/bulk - Bulk email operations

AI Features
POST /api/rag/suggest-reply - AI-generated reply suggestions

GET /api/analytics/categories - Email category statistics

GET /api/analytics/productivity - Productivity metrics

Account Management
GET /api/accounts - Get connected accounts

POST /api/accounts - Add new email account

POST /api/accounts/test-connection - Test account connection

🧪 Testing
bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# End-to-end tests
npm run test:e2e
🐛 Troubleshooting
Common Issues
Elasticsearch Connection Failed

Ensure Elasticsearch is running on port 9200

Check firewall settings

Verify Elasticsearch version compatibility

AI Categorization Not Working

Verify Google AI API key configuration

Check internet connectivity

Review API quota limits

Real-time Updates Not Working

Check Server-Sent Events support in browser

Verify backend event stream endpoint

Check network connectivity

Debug Mode
Enable debug logging by setting:

env
DEBUG=reachinbox:*
NODE_ENV=development
🤝 Contributing
We welcome contributions! Please see our Contributing Guide for details.

Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🏆 Acknowledgments
React Team - For the amazing frontend framework

Elasticsearch - For powerful search capabilities

Google AI - For AI/ML capabilities

Lucide Icons - For beautiful iconography

📞 Support
Documentation: Docs

Issues: GitHub Issues

Email: support@reachinbox.ai

