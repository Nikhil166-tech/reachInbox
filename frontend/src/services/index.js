import { useState, useEffect } from 'react';

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache management
const cache = new Map();
const pendingRequests = new Map();

const getCacheKey = (endpoint, params = {}) => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

const setCache = (key, data, duration = CACHE_DURATION) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    duration
  });
};

const getCache = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > cached.duration;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return cached.data;
};

// Enhanced fetch with timeout, retry, and caching
const enhancedFetch = async (url, options = {}, cacheKey = null, useCache = true) => {
  // Return cached data if available and caching is enabled
  if (useCache && cacheKey) {
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      console.log(`📦 Serving from cache: ${cacheKey}`);
      return cachedData;
    }
  }

  // Prevent duplicate requests
  if (pendingRequests.has(cacheKey)) {
    console.log(`⏳ Waiting for pending request: ${cacheKey}`);
    return pendingRequests.get(cacheKey);
  }

  const timeout = 10000; // 10 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful responses
      if (useCache && cacheKey && response.ok) {
        setCache(cacheKey, data);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
};

// Real-time event management
class EventManager {
  constructor() {
    this.listeners = new Map();
    this.eventSource = null;
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Real-time email updates via Server-Sent Events
  connectToEvents() {
    if (this.eventSource) return;

    try {
      this.eventSource = new EventSource(`${API_BASE_URL}/events`);
      
      this.eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.emit(data.type, data.payload);
      };

      this.eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        this.emit('connection_error', { error: 'Real-time connection lost' });
      };

      this.eventSource.addEventListener('email_received', (event) => {
        const email = JSON.parse(event.data);
        this.emit('email_received', email);
      });

      this.eventSource.addEventListener('email_updated', (event) => {
        const update = JSON.parse(event.data);
        this.emit('email_updated', update);
      });

      this.eventSource.addEventListener('sync_status', (event) => {
        const status = JSON.parse(event.data);
        this.emit('sync_status', status);
      });

    } catch (error) {
      console.error('Failed to connect to real-time events:', error);
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// Create single instance
const eventManager = new EventManager();

// Offline support
const isOnline = () => navigator.onLine;
const offlineQueue = [];

const processOfflineQueue = async () => {
  while (offlineQueue.length > 0 && isOnline()) {
    const { action, resolve, reject } = offlineQueue.shift();
    try {
      const result = await action();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }
};

// Enhanced Email API with real-time features
const emailAPI = {
  async searchEmails({ 
    searchTerm, 
    accountFilter, 
    folderFilter, 
    categoryFilter,
    dateRange,
    limit = 50,
    offset = 0,
    sortBy = 'date',
    sortOrder = 'desc'
  } = {}) {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (accountFilter) params.append('account', accountFilter);
      if (folderFilter) params.append('folder', folderFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (dateRange?.start) params.append('startDate', dateRange.start);
      if (dateRange?.end) params.append('endDate', dateRange.end);
      if (limit) params.append('limit', limit);
      if (offset) params.append('offset', offset);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      
      const cacheKey = getCacheKey('emails/search', { 
        searchTerm, accountFilter, folderFilter, categoryFilter, dateRange, limit, offset, sortBy, sortOrder 
      });

      const data = await enhancedFetch(
        `${API_BASE_URL}/emails/search?${params}`,
        { method: 'GET' },
        cacheKey,
        true
      );
      
      return {
        success: true,
        data: data.data || [],
        total: data.total || data.data?.length || 0,
        hasMore: data.hasMore || false
      };
    } catch (error) {
      console.error('Search emails error:', error);
      
      // Fallback to mock data
      console.log('🔄 Falling back to mock data');
      const mockData = await mockAPI.searchEmails({ 
        searchTerm, accountFilter, folderFilter, categoryFilter, dateRange, limit, offset 
      });
      return {
        success: true,
        data: mockData,
        total: mockData.length,
        hasMore: false,
        fromCache: true
      };
    }
  },

  async getEmail(id, useCache = true) {
    try {
      const cacheKey = getCacheKey(`emails/${id}`);
      
      const data = await enhancedFetch(
        `${API_BASE_URL}/emails/${id}`,
        { method: 'GET' },
        useCache ? cacheKey : null,
        useCache
      );
      
      return {
        success: true,
        data: data.data || null
      };
    } catch (error) {
      console.error('Get email error:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  async generateReply(emailId, emailContent, context = {}) {
    try {
      const response = await enhancedFetch(
        `${API_BASE_URL}/rag/suggest-reply`,
        {
          method: 'POST',
          body: JSON.stringify({
            emailId,
            emailContent,
            context,
            options: {
              tone: 'professional',
              length: 'medium',
              includeContext: true
            }
          })
        },
        null, // Don't cache AI responses
        false
      );

      return {
        success: true,
        reply: response.reply,
        contextUsed: response.contextUsed,
        confidence: response.confidence
      };
    } catch (error) {
      console.error('Generate reply error:', error);
      return {
        success: false,
        error: error.message,
        reply: null
      };
    }
  },

  async updateEmail(id, updates) {
    try {
      const response = await enhancedFetch(
        `${API_BASE_URL}/emails/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updates)
        },
        null,
        false
      );

      // Invalidate relevant caches
      this.invalidateCaches();
      
      // Emit real-time update
      eventManager.emit('email_updated', { id, updates });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Update email error:', error);
      
      // Queue for offline processing
      if (!isOnline()) {
        return new Promise((resolve, reject) => {
          offlineQueue.push({
            action: () => this.updateEmail(id, updates),
            resolve,
            reject
          });
          resolve({ success: true, queued: true });
        });
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  },

  async markAsRead(id, read = true) {
    return this.updateEmail(id, { read });
  },

  async toggleStar(id) {
    const email = await this.getEmail(id);
    if (email.success) {
      return this.updateEmail(id, { starred: !email.data.starred });
    }
    return email;
  },

  async bulkAction(emailIds, action, data = {}) {
    try {
      const response = await enhancedFetch(
        `${API_BASE_URL}/emails/bulk`,
        {
          method: 'POST',
          body: JSON.stringify({
            emailIds,
            action,
            data
          })
        },
        null,
        false
      );

      // Invalidate caches
      this.invalidateCaches();
      
      // Emit bulk update event
      eventManager.emit('bulk_update', { emailIds, action, data });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Bulk action error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async getEmailStats(timeRange = '30d') {
    try {
      const cacheKey = getCacheKey('emails/stats', { timeRange });
      
      const data = await enhancedFetch(
        `${API_BASE_URL}/analytics/email-stats?timeRange=${timeRange}`,
        { method: 'GET' },
        cacheKey,
        true
      );

      return {
        success: true,
        data: data.data || {
          total: 156,
          read: 120,
          unread: 36,
          starred: 15,
          withAttachments: 23
        }
      };
    } catch (error) {
      console.error('Get email stats error:', error);
      return {
        success: true,
        data: {
          total: 156,
          read: 120,
          unread: 36,
          starred: 15,
          withAttachments: 23
        },
        fromCache: true
      };
    }
  },

  invalidateCaches() {
    // Invalidate all email-related caches
    for (const [key] of cache) {
      if (key.startsWith('emails/')) {
        cache.delete(key);
      }
    }
    console.log('🧹 Invalidated email caches');
  },

  // Real-time subscription methods
  subscribeToEmailUpdates(callback) {
    return eventManager.subscribe('email_updated', callback);
  },

  subscribeToNewEmails(callback) {
    return eventManager.subscribe('email_received', callback);
  },

  subscribeToSyncStatus(callback) {
    return eventManager.subscribe('sync_status', callback);
  }
};

// Enhanced Account API
const accountAPI = {
  async getAccounts(forceRefresh = false) {
    try {
      const cacheKey = getCacheKey('accounts');
      
      const data = await enhancedFetch(
        `${API_BASE_URL}/accounts`,
        { method: 'GET' },
        forceRefresh ? null : cacheKey,
        !forceRefresh
      );

      return {
        success: true,
        data: Array.isArray(data.data) ? data.data : []
      };
    } catch (error) {
      console.error('Get accounts error:', error);
      
      // Fallback to mock data
      const mockData = await mockAPI.getAccounts();
      return {
        success: true,
        data: mockData,
        fromCache: true
      };
    }
  },

  async addAccount(accountData) {
    try {
      const response = await enhancedFetch(
        `${API_BASE_URL}/accounts`,
        {
          method: 'POST',
          body: JSON.stringify(accountData)
        },
        null,
        false
      );

      // Invalidate accounts cache
      cache.delete(getCacheKey('accounts'));

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Add account error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async testAccountConnection(accountData) {
    try {
      const response = await enhancedFetch(
        `${API_BASE_URL}/accounts/test-connection`,
        {
          method: 'POST',
          body: JSON.stringify(accountData)
        },
        null,
        false
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Test account connection error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Enhanced Analytics API with fallbacks
const analyticsAPI = {
  async getCategoryStats() {
    try {
      const cacheKey = getCacheKey('analytics/categories');
      
      const data = await enhancedFetch(
        `${API_BASE_URL}/analytics/categories`,
        { method: 'GET' },
        cacheKey,
        true
      );

      return {
        success: true,
        data: data.data || {
          Interested: 3,
          Spam: 2,
          'Out of Office': 1,
          'Meeting Booked': 0,
          'Not Interested': 0
        }
      };
    } catch (error) {
      console.error('Get category stats error:', error);
      // Fallback data
      return {
        success: true,
        data: {
          Interested: 3,
          Spam: 2,
          'Out of Office': 1,
          'Meeting Booked': 0,
          'Not Interested': 0
        },
        fromCache: true
      };
    }
  },

  async getProductivityMetrics(timeRange = '30d') {
    try {
      const cacheKey = getCacheKey('analytics/productivity', { timeRange });
      
      const data = await enhancedFetch(
        `${API_BASE_URL}/analytics/productivity?timeRange=${timeRange}`,
        { method: 'GET' },
        cacheKey,
        true
      );

      return {
        success: true,
        data: data.data || {
          emailsProcessed: 156,
          responseTime: '2.1h',
          automationRate: '78%',
          productivityScore: 8.4
        }
      };
    } catch (error) {
      console.error('Get productivity metrics error:', error);
      return {
        success: true,
        data: {
          emailsProcessed: 156,
          responseTime: '2.1h',
          automationRate: '78%',
          productivityScore: 8.4
        },
        fromCache: true
      };
    }
  },

  async getResponseTimeAnalytics(timeRange = '30d') {
    try {
      const cacheKey = getCacheKey('analytics/response-times', { timeRange });
      
      const data = await enhancedFetch(
        `${API_BASE_URL}/analytics/response-times?timeRange=${timeRange}`,
        { method: 'GET' },
        cacheKey,
        true
      );

      return {
        success: true,
        data: data.data || {
          average: '2.1h',
          median: '1.8h',
          p95: '4.5h',
          trend: 'improving'
        }
      };
    } catch (error) {
      console.error('Get response time analytics error:', error);
      return {
        success: true,
        data: {
          average: '2.1h',
          median: '1.8h',
          p95: '4.5h',
          trend: 'improving'
        },
        fromCache: true
      };
    }
  }
};

// Mock data for fallback and development
const mockAPI = {
  async searchEmails({ 
    searchTerm, 
    accountFilter, 
    folderFilter, 
    categoryFilter,
    dateRange,
    limit = 50,
    offset = 0 
  } = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

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
        starred: false,
        confidence: 0.92,
        labels: [{ name: 'Work', color: '#3b82f6' }],
        hasAttachments: false,
        isVerified: true,
        company: 'TechCorp'
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
        starred: true,
        confidence: 0.88,
        labels: [{ name: 'Meeting', color: '#10b981' }],
        hasAttachments: true
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
        starred: false,
        confidence: 0.45,
        labels: [],
        hasAttachments: true
      },
      {
        id: 'msg_004',
        accountId: 'joe@reach.io',
        folder: 'INBOX',
        subject: 'Win a free tablet! Urgent! Limited time offer!',
        from: 'Spammy Sender <blast@marketing.net>',
        to: ['joe@reach.io'],
        date: new Date(Date.now() - 86400000 * 1).toISOString(),
        body: "Click here to win a free tablet! Offer expires in 2 hours. This is an urgent email. Buy now!",
        aiCategory: 'Spam',
        read: false,
        starred: false,
        confidence: 0.96,
        labels: [],
        hasAttachments: false
      },
      {
        id: 'msg_005',
        accountId: 'support@reach.io',
        folder: 'Archive',
        subject: 'Out of Office: Vacation Notice',
        from: 'Bob <bob@acme.org>',
        to: ['support@reach.io'],
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        body: "Thanks for your email. I am currently out of the office until November 1st with limited access to email. I will respond to your query upon my return. This is an automatic reply.",
        aiCategory: 'Out of Office',
        read: true,
        starred: false,
        confidence: 0.91,
        labels: [{ name: 'Auto-reply', color: '#6b7280' }],
        hasAttachments: false,
        isVerified: true,
        company: 'Acme Inc'
      },
      {
        id: 'msg_006',
        accountId: 'joe@reach.io',
        folder: 'INBOX',
        subject: 'Not interested in your services',
        from: 'John Doe <john@example.com>',
        to: ['joe@reach.io'],
        date: new Date(Date.now() - 86400000 * 4).toISOString(),
        body: "Please remove me from your mailing list. I am not interested in your services anymore.",
        aiCategory: 'Not Interested',
        read: true,
        starred: false,
        confidence: 0.87,
        labels: [],
        hasAttachments: false
      }
    ];

    // Apply filters
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

    if (categoryFilter) {
      filteredEmails = filteredEmails.filter(email => 
        email.aiCategory === categoryFilter
      );
    }

    // Apply pagination
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedEmails = filteredEmails.slice(startIndex, endIndex);

    return paginatedEmails;
  },

  async getAccounts() {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return [
      { 
        id: 'acc_001', 
        email: 'joe@reach.io', 
        name: 'Joe', 
        type: 'primary', 
        unread: 3, 
        status: 'connected',
        lastSync: new Date().toISOString()
      },
      { 
        id: 'acc_002', 
        email: 'support@reach.io', 
        name: 'Support', 
        type: 'support', 
        unread: 1, 
        status: 'connected',
        lastSync: new Date().toISOString()
      },
      { 
        id: 'acc_003', 
        email: 'sales@reach.io', 
        name: 'Sales', 
        type: 'sales', 
        unread: 0, 
        status: 'connected',
        lastSync: new Date().toISOString()
      }
    ];
  }
};

// Initialize real-time connection when services are imported
if (typeof window !== 'undefined') {
  // Wait a bit before connecting to real-time events
  setTimeout(() => {
    eventManager.connectToEvents();
    
    // Set up online/offline handlers
    window.addEventListener('online', () => {
      console.log('🌐 Online - processing queued requests');
      processOfflineQueue();
      eventManager.emit('connection_status', { online: true });
    });

    window.addEventListener('offline', () => {
      console.log('📴 Offline - queuing requests');
      eventManager.emit('connection_status', { online: false });
    });
  }, 1000);
}

// Export all APIs and utilities
export { 
  emailAPI, 
  accountAPI, 
  analyticsAPI, 
  mockAPI, 
  eventManager,
  enhancedFetch 
};

// Utility function to clear all caches (useful for logout)
export const clearAllCaches = () => {
  cache.clear();
  pendingRequests.clear();
  console.log('🧹 Cleared all caches');
};

// Hook for using the service with React (optional)
export const useService = (service, method, ...args) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await service[method](...args);
        
        if (mounted) {
          if (result.success) {
            setData(result.data);
          } else {
            setError(result.error);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [service, method, ...args]);

  return { data, loading, error };
};