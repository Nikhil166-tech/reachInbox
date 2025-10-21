import React, { useState, memo } from 'react';
import { 
  Star, 
  StarOff, 
  Paperclip, 
  Eye, 
  EyeOff, 
  Check, 
  Clock,
  User,
  Mail,
  Archive,
  Trash2
} from 'lucide-react';
import { getCategoryClass, formatDate, getSenderInitials, getRelativeTime } from '../../utils';
import './index.css';

const EmailListItem = ({ 
  email, 
  onClick, 
  onToggleStar, 
  onMarkRead, 
  onArchive,
  onDelete,
  isSelected = false,
  onSelect,
  showCheckbox = false 
}) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const categoryClass = getCategoryClass(email?.aiCategory);
    const fromName = email?.from ? email.from.split('<')[0].trim() : 'Unknown Sender';
    const accountName = email?.accountId ? email.accountId.split('@')[0] : 'Unknown';
    const folder = email?.folder || 'Unknown';
    const subject = email?.subject || 'No Subject';
    const date = email?.date ? formatDate(email.date) : 'Unknown Date';
    const aiCategory = email?.aiCategory || 'Uncategorized';
    const isRead = email?.read || false;
    const isStarred = email?.starred || false;
    const hasAttachment = email?.attachments && email.attachments.length > 0;
    const senderInitials = getSenderInitials(fromName);
    const relativeTime = email?.date ? getRelativeTime(email.date) : '';

    const handleStarClick = (e) => {
        e.stopPropagation();
        onToggleStar?.(email.id);
    };

    const handleReadClick = (e) => {
        e.stopPropagation();
        onMarkRead?.(email.id, !isRead);
    };

    const handleArchiveClick = (e) => {
        e.stopPropagation();
        onArchive?.(email.id);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete?.(email.id);
    };

    const handleCheckboxClick = (e) => {
        e.stopPropagation();
        onSelect?.(email.id, !isSelected);
    };

    const getPriorityLevel = () => {
        if (email?.aiCategory === 'Interested') return 'high';
        if (email?.aiCategory === 'Meeting Booked') return 'medium';
        return 'low';
    };

    const priorityLevel = getPriorityLevel();

    return (
        <div 
            className={`email-list-item ${isRead ? 'email-read' : 'email-unread'} ${isSelected ? 'email-selected' : ''} priority-${priorityLevel}`}
            onClick={() => onClick(email)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="email-grid">
                {/* Selection Checkbox */}
                {showCheckbox && (
                    <div className="email-checkbox">
                        <div 
                            className={`checkbox ${isSelected ? 'checked' : ''}`}
                            onClick={handleCheckboxClick}
                        >
                            {isSelected && <Check size={12} />}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="email-actions">
                    <div className="action-group">
                        <button 
                            className={`star-btn ${isStarred ? 'starred' : ''} ${isHovered ? 'visible' : ''}`}
                            onClick={handleStarClick}
                            title={isStarred ? 'Unstar' : 'Star'}
                        >
                            {isStarred ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                        </button>
                        <button 
                            className={`read-btn ${isRead ? 'read' : 'unread'} ${isHovered ? 'visible' : ''}`}
                            onClick={handleReadClick}
                            title={isRead ? 'Mark as unread' : 'Mark as read'}
                        >
                            {isRead ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* Sender Avatar with Online Status */}
                <div className="email-sender-avatar">
                    <div className="avatar-container">
                        <div className="avatar">
                            {senderInitials}
                        </div>
                        <div className={`online-status ${email?.isOnline ? 'online' : 'offline'}`}></div>
                    </div>
                </div>

                {/* Sender Name with Verification */}
                <div className="email-sender">
                    <div className="sender-info">
                        <span className="sender-name">{fromName}</span>
                        {email?.isVerified && (
                            <span className="verified-badge" title="Verified sender">✓</span>
                        )}
                    </div>
                    {email?.company && (
                        <div className="sender-company">{email.company}</div>
                    )}
                </div>

                {/* Subject with Priority and Preview */}
                <div className="email-subject-preview">
                    <div className="subject-line">
                        <div className="subject-content">
                            <span className="subject-text">{subject}</span>
                            {priorityLevel === 'high' && (
                                <span className="priority-indicator high" title="High priority">❗</span>
                            )}
                            {priorityLevel === 'medium' && (
                                <span className="priority-indicator medium" title="Medium priority">🔸</span>
                            )}
                        </div>
                        <div className="subject-actions">
                            {hasAttachment && (
                                <Paperclip size={14} className="attachment-icon" title="Has attachments" />
                            )}
                            {isHovered && (
                                <>
                                    <button 
                                        className="quick-action-btn"
                                        onClick={handleArchiveClick}
                                        title="Archive"
                                    >
                                        <Archive size={14} />
                                    </button>
                                    <button 
                                        className="quick-action-btn delete"
                                        onClick={handleDeleteClick}
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="email-preview">
                        {email?.body ? email.body.substring(0, 80) + (email.body.length > 80 ? '...' : '') : 'No content'}
                    </div>
                    {email?.labels && email.labels.length > 0 && (
                        <div className="email-labels">
                            {email.labels.map((label, index) => (
                                <span key={index} className="email-label" style={{ backgroundColor: label.color }}>
                                    {label.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Account & Folder with Sync Status */}
                <div className="email-account-folder">
                    <div className="account-info">
                        <span className="account-badge">
                            <span className="account-name">{accountName}</span>
                            <span className="folder-tag">{folder}</span>
                        </span>
                        {email?.syncStatus === 'syncing' && (
                            <div className="sync-indicator" title="Syncing...">
                                <div className="sync-spinner"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Date & Time with Read Receipt */}
                <div className="email-date-time">
                    <div className="date-text">{date}</div>
                    <div className="time-info">
                        <span className="time-text">{relativeTime}</span>
                        {email?.readReceipt && (
                            <div className="read-receipt" title="Read receipt received">
                                <Eye size={10} />
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Category with Confidence Score */}
                <div className="email-category">
                    <div className="category-info">
                        <span className={`ai-category ${categoryClass}`}>
                            {aiCategory}
                        </span>
                        {email?.confidence && (
                            <div className="confidence-score" title={`AI confidence: ${Math.round(email.confidence * 100)}%`}>
                                <div 
                                    className="confidence-bar" 
                                    style={{ width: `${email.confidence * 100}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Bar for Operations */}
            {(email?.isArchiving || email?.isDeleting) && (
                <div className="operation-progress">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${email.progress || 0}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Memoize component for better performance
export default memo(EmailListItem);