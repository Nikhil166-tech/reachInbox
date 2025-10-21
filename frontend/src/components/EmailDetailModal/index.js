import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Copy, Send, Download, Archive, Trash2, 
  Clock, CheckCircle, AlertCircle, Sparkles 
} from 'lucide-react';
import { getCategoryClass } from '../../utils';
import './index.css';

const EmailDetailModal = ({ email, onClose, setSystemMessage, usingMockData }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestedReply, setSuggestedReply] = useState("");
    const [currentStep, setCurrentStep] = useState(null);
    const [copied, setCopied] = useState(false);
    const [replyTemplates, setReplyTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    useEffect(() => {
        setSuggestedReply("Click 'Generate AI Reply' to create a context-aware response using our RAG pipeline.");
        setIsGenerating(false);
        setCurrentStep(null);
        setCopied(false);
        loadReplyTemplates();
    }, [email?.id]);

    // Safe data access with fallbacks
    const categoryClass = getCategoryClass(email?.aiCategory);
    
    const toArray = Array.isArray(email?.to) ? email.to : 
                   typeof email?.to === 'string' ? [email.to] : 
                   ['Unknown Recipient'];
    
    const fromAddress = email?.from || 'Unknown Sender';
    const fromName = fromAddress.split('<')[0].trim();
    const subject = email?.subject || 'No Subject';
    const body = email?.body || 'No content';
    const date = email?.date ? new Date(email.date).toLocaleString() : 'Unknown Date';
    const aiCategory = email?.aiCategory || 'Uncategorized';

    const loadReplyTemplates = () => {
        const templates = [
            { id: 'quick_response', name: 'Quick Response', content: 'Thank you for your email. I will get back to you shortly.' },
            { id: 'meeting_request', name: 'Meeting Request', content: 'I would be happy to schedule a meeting. Please let me know your availability.' },
            { id: 'follow_up', name: 'Follow Up', content: 'Just following up on my previous email. Looking forward to your response.' }
        ];
        setReplyTemplates(templates);
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(suggestedReply);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const applyTemplate = (templateId) => {
        const template = replyTemplates.find(t => t.id === templateId);
        if (template) {
            setSuggestedReply(template.content);
            setSelectedTemplate(templateId);
        }
    };

    const simulateReplyGeneration = useCallback(async (retries = 0) => {
        if (isGenerating) return;
        setIsGenerating(true);
        setSystemMessage(null);
        setCopied(false);
        
        const MAX_RETRIES = 3;
        const BASE_DELAY_MS = 1000;

        try {
            // Step 1: Query Embedding
            setCurrentStep('embedding');
            setSuggestedReply(
                <div className="rag-step">
                    <div className="step-header">
                        <Sparkles size={16} />
                        <span>Analyzing email content and generating query embeddings...</span>
                    </div>
                    <div className="step-progress">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: '25%' }}></div>
                        </div>
                    </div>
                </div>
            );
            await new Promise(resolve => setTimeout(resolve, BASE_DELAY_MS));

            const shouldFail = Math.random() < 0.1 && retries < 2;
            if (shouldFail) {
                throw new Error("Simulated 503 Service Unavailable");
            }

            // Step 2: Vector Search
            setCurrentStep('retrieval');
            setSuggestedReply(
                <div className="rag-step retrieval">
                    <div className="step-header">
                        <Download size={16} />
                        <span>Searching vector database for relevant context...</span>
                    </div>
                    <div className="step-progress">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: '50%' }}></div>
                        </div>
                    </div>
                </div>
            );
            await new Promise(resolve => setTimeout(resolve, BASE_DELAY_MS * 1.5));
            
            const retrievedContext = `Context: The standard meeting link is 'https://calendly.com/reachinbox/quick-chat'. For volume pricing inquiries (over 100 users), refer to the 'Enterprise Tier 3 Document'. API Key rotation steps are documented internally under 'Security Protocol 4.1'.`;

            // Step 3: Generation
            setCurrentStep('generation');
            setSuggestedReply(
                <div className="rag-step generation">
                    <div className="step-header">
                        <Send size={16} />
                        <span>Generating context-aware response using Gemini AI...</span>
                    </div>
                    <div className="step-progress">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: '75%' }}></div>
                        </div>
                    </div>
                </div>
            );
            await new Promise(resolve => setTimeout(resolve, BASE_DELAY_MS * 2.5));
            
            let reply;
            if (email?.aiCategory === 'Interested') {
                reply = `Dear ${fromName},\n\nThank you for reaching out! We would be delighted to set up a 15-minute call to discuss your needs. You can book a time directly using our standard link: https://calendly.com/reachinbox/quick-chat\n\nIf your inquiry is about 500+ users, we can discuss the Enterprise Tier 3 volume pricing on that call.\n\nBest regards,\nJoe (ReachInbox)`;
            } else if (email?.aiCategory === 'Not Interested') {
                 reply = "Thank you for the update. We respect your decision and have removed you from our list. If you change your mind in the future, please don't hesitate to reach out.\n\nBest regards,\nThe ReachInbox Team";
            } else if (email?.aiCategory === 'Meeting Booked') {
                reply = `Hi ${fromName},\n\nThank you for confirming the meeting! I have added it to my calendar and look forward to our discussion on Tuesday at 10:00 AM PST.\n\nPlease don't hesitate to reach out if you need to reschedule or have any pre-meeting materials to share.\n\nBest regards,\nJoe`;
            } else {
                reply = `Dear ${fromName},\n\nThank you for your email. A specialist will review your inquiry and get back to you within 24 hours.\n\nFor urgent matters, please contact our support team at support@reachinbox.com.\n\nBest regards,\nReachInbox AI Assistant\n\nContext used: ${retrievedContext}`;
            }

            setSuggestedReply(reply);
            setCurrentStep('complete');
            setIsGenerating(false);

        } catch (error) {
            console.error('RAG process failed:', error.message);
            if (retries < MAX_RETRIES) {
                const delay = BASE_DELAY_MS * Math.pow(2, retries) + Math.random() * 1000;
                setSystemMessage({ 
                    type: 'error', 
                    message: `Generation failed. Retrying in ${Math.ceil(delay / 1000)}s... (Attempt ${retries + 1}/${MAX_RETRIES})` 
                });
                await new Promise(resolve => setTimeout(resolve, delay));
                await simulateReplyGeneration(retries + 1);
            } else {
                setSystemMessage({ 
                    type: 'error', 
                    message: `RAG Reply generation failed after ${MAX_RETRIES} attempts. Please try again later.` 
                });
                setSuggestedReply("❌ Generation failed. Please try again or use a template below.");
                setIsGenerating(false);
                setCurrentStep('failed');
            }
        }
    }, [email?.id, email?.aiCategory, isGenerating, currentStep, setSystemMessage, fromName]);

    const getStatusConfig = () => {
        const configs = {
            embedding: { text: 'Embedding Query', icon: Sparkles, color: 'blue', progress: 25 },
            retrieval: { text: 'Retrieving Context', icon: Download, color: 'purple', progress: 50 },
            generation: { text: 'Generating Reply', icon: Send, color: 'green', progress: 75 },
            complete: { text: 'Generation Complete', icon: CheckCircle, color: 'green', progress: 100 },
            failed: { text: 'Generation Failed', icon: AlertCircle, color: 'red', progress: 0 }
        };
        return configs[currentStep] || { text: 'Ready', icon: Clock, color: 'gray', progress: 0 };
    };

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    return (
        <div className="email-modal-overlay" onClick={onClose}>
            <div className="email-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-content">
                        <h2 className="modal-subject">{subject}</h2>
                        <div className="header-actions">
                            <button className="icon-btn" title="Archive">
                                <Archive size={18} />
                            </button>
                            <button className="icon-btn" title="Delete">
                                <Trash2 size={18} />
                            </button>
                            <button className="close-button" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="modal-metadata">
                    <div className="metadata-row">
                        <div className="metadata-group">
                            <p className="metadata-from">
                                <strong>From:</strong> <span className="email-address">{fromAddress}</span>
                            </p>
                            <p className="metadata-to">
                                <strong>To:</strong> <span className="email-address">{toArray.join(', ')}</span>
                            </p>
                        </div>
                        <div className="metadata-group">
                            <p className="metadata-time">
                                <Clock size={14} />
                                <span>{date}</span>
                            </p>
                            <p className="metadata-category">
                                <strong>AI Category:</strong>
                                <span className={`ai-category ${categoryClass}`}>
                                    {aiCategory}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="modal-body">
                    <div className="email-content">
                        <div className="content-header">
                            <span className="content-label">Original Message:</span>
                        </div>
                        <div className="email-body">
                            {body.split('\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <div className="actions-header">
                        <div className="header-title">
                            <Sparkles size={20} className="title-icon" />
                            <h3>AI Suggested Reply</h3>
                            {usingMockData && (
                                <span className="demo-badge">Demo Mode</span>
                            )}
                        </div>
                        <div className={`status-indicator ${statusConfig.color}`}>
                            <StatusIcon size={16} />
                            <span>{statusConfig.text}</span>
                        </div>
                    </div>

                    {/* Quick Templates */}
                    <div className="templates-section">
                        <label>Quick Templates:</label>
                        <div className="template-buttons">
                            {replyTemplates.map(template => (
                                <button
                                    key={template.id}
                                    className={`template-btn ${selectedTemplate === template.id ? 'active' : ''}`}
                                    onClick={() => applyTemplate(template.id)}
                                    disabled={isGenerating}
                                >
                                    {template.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reply Content */}
                    <div className="reply-section">
                        <div className="reply-header">
                            <label>Generated Reply:</label>
                            <button 
                                className={`copy-btn ${copied ? 'copied' : ''}`}
                                onClick={copyToClipboard}
                                disabled={!suggestedReply || typeof suggestedReply !== 'string'}
                            >
                                <Copy size={16} />
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <div className="reply-content">
                            {typeof suggestedReply === 'string' ? (
                                <pre>{suggestedReply}</pre>
                            ) : (
                                suggestedReply
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button 
                            className={`generate-btn primary ${isGenerating ? 'generating' : ''}`}
                            onClick={() => simulateReplyGeneration(0)} 
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="button-spinner"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Generate AI Reply
                                </>
                            )}
                        </button>
                        
                        <button 
                            className="generate-btn secondary"
                            onClick={copyToClipboard}
                            disabled={!suggestedReply || typeof suggestedReply !== 'string' || isGenerating}
                        >
                            <Send size={16} />
                            Use & Send
                        </button>
                    </div>

                    <div className="actions-footer">
                        <p className="tech-info">
                            <strong>RAG Pipeline:</strong> Query Embedding → Vector Search (Qdrant) → Context Assembly → AI Generation (Gemini)
                            {currentStep && ` | Current: ${statusConfig.text}`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailDetailModal;