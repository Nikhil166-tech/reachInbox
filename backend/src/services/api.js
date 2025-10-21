const API_BASE_URL = 'http://localhost:3001/api';

export const emailAPI = {
  // Search emails
  async searchEmails({ searchTerm, accountFilter, folderFilter }) {
    const params = new URLSearchParams();
    if (searchTerm) params.append('q', searchTerm);
    if (accountFilter) params.append('account', accountFilter);
    if (folderFilter) params.append('folder', folderFilter);
    
    const response = await fetch(`${API_BASE_URL}/emails/search?${params}`);
    const data = await response.json();
    return data.success ? data.data : [];
  },

  // Get email by ID
  async getEmail(id) {
    const response = await fetch(`${API_BASE_URL}/emails/${id}`);
    const data = await response.json();
    return data.success ? data.data : null;
  },

  // Generate AI reply
  async generateReply(emailId, emailContent) {
    const response = await fetch(`${API_BASE_URL}/emails/${emailId}/suggest-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailContent })
    });
    const data = await response.json();
    return data.success ? data.reply : 'Failed to generate reply';
  }
};

export const accountAPI = {
  // Get all accounts
  async getAccounts() {
    const response = await fetch(`${API_BASE_URL}/accounts`);
    return await response.json();
  }
};