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
            const isHN = this.currentTab.url.includes('news.ycombinator.com');
            const isReddit = this.currentTab.url.includes('reddit.com');
            const isQuora = this.currentTab.url.includes('quora.com');
            const isSupportedSite = isHN || isReddit || isQuora;
            
            // Update UI visibility
            document.getElementById('notOnCommunity').style.display = 
                isSupportedSite ? 'none' : 'block';
            
            document.getElementById('onCommunity').style.display = 
                isSupportedSite ? 'block' : 'none';

            if (isSupportedSite) {
                try {
                    // Get page info from content script
                    const pageInfo = await this.sendMessageToTab('getPageInfo');
                    console.log('Page info:', pageInfo);
                    
                    // Update page type and title
                    const pageTypeElement = document.getElementById('pageType');
                    const pageTitleElement = document.getElementById('pageTitle');
                    
                    if (pageTypeElement) {
                        pageTypeElement.textContent = pageInfo.isDiscussion ? 'Discussion' : 'Listing';
                    }
                    
                    if (pageTitleElement) {
                        pageTitleElement.textContent = pageInfo.title || 'Untitled';
                    }

                    // Update button visibility based on page type
                    document.getElementById('summarizeBtn').style.display = 
                        pageInfo.isDiscussion ? 'block' : 'none';
                    
                    document.getElementById('toggleSidebarBtn').style.display = 
                        pageInfo.isDiscussion ? 'block' : 'none';
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
            this.setStatus('Generating summary...', true);
            const response = await this.sendMessageToTab('summarize');
            
            if (response.success) {
                this.setStatus('Summary generated!');
                setTimeout(() => this.clearStatus(), 2000);
            } else {
                throw new Error(response.error || 'Failed to generate summary');
            }
        } catch (error) {
            console.error('Summarization error:', error);
            this.showError(error.message);
        }
    }

    async handleToggleSidebar() {
        try {
            await this.sendMessageToTab('toggleSidebar');
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
            const response = await chrome.tabs.sendMessage(this.currentTab.id, { action, ...data });
            return response;
        } catch (error) {
            console.error('Message send error:', error);
            throw new Error('Could not communicate with the page. Please refresh and try again.');
        }
    }

    setStatus(message, loading = false) {
        const statusMessage = document.getElementById('statusMessage');
        const statusText = document.getElementById('statusText');
        
        if (statusMessage && statusText) {
            statusText.textContent = message;
            statusMessage.classList.toggle('hidden', !message);
            const spinner = statusMessage.querySelector('svg');
            if (spinner) {
                spinner.classList.toggle('hidden', !loading);
            }
        }
    }

    clearStatus() {
        this.setStatus('');
    }

    showError(message) {
        this.setStatus(`Error: ${message}`);
        setTimeout(() => this.clearStatus(), 3000);
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
