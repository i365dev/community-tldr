import { renderMarkdown } from '../utils/markdown';

export class BaseSummarizer {
    constructor() {
        this.sidebarVisible = false;
        this.threadSummaries = new Map();
        this.settings = null;
        this.parser = null;
    }

    async init() {
        this.settings = await this.loadSettings();
        this.setupMessageListener();
        this.initializeUI();
        console.log('Community TL;DR: Content script loaded');
    }

    async loadSettings() {
        try {
            return await chrome.storage.sync.get({
                aiProvider: 'custom',
                apiKey: '',
                endpoint: '',
                model: 'gpt-3.5-turbo',
                summaryLength: 'medium',
                language: 'chinese',
                autoSummarize: false
            });
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
                        const pageInfo = this.getPageInfo();
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

    getPageInfo() {
        return {
            isDiscussion: this.parser.isDiscussionPage(),
            title: this.parser.getTitle(),
            url: window.location.href
        };
    }

    async handleSummarize() {
        try {
            const sidebar = this.getOrCreateSidebar();
            this.updateSidebarContent({ loading: true, message: 'Analyzing discussion...' });
            sidebar.classList.add('visible');
            this.sidebarVisible = true;

            const content = this.parser.getPageContent();
            if (!content) {
                throw new Error('Could not extract page content');
            }

            const summary = await this.summarizeContent({
                content: this.formatContentForSummary(content),
                type: 'discussion'
            });

            this.updateSidebarContent({
                type: 'main_post',
                title: content.mainPost?.title || 'Discussion',
                summary: summary,
                threadCount: content.threads?.length || 0
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
            const response = await chrome.runtime.sendMessage({
                type: 'SUMMARIZE',
                data: {
                    content: data.content,
                    type: data.type,
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

    formatContentForSummary(content) {
        let formattedContent = '';
        
        if (content.mainPost) {
            formattedContent += `Title: ${content.mainPost.title}\n`;
            if (content.mainPost.url) formattedContent += `URL: ${content.mainPost.url}\n`;
        }

        if (content.threads && content.threads.length > 0) {
            formattedContent += '\n\nDiscussion:\n';
            content.threads.forEach(thread => {
                if (thread.root && thread.root.text) {
                    formattedContent += `\n${thread.root.text}\n`;
                }
            });
        }

        return formattedContent;
    }

    handleToggleSidebar() {
        const sidebar = this.getOrCreateSidebar();
        this.sidebarVisible = !sidebar.classList.contains('visible');
        sidebar.classList.toggle('visible');
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

            const closeBtn = sidebar.querySelector('.tldr-sidebar-close');
            closeBtn.addEventListener('click', () => {
                sidebar.classList.remove('visible');
                this.sidebarVisible = false;
            });
        }

        return sidebar;
    }

    updateSidebarContent(data) {
        const content = this.sidebar.querySelector('.tldr-sidebar-content');
        if (!content) return;

        if (data.loading) {
            content.innerHTML = `
                <div class="tldr-loading">
                    <div class="tldr-loading-spinner"></div>
                    <p>${data.message || 'Loading...'}</p>
                </div>
            `;
            return;
        }

        if (data.error) {
            content.innerHTML = `
                <div class="tldr-error">
                    <p class="tldr-error-message">${data.message || 'An error occurred'}</p>
                </div>
            `;
            return;
        }

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

    // Abstract methods to be implemented by platform-specific classes
    initializeUI() {
        throw new Error('initializeUI must be implemented by platform-specific class');
    }
}