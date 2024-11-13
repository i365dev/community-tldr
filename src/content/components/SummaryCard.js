import { renderMarkdown } from '../services/markdown';

export class SummaryCard {
    constructor(summary) {
        this.summary = summary;
        this.element = this.createElement();
    }

    createElement() {
        const card = document.createElement('div');
        card.className = 'tldr-summary-card';
        
        if (this.summary.type === 'main_post') {
            this.createMainPostCard(card);
        } else {
            this.createThreadCard(card);
        }

        this.addStyles();
        return card;
    }

    createMainPostCard(card) {
        card.innerHTML = `
            <div class="tldr-summary-card-header">
                <h3 class="tldr-summary-card-title">${this.summary.title}</h3>
                <div class="tldr-summary-card-meta">
                    ${this.summary.threadCount || 0} comments in total
                </div>
            </div>
            <div class="tldr-summary-content markdown-body">
                ${renderMarkdown(this.summary.summary)}
            </div>
        `;
    }

    createThreadCard(card) {
        card.setAttribute('data-thread-id', this.summary.id);
        card.innerHTML = `
            <div class="tldr-thread-header">
                <span class="tldr-thread-author">${this.summary.author}</span>
                <span class="tldr-thread-replies">${this.summary.replyCount} replies</span>
            </div>
            <div class="tldr-thread-content markdown-body">
                ${renderMarkdown(this.summary.summary)}
            </div>
        `;

        // Add click handler to scroll to original comment
        card.addEventListener('click', () => {
            const comment = document.querySelector(`shreddit-comment[comment-id="${this.summary.id}"]`);
            if (comment) {
                comment.scrollIntoView({ behavior: 'smooth', block: 'center' });
                this.highlightComment(comment);
            }
        });
    }

    highlightComment(comment) {
        // Remove existing highlights
        document.querySelectorAll('shreddit-comment').forEach(c => {
            if (c.shadowRoot) {
                c.shadowRoot.querySelector('.comment-body')?.classList.remove('highlight');
            }
        });

        // Add new highlight
        if (comment.shadowRoot) {
            const commentBody = comment.shadowRoot.querySelector('.comment-body');
            if (commentBody) {
                commentBody.classList.add('highlight');
                commentBody.style.backgroundColor = 'rgba(0, 121, 211, 0.05)';
                commentBody.style.borderLeft = '3px solid #0079d3';
            }
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tldr-summary-card {
                margin-bottom: 16px;
                padding: 12px;
                border: 1px solid #e5e5e5;
                border-radius: 4px;
            }

            .tldr-summary-card.thread {
                cursor: pointer;
            }

            .tldr-summary-card.thread:hover {
                background: #f5f5f5;
            }

            .tldr-summary-card-header {
                margin-bottom: 12px;
            }

            .tldr-summary-card-title {
                margin: 0 0 4px 0;
                font-size: 16px;
            }

            .tldr-summary-card-meta,
            .tldr-thread-header {
                font-size: 14px;
                color: #666;
                margin-bottom: 8px;
            }

            .tldr-thread-replies {
                margin-left: 8px;
            }

            .tldr-summary-content,
            .tldr-thread-content {
                font-size: 14px;
                line-height: 1.5;
                color: #333;
            }
        `;

        if (!document.querySelector('#tldr-summary-card-styles')) {
            style.id = 'tldr-summary-card-styles';
            document.head.appendChild(style);
        }
    }
}