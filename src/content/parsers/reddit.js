import { BaseParser } from './base';

export class RedditParser extends BaseParser {
    isDiscussionPage() {
        return window.location.pathname.includes('/comments/');
    }

    getTitle() {
        const titleElement = document.querySelector('h1');
        return titleElement ? titleElement.textContent.trim() : '';
    }

    getTopLevelComments() {
        return Array.from(document.querySelectorAll('shreddit-comment')).filter(comment => 
            comment.getAttribute('depth') === '0'
        );
    }

    initializeThreadControls() {
        const topLevelComments = Array.from(document.querySelectorAll('shreddit-comment')).filter(comment => 
            comment.getAttribute('depth') === '0'
        );

        topLevelComments.forEach(comment => {
            const timeElement = comment.querySelector('a[rel="nofollow noopener noreferrer"]');
            if (!timeElement || timeElement.nextSibling?.classList?.contains('tldr-summarize-btn')) {
                return;
            }

            const tldrLink = document.createElement('a');
            tldrLink.href = '#';
            tldrLink.textContent = 'TL;DR';
            tldrLink.className = 'tldr-summarize-btn';
            tldrLink.style.marginLeft = '10px';
            
            tldrLink.addEventListener('click', (event) => {
                event.preventDefault();
                if (this.contentScript) {
                    this.contentScript.summarizeThread({
                        id: comment.id,
                        text: comment.innerText
                    });
                }
            });
            
            timeElement.parentNode.insertBefore(tldrLink, timeElement.nextSibling);
        });
    }

    getPageContent() {
        if (!this.isDiscussionPage()) return null;

        const mainPost = {
            title: this.getTitle(),
            url: window.location.href
        };

        const threads = this.getTopLevelComments().map(comment => ({
            id: comment.id,
            root: {
                text: comment.innerText
            }
        }));

        return { mainPost, threads };
    }

    setContentScript(contentScript) {
        this.contentScript = contentScript;
    }
}