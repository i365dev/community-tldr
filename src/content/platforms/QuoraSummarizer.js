import { BaseSummarizer } from '../base/BaseSummarizer';
import { QuoraParser } from '../parsers/quora';
import { renderMarkdown } from '../utils/markdown';

export class QuoraSummarizer extends BaseSummarizer {
    constructor() {
        super();
        this.parser = new QuoraParser();
        this.parser.setContentScript(this);
        this.setupAnswerObserver();
    }

    setupAnswerObserver() {
        // Set up a mutation observer to detect when new answers are loaded
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    // Check if new answers were added
                    if (document.querySelectorAll('div[id^="answer_"]').length > 0) {
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
        const answers = this.parser.getTopLevelComments();
        
        answers.forEach(answer => {
            // Skip if TLDR button already exists
            if (answer.querySelector('.tldr-summarize-btn')) {
                return;
            }

            // Find the upvote/actions area to place our button
            const actionArea = answer.querySelector('div[class*="q-flex"][class*="qu-justifyContent--space-between"]');
            if (!actionArea) return;

            try {
                // Create container for our button
                const tldrContainer = document.createElement('div');
                tldrContainer.className = 'tldr-btn-container';
                tldrContainer.style.display = 'inline-block';
                tldrContainer.style.marginLeft = '10px';

                // Create the TLDR button
                const tldrButton = document.createElement('button');
                tldrButton.textContent = 'TL;DR';
                tldrButton.className = 'tldr-summarize-btn';
                tldrButton.style.fontSize = '13px';
                tldrButton.style.color = '#636466';
                tldrButton.style.cursor = 'pointer';
                tldrButton.style.background = 'none';
                tldrButton.style.border = 'none';
                tldrButton.style.padding = '4px 8px';
                tldrButton.style.borderRadius = '3px';
                
                // Add hover effect
                tldrButton.addEventListener('mouseover', () => {
                    tldrButton.style.backgroundColor = '#f1f1f2';
                });
                
                tldrButton.addEventListener('mouseout', () => {
                    tldrButton.style.backgroundColor = 'transparent';
                });
                
                // Add click handler
                tldrButton.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    tldrButton.textContent = 'Summarizing...';
                    tldrButton.style.color = '#939598';
                    
                    this.summarizeAnswer(answer, tldrButton);
                });

                tldrContainer.appendChild(tldrButton);
                actionArea.appendChild(tldrContainer);
            } catch (error) {
                console.error('Error adding TLDR link:', error);
            }
        });
    }

    async summarizeAnswer(answerElement, button) {
        try {
            // Get answer ID
            const answerId = answerElement.id;
            
            // Extract author name
            const authorElement = answerElement.querySelector('a[class*="q-box"][href^="/profile/"]');
            const author = authorElement ? authorElement.textContent.trim() : 'Anonymous';
            
            // Extract answer content
            const contentElement = answerElement.querySelector('div[class*="q-text"]');
            const content = contentElement ? contentElement.textContent.trim() : '';
            
            // Count comments
            const commentsContainer = answerElement.querySelector('div[class*="q-box"][class*="qu-mt--medium"] div[class*="q-box"][class*="qu-borderTop"]');
            const commentCount = commentsContainer ? commentsContainer.querySelectorAll('div[class*="q-box"][class*="qu-pt--medium"]').length : 0;

            // Format content for summarization
            const answerContent = `
Question: ${this.parser.getTitle()}

Answer by ${author}:
${content}

${commentCount > 0 ? `This answer has ${commentCount} comments.` : ''}

Please summarize focusing on:
1. Main points and arguments
2. Key insights
3. Evidence or examples provided
`;

            const summary = await this.summarizeContent({
                content: answerContent,
                type: 'answer'
            });

            // Store summary data
            this.threadSummaries.set(answerId, {
                summary,
                author,
                replyCount: commentCount,
                timestamp: Date.now()
            });

            // Update UI
            this.updateThreadSummary(answerId);
            
            // Show sidebar if hidden
            if (!this.sidebarVisible) {
                this.handleToggleSidebar();
            }

            // Update button state
            if (button) {
                button.textContent = 'TL;DR ✓';
                button.style.color = '#2e69ff';
            }

        } catch (error) {
            console.error('Answer summarization error:', error);
            if (button) {
                button.textContent = 'TL;DR (error)';
                button.style.color = '#b92b27';
            }
        }
    }

    updateThreadSummary(answerId) {
        const threadData = this.threadSummaries.get(answerId);
        if (!threadData) return;

        let threadsList = this.sidebar.querySelector('#tldr-threads-list');
        if (!threadsList) {
            const content = this.sidebar.querySelector('.tldr-sidebar-content');
            if (!content) return;

            const threadsContainer = document.createElement('div');
            threadsContainer.className = 'tldr-threads-container';
            threadsContainer.innerHTML = `
                <h4 class="tldr-threads-title">Answer Summaries</h4>
                <div id="tldr-threads-list" class="tldr-threads-list"></div>
            `;
            content.appendChild(threadsContainer);
            threadsList = threadsContainer.querySelector('#tldr-threads-list');
        }

        // Create new summary element
        let threadElement = document.createElement('div');
        threadElement.className = 'tldr-thread-summary';
        threadElement.setAttribute('data-thread-id', answerId);
        threadElement.style.marginBottom = '16px';
        threadElement.style.padding = '12px';
        threadElement.style.backgroundColor = '#f7f7f8';
        threadElement.style.borderRadius = '4px';
        threadElement.style.cursor = 'pointer';

        threadElement.innerHTML = `
            <div class="tldr-thread-header" style="margin-bottom: 8px; color: #636466; font-size: 13px;">
                <span class="tldr-thread-author" style="font-weight: 500;">${threadData.author}</span>
                ${threadData.replyCount > 0 ? 
                    `<span class="tldr-thread-replies" style="margin-left: 8px;">${threadData.replyCount} comments</span>` : 
                    ''}
            </div>
            <div class="tldr-thread-content markdown-body">
                ${renderMarkdown(threadData.summary)}
            </div>
        `;

        // Add click handler to scroll to answer
        threadElement.addEventListener('click', () => {
            this.parser.scrollToComment(answerId);
        });

        // Insert at the top of the list
        threadsList.insertBefore(threadElement, threadsList.firstChild);
    }

    formatContentForSummary(content) {
        let formattedContent = '';
        
        if (content.mainPost) {
            formattedContent += `Question: ${content.mainPost.title}\n`;
            if (content.mainPost.url) formattedContent += `URL: ${content.mainPost.url}\n`;
            if (content.mainPost.text) formattedContent += `\nDetails: ${content.mainPost.text}\n`;
        }

        if (content.threads && content.threads.length > 0) {
            formattedContent += '\n\nAnswers:\n';
            content.threads.forEach((thread, index) => {
                if (thread.root && thread.root.text) {
                    formattedContent += `\n[Answer ${index + 1} by ${thread.root.by || 'anonymous'}]:\n${thread.root.text}\n`;
                    
                    if (thread.replies && thread.replies.length > 0) {
                        formattedContent += `\nComments on this answer:\n`;
                        thread.replies.forEach(reply => {
                            formattedContent += `- [${reply.by || 'anonymous'}]: ${reply.text}\n`;
                        });
                    }
                }
            });
        }

        return formattedContent;
    }
}
