import { getParser, isSupportedSite } from './parsers/registry';

// Simple markdown renderer
const renderMarkdown = (text) => {
    return text
        // Headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Lists
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        // Paragraphs
        .split('\n')
        .map(line => line.trim() ? `<p>${line}</p>` : '')
        .join('\n');
};

class ContentScript {
    constructor() {
        if (!isSupportedSite()) {
            console.log('Site not supported');
            return;
        }
        
        this.parser = getParser();
        this.sidebarVisible = false;
        this.threadSummaries = new Map();
        this.settings = null;
        this.init();
    }

    async init() {
        // Load user settings
        this.settings = await this.loadSettings();
        this.setupMessageListener();
        this.initializeUI();
        console.log('Community TL;DR: Content script loaded');
    }

    async loadSettings() {
        try {
            // Load settings with defaults
            const settings = await chrome.storage.sync.get({
                aiProvider: 'custom',
                apiKey: '',
                endpoint: '',
                model: 'gpt-3.5-turbo',
                summaryLength: 'medium',
                language: 'chinese', // Default to Chinese
                autoSummarize: false
            });
            return settings;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return {};
        }
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Content script received message:', request);
            
            const action = typeof request === 'string' ? request : request.action;
            
            switch (action) {
                case 'summarize':
                    (async () => {
                        try {
                            const result = await this.handleSummarize();
                            sendResponse(result);
                        } catch (error) {
                            console.error('Summarization error:', error);
                            sendResponse({
                                success: false,
                                error: error.message || 'Summarization failed'
                            });
                        }
                    })();
                    return true;
                
                case 'toggleSidebar':
                    try {
                        this.handleToggleSidebar();
                        sendResponse({ success: true });
                    } catch (error) {
                        console.error('Toggle sidebar error:', error);
                        sendResponse({
                            success: false,
                            error: error.message || 'Toggle sidebar failed'
                        });
                    }
                    return true;
                
                case 'getPageInfo':
                    try {
                        const pageInfo = {
                            type: 'hackernews',
                            isDiscussion: this.parser.isDiscussionPage(),
                            title: this.parser.getTitle(),
                            url: window.location.href
                        };
                        sendResponse(pageInfo);
                    } catch (error) {
                        console.error('Get page info error:', error);
                        sendResponse({
                            success: false,
                            error: error.message || 'Failed to get page info'
                        });
                    }
                    return true;

                default:
                    console.warn('Unknown message action:', action);
                    sendResponse({
                        success: false,
                        error: 'Unknown action'
                    });
                    return true;
            }
        });
    }

    async handleSummarize() {
        try {
            const sidebar = this.getOrCreateSidebar();
            
            this.updateSidebarContent({ 
                loading: true, 
                message: 'Analyzing main post...' 
            });
            
            sidebar.classList.add('visible');
            this.sidebarVisible = true;

            const content = this.parser.getPageContent();
            if (!content) {
                throw new Error('Could not extract page content');
            }
            
            // Summarize main post
            const mainPostSummary = await this.summarizeContent({
                type: 'main_post',
                title: content.mainPost.title,
                text: content.mainPost.text || content.mainPost.url,
                url: content.mainPost.url
            });

            // Update sidebar with summary
            this.updateSidebarContent({
                type: 'main_post',
                title: content.mainPost.title,
                summary: mainPostSummary,
                threadCount: this.parser.getTopLevelComments().length
            });
            
            return { success: true };
        } catch (error) {
            console.error('Summarization error:', error);
            this.updateSidebarContent({
                error: true,
                message: error.message || 'Failed to generate summary'
            });
            throw error;
        }
    }

    async summarizeContent(data) {
        try {
            // Prepare thread content for summarization
            const threadContent = `
    Title: ${data.title || 'No Title'}
    Content: ${data.text || 'No Content'}
            `.trim();
    
            // Send summarization request to background worker
            const response = await chrome.runtime.sendMessage({
                type: 'SUMMARIZE',
                data: {
                    content: threadContent,
                    type: data.type,
                    url: data.url,
                    language: this.settings?.language || 'chinese'
                }
            });
    
            if (!response.success) {
                throw new Error(response.error || 'Failed to generate summary');
            }
    
            return response.data;
        } catch (error) {
            console.error('Summarization error:', error);
            throw error;
        }
    }

    initializeUI() {
        // Create or get sidebar
        this.sidebar = this.getOrCreateSidebar();
        
        // Add TL;DR buttons if on discussion page
        if (this.parser.isDiscussionPage()) {
            this.initializeThreadControls();
        }
    }

    initializeThreadControls() {
        // Add summary buttons only to top-level comments
        const topLevelComments = this.parser.getTopLevelComments();
        topLevelComments.forEach(comment => {
            const commentHead = comment.querySelector('.comhead');
            if (commentHead && !commentHead.querySelector('.tldr-summarize-btn')) {
                const summarizeBtn = document.createElement('a');
                summarizeBtn.href = 'javascript:void(0)';
                summarizeBtn.className = 'tldr-summarize-btn';
                summarizeBtn.textContent = 'TL;DR';
                summarizeBtn.style.marginLeft = '4px';
                summarizeBtn.style.color = '#666';
                summarizeBtn.style.fontSize = '11px';
                
                summarizeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.summarizeThread(comment);
                });
                
                commentHead.appendChild(summarizeBtn);
            }
        });
    }

    async summarizeThread(commentElement) {
        const threadId = commentElement.id;
        console.log('Starting to summarize thread:', threadId);
        const summarizeBtn = commentElement.querySelector('.tldr-summarize-btn');
        
        try {
            // Update button state to loading
            if (summarizeBtn) {
                summarizeBtn.textContent = 'Summarizing...';
                summarizeBtn.style.color = '#999';
            }

            // Get thread content with replies
            const thread = this.parser.parseCommentThread(commentElement);
            
            // Prepare content for summarization
            const threadContent = `
Thread started by ${thread.root.by}:
${thread.root.text}

Thread discussion (${thread.replies.length} replies):
${thread.replies.map(reply => `[${reply.by}]: ${reply.text}`).join('\n\n')}

Please summarize focusing on:
1. Main points and arguments
2. Key insights or conclusions
3. Any consensus or disagreements
`;

            // Call summarization service
            const response = await chrome.runtime.sendMessage({
                type: 'SUMMARIZE',
                data: {
                    content: threadContent,
                    threadId: threadId,
                    language: this.settings.language
                }
            });

            if (response?.success) {
                // Store summary data
                this.threadSummaries.set(threadId, {
                    summary: response.data,
                    author: thread.root.by,
                    replyCount: thread.replies.length,
                    timestamp: Date.now()
                });

                // Update UI
                this.updateThreadSummary(threadId);
                
                // Show sidebar if hidden
                if (!this.sidebarVisible) {
                    this.handleToggleSidebar();
                }

                // Update button to success state
                if (summarizeBtn) {
                    summarizeBtn.textContent = 'TL;DR ✓';
                    summarizeBtn.style.color = '#090';
                }
            } else {
                throw new Error(response?.error || 'Failed to get summary');
            }
        } catch (error) {
            console.error(`Error summarizing thread ${threadId}:`, error);
            // Update button to error state
            if (summarizeBtn) {
                summarizeBtn.textContent = 'TL;DR (error)';
                summarizeBtn.style.color = '#c00';
            }
        }
    }

    handleToggleSidebar() {
        const sidebar = this.getOrCreateSidebar();
        this.sidebarVisible = !sidebar.classList.contains('visible');
        sidebar.classList.toggle('visible');
    }

    updateThreadSummary(threadId) {
        // Ensure sidebar structure exists
        this.ensureSidebarStructure();

        const threadsList = this.sidebar.querySelector('#tldr-threads-list');
        if (!threadsList) {
            console.error('Threads list container not found');
            return;
        }

        const threadData = this.threadSummaries.get(threadId);
        if (!threadData) {
            console.error('No summary data found for thread:', threadId);
            return;
        }

        // Create or update thread summary element
        let threadElement = threadsList.querySelector(`[data-thread-id="${threadId}"]`);
        if (!threadElement) {
            threadElement = document.createElement('div');
            threadElement.className = 'tldr-thread-summary';
            threadElement.setAttribute('data-thread-id', threadId);
            threadsList.insertBefore(threadElement, threadsList.firstChild);
        }

        // Update content with markdown rendering
        threadElement.innerHTML = `
            <div class="tldr-thread-header">
                <span class="tldr-thread-author">${threadData.author}</span>
                <span class="tldr-thread-replies">${threadData.replyCount} replies</span>
            </div>
            <div class="tldr-thread-content markdown-body">
                ${renderMarkdown(threadData.summary)}
            </div>
        `;

        // Add click handler to scroll to original comment
        threadElement.addEventListener('click', () => {
            this.parser.scrollToComment(threadId);
        });
    }

    ensureSidebarStructure() {
        const content = this.sidebar.querySelector('.tldr-sidebar-content');
        if (!content) {
            console.error('Sidebar content container not found');
            return;
        }

        // Create thread list container if it doesn't exist
        let threadsList = content.querySelector('#tldr-threads-list');
        if (!threadsList) {
            const threadsContainer = document.createElement('div');
            threadsContainer.className = 'tldr-threads-container';
            threadsContainer.innerHTML = `
                <h4 class="tldr-threads-title">Discussion Summaries</h4>
                <div id="tldr-threads-list" class="tldr-threads-list"></div>
            `;
            content.appendChild(threadsContainer);
        }
    }

    updateSidebarContent(data) {
        const content = this.sidebar.querySelector('.tldr-sidebar-content');
        if (!content) {
            console.error('Could not find sidebar content element');
            return;
        }

        // Show loading state
        if (data.loading) {
            content.innerHTML = `
                <div class="tldr-loading">
                    <div class="tldr-loading-spinner"></div>
                    <p>${data.message || 'Loading...'}</p>
                </div>
            `;
            return;
        }

        // Show error state
        if (data.error) {
            content.innerHTML = `
                <div class="tldr-error">
                    <p class="tldr-error-message">${data.message || 'An error occurred'}</p>
                </div>
            `;
            return;
        }

        // Update main post summary
        if (data.type === 'main_post' && !content.querySelector('.tldr-main-content')) {
            content.innerHTML = `
                <div class="tldr-main-content">
                    <div class="tldr-summary-card">
                        <div class="tldr-summary-card-header">
                            <h3 class="tldr-summary-card-title">${data.title}</h3>
                            <div class="tldr-summary-card-meta">
                                ${data.threadCount} comments in total
                            </div>
                        </div>
                        <div class="tldr-summary-content markdown-body">
                            ${renderMarkdown(data.summary)}
                        </div>
                    </div>
                </div>
                <div class="tldr-threads-container">
                    <h4 class="tldr-threads-title">Thread Summaries</h4>
                    <div id="tldr-threads-list" class="tldr-threads-list"></div>
                </div>
            `;
        }
    }

    getOrCreateSidebar() {
        let sidebar = document.querySelector('.tldr-sidebar');
        
        if (!sidebar) {
            sidebar = document.createElement('div');
            sidebar.className = 'tldr-sidebar';
            sidebar.innerHTML = `
                <div class="tldr-sidebar-header">
                    <h2 class="tldr-sidebar-title">Discussion Summary</h2>
                    <button class="tldr-sidebar-close">&times;</button>
                </div>
                <div class="tldr-sidebar-content"></div>
            `;

            document.body.appendChild(sidebar);

            // Add close button handler
            const closeBtn = sidebar.querySelector('.tldr-sidebar-close');
            closeBtn.addEventListener('click', () => {
                sidebar.classList.remove('visible');
                this.sidebarVisible = false;
            });
        }

        return sidebar;
    }
}

// Initialize content script
new ContentScript();