import { getParser, isSupportedSite } from './parsers/registry';
import { Sidebar } from './components/Sidebar';
import { ContentSummarizer } from './services/summarizer';
import { UIController } from './services/ui-controller';
import { log } from './utils/logger';

class ContentScript {
    static instance = null;

    constructor() {
        if (ContentScript.instance) {
            log.info('ContentScript instance already exists');
            return ContentScript.instance;
        }
        ContentScript.instance = this;

        if (!isSupportedSite()) {
            log.info('Site not supported:', window.location.hostname);
            return;
        }

        this.parser = null;
        this.summarizer = null;
        this.sidebar = null;
        this.uiController = null;
        this.initialize();
    }

    async initialize() {
        try {
            this.parser = getParser();
            await this.parser.initialize();

            this.summarizer = new ContentSummarizer(this.parser);
            this.sidebar = new Sidebar();
            this.uiController = new UIController(this.parser, this.summarizer, this.sidebar);
            
            this.setupMessageListener();
            await this.uiController.initialize();
            
            window.tldrParser = this.parser;
            
            log.info('Content script initialized successfully');
        } catch (error) {
            log.error('Initialization error:', error);
        }
    }

    setupMessageListener() {
        if (this._messageListener) {
            chrome.runtime.onMessage.removeListener(this._messageListener);
        }
        if (this._windowListener) {
            window.removeEventListener('message', this._windowListener);
        }

        this._messageListener = this.handleExtensionMessage.bind(this);
        this._windowListener = this.handleWindowMessage.bind(this);

        chrome.runtime.onMessage.addListener(this._messageListener);
        window.addEventListener('message', this._windowListener);
        
        log.info('Message listeners set up');
    }

    async handleExtensionMessage(request, sender, sendResponse) {
        const action = typeof request === 'string' ? request : request.action;
        log.debug('Handling extension message:', action);
        
        try {
            let response = { success: false };

            switch (action) {
                case 'summarize':
                    if (!this.summarizer) {
                        throw new Error('Summarizer not initialized');
                    }
                    log.debug('Starting summarization');
                    const result = await this.summarizer.summarizeAll();
                    log.debug('Summarization result:', result);
                    if (!result.success) {
                        throw new Error(result.error || 'Summarization failed');
                    }
                    response = { 
                        success: true,
                        data: result.summary 
                    };
                    break;
                    
                case 'toggleSidebar':
                    if (!this.sidebar) {
                        throw new Error('Sidebar not initialized');
                    }
                    this.sidebar.toggle();
                    response = { success: true };
                    break;
                    
                case 'getPageInfo':
                    if (!this.parser) {
                        throw new Error('Parser not initialized');
                    }
                    const pageInfo = {
                        type: this.getCurrentSite(),
                        isDiscussion: this.parser.isDiscussionPage(),
                        title: this.parser.getTitle(),
                        url: window.location.href,
                        canSummarize: this.parser.isDiscussionPage()
                    };
                    response = { 
                        success: true,
                        data: pageInfo 
                    };
                    break;
                    
                default:
                    throw new Error('Unknown action');
            }

            log.debug(`Sending response for ${action}:`, response);
            sendResponse(response);
        } catch (error) {
            log.error(`Error handling ${action}:`, error);
            sendResponse({ 
                success: false, 
                error: error.message || 'Unknown error occurred' 
            });
        }
        
        return true;
    }

    async handleWindowMessage(event) {
        if (event.data.type === 'TLDR_SUMMARIZE') {
            log.debug('Handling TLDR_SUMMARIZE message:', event.data);
            try {
                const summary = await this.summarizer.summarize(event.data.data);
                if (summary && this.sidebar) {
                    this.sidebar.addSummary(summary);
                }
            } catch (error) {
                log.error('Error handling TLDR_SUMMARIZE:', error);
            }
        }
    }

    getCurrentSite() {
        const hostname = window.location.hostname;
        if (hostname.includes('news.ycombinator.com')) return 'hackernews';
        if (hostname.includes('reddit.com')) return 'reddit';
        return 'unknown';
    }

    destroy() {
        if (this._messageListener) {
            chrome.runtime.onMessage.removeListener(this._messageListener);
        }
        if (this._windowListener) {
            window.removeEventListener('message', this._windowListener);
        }
        
        this.parser?.destroy();
        this.sidebar?.destroy();
        this.uiController?.destroy();
        
        ContentScript.instance = null;
        
        log.info('ContentScript destroyed');
    }
}

// Initialize content script
const contentScript = new ContentScript();