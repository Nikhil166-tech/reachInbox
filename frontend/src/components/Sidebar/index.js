import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Settings, 
  RefreshCw,
  BarChart3,
  Zap,
  Users,
  Mail,
  Folder,
  Star,
  Clock,
  Archive,
  Trash2,
  Search,
  Filter
} from 'lucide-react';
import './index.css';

const Sidebar = ({ 
  categories = [], 
  selectedCategory, 
  onCategorySelect, 
  unreadCount = 0,
  starredCount = 0,
  onComposeEmail,
  onRefresh,
  accounts = [],
  selectedAccount,
  onAccountSelect,
  folders = [],
  selectedFolder,
  onFolderSelect,
  searchQuery,
  onSearchChange,
  aiInsights = {},
  syncStatus = 'synced'
}) => {
  const [expandedSections, setExpandedSections] = useState({
    accounts: true,
    categories: true,
    folders: true,
    insights: true
  });
  const [quickFilters, setQuickFilters] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  // Initialize with default data if not provided
  const defaultCategories = [
    { name: 'Inbox', icon: '📥', count: unreadCount, type: 'inbox', color: '#3b82f6' },
    { name: 'Starred', icon: '⭐', count: starredCount, type: 'starred', color: '#f59e0b' },
    { name: 'Important', icon: '⚡', count: aiInsights.important || 0, type: 'important', color: '#ef4444' },
    { name: 'Sent', icon: '📤', count: 0, type: 'sent', color: '#10b981' },
    { name: 'Drafts', icon: '📝', count: aiInsights.drafts || 0, type: 'drafts', color: '#8b5cf6' },
    { name: 'Archive', icon: '📁', count: 0, type: 'archive', color: '#6b7280' }
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  const defaultAccounts = [
    { id: 'joe@reach.io', name: 'Joe', email: 'joe@reach.io', type: 'primary', unread: 3, status: 'connected' },
    { id: 'support@reach.io', name: 'Support', email: 'support@reach.io', type: 'support', unread: 1, status: 'connected' },
    { id: 'sales@reach.io', name: 'Sales', email: 'sales@reach.io', type: 'sales', unread: 0, status: 'connected' }
  ];

  const displayAccounts = accounts.length > 0 ? accounts : defaultAccounts;

  const defaultFolders = [
    { name: 'INBOX', count: unreadCount, type: 'inbox', icon: '📥' },
    { name: 'Sent', count: 23, type: 'sent', icon: '📤' },
    { name: 'Archive', count: 156, type: 'archive', icon: '📁' },
    { name: 'Spam', count: 12, type: 'spam', icon: '🚫' },
    { name: 'Trash', count: 45, type: 'trash', icon: '🗑️' }
  ];

  const displayFolders = folders.length > 0 ? folders : defaultFolders;

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(savedSearches);
    
    // Initialize quick filters
    setQuickFilters([
      { name: 'Unread', query: 'is:unread', count: unreadCount },
      { name: 'Starred', query: 'is:starred', count: starredCount },
      { name: 'With Attachments', query: 'has:attachment', count: aiInsights.withAttachments || 8 },
      { name: 'This Week', query: 'after:1week', count: aiInsights.thisWeek || 15 }
    ]);
  }, [unreadCount, starredCount, aiInsights]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSearch = (query) => {
    onSearchChange?.(query);
    
    // Add to recent searches
    if (query && !recentSearches.includes(query)) {
      const updatedSearches = [query, ...recentSearches.slice(0, 4)];
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    }
  };

  const handleQuickFilter = (filter) => {
    onSearchChange?.(filter.query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.setItem('recentSearches', '[]');
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw size={14} className="spinning" />;
      case 'error':
        return <div className="status-dot error" />;
      case 'synced':
        return <div className="status-dot synced" />;
      default:
        return <div className="status-dot synced" />;
    }
  };

  const getAccountIcon = (account) => {
    switch (account.type) {
      case 'primary':
        return <Users size={16} className="account-icon primary" />;
      case 'support':
        return <Mail size={16} className="account-icon support" />;
      case 'sales':
        return <BarChart3 size={16} className="account-icon sales" />;
      default:
        return <Mail size={16} className="account-icon" />;
    }
  };

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">🚀</div>
          <div className="logo-text">
            <h2>ReachInbox</h2>
            <p>AI Email Manager</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="icon-btn refresh-btn"
            onClick={onRefresh}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            className="icon-btn settings-btn"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Compose Button */}
      <div className="compose-section">
        <button 
          className="compose-btn"
          onClick={onComposeEmail}
        >
          <Plus size={18} />
          Compose
        </button>
      </div>

      {/* Quick Search */}
      <div className="search-section">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          <Filter size={16} className="filter-icon" />
        </div>
        
        {/* Recent Searches */}
        {recentSearches.length > 0 && expandedSections.search && (
          <div className="recent-searches">
            <div className="section-header">
              <span>Recent Searches</span>
              <button 
                className="clear-btn"
                onClick={clearRecentSearches}
                title="Clear recent searches"
              >
                Clear
              </button>
            </div>
            {recentSearches.map((search, index) => (
              <div
                key={index}
                className="recent-search-item"
                onClick={() => handleSearch(search)}
              >
                <Search size={14} />
                <span>{search}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accounts Section */}
      <div className="sidebar-section">
        <div 
          className="section-header clickable"
          onClick={() => toggleSection('accounts')}
        >
          <div className="header-title">
            {expandedSections.accounts ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>Accounts</span>
          </div>
          <div className="sync-status">
            {getSyncStatusIcon()}
          </div>
        </div>
        
        {expandedSections.accounts && (
          <div className="accounts-list">
            {displayAccounts.map(account => (
              <div
                key={account.id}
                className={`account-item ${selectedAccount === account.id ? 'active' : ''}`}
                onClick={() => onAccountSelect?.(account.id)}
              >
                <div className="account-info">
                  {getAccountIcon(account)}
                  <div className="account-details">
                    <span className="account-name">{account.name}</span>
                    <span className="account-email">{account.email}</span>
                  </div>
                </div>
                <div className="account-stats">
                  {account.unread > 0 && (
                    <span className="unread-badge">{account.unread}</span>
                  )}
                  <div className={`status-dot ${account.status}`} />
                </div>
              </div>
            ))}
            <button className="add-account-btn">
              <Plus size={14} />
              Add Account
            </button>
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="sidebar-section">
        <div 
          className="section-header clickable"
          onClick={() => toggleSection('categories')}
        >
          <div className="header-title">
            {expandedSections.categories ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>Categories</span>
          </div>
        </div>
        
        {expandedSections.categories && (
          <div className="categories-list">
            {displayCategories.map(category => (
              <div
                key={category.name}
                className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                onClick={() => onCategorySelect?.(category.name)}
                style={{ '--category-color': category.color }}
              >
                <div className="category-icon">{category.icon}</div>
                <span className="category-name">{category.name}</span>
                {category.count > 0 && (
                  <span className="category-count">{category.count}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Folders Section */}
      <div className="sidebar-section">
        <div 
          className="section-header clickable"
          onClick={() => toggleSection('folders')}
        >
          <div className="header-title">
            {expandedSections.folders ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>Folders</span>
          </div>
        </div>
        
        {expandedSections.folders && (
          <div className="folders-list">
            {displayFolders.map(folder => (
              <div
                key={folder.name}
                className={`folder-item ${selectedFolder === folder.name ? 'active' : ''}`}
                onClick={() => onFolderSelect?.(folder.name)}
              >
                <div className="folder-icon">{folder.icon}</div>
                <span className="folder-name">{folder.name}</span>
                {folder.count > 0 && (
                  <span className="folder-count">{folder.count}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div className="sidebar-section">
        <div className="section-header">
          <Filter size={16} />
          <span>Quick Filters</span>
        </div>
        <div className="filters-list">
          {quickFilters.map(filter => (
            <div
              key={filter.name}
              className="filter-item"
              onClick={() => handleQuickFilter(filter)}
            >
              <div className="filter-info">
                <span className="filter-name">{filter.name}</span>
                {filter.count > 0 && (
                  <span className="filter-count">{filter.count}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="sidebar-section">
        <div 
          className="section-header clickable"
          onClick={() => toggleSection('insights')}
        >
          <div className="header-title">
            {expandedSections.insights ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Zap size={16} />
            <span>AI Insights</span>
          </div>
        </div>
        
        {expandedSections.insights && (
          <div className="ai-insights">
            <div className="insight-item">
              <div className="insight-icon">📈</div>
              <div className="insight-details">
                <span className="insight-value">{unreadCount}</span>
                <span className="insight-label">Unread</span>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon">⭐</div>
              <div className="insight-details">
                <span className="insight-value">{starredCount}</span>
                <span className="insight-label">Starred</span>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon">⚡</div>
              <div className="insight-details">
                <span className="insight-value">
                  {displayCategories.find(c => c.name === 'Interested')?.count || 0}
                </span>
                <span className="insight-label">Hot Leads</span>
              </div>
            </div>
            <div className="insight-item">
              <div className="insight-icon">🚀</div>
              <div className="insight-details">
                <span className="insight-value">
                  {aiInsights.responseTime || '2.1h'}
                </span>
                <span className="insight-label">Avg Response</span>
              </div>
            </div>
            <div className="insight-chart">
              <div className="chart-title">Category Distribution</div>
              <div className="chart-bars">
                {displayCategories.slice(0, 4).map(category => (
                  <div key={category.name} className="chart-bar">
                    <div 
                      className="bar-fill"
                      style={{ 
                        height: `${(category.count / Math.max(...displayCategories.map(c => c.count)) * 100)}%`,
                        backgroundColor: category.color
                      }}
                    />
                    <span className="bar-label">{category.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="sidebar-footer">
        <div className="storage-stats">
          <div className="storage-bar">
            <div 
              className="storage-fill"
              style={{ width: '65%' }}
            />
          </div>
          <span className="storage-text">4.2GB of 15GB used</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;