class PopupManager {
    constructor() {
        this.currentTab = null;
        this.init();
    }

    async init() {
        await this.getCurrentTab();
        this.setupEventListeners();
        await this.updateUI();
    }

    async getCurrentTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        this.currentTab = tab;
    }

    setupEventListeners() {
        // Summary button handler
        const summarizeBtn = document.getElementById('summarizeBtn');
        if (summarizeBtn) {
            summarizeBtn.addEventListener('click', () => this.handleSummarize());
        }

        // Settings button handler
        const settingsBtn = document.getElementById('settingsButton');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                chrome.runtime.openOptionsPage();
            });
        }

        // Sidebar toggle button handler
        const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
        if (toggleSidebarBtn) {
            toggleSidebarBtn.addEventListener('click', () => this.handleToggleSidebar());
        }
    }

    async updateUI() {
        try {
            // Check if current page is supported
            const hostname = this.currentTab.url.toLowerCase();
            const isHN = hostname.includes('news.ycombinator.com');
            const isReddit = hostname.includes('reddit.com');
            const isSupportedSite = isHN || isReddit;
            
            // Update UI visibility
            document.getElementById('notOnCommunity').style.display = 
                isSupportedSite ? 'none' : 'block';
            
            document.getElementById('onCommunity').style.display = 
                isSupportedSite ? 'block' : 'none';

            if (isSupportedSite) {
                try {
                    // Get page info from content script
                    const response = await this.sendMessageToTab('getPageInfo');
                    console.log('Page info response:', response);

                    if (!response.success) {
                        throw new Error(response.error || 'Failed to get page info');
                    }
                    
                    const pageInfo = response.data;
                    console.log('Page info:', pageInfo);
                    
                    // Update page type display
                    document.getElementById('pageType').textContent = 
                        pageInfo.isDiscussion ? 'Discussion' : 'Listing';

                    // Update button visibility based on page type
                    const canSummarize = pageInfo.isDiscussion;
                    document.getElementById('summarizeBtn').style.display = 
                        canSummarize ? 'block' : 'none';
                    
                    document.getElementById('toggleSidebarBtn').style.display = 
                        canSummarize ? 'block' : 'none';

                    // Update thread info if available
                    const threadInfo = document.getElementById('threadInfo');
                    if (threadInfo && pageInfo.title) {
                        threadInfo.textContent = pageInfo.title;
                    }
                } catch (error) {
                    console.error('Error getting page info:', error);
                    this.showError('Could not get page information. Please refresh the page.');
                }
            }
        } catch (error) {
            console.error('Error updating UI:', error);
            this.showError('Failed to update UI');
        }
    }

    async handleSummarize() {
        try {
            const summarizeBtn = document.getElementById('summarizeBtn');
            summarizeBtn.disabled = true;
            this.setStatus('Generating summary...', true);

            await this.sendMessageToTab('toggleSidebar');

            console.log('Sending summarize message to tab:', this.currentTab?.id);
            const response = await this.sendMessageToTab('summarize');
            console.log('Received summarize response:', response);

            if (!response) {
                throw new Error('No response received from content script');
            }
            
            if (response.success) {
                console.log('Summary generated successfully');
                window.close();
            } else {
                throw new Error(response.error || 'Failed to generate summary');
            }
        } catch (error) {
            console.error('Summarization error:', error);
            this.showError(error.message);
            document.getElementById('summarizeBtn').disabled = false;
        }
    }


    async handleToggleSidebar() {
        try {
            await this.sendMessageToTab('toggleSidebar');
            window.close();
        } catch (error) {
            console.error('Toggle sidebar error:', error);
            this.showError('Could not toggle sidebar');
        }
    }

    async sendMessageToTab(action, data = {}) {
        if (!this.currentTab?.id) {
            throw new Error('No active tab found');
        }
        
        try {
            console.log(`Sending message to tab ${this.currentTab.id}:`, { action, data });
            const response = await chrome.tabs.sendMessage(this.currentTab.id, { action, ...data });
            console.log(`Received response for ${action}:`, response);
            
            // 添加默认响应对象
            return response || { success: true };
        } catch (error) {
            console.error('Message send error:', error);
            throw new Error('Could not communicate with the page. Please refresh and try again.');
        }
    }

    setStatus(message, loading = false) {
        console.log('Setting status:', { message, loading });
        const statusMessage = document.getElementById('statusMessage');
        const statusText = document.getElementById('statusText');
        const spinner = statusMessage?.querySelector('svg');
        
        if (statusMessage && statusText) {
            statusText.textContent = message;
            statusMessage.classList.toggle('hidden', !message);
            if (spinner) {
                spinner.classList.toggle('hidden', !loading);
            }
        }
    }

    clearStatus() {
        this.setStatus('');
    }

    showError(message) {
        console.error('Showing error:', message);
        this.setStatus(`Error: ${message}`);
        setTimeout(() => this.clearStatus(), 3000);
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});