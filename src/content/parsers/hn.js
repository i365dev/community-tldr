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

        // Get all comments
        const threads = this.getTopLevelComments().map(comment => 
            this.parseCommentThread(comment)
        );

        return {
            mainPost,
            threads
        };
    }

    getTopLevelComments() {
        // Get top-level comments
        return Array.from(
            document.querySelectorAll('.comment-tree > tbody > tr.athing.comtr')
        );
    }

    parseCommentThread(rootComment) {
        if (!rootComment?.classList?.contains('comtr')) {
            console.warn('Invalid comment element provided');
            return null;
        }

        const thread = {
            id: rootComment.id,
            root: this.parseComment(rootComment),
            replies: [],
            level: 0
        };

        // Get all replies
        let currentElement = rootComment.nextElementSibling;
        const rootIndent = this.getCommentIndent(rootComment);
        
        while (currentElement) {
            const isComment = currentElement.classList.contains('comtr');
            if (!isComment) {
                currentElement = currentElement.nextElementSibling;
                continue;
            }

            const currentIndent = this.getCommentIndent(currentElement);
            
            // If indentation is less than or equal to root, it's a new thread
            if (currentIndent <= rootIndent) {
                break;
            }

            // Add reply to thread
            const reply = this.parseComment(currentElement);
            if (reply) {
                reply.level = currentIndent - rootIndent;
                thread.replies.push(reply);
            }

            currentElement = currentElement.nextElementSibling;
        }

        return thread;
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
            element: commentElement,  // Keep DOM reference for later use
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
        }
    }
}
