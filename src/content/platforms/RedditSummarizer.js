import { BaseSummarizer } from '../base/BaseSummarizer';
import { RedditParser } from '../parsers/reddit';
import { renderMarkdown } from '../utils/markdown';

export class RedditSummarizer extends BaseSummarizer {
    constructor() {
        super();
        this.parser = new RedditParser();
        this.parser.setContentScript(this);
        this.setupCommentObserver();
    }

    setupCommentObserver() {
        // Monitor DOM changes for comment loading
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    // Check if we have comments after each DOM change
                    const comments = document.querySelectorAll('shreddit-comment');
                    if (comments.length > 0) {
                        this.addTLDRLinks();
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    initializeUI() {
        this.sidebar = this.getOrCreateSidebar();
        
        if (this.parser.isDiscussionPage()) {
            this.addTLDRLinks();
        }
    }

    addTLDRLinks() {
        const topLevelComments = this.parser.getTopLevelComments();
        console.log('Found comments:', topLevelComments.length);

        topLevelComments.forEach(comment => {
            if (!comment.querySelector('.tldr-summarize-btn')) {
                const tldrContainer = document.createElement('span');
                tldrContainer.className = 'tldr-btn-container';
                tldrContainer.setAttribute('data-thread-id', comment.id); // Add thread ID to container

                const tldrLink = document.createElement('a');
                tldrLink.href = 'javascript:void(0)';
                tldrLink.textContent = 'TL;DR';
                tldrLink.className = 'tldr-summarize-btn';
                tldrLink.style.marginLeft = '10px';
                tldrLink.style.cursor = 'pointer';
                
                tldrLink.addEventListener('mousedown', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.summarizeThread({
                        id: comment.id,
                        text: comment.innerText
                    });
                }, true);

                tldrLink.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }, true);

                tldrContainer.appendChild(tldrLink);
                
                const timeElement = comment.querySelector('a[rel="nofollow noopener noreferrer"]');
                if (timeElement) {
                    timeElement.parentNode.insertBefore(tldrContainer, timeElement.nextSibling);
                }
            }
        });
    }

    async summarizeThread({ id, text }) {
        console.log('Starting to summarize thread:', id);
        const tldrButton = document.querySelector(`[data-thread-id="${id}"] .tldr-summarize-btn`);
        
        try {
            // Update button state to loading
            if (tldrButton) {
                tldrButton.textContent = 'Summarizing...';
                tldrButton.style.color = '#999';
            }

            // Prepare content for summarization
            const threadContent = `
Thread content:
${text}

Please summarize focusing on:
1. Main points and arguments
2. Key insights or conclusions
3. Any consensus or disagreements
`;

            // Get summary from AI
            const summary = await this.summarizeContent({
                content: threadContent,
                type: 'thread'
            });

            // Store summary data
            this.threadSummaries.set(id, {
                summary,
                timestamp: Date.now()
            });

            // Update UI
            this.updateThreadSummary(id);
            
            // Show sidebar if hidden
            if (!this.sidebarVisible) {
                this.handleToggleSidebar();
            }

            // Update button to success state
            if (tldrButton) {
                tldrButton.textContent = 'TL;DR ✓';
                tldrButton.style.color = '#090';
            }

        } catch (error) {
            console.error('Thread summarization error:', error);
            if (tldrButton) {
                tldrButton.textContent = 'TL;DR (error)';
                tldrButton.style.color = '#c00';
            }
        }
    }

    updateThreadSummary(threadId) {
        const summary = this.threadSummaries.get(threadId);
        if (!summary) {
            console.error('No summary found for thread:', threadId);
            return;
        }

        // Make sure threads container exists
        let threadsList = this.sidebar.querySelector('#tldr-threads-list');
        if (!threadsList) {
            const content = this.sidebar.querySelector('.tldr-sidebar-content');
            if (!content) return;

            const threadsContainer = document.createElement('div');
            threadsContainer.className = 'tldr-threads-container';
            threadsContainer.innerHTML = `
                <h4 class="tldr-threads-title">Thread Summaries</h4>
                <div id="tldr-threads-list" class="tldr-threads-list"></div>
            `;
            content.appendChild(threadsContainer);
            threadsList = threadsContainer.querySelector('#tldr-threads-list');
        }

        // Create or update thread summary element
        let threadElement = threadsList.querySelector(`[data-thread-id="${threadId}"]`);
        if (!threadElement) {
            threadElement = document.createElement('div');
            threadElement.className = 'tldr-thread-summary';
            threadElement.setAttribute('data-thread-id', threadId);
            threadsList.insertBefore(threadElement, threadsList.firstChild);
        }

        threadElement.innerHTML = `
            <div class="tldr-thread-content markdown-body">
                ${renderMarkdown(summary.summary)}
            </div>
        `;

        // Add click handler to scroll to comment
        threadElement.addEventListener('click', () => {
            const commentElement = document.getElementById(threadId);
            if (commentElement) {
                commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }
}