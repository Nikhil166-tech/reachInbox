const API_BASE_URL = 'http://localhost:3001/api';

// Email API functions
const emailAPI = {
  async searchEmails({ searchTerm, accountFilter, folderFilter } = {}) {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (accountFilter) params.append('account', accountFilter);
      if (folderFilter) params.append('folder', folderFilter);
      
      const response = await fetch(`${API_BASE_URL}/emails/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Search emails error:', error);
      return []; // Return empty array on error
    }
  },

  async getEmail(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/${id}`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Get email error:', error);
      return null;
    }
  },

  async generateReply(emailId, emailContent) {
    try {
      const response = await fetch(`${API_BASE_URL}/emails/${emailId}/suggest-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailContent })
      });
      const data = await response.json();
      return data.success ? data.reply : 'Failed to generate reply';
    } catch (error) {
      console.error('Generate reply error:', error);
      return 'Error generating reply';
    }
  }
};

// Account API functions
const accountAPI = {
  async getAccounts() {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Get accounts error:', error);
      return [];
    }
  }
};

// Mock data for fallback - USING THE CORRECT DATA
const mockAPI = {
  async searchEmails({ searchTerm, accountFilter, folderFilter } = {}) {
    // Return the specific mock data we want to see
    const mockEmails = [
      {
        id: 'msg_001',
        accountId: 'joe@reach.io',
        folder: 'INBOX',
        subject: 'Quick question about your RAG implementation',
        from: 'Alice Johnson <alice@techcorp.com>',
        to: ['joe@reach.io'],
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        body: "Hi Joe, I saw your documentation on the RAG pipeline using Qdrant. We are highly interested in implementing a similar architecture for our internal knowledge base. Can we schedule a 15-minute call sometime next week? Let me know your availability.",
        aiCategory: 'Interested',
        read: false,
        starred: false
      },
      {
        id: 'msg_002',
        accountId: 'support@reach.io',
        folder: 'INBOX',
        subject: 'FWD: Your meeting is confirmed for Tuesday',
        from: 'Calendar Bot <no-reply@scheduler.com>',
        to: ['support@reach.io'],
        date: new Date(Date.now() - 86400000 * 0.5).toISOString(),
        body: "This is a confirmation that your meeting with Alex Smith is scheduled for 10:00 AM PST on Tuesday, October 22nd. Agenda: Discuss pricing model.",
        aiCategory: 'Meeting Booked',
        read: false,
        starred: false
      },
      {
        id: 'msg_003',
        accountId: 'sales@reach.io',
        folder: 'Sent',
        subject: 'Following up on our recent conversation',
        from: 'sales@reach.io',
        to: ['mark@competitor.com'],
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        body: "Mark, thanks for the chat. I've attached the full proposal. Let me know what you think!",
        aiCategory: 'Uncategorized',
        read: true,
        starred: false
      },
      {
        id: 'msg_004',
        accountId: 'joe@reach.io',
        folder: 'INBOX',
        subject: 'Win a free tablet! Urgent!',
        from: 'Spammy Sender <blast@marketing.net>',
        to: ['joe@reach.io'],
        date: new Date(Date.now() - 86400000 * 1).toISOString(),
        body: "Click here to win a free tablet! Offer expires in 2 hours. This is an urgent email.",
        aiCategory: 'Spam',
        read: false,
        starred: false
      },
      {
        id: 'msg_005',
        accountId: 'support@reach.io',
        folder: 'Archive',
        subject: 'Out of Office Reply',
        from: 'Bob <bob@acme.org>',
        to: ['support@reach.io'],
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        body: "Thanks for your email. I am currently out of the office until November 1st with limited access to email. I will respond to your query upon my return.",
        aiCategory: 'Out of Office',
        read: true,
        starred: true
      }
    ];

    // Apply filters if provided
    let filteredEmails = mockEmails;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredEmails = filteredEmails.filter(email => 
        email.subject.toLowerCase().includes(searchLower) ||
        email.body.toLowerCase().includes(searchLower) ||
        email.from.toLowerCase().includes(searchLower)
      );
    }
    
    if (accountFilter) {
      filteredEmails = filteredEmails.filter(email => 
        email.accountId === accountFilter
      );
    }
    
    if (folderFilter) {
      filteredEmails = filteredEmails.filter(email => 
        email.folder === folderFilter
      );
    }

    return filteredEmails;
  },

  async getAccounts() {
    return [
      { id: 'acc_001', email: 'joe@reach.io', name: 'Joe' },
      { id: 'acc_002', email: 'support@reach.io', name: 'Support' },
      { id: 'acc_003', email: 'sales@reach.io', name: 'Sales' }
    ];
  }
};

// Export all APIs
export { emailAPI, accountAPI, mockAPI };