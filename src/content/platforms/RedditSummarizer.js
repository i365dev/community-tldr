import { BaseSummarizer } from '../base/BaseSummarizer';
import { RedditParser } from '../parsers/reddit';
import { renderMarkdown } from '../utils/markdown';

export class RedditSummarizer extends BaseSummarizer {
    constructor() {
        super();
        this.parser = new RedditParser();
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
            if (!comment.querySelector('.tldr-summarize-btn')) {
                const tldrLink = document.createElement('a');
                tldrLink.href = '#';
                tldrLink.textContent = 'TL;DR';
                tldrLink.className = 'tldr-summarize-btn';
                tldrLink.style.marginLeft = '10px';
                
                tldrLink.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.summarizeThread({
                        id: comment.id,
                        text: comment.innerText
                    });
                });
                
                const timeElement = comment.querySelector('a[rel="nofollow noopener noreferrer"]');
                if (timeElement) {
                    timeElement.parentNode.insertBefore(tldrLink, timeElement.nextSibling);
                }
            }
        });
    }

    summarizeThread(thread) {
        if (!thread?.id || !thread?.text) return;

        this.summarizeContent({
            content: thread.text,
            type: 'thread'
        }).then(summary => {
            this.threadSummaries.set(thread.id, {
                summary,
                timestamp: Date.now()
            });
            this.updateThreadSummary(thread.id);
        }).catch(error => {
            console.error('Thread summarization error:', error);
        });
    }

    updateThreadSummary(threadId) {
        const summary = this.threadSummaries.get(threadId);
        if (!summary) return;

        const threadsList = document.getElementById('tldr-threads-list');
        if (!threadsList) return;

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

        threadElement.addEventListener('click', () => {
            document.getElementById(threadId)?.scrollIntoView({ behavior: 'smooth' });
        });
    }
}