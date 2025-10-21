/**
 * Returns Tailwind class based on AI Category (Phase 3).
 * @param {string} category
 */
export const getCategoryClass = (category) => {
    if (!category) return 'category-uncategorized';
    
    switch (category) {
        case 'Interested': return 'category-interested';
        case 'Meeting Booked': return 'category-meeting-booked';
        case 'Not Interested': return 'category-not-interested';
        case 'Spam': return 'category-spam';
        case 'Out of Office': return 'category-out-of-office';
        default: return 'category-uncategorized';
    }
};

/**
 * Formats date for display.
 * @param {string} dateString
 */
export const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Invalid Date';
    }
};

/**
 * Returns relative time (e.g., "2 hours ago")
 * @param {string} dateString
 */
export const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInHours = diffInMs / (1000 * 60 * 60);
        const diffInDays = diffInHours / 24;
        
        if (diffInHours < 1) {
            const minutes = Math.floor(diffInMs / (1000 * 60));
            return minutes <= 1 ? 'just now' : `${minutes}m ago`;
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return `${hours}h ago`;
        } else if (diffInDays < 7) {
            const days = Math.floor(diffInDays);
            return `${days}d ago`;
        } else {
            return formatDate(dateString);
        }
    } catch (error) {
        return '';
    }
};

/**
 * Gets sender initials for avatar
 * @param {string} fromName
 */
export const getSenderInitials = (fromName) => {
    if (!fromName) return '?';
    
    try {
        // Extract name from "John Doe <john@example.com>" format
        const namePart = fromName.split('<')[0].trim();
        const names = namePart.split(' ');
        
        if (names.length >= 2) {
            return (names[0][0] + names[1][0]).toUpperCase();
        } else if (names.length === 1 && names[0].length > 0) {
            return names[0][0].toUpperCase();
        }
        
        return '?';
    } catch (error) {
        return '?';
    }
};

/**
 * Truncates text to specified length
 * @param {string} text
 * @param {number} length
 */
export const truncateText = (text, length = 50) => {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
};