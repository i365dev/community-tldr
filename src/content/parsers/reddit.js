import { BaseParser } from './base';
import { waitForElement, waitForShadowRoot, createButton } from '../utils/dom';
import { log } from '../utils/logger';

export class RedditParser extends BaseParser {
    constructor() {
        super();
        this.commentsLoaded = false;
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 30;
        this.observers = new Set();
    }

    async initialize() {
        log.info('Initializing Reddit parser...');
        await this.waitForComments();
        this.setupMutationObserver();
        this.addInitialButtons();
    }

    async waitForComments() {
        return new Promise((resolve) => {
            const checkComments = () => {
                this.initializationAttempts++;
                const comments = document.querySelectorAll('shreddit-comment');
                
                if (comments.length > 0) {
                    log.info('Comments found:', comments.length);
                    this.commentsLoaded = true;
                    resolve();
                } else if (this.initializationAttempts >= this.maxInitializationAttempts) {
                    log.warn('Max attempts reached, initializing anyway');
                    resolve();
                } else {
                    setTimeout(checkComments, 1000);
                }
            };

            checkComments();
        });
    }

    setupMutationObserver() {
        // Main DOM observer
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeName?.toLowerCase() === 'shreddit-comment') {
                        this.handleNewComment(node);
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.observers.add(observer);
    }

    async handleNewComment(commentElement) {
        try {
            // Wait for shadow root to be attached
            const shadowRoot = await waitForShadowRoot(commentElement);
            
            // Wait for action buttons container
            const actionButtons = await new Promise(resolve => {
                const check = () => {
                    const buttons = shadowRoot.querySelector('.action-buttons');
                    if (buttons) {
                        resolve(buttons);
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });

            // Add TLDR button if not already present
            if (!actionButtons.querySelector('.tldr-button')) {
                this.addCommentButton(commentElement, actionButtons);
            }
        } catch (error) {
            log.error('Error handling new comment:', error);
        }
    }

    addInitialButtons() {
        const comments = this.getTopLevelComments();
        log.info(`Adding buttons to ${comments.length} comments`);
        
        comments.forEach(async (comment) => {
            try {
                const shadowRoot = await waitForShadowRoot(comment);
                const actionButtons = shadowRoot.querySelector('.action-buttons');
                if (actionButtons && !actionButtons.querySelector('.tldr-button')) {
                    this.addCommentButton(comment, actionButtons);
                }
            } catch (error) {
                log.error('Error adding button to comment:', error);
            }
        });
    }

    addCommentButton(commentElement, actionButtons) {
        const button = createButton('TL;DR', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleCommentSummarize(commentElement);
        });
        button.className = 'tldr-button';
        actionButtons.appendChild(button);
    }

    getTopLevelComments() {
        if (!this.commentsLoaded) {
            log.warn('Comments not yet loaded');
            return [];
        }

        return Array.from(document.querySelectorAll('shreddit-comment[depth="0"]'))
            .filter(comment => {
                if (!comment.shadowRoot) return false;
                const content = comment.shadowRoot.querySelector('.text-neutral-content');
                return content && !content.textContent.includes('[deleted]');
            });
    }

    isDiscussionPage() {
        return window.location.pathname.includes('/comments/');
    }

    getTitle() {
        const post = document.querySelector('shreddit-post');
        return post?.shadowRoot?.querySelector('h1')?.textContent || 'Reddit Discussion';
    }

    async handleCommentSummarize(commentElement) {
        try {
            const thread = await this.parseCommentThread(commentElement);
            window.postMessage({
                type: 'TLDR_SUMMARIZE',
                data: {
                    type: 'comment',
                    content: thread
                }
            }, '*');
        } catch (error) {
            log.error('Error summarizing comment:', error);
        }
    }

    async parseCommentThread(commentElement) {
        const thread = {
            id: commentElement.getAttribute('comment-id'),
            root: await this.parseComment(commentElement),
            replies: [],
            level: parseInt(commentElement.getAttribute('depth') || '0', 10)
        };

        const replies = Array.from(document.querySelectorAll('shreddit-comment'))
            .filter(reply => 
                reply !== commentElement && 
                parseInt(reply.getAttribute('depth') || '0', 10) > thread.level
            );

        thread.replies = await Promise.all(
            replies.map(reply => this.parseComment(reply))
        );

        return thread;
    }

    async parseComment(commentElement) {
        const shadowRoot = await waitForShadowRoot(commentElement);
        const content = shadowRoot.querySelector('.text-neutral-content');
        const author = commentElement.getAttribute('author');
        const time = shadowRoot.querySelector('time');

        return {
            id: commentElement.getAttribute('comment-id'),
            text: content?.textContent?.trim() || '',
            by: author || '[deleted]',
            time: time?.textContent || '',
            level: parseInt(commentElement.getAttribute('depth') || '0', 10)
        };
    }

    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}