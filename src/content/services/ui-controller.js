import { log } from '../utils/logger';

export class UIController {
    constructor(parser, summarizer, sidebar) {
        this.parser = parser;
        this.summarizer = summarizer;
        this.sidebar = sidebar;
    }

    async initialize() {
        try {
            this.sidebar.initialize();
            
            // Add TL;DR buttons if on discussion page
            if (this.parser.isDiscussionPage()) {
                await this.initializeThreadControls();
            }
            
            log.info('UI Controller initialized');
        } catch (error) {
            log.error('Error initializing UI:', error);
        }
    }

    async initializeThreadControls() {
        try {
            const topLevelComments = this.parser.getTopLevelComments();
            log.debug(`Adding controls to ${topLevelComments.length} comments`);

            for (const comment of topLevelComments) {
                await this.addCommentButton(comment);
            }
        } catch (error) {
            log.error('Error initializing thread controls:', error);
        }
    }

    async addCommentButton(comment) {
        try {
            // Handle both Reddit and HN comment structures
            const buttonContainer = comment.shadowRoot ? 
                comment.shadowRoot.querySelector('.action-buttons') : // Reddit
                comment.querySelector('.comhead');  // HN

            if (!buttonContainer || buttonContainer.querySelector('.tldr-button')) {
                return;
            }

            const button = document.createElement(comment.shadowRoot ? 'button' : 'a');
            button.className = 'tldr-button';
            button.textContent = 'TL;DR';
            
            if (comment.shadowRoot) {
                // Reddit style
                button.style.cssText = `
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--color-tone-1);
                    background: none;
                    border: none;
                    padding: 4px 8px;
                    cursor: pointer;
                    margin-left: 8px;
                    border-radius: 4px;
                `;
            } else {
                // HN style
                button.href = 'javascript:void(0)';
                button.style.cssText = `
                    margin-left: 4px;
                    color: #666;
                    font-size: 11px;
                `;
            }

            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.handleCommentSummarize(comment);
            });

            buttonContainer.appendChild(button);
        } catch (error) {
            log.error('Error adding comment button:', error);
        }
    }

    async handleCommentSummarize(commentElement) {
        const button = commentElement.shadowRoot ? 
            commentElement.shadowRoot.querySelector('.tldr-button') :
            commentElement.querySelector('.tldr-button');

        try {
            if (button) {
                button.textContent = 'Summarizing...';
                button.style.color = '#999';
            }

            const thread = await this.parser.parseCommentThread(commentElement);
            const summary = await this.summarizer.summarize({
                type: 'comment',
                content: thread
            });

            if (summary) {
                // Update UI with completed summary
                window.postMessage({
                    type: 'TLDR_UPDATE_STATE',
                    data: {
                        loading: false,
                        summary: summary
                    }
                }, '*');
                
                if (button) {
                    button.textContent = 'TL;DR ✓';
                    button.style.color = '#090';
                }
            }
        } catch (error) {
            log.error('Error summarizing comment:', error);
            if (button) {
                button.textContent = 'TL;DR (error)';
                button.style.color = '#c00';
            }
        }
    }

    destroy() {
        // Cleanup any UI-related resources
        document.querySelectorAll('.tldr-button').forEach(btn => btn.remove());
    }
}