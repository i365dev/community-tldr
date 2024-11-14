import { BaseSummarizer } from '../base/BaseSummarizer';
import { HNParser } from '../parsers/hn';
import { renderMarkdown } from '../utils/markdown';

export class HNSummarizer extends BaseSummarizer {
    constructor() {
        super();
        this.parser = new HNParser();
        this.parser.setContentScript(this);
    }

    initializeUI() {
        this.sidebar = this.getOrCreateSidebar();
        
        if (this.parser.isDiscussionPage()) {
            this.addTLDRLinks();
        }
    }

    addTLDRLinks() {
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

            const summary = await this.summarizeContent({
                content: threadContent,
                type: 'thread'
            });

            // Store summary data
            this.threadSummaries.set(threadId, {
                summary,
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
        } catch (error) {
            console.error(`Error summarizing thread ${threadId}:`, error);
            if (summarizeBtn) {
                summarizeBtn.textContent = 'TL;DR (error)';
                summarizeBtn.style.color = '#c00';
            }
        }
    }

    updateThreadSummary(threadId) {
        const threadData = this.threadSummaries.get(threadId);
        if (!threadData) return;

        let threadsList = document.getElementById('tldr-threads-list');
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

        let threadElement = threadsList.querySelector(`[data-thread-id="${threadId}"]`);
        if (!threadElement) {
            threadElement = document.createElement('div');
            threadElement.className = 'tldr-thread-summary';
            threadElement.setAttribute('data-thread-id', threadId);
            threadsList.insertBefore(threadElement, threadsList.firstChild);
        }

        threadElement.innerHTML = `
            <div class="tldr-thread-header">
                <span class="tldr-thread-author">${threadData.author}</span>
                <span class="tldr-thread-replies">${threadData.replyCount} replies</span>
            </div>
            <div class="tldr-thread-content markdown-body">
                ${renderMarkdown(threadData.summary)}
            </div>
        `;

        threadElement.addEventListener('click', () => {
            this.parser.scrollToComment(threadId);
        });
    }

    formatContentForSummary(content) {
        let formattedContent = '';
        
        if (content.mainPost) {
            formattedContent += `Title: ${content.mainPost.title}\n`;
            if (content.mainPost.url) formattedContent += `URL: ${content.mainPost.url}\n`;
            if (content.mainPost.by) formattedContent += `Author: ${content.mainPost.by}\n`;
            if (content.mainPost.text) formattedContent += `\nContent:\n${content.mainPost.text}\n`;
        }

        if (content.threads && content.threads.length > 0) {
            formattedContent += '\n\nDiscussion:\n';
            content.threads.forEach(thread => {
                if (thread.root && thread.root.text) {
                    formattedContent += `\n[${thread.root.by || 'anonymous'}]: ${thread.root.text}\n`;
                    
                    if (thread.replies && thread.replies.length > 0) {
                        thread.replies.forEach(reply => {
                            const indent = '  '.repeat(reply.level || 1);
                            formattedContent += `${indent}↳ [${reply.by || 'anonymous'}]: ${reply.text}\n`;
                        });
                    }
                }
            });
        }

        return formattedContent;
    }
}