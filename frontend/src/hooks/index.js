import { useState, useEffect, useCallback, useRef } from 'react';
import { firebaseConfig, initialAuthToken } from '../config';
import { eventManager, emailAPI, accountAPI, analyticsAPI } from '../services';

// Enhanced Authentication Hook with Real-time Session Management
export const useFirebaseAuth = () => {
    const [authStatus, setAuthStatus] = useState({ 
        initialized: false, 
        uid: null, 
        mode: 'Initializing',
        user: null,
        isOnline: true
    });

    const [sessionTimer, setSessionTimer] = useState(null);
    const sessionTimeoutRef = useRef(null);

    // Session management
    const startSessionTimer = useCallback(() => {
        if (sessionTimeoutRef.current) {
            clearTimeout(sessionTimeoutRef.current);
        }

        // 60-minute session timeout
        sessionTimeoutRef.current = setTimeout(() => {
            setAuthStatus(prev => ({
                ...prev,
                mode: 'Session Expired',
                user: null,
                uid: null
            }));
            console.log('🔐 Session expired due to inactivity');
        }, 60 * 60 * 1000);
    }, []);

    const resetSessionTimer = useCallback(() => {
        startSessionTimer();
    }, [startSessionTimer]);

    // Activity listeners for session management
    useEffect(() => {
        const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        const handleActivity = () => {
            resetSessionTimer();
        };

        activities.forEach(activity => {
            document.addEventListener(activity, handleActivity);
        });

        return () => {
            activities.forEach(activity => {
                document.removeEventListener(activity, handleActivity);
            });
            if (sessionTimeoutRef.current) {
                clearTimeout(sessionTimeoutRef.current);
            }
        };
    }, [resetSessionTimer]);

    useEffect(() => {
        const mockInitialize = async () => {
            if (Object.keys(firebaseConfig).length === 0) {
                const mockUser = {
                    uid: 'mock-user',
                    email: 'demo@reachinbox.com',
                    name: 'Demo User',
                    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                    plan: 'premium',
                    storageUsed: 4.2,
                    storageLimit: 15
                };
                
                setAuthStatus({ 
                    initialized: true, 
                    uid: mockUser.uid, 
                    mode: 'Demo Mode',
                    user: mockUser,
                    isOnline: navigator.onLine
                });
                startSessionTimer();
                return;
            }

            // Simulate Firebase initialization
            setTimeout(() => {
                const userUid = initialAuthToken ? `user-${Math.random().toString(36).substring(2, 9)}` : `anon-${Math.random().toString(36).substring(2, 9)}`;
                const mode = initialAuthToken ? 'Authenticated' : 'Anonymous';
                const user = initialAuthToken ? {
                    uid: userUid,
                    email: 'user@company.com',
                    name: 'Authenticated User',
                    avatar: null,
                    plan: 'business',
                    storageUsed: 2.1,
                    storageLimit: 50
                } : null;

                setAuthStatus({ 
                    initialized: true, 
                    uid: userUid, 
                    mode: mode,
                    user: user,
                    isOnline: navigator.onLine
                });
                startSessionTimer();
                console.log(`🔥 Firebase initialized. Auth Mode: ${mode}, User ID: ${userUid}`);
            }, 1000);
        };

        mockInitialize();

        // Online/offline detection
        const handleOnline = () => {
            setAuthStatus(prev => ({ ...prev, isOnline: true }));
            console.log('🌐 App is online');
        };

        const handleOffline = () => {
            setAuthStatus(prev => ({ ...prev, isOnline: false }));
            console.log('📴 App is offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (sessionTimeoutRef.current) {
                clearTimeout(sessionTimeoutRef.current);
            }
        };
    }, [startSessionTimer]);

    const signOut = useCallback(() => {
        setAuthStatus({
            initialized: true,
            uid: null,
            mode: 'Signed Out',
            user: null,
            isOnline: navigator.onLine
        });
        if (sessionTimeoutRef.current) {
            clearTimeout(sessionTimeoutRef.current);
        }
    }, []);

    const refreshSession = useCallback(() => {
        resetSessionTimer();
        console.log('🔄 Session refreshed');
    }, [resetSessionTimer]);

    return {
        ...authStatus,
        signOut,
        refreshSession,
        isAuthenticated: authStatus.mode === 'Authenticated' || authStatus.mode === 'Demo Mode'
    };
};

// Enhanced Email Management Hook with Real-time Updates
export const useEmailManager = (initialFilters = {}) => {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        hasMore: false
    });
    const [selectedEmails, setSelectedEmails] = useState(new Set());
    const [bulkActionState, setBulkActionState] = useState({
        inProgress: false,
        progress: 0,
        currentAction: null
    });

    // Real-time email updates
    useEffect(() => {
        const unsubscribeUpdated = emailAPI.subscribeToEmailUpdates(({ id, updates }) => {
            setEmails(prev => prev.map(email => 
                email.id === id ? { ...email, ...updates } : email
            ));
        });

        const unsubscribeNew = emailAPI.subscribeToNewEmails((newEmail) => {
            setEmails(prev => [newEmail, ...prev]);
            // Show notification for new email
            if (Notification.permission === 'granted') {
                new Notification(`New email from ${newEmail.from}`, {
                    body: newEmail.subject,
                    icon: '/icon.png'
                });
            }
        });

        return () => {
            unsubscribeUpdated();
            unsubscribeNew();
        };
    }, []);

    // Load emails with filters
    const loadEmails = useCallback(async (newFilters = {}, reset = false) => {
        try {
            setLoading(true);
            setError(null);

            if (reset) {
                setSelectedEmails(new Set());
            }

            const mergedFilters = { ...filters, ...newFilters };
            setFilters(mergedFilters);

            const result = await emailAPI.searchEmails({
                ...mergedFilters,
                limit: pagination.limit,
                offset: reset ? 0 : (pagination.page - 1) * pagination.limit
            });

            if (result.success) {
                setEmails(prev => reset ? result.data : [...prev, ...result.data]);
                setPagination(prev => ({
                    ...prev,
                    total: result.total,
                    hasMore: result.hasMore,
                    page: reset ? 1 : prev.page
                }));
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.limit, pagination.page]);

    // Initial load and filter changes
    useEffect(() => {
        loadEmails({}, true);
    }, []);

    // Bulk actions
    const performBulkAction = useCallback(async (action, data = {}) => {
        if (selectedEmails.size === 0) return;

        setBulkActionState({
            inProgress: true,
            progress: 0,
            currentAction: action
        });

        try {
            const emailIds = Array.from(selectedEmails);
            const result = await emailAPI.bulkAction(emailIds, action, data);

            if (result.success) {
                // Update local state optimistically
                setEmails(prev => prev.map(email => 
                    selectedEmails.has(email.id) 
                        ? { ...email, ...getBulkUpdateData(action, data) }
                        : email
                ));
                
                // Clear selection
                setSelectedEmails(new Set());
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setBulkActionState({
                inProgress: false,
                progress: 0,
                currentAction: null
            });
        }
    }, [selectedEmails]);

    // Individual email actions
    const markAsRead = useCallback(async (emailId, read = true) => {
        const result = await emailAPI.markAsRead(emailId, read);
        if (result.success) {
            setEmails(prev => prev.map(email => 
                email.id === emailId ? { ...email, read } : email
            ));
        }
        return result;
    }, []);

    const toggleStar = useCallback(async (emailId) => {
        const result = await emailAPI.toggleStar(emailId);
        if (result.success) {
            setEmails(prev => prev.map(email => 
                email.id === emailId ? { ...email, starred: !email.starred } : email
            ));
        }
        return result;
    }, []);

    // Selection management
    const toggleEmailSelection = useCallback((emailId, selected) => {
        setSelectedEmails(prev => {
            const newSelection = new Set(prev);
            if (selected) {
                newSelection.add(emailId);
            } else {
                newSelection.delete(emailId);
            }
            return newSelection;
        });
    }, []);

    const selectAllEmails = useCallback(() => {
        setSelectedEmails(new Set(emails.map(email => email.id)));
    }, [emails]);

    const clearSelection = useCallback(() => {
        setSelectedEmails(new Set());
    }, []);

    // Pagination
    const loadMore = useCallback(() => {
        if (pagination.hasMore && !loading) {
            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
            loadEmails({}, false);
        }
    }, [pagination.hasMore, loading, loadEmails]);

    // Auto-refresh every 2 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading) {
                loadEmails({}, false);
            }
        }, 2 * 60 * 1000);

        return () => clearInterval(interval);
    }, [loading, loadEmails]);

    return {
        // State
        emails,
        loading,
        error,
        filters,
        pagination,
        selectedEmails: Array.from(selectedEmails),
        bulkActionState,
        
        // Actions
        loadEmails,
        markAsRead,
        toggleStar,
        performBulkAction,
        toggleEmailSelection,
        selectAllEmails,
        clearSelection,
        loadMore,
        setFilters,
        setError,
        
        // Utilities
        hasSelection: selectedEmails.size > 0,
        selectionCount: selectedEmails.size,
        isAllSelected: selectedEmails.size === emails.length && emails.length > 0
    };
};

// Enhanced Analytics Hook with Real-time Dashboard
export const useAnalytics = (timeRange = '30d') => {
    const [stats, setStats] = useState({
        categoryStats: {},
        productivity: {},
        responseTimes: {},
        emailStats: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAnalytics = useCallback(async (newTimeRange = timeRange) => {
        try {
            setLoading(true);
            setError(null);

            const [categoryResult, productivityResult, responseTimeResult, emailStatsResult] = await Promise.all([
                analyticsAPI.getCategoryStats(),
                analyticsAPI.getProductivityMetrics(newTimeRange),
                analyticsAPI.getResponseTimeAnalytics(newTimeRange),
                emailAPI.getEmailStats(newTimeRange)
            ]);

            setStats({
                categoryStats: categoryResult.success ? categoryResult.data : {},
                productivity: productivityResult.success ? productivityResult.data : {},
                responseTimes: responseTimeResult.success ? responseTimeResult.data : {},
                emailStats: emailStatsResult.success ? emailStatsResult.data : {}
            });

            if (categoryResult.error) setError(categoryResult.error);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    // Real-time stats updates
    useEffect(() => {
        const unsubscribe = eventManager.subscribe('email_updated', () => {
            // Debounced refresh of analytics
            setTimeout(() => loadAnalytics(), 1000);
        });

        return unsubscribe;
    }, [loadAnalytics]);

    return {
        stats,
        loading,
        error,
        refresh: loadAnalytics,
        timeRange
    };
};

// Enhanced Account Management Hook
export const useAccountManager = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [syncStatus, setSyncStatus] = useState({});

    const loadAccounts = useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            setError(null);

            const result = await accountAPI.getAccounts(forceRefresh);
            
            if (result.success) {
                setAccounts(result.data);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAccounts();

        // Subscribe to sync status updates
        const unsubscribe = emailAPI.subscribeToSyncStatus((status) => {
            setSyncStatus(prev => ({
                ...prev,
                [status.accountId]: status
            }));
        });

        return unsubscribe;
    }, [loadAccounts]);

    const addAccount = useCallback(async (accountData) => {
        const result = await accountAPI.addAccount(accountData);
        if (result.success) {
            await loadAccounts(true); // Refresh accounts list
        }
        return result;
    }, [loadAccounts]);

    const testConnection = useCallback(async (accountData) => {
        return await accountAPI.testAccountConnection(accountData);
    }, []);

    return {
        accounts,
        loading,
        error,
        syncStatus,
        loadAccounts,
        addAccount,
        testConnection,
        refreshAccounts: () => loadAccounts(true)
    };
};

// Real-time Notification Hook
export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Subscribe to real-time events for notifications
        const unsubscribeNewEmail = emailAPI.subscribeToNewEmails((email) => {
            const notification = {
                id: Date.now().toString(),
                type: 'new_email',
                title: `New email from ${email.from}`,
                message: email.subject,
                timestamp: new Date(),
                read: false,
                data: email
            };

            setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
            setUnreadCount(prev => prev + 1);

            // Show desktop notification
            if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/icon.png',
                    tag: 'new-email'
                });
            }
        });

        const unsubscribeSync = emailAPI.subscribeToSyncStatus((status) => {
            if (status.status === 'error') {
                const notification = {
                    id: `sync-error-${Date.now()}`,
                    type: 'sync_error',
                    title: 'Sync Error',
                    message: `Failed to sync ${status.accountId}`,
                    timestamp: new Date(),
                    read: false,
                    data: status
                };

                setNotifications(prev => [notification, ...prev.slice(0, 49)]);
                setUnreadCount(prev => prev + 1);
            }
        });

        return () => {
            unsubscribeNewEmail();
            unsubscribeSync();
        };
    }, []);

    const markAsRead = useCallback((notificationId) => {
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === notificationId ? { ...notif, read: true } : notif
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => 
            prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
    }, []);

    const removeNotification = useCallback((notificationId) => {
        setNotifications(prev => {
            const removed = prev.find(n => n.id === notificationId);
            if (removed && !removed.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            return prev.filter(n => n.id !== notificationId);
        });
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll
    };
};

// Network Status Hook
export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [lastOnline, setLastOnline] = useState(null);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setLastOnline(new Date());
            console.log('🌐 Network: Online');
        };

        const handleOffline = () => {
            setIsOnline(false);
            console.log('📴 Network: Offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return {
        isOnline,
        lastOnline,
        offlineDuration: lastOnline ? Date.now() - lastOnline.getTime() : null
    };
};

// Helper function for bulk actions
const getBulkUpdateData = (action, data) => {
    switch (action) {
        case 'mark_read':
            return { read: true };
        case 'mark_unread':
            return { read: false };
        case 'star':
            return { starred: true };
        case 'unstar':
            return { starred: false };
        case 'archive':
            return { folder: 'Archive' };
        case 'move':
            return { folder: data.folder };
        default:
            return {};
    }
};

export default useFirebaseAuth;