import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Filter, 
  User, 
  Mail, 
  BarChart3, 
  Bell,
  Wifi,
  WifiOff,
  Settings,
  RefreshCw
} from 'lucide-react';

// Enhanced Hooks
import { 
  useFirebaseAuth, 
  useEmailManager, 
  useAnalytics, 
  useAccountManager, 
  useNotifications,
  useNetworkStatus 
} from './hooks';

// Enhanced Components
import { 
  SystemAlert, 
  EmailListItem, 
  EmailDetailModal,
  Sidebar 
} from './components';

// Enhanced Services
import { emailAPI, analyticsAPI } from './services';

import './App.css';

// AI Categorization Function - Enhanced with confidence scoring
const categorizeEmail = (email) => {
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();
  
  let confidence = 0.7; // Base confidence
  
  // Interested: Keywords about interest, scheduling, calls
  const interestedKeywords = ['interested', 'schedule', 'call', 'discuss', 'meeting'];
  const interestedMatches = interestedKeywords.filter(keyword => 
    subject.includes(keyword) || body.includes(keyword)
  ).length;
  
  if (interestedMatches > 0) {
    confidence = Math.min(0.95, 0.7 + (interestedMatches * 0.1));
    if (!subject.includes('confirmed')) {
      return { category: 'Interested', confidence };
    }
  }
  
  // Meeting Booked: Confirmation keywords
  const bookedKeywords = ['confirmed', 'meeting booked', 'appointment confirmed', 'calendar invite'];
  if (bookedKeywords.some(keyword => subject.includes(keyword) || body.includes(keyword))) {
    return { category: 'Meeting Booked', confidence: 0.9 };
  }
  
  // Not Interested: Unsubscribe, not interested
  const notInterestedKeywords = ['not interested', 'unsubscribe', 'stop', 'remove'];
  if (notInterestedKeywords.some(keyword => subject.includes(keyword) || body.includes(keyword))) {
    return { category: 'Not Interested', confidence: 0.88 };
  }
  
  // Spam: Sales, promotions, urgent offers
  const spamKeywords = ['win', 'free', 'urgent!', 'discount', 'offer', 'deal', 'limited time', 'act now', 'buy now', 'promotion'];
  const spamMatches = spamKeywords.filter(keyword => 
    subject.includes(keyword) || body.includes(keyword)
  ).length;
  
  if (spamMatches > 1) {
    return { category: 'Spam', confidence: Math.min(0.98, 0.8 + (spamMatches * 0.1)) };
  }
  
  // Out of Office: Auto-replies, vacation notices
  const oooKeywords = ['out of office', 'out of the office', 'auto-reply', 'automatic reply', 'vacation', 'away from', 'will return', 'limited access'];
  if (oooKeywords.some(keyword => body.includes(keyword))) {
    return { category: 'Out of Office', confidence: 0.85 };
  }
  
  return { category: 'Uncategorized', confidence: 0.5 };
};

// Enhanced Mock Data with AI Categorization and Confidence
// Enhanced Mock Data with AI Categorization and Confidence - FIXED VERSION
const CORRECT_EMAILS = [
  {
    id: 'msg_001',
    accountId: 'joe@reach.io',
    accountName: 'Joe', // Add this
    folder: 'INBOX',
    subject: 'Quick question about your RAG implementation',
    from: 'Alice Johnson <alice@techcorp.com>',
    to: ['joe@reach.io'],
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    body: "Hi Joe, I saw your documentation on the RAG pipeline using Qdrant. We are highly interested in implementing a similar architecture for our internal knowledge base. Can we schedule a 15-minute call sometime next week? Let me know your availability.",
    read: false,
    starred: false,
    hasAttachments: false,
    labels: [{ name: 'Work', color: '#3b82f6' }],
    isVerified: true,
    company: 'TechCorp',
    // AI Categorization fields
    aiCategory: 'Interested',
    confidence: 0.92,
    syncStatus: 'synced'
  },
  {
    id: 'msg_002',
    accountId: 'support@reach.io',
    accountName: 'Support', // Add this
    folder: 'INBOX',
    subject: 'FWD: Your meeting is confirmed for Tuesday',
    from: 'Calendar Bot <no-reply@scheduler.com>',
    to: ['support@reach.io'],
    date: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    body: "This is a confirmation that your meeting with Alex Smith is scheduled for 10:00 AM PST on Tuesday, October 22nd. Agenda: Discuss pricing model.",
    read: false,
    starred: true,
    hasAttachments: true,
    labels: [{ name: 'Meeting', color: '#10b981' }],
    // AI Categorization fields
    aiCategory: 'Meeting Booked',
    confidence: 0.88,
    syncStatus: 'synced'
  },
  {
    id: 'msg_003',
    accountId: 'sales@reach.io',
    accountName: 'Sales', // Add this
    folder: 'Sent',
    subject: 'Following up on our recent conversation',
    from: 'sales@reach.io',
    to: ['mark@competitor.com'],
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    body: "Mark, thanks for the chat. I've attached the full proposal. Let me know what you think!",
    read: true,
    starred: false,
    hasAttachments: true,
    labels: [],
    // AI Categorization fields
    aiCategory: 'Uncategorized',
    confidence: 0.45,
    syncStatus: 'synced'
  },
  {
    id: 'msg_004',
    accountId: 'joe@reach.io',
    accountName: 'Joe', // Add this
    folder: 'INBOX',
    subject: 'Win a free tablet! Urgent! Limited time offer!',
    from: 'Spammy Sender <blast@marketing.net>',
    to: ['joe@reach.io'],
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    body: "Click here to win a free tablet! Offer expires in 2 hours. This is an urgent email. Buy now!",
    read: false,
    starred: false,
    hasAttachments: false,
    labels: [],
    // AI Categorization fields
    aiCategory: 'Spam',
    confidence: 0.96,
    syncStatus: 'synced'
  },
  {
    id: 'msg_005',
    accountId: 'support@reach.io',
    accountName: 'Support', // Add this
    folder: 'Archive',
    subject: 'Out of Office: Vacation Notice',
    from: 'Bob <bob@acme.org>',
    to: ['support@reach.io'],
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    body: "Thanks for your email. I am currently out of the office until November 1st with limited access to email. I will respond to your query upon my return. This is an automatic reply.",
    read: true,
    starred: false,
    hasAttachments: false,
    labels: [{ name: 'Auto-reply', color: '#6b7280' }],
    isVerified: true,
    company: 'Acme Inc',
    // AI Categorization fields
    aiCategory: 'Out of Office',
    confidence: 0.91,
    syncStatus: 'synced'
  },
  {
    id: 'msg_006',
    accountId: 'joe@reach.io',
    accountName: 'Joe', // Add this
    folder: 'INBOX',
    subject: 'Not interested in your services',
    from: 'John Doe <john@example.com>',
    to: ['joe@reach.io'],
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
    body: "Please remove me from your mailing list. I am not interested in your services anymore.",
    read: true,
    starred: false,
    hasAttachments: false,
    labels: [],
    // AI Categorization fields
    aiCategory: 'Not Interested',
    confidence: 0.87,
    syncStatus: 'synced'
  }
];

// Remove the .map() transformation since we're now including the fields directly
const App = () => {
    // Enhanced Authentication
    const { 
        initialized, 
        uid, 
        mode, 
        user, 
        isOnline: authOnline, 
        signOut, 
        refreshSession,
        isAuthenticated 
    } = useFirebaseAuth();

    // Enhanced Email Management
    const emailManager = useEmailManager({
        searchTerm: '',
        accountFilter: '',
        folderFilter: '',
        categoryFilter: ''
    });

    // Enhanced Analytics
    const analytics = useAnalytics('30d');

    // Enhanced Account Management
    const accountManager = useAccountManager();

    // Enhanced Notifications
    const notifications = useNotifications();

    // Enhanced Network Status
    const networkStatus = useNetworkStatus();

    // Local State
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [systemMessage, setSystemMessage] = useState(null);
    const [usingMockData, setUsingMockData] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [composeModalOpen, setComposeModalOpen] = useState(false);
    const [bulkActionsOpen, setBulkActionsOpen] = useState(false);

    // Fix: Use ref to prevent infinite loops
    const hasInitialized = useRef(false);

    // FIXED: Initialize with enhanced data - no infinite loops
    useEffect(() => {
        if (initialized && !hasInitialized.current) {
            hasInitialized.current = true;
            console.log('🎯 FORCING ENHANCED DATA WITH AI CATEGORIZATION');
            console.log('📧 AI Categories with confidence:', CORRECT_EMAILS.map(e => ({ 
                subject: e.subject, 
                category: e.aiCategory, 
                confidence: e.confidence 
            })));
            
            // Use setTimeout to break synchronous execution chain
            setTimeout(() => {
                emailManager.loadEmails({}, true);
            }, 100);
            
            setUsingMockData(true);
            setSystemMessage({ 
                type: 'info', 
                message: 'Using ReachInbox AI demo data with automatic categorization and confidence scoring' 
            });
        }
    }, [initialized]); // Removed emailManager from dependencies

    // FIXED: Real-time sync status updates
    useEffect(() => {
        const unsubscribe = emailAPI.subscribeToSyncStatus((status) => {
            setSystemMessage({
                type: status.status === 'error' ? 'error' : 'info',
                message: `Sync ${status.status}: ${status.accountId}`
            });
        });

        return unsubscribe;
    }, []);

    // FIXED: Enhanced Handlers - use useCallback properly
    const handleSearch = useCallback((query) => {
        if (!emailManager.loading) {
            emailManager.loadEmails({ searchTerm: query }, true);
        }
    }, [emailManager.loading]); // Only depend on loading state

    const handleAccountFilter = useCallback((accountId) => {
        if (!emailManager.loading) {
            emailManager.loadEmails({ accountFilter: accountId }, true);
        }
    }, [emailManager.loading]);

    const handleFolderFilter = useCallback((folder) => {
        if (!emailManager.loading) {
            emailManager.loadEmails({ folderFilter: folder }, true);
        }
    }, [emailManager.loading]);

    const handleCategoryFilter = useCallback((category) => {
        if (!emailManager.loading) {
            emailManager.loadEmails({ categoryFilter: category }, true);
        }
    }, [emailManager.loading]);

    const handleRefresh = useCallback(async () => {
        if (emailManager.loading) return;
        
        setSystemMessage({ type: 'info', message: 'Refreshing emails...' });
        await emailManager.loadEmails({}, true);
        await analytics.refresh();
        await accountManager.refreshAccounts();
        setSystemMessage({ type: 'success', message: 'Refresh completed' });
        
        // Clear message after 3 seconds
        setTimeout(() => setSystemMessage(null), 3000);
    }, [emailManager.loading]); // Only depend on loading state

    const handleComposeEmail = useCallback(() => {
        setComposeModalOpen(true);
    }, []);

    const handleBulkAction = useCallback(async (action, data = {}) => {
        if (emailManager.bulkActionState.inProgress) return;
        
        setSystemMessage({ type: 'info', message: `Performing ${action} on ${emailManager.selectedEmails.length} emails...` });
        
        await emailManager.performBulkAction(action, data);
        
        setSystemMessage({ type: 'success', message: `${action} completed successfully` });
        setBulkActionsOpen(false);
        
        // Clear message after 3 seconds
        setTimeout(() => setSystemMessage(null), 3000);
    }, [emailManager.bulkActionState.inProgress, emailManager.selectedEmails.length]);

    const openEmailModal = useCallback((email) => {
        setSelectedEmail(email);
        setSystemMessage(null);
        
        // Auto-mark as read when opening
        if (!email.read) {
            emailManager.markAsRead(email.id, true);
        }
    }, []); // Remove emailManager dependency

    const closeEmailModal = useCallback(() => {
        setSelectedEmail(null);
    }, []);

    const closeComposeModal = useCallback(() => {
        setComposeModalOpen(false);
    }, []);

    // Enhanced UI rendering
    if (!initialized) {
        return (
            <div className="app-loading">
                <div className="loading-spinner large"></div>
                <div className="loading-text">
                    <h2>ReachInbox AI</h2>
                    <p>Initializing enhanced email management...</p>
                </div>
            </div>
        );
    }

    // Enhanced categories for sidebar
    const enhancedCategories = [
        { name: 'Inbox', icon: '📥', count: emailManager.emails.filter(e => !e.read).length, type: 'inbox', color: '#3b82f6' },
        { name: 'Starred', icon: '⭐', count: emailManager.emails.filter(e => e.starred).length, type: 'starred', color: '#f59e0b' },
        { name: 'Important', icon: '⚡', count: emailManager.emails.filter(e => e.aiCategory === 'Interested').length, type: 'important', color: '#ef4444' },
        { name: 'Sent', icon: '📤', count: emailManager.emails.filter(e => e.folder === 'Sent').length, type: 'sent', color: '#10b981' },
        { name: 'Drafts', icon: '📝', count: 0, type: 'drafts', color: '#8b5cf6' },
        { name: 'Archive', icon: '📁', count: emailManager.emails.filter(e => e.folder === 'Archive').length, type: 'archive', color: '#6b7280' }
    ];

    return (
        <div className="app">
            {/* Enhanced Header */}
            <header className="app-header">
                <div className="header-content">
                    <div className="header-left">
                        <button 
                            className="sidebar-toggle"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <div className={`hamburger ${sidebarCollapsed ? 'collapsed' : ''}`}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </button>
                        
                        <div className="logo-section">
                            <div className="logo-icon">
                                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                </svg>
                            </div>
                            <h1 className="app-title">ReachInbox AI</h1>
                            {usingMockData && <div className="demo-badge">Demo Mode</div>}
                            {mode === 'Authenticated' && <div className="auth-badge">Professional</div>}
                        </div>
                    </div>

                    <div className="header-center">
                        <div className="connection-status">
                            {networkStatus.isOnline ? (
                                <Wifi size={16} className="online" title="Online" />
                            ) : (
                                <WifiOff size={16} className="offline" title="Offline" />
                            )}
                            <span className="status-text">
                                {networkStatus.isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="header-actions">
                            <button 
                                className="icon-btn refresh-btn"
                                onClick={handleRefresh}
                                title="Refresh"
                                disabled={emailManager.loading}
                            >
                                <RefreshCw size={18} className={emailManager.loading ? 'spinning' : ''} />
                            </button>
                            
                            <div className="notifications-wrapper">
                                <button 
                                    className="icon-btn notifications-btn"
                                    title={`Notifications (${notifications.unreadCount})`}
                                >
                                    <Bell size={18} />
                                    {notifications.unreadCount > 0 && (
                                        <span className="notification-badge">{notifications.unreadCount}</span>
                                    )}
                                </button>
                            </div>
                            
                            <button className="icon-btn settings-btn" title="Settings">
                                <Settings size={18} />
                            </button>
                        </div>

                        <div className="user-info">
                            <div className="user-avatar">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.name} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                            <div className="user-details">
                                <span className="user-name">{user?.name || 'User'}</span>
                                <span className="user-status">{mode}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Enhanced Main Layout */}
            <div className="app-layout">
                {/* Enhanced Sidebar */}
                {!sidebarCollapsed && (
                    <Sidebar 
                        categories={enhancedCategories}
                        selectedCategory={emailManager.filters.categoryFilter}
                        onCategorySelect={handleCategoryFilter}
                        unreadCount={emailManager.emails.filter(e => !e.read).length}
                        starredCount={emailManager.emails.filter(e => e.starred).length}
                        onComposeEmail={handleComposeEmail}
                        onRefresh={handleRefresh}
                        accounts={accountManager.accounts}
                        selectedAccount={emailManager.filters.accountFilter}
                        onAccountSelect={handleAccountFilter}
                        folders={[
                            { name: 'INBOX', count: emailManager.emails.filter(e => e.folder === 'INBOX').length, type: 'inbox', icon: '📥' },
                            { name: 'Sent', count: emailManager.emails.filter(e => e.folder === 'Sent').length, type: 'sent', icon: '📤' },
                            { name: 'Archive', count: emailManager.emails.filter(e => e.folder === 'Archive').length, type: 'archive', icon: '📁' },
                            { name: 'Spam', count: emailManager.emails.filter(e => e.aiCategory === 'Spam').length, type: 'spam', icon: '🚫' }
                        ]}
                        selectedFolder={emailManager.filters.folderFilter}
                        onFolderSelect={handleFolderFilter}
                        searchQuery={emailManager.filters.searchTerm}
                        onSearchChange={handleSearch}
                        aiInsights={analytics.stats}
                        syncStatus={accountManager.syncStatus}
                    />
                )}

                {/* Enhanced Main Content */}
                <main className={`app-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                    <div className="main-content">
                        <SystemAlert 
                            message={systemMessage?.message} 
                            type={systemMessage?.type || 'info'} 
                            onClose={() => setSystemMessage(null)}
                        />

                        {/* Enhanced Toolbar */}
                        <div className="email-toolbar">
                            <div className="toolbar-left">
                                {/* Bulk Actions */}
                                {emailManager.hasSelection && (
                                    <div className="bulk-actions">
                                        <span className="selection-count">
                                            {emailManager.selectionCount} selected
                                        </span>
                                        <div className="bulk-buttons">
                                            <button 
                                                className="bulk-btn"
                                                onClick={() => handleBulkAction('mark_read')}
                                                disabled={emailManager.bulkActionState.inProgress}
                                            >
                                                Mark Read
                                            </button>
                                            <button 
                                                className="bulk-btn"
                                                onClick={() => handleBulkAction('mark_unread')}
                                                disabled={emailManager.bulkActionState.inProgress}
                                            >
                                                Mark Unread
                                            </button>
                                            <button 
                                                className="bulk-btn"
                                                onClick={() => handleBulkAction('archive')}
                                                disabled={emailManager.bulkActionState.inProgress}
                                            >
                                                Archive
                                            </button>
                                            <button 
                                                className="bulk-btn danger"
                                                onClick={() => handleBulkAction('delete')}
                                                disabled={emailManager.bulkActionState.inProgress}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="toolbar-right">
                                {/* Enhanced Stats */}
                                <div className="email-stats">
                                    <div className="stats-info">
                                        Showing <strong>{emailManager.emails.length}</strong> of{' '}
                                        <strong>{emailManager.pagination.total}</strong> emails
                                        {usingMockData && <span className="mock-indicator"> (AI Categorized)</span>}
                                        
                                        <div className="count-badges">
                                            <span className="unread-badge">
                                                {emailManager.emails.filter(e => !e.read).length} unread
                                            </span>
                                            <span className="starred-badge">
                                                {emailManager.emails.filter(e => e.starred).length} starred
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="ai-badge">
                                        <BarChart3 size={16} />
                                        AI-Powered Categorization
                                        <span className="category-counts">
                                            {Object.entries(analytics.stats.categoryStats || {}).map(([category, count]) => (
                                                <span key={category} className="category-count">
                                                    {category}: {count}
                                                </span>
                                            ))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Email List Header */}
                        <div className="email-list-header">
                            <div className="header-checkbox">
                                <input
                                    type="checkbox"
                                    checked={emailManager.isAllSelected}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            emailManager.selectAllEmails();
                                        } else {
                                            emailManager.clearSelection();
                                        }
                                    }}
                                />
                            </div>
                            <div className="header-sender">Sender</div>
                            <div className="header-subject">Subject</div>
                            <div className="header-account">Account / Folder</div>
                            <div className="header-date">Date</div>
                            <div className="header-category">AI Category</div>
                        </div>

                        {/* Enhanced Email List */}
                        <div className="email-list">
                            {emailManager.loading ? (
                                <div className="empty-state">
                                    <div className="loading-spinner"></div>
                                    <p className="empty-title">Loading enhanced emails...</p>
                                </div>
                            ) : emailManager.emails.length > 0 ? (
                                emailManager.emails.map(email => (
                                    <EmailListItem 
                                        key={email.id}
                                        email={email}
                                        onClick={openEmailModal}
                                        onToggleStar={emailManager.toggleStar}
                                        onMarkRead={emailManager.markAsRead}
                                        onArchive={(id) => handleBulkAction('archive', { emailIds: [id] })}
                                        onDelete={(id) => handleBulkAction('delete', { emailIds: [id] })}
                                        isSelected={emailManager.selectedEmails.includes(email.id)}
                                        onSelect={emailManager.toggleEmailSelection}
                                        showCheckbox={true}
                                    />
                                ))
                            ) : (
                                <div className="empty-state">
                                    <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                    </svg>
                                    <p className="empty-title">No emails found</p>
                                    <p className="empty-description">
                                        {usingMockData 
                                            ? "Try adjusting your search criteria or refresh the data" 
                                            : "No emails match your search criteria"}
                                    </p>
                                    <button 
                                        className="refresh-btn primary"
                                        onClick={handleRefresh}
                                    >
                                        <RefreshCw size={16} />
                                        Refresh Emails
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Load More Button */}
                        {emailManager.pagination.hasMore && (
                            <div className="load-more-section">
                                <button 
                                    className="load-more-btn"
                                    onClick={emailManager.loadMore}
                                    disabled={emailManager.loading}
                                >
                                    {emailManager.loading ? 'Loading...' : 'Load More Emails'}
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Enhanced Email Detail Modal */}
            {selectedEmail && (
                <EmailDetailModal 
                    email={selectedEmail} 
                    onClose={closeEmailModal} 
                    setSystemMessage={setSystemMessage} 
                    usingMockData={usingMockData}
                />
            )}

            {/* Compose Modal (Placeholder) */}
            {composeModalOpen && (
                <div className="modal-overlay" onClick={closeComposeModal}>
                    <div className="compose-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Compose Email</h3>
                            <button className="close-btn" onClick={closeComposeModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Enhanced compose functionality coming soon...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Network Status Indicator */}
            {!networkStatus.isOnline && (
                <div className="offline-indicator">
                    <WifiOff size={16} />
                    <span>You are currently offline. Some features may be limited.</span>
                </div>
            )}
        </div>
    );
};

export default App;