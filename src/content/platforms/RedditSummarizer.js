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
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    const comments = document.querySelectorAll('shreddit-comment');
                    // console.log('Found shreddit comments:', comments.length);
                    if (comments.length > 0) {
                        // console.log('First comment properties:', {
                        //     postId: comments[0].postId,
                        //     author: comments[0].author,
                        //     hasTimeElement: !!comments[0].querySelector('a[rel="nofollow noopener noreferrer"]')
                        // });
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
    }

    addTLDRLinks() {
        const topLevelComments = this.parser.getTopLevelComments();
        // console.log('Found top level comments:', topLevelComments.length);

        topLevelComments.forEach(comment => {
            // console.log('Processing comment:', {
            //     id: comment.id,
            //     postId: comment.postId,
            //     author: comment.author,
            //     hasExistingTLDR: !!comment.querySelector('.tldr-summarize-btn'),
            //     hasTimeElement: !!comment.querySelector('a[rel="nofollow noopener noreferrer"]')
            // });

            const timeElement = comment.querySelector('a[rel="nofollow noopener noreferrer"]');
            if (!timeElement) {
                console.log('Failed to find time element for comment');
                return;
            }

            if (comment.querySelector('.tldr-summarize-btn')) {
                console.log('TLDR button already exists for comment');
                return;
            }

            try {
                const tldrContainer = document.createElement('span');
                tldrContainer.className = 'tldr-btn-container';
                tldrContainer.setAttribute('data-thread-id', comment.postId || comment.id);

                const tldrLink = document.createElement('a');
                tldrLink.href = 'javascript:void(0)';
                tldrLink.textContent = 'TL;DR';
                tldrLink.className = 'tldr-summarize-btn';
                tldrLink.style.marginLeft = '10px';
                tldrLink.style.cursor = 'pointer';
                tldrLink.style.color = '#666';
                
                tldrLink.addEventListener('mousedown', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    const button = event.currentTarget;
                    button.textContent = 'Summarizing...';
                    button.style.color = '#999';
                    
                    this.summarizeThread({
                        id: comment.postId || comment.id,
                        author: comment.author || 'anonymous',
                        replyCount: this.countReplies(comment),
                        text: comment.innerText,
                        button: button
                    });
                }, true);

                tldrLink.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                }, true);

                tldrContainer.appendChild(tldrLink);
                
                // console.log('Attempting to insert TLDR button');
                timeElement.parentNode.insertBefore(tldrContainer, timeElement.nextSibling);
                // console.log('Successfully inserted TLDR button');
            } catch (error) {
                console.error('Error adding TLDR link:', error);
            }
        });
    }

    async summarizeThread({ id, author, replyCount, text, button }) {
        console.log('Starting to summarize thread:', id);
        
        try {
            const threadContent = `
                Thread content:
                ${text}

                Please summarize focusing on:
                1. Main points and arguments
                2. Key insights or conclusions
                3. Any consensus or disagreements
            `;

            const summary = await this.summarizeContent({
                content: threadContent,
                type: 'thread'
            });

            this.threadSummaries.set(id, {
                summary,
                author,
                replyCount,
                timestamp: Date.now()
            });

            this.updateThreadSummary(id);
            
            if (!this.sidebarVisible) {
                this.handleToggleSidebar();
            }

            // Update button with checkmark
            if (button) {
                button.textContent = 'TL;DR ✓';
                button.style.color = '#090';
            }

        } catch (error) {
            console.error('Thread summarization error:', error);
            if (button) {
                button.textContent = 'TL;DR (error)';
                button.style.color = '#c00';
            }
        }
    }

    countReplies(commentElement) {
        // Count all nested replies
        const allReplies = commentElement.querySelectorAll('shreddit-comment');
        return allReplies.length;
    }

    updateThreadSummary(threadId) {
        const threadData = this.threadSummaries.get(threadId);
        if (!threadData) return;

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

        // Create new thread summary element (always add to top)
        let threadElement = document.createElement('div');
        threadElement.className = 'tldr-thread-summary';
        threadElement.setAttribute('data-thread-id', threadId);

        threadElement.innerHTML = `
            <div class="tldr-thread-header">
                <span class="tldr-thread-author">${threadData.author}</span>
                <span class="tldr-thread-replies">${threadData.replyCount} replies</span>
            </div>
            <div class="tldr-thread-content markdown-body">
                ${renderMarkdown(threadData.summary)}
            </div>
        `;

        // Style the summary header
        const header = threadElement.querySelector('.tldr-thread-header');
        if (header) {
            header.style.marginBottom = '8px';
            header.style.color = '#666';
            header.style.fontSize = '12px';
        }

        // Add click handler to scroll to comment
        threadElement.addEventListener('click', () => {
            const commentElement = document.getElementById(threadId);
            if (commentElement) {
                commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        // Insert at the top of the list
        threadsList.insertBefore(threadElement, threadsList.firstChild);
    }
}