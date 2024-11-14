import { BaseParser } from './base';

export class HNParser extends BaseParser {
    isDiscussionPage() {
        return window.location.pathname.startsWith('/item');
    }

    getTitle() {
        return document.querySelector('.storylink')?.textContent || 
               document.querySelector('.titleline a')?.textContent || 
               'Hacker News Discussion';
    }

    getTopLevelComments() {
        return Array.from(document.querySelectorAll('.comment-tree > tbody > tr.athing.comtr'));
    }

    parseCommentThread(rootComment) {
        if (!rootComment?.classList?.contains('comtr')) {
            log.warn('Invalid comment element provided');
            return null;
        }
    
        const thread = {
            id: rootComment.id,
            root: this.parseComment(rootComment),
            replies: [],
            level: this.getCommentIndent(rootComment),
        };
    
        let currentElement = rootComment.nextElementSibling;
        const rootIndent = thread.level;
    
        while (currentElement) {
            const isComment = currentElement.classList.contains('comtr');
            if (!isComment) {
                currentElement = currentElement.nextElementSibling;
                continue;
            }
    
            const currentIndent = this.getCommentIndent(currentElement);
    
            if (currentIndent <= rootIndent) {
                break;
            }
    
            const reply = this.parseComment(currentElement);
            if (reply) {
                reply.level = currentIndent - rootIndent;
                thread.replies.push(reply);
            }
    
            currentElement = currentElement.nextElementSibling;
        }
    
        return thread;
    }    

    getPageContent() {
        if (!this.isDiscussionPage()) {
            return null;
        }

        // Get main post content
        const mainPost = {
            title: this.getTitle(),
            url: document.querySelector('.titleline a')?.href,
            text: document.querySelector('.toptext')?.textContent,
            by: document.querySelector('.hnuser')?.textContent,
            time: document.querySelector('.age')?.textContent
        };

        // Get and process all comments in a single pass
        const threads = this.processComments();

        return {
            mainPost,
            threads
        };
    }

    processComments() {
        // Process top-level comments and nested threads in a single pass
        const comments = [];
        const commentElements = Array.from(document.querySelectorAll('.comment-tree > tbody > tr.athing.comtr'));

        let currentThread = null;
        commentElements.forEach((commentElement) => {
            const currentIndent = this.getCommentIndent(commentElement);

            if (!currentThread || currentIndent === 0) {
                // Start a new thread if we are at top-level or after ending a previous thread
                currentThread = {
                    id: commentElement.id,
                    root: this.parseComment(commentElement),
                    replies: [],
                    level: 0
                };
                comments.push(currentThread);
            } else if (currentThread && currentIndent > currentThread.level) {
                // Add nested comments to the current thread based on indentation level
                const reply = this.parseComment(commentElement);
                if (reply) {
                    reply.level = currentIndent - currentThread.level;
                    currentThread.replies.push(reply);
                }
            }
        });

        return comments;
    }

    parseComment(commentElement) {
        if (!commentElement) return null;

        const commentText = commentElement.querySelector('.commtext');
        const userElement = commentElement.querySelector('.hnuser');
        const ageElement = commentElement.querySelector('.age');
        const scoreElement = commentElement.querySelector('.score');

        return {
            id: commentElement.id,
            text: commentText?.textContent?.trim() || '',
            by: userElement?.textContent || '',
            time: ageElement?.getAttribute('title') || ageElement?.textContent || '',
            score: scoreElement?.textContent || '',
            element: commentElement,
            level: this.getCommentIndent(commentElement)
        };
    }

    getCommentIndent(commentElement) {
        const indentElement = commentElement.querySelector('.ind img');
        if (!indentElement) return 0;
        
        // HN uses width attribute for indentation, each level is 40px
        const width = parseInt(indentElement.getAttribute('width') || '0', 10);
        return Math.floor(width / 40);
    }

    scrollToComment(commentId) {
        const comment = document.getElementById(commentId);
        if (comment) {
            comment.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.highlightComment(comment);

            // Add specific HN highlight style
            comment.style.backgroundColor = '#f6f6ef';
            comment.style.borderLeft = '3px solid #ff6600';
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                comment.style.backgroundColor = '';
                comment.style.borderLeft = '';
            }, 3000);
        }
    }

    destroy() {
        // Remove any added styles or elements
        document.getElementById('highlight-styles')?.remove();
    }
}
