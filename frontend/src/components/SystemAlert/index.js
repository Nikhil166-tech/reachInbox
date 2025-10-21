import React from 'react';
import './index.css'; // Fixed import - was "./index.cs."

const SystemAlert = ({ message, type, onClose }) => {
    if (!message) return null;
    
    const alertClass = `system-alert system-alert-${type}`;

    return (
        <div className={alertClass} role="alert">
            <div className="alert-content">
                <strong className="alert-title">{type.toUpperCase()}!</strong>
                <span className="alert-message">{message}</span>
            </div>
            <button className="alert-close" onClick={onClose}>
                <svg className="close-icon" viewBox="0 0 20 20">
                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.854l-2.651 2.995a1.2 1.2 0 1 1-1.697-1.697l2.995-2.651-2.995-2.651a1.2 1.2 0 0 1 1.697-1.697L10 8.305l2.651-2.995a1.2 1.2 0 1 1 1.697 1.697L11.854 10l2.995 2.651a1.2 1.2 0 0 1 0 1.698z"/>
                </svg>
            </button>
        </div>
    );
};

export default SystemAlert;