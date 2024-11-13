export class Sidebar {
    constructor() {
        this.visible = false;
        this.element = null;
        this.summaries = new Map();
        this.setupMessageListener();
    }

    setupMessageListener() {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'TLDR_UPDATE_STATE') {
                this.handleStateUpdate(event.data.data);
            }
        });
    }

    handleStateUpdate(state) {
        if (!this.element) return;

        const content = this.element.querySelector('.tldr-sidebar-content');
        if (!content) return;

        if (state.loading) {
            content.innerHTML = `
                <div class="tldr-loading">
                    <div class="tldr-loading-spinner"></div>
                    <p>${state.message || 'Analyzing discussion...'}</p>
                </div>
            `;
            this.show();
        } else if (state.error) {
            content.innerHTML = `
                <div class="tldr-error">
                    <p class="tldr-error-message">${state.error}</p>
                </div>
            `;
        } else if (state.summary) {
            this.addSummary(state.summary);
        }
    }

    initialize() {
        this.element = this.createSidebarElement();
    }

    createSidebarElement() {
        const sidebar = document.createElement('div');
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
        closeBtn.addEventListener('click', () => this.hide());

        return sidebar;
    }

    show() {
        if (this.element) {
            this.element.classList.add('visible');
            this.visible = true;
        }
    }

    hide() {
        if (this.element) {
            this.element.classList.remove('visible');
            this.visible = false;
        }
    }

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    addSummary(summary) {
        if (!this.element) return;

        const content = this.element.querySelector('.tldr-sidebar-content');
        if (!content) return;

        if (summary.type === 'main_post') {
            this.updateMainSummary(content, summary);
        } else {
            this.updateThreadSummary(content, summary);
        }

        this.show();
    }

    updateMainSummary(container, summary) {
        container.innerHTML = `
            <div class="tldr-main-content">
                <div class="tldr-summary-card">
                    <div class="tldr-summary-card-header">
                        <h3 class="tldr-summary-card-title">${summary.title}</h3>
                        <div class="tldr-summary-card-meta">
                            ${summary.threadCount} comments in total
                        </div>
                    </div>
                    <div class="tldr-summary-content markdown-body">
                        ${this.renderMarkdown(summary.summary)}
                    </div>
                </div>
                <div class="tldr-threads-container">
                    <h4 class="tldr-threads-title">Thread Summaries</h4>
                    <div id="tldr-threads-list" class="tldr-threads-list"></div>
                </div>
            </div>
        `;
    }

    updateThreadSummary(container, summary) {
        this.summaries.set(summary.id, summary);
        let threadsList = container.querySelector('#tldr-threads-list');
        if (!threadsList) return;

        const threadElement = document.createElement('div');
        threadElement.className = 'tldr-thread-summary';
        threadElement.setAttribute('data-thread-id', summary.id);
        threadElement.innerHTML = `
            <div class="tldr-thread-header">
                <span class="tldr-thread-author">${summary.author}</span>
                <span class="tldr-thread-replies">${summary.replyCount} replies</span>
            </div>
            <div class="tldr-thread-content markdown-body">
                ${this.renderMarkdown(summary.summary)}
            </div>
        `;

        threadsList.insertBefore(threadElement, threadsList.firstChild);
    }

    renderMarkdown(text) {
        if (!text) return '';
        
        return text
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
            .replace(/^\* (.*$)/gm, '<li>$1</li>')
            .split('\n')
            .map(line => line.trim() ? `<p>${line}</p>` : '')
            .join('\n');
    }

    destroy() {
        window.removeEventListener('message', this.handleStateUpdate);
        
        if (this.element) {
            this.element.remove();
        }
        
        this.summaries.clear();
        this.element = null;
        this.visible = false;
    }
}