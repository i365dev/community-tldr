import { BaseParser } from './base';

export class QuoraParser extends BaseParser {
    isDiscussionPage() {
        // Check if current page is a question page
        return window.location.hostname.includes('quora.com') && 
               (window.location.pathname.includes('/answer/') || 
                document.querySelector('.q-box.qu-borderAll') !== null);
    }

    getTitle() {
        // Get the question title
        const titleElement = document.querySelector('div[class*="q-text"][id^="mainContent"] span');
        return titleElement ? titleElement.textContent.trim() : 'Quora Discussion';
    }

    getTopLevelComments() {
        // Get all answers (Quora's equivalent of top-level comments)
        return Array.from(document.querySelectorAll('div[class*="q-box"][id^="answer_"]'));
    }

    parseCommentThread(answerElement) {
        if (!answerElement) {
            console.warn('Invalid answer element provided');
            return null;
        }
    
        // Extract answer content
        const contentElement = answerElement.querySelector('div[class*="q-text"]');
        const authorElement = answerElement.querySelector('a[class*="q-box"][href^="/profile/"]');
        const upvoteElement = answerElement.querySelector('div[class*="q-text"][class*="qu-color--gray"]');
    
        const thread = {
            id: answerElement.id,
            root: {
                text: contentElement ? contentElement.textContent.trim() : '',
                by: authorElement ? authorElement.textContent.trim() : 'Anonymous',
                score: upvoteElement ? upvoteElement.textContent.trim() : '',
                element: answerElement,
                level: 0
            },
            replies: [],
            level: 0
        };
    
        // Extract comments on this answer if available
        const commentsContainer = answerElement.querySelector('div[class*="q-box"][class*="qu-mt--medium"] div[class*="q-box"][class*="qu-borderTop"]');
        if (commentsContainer) {
            const comments = commentsContainer.querySelectorAll('div[class*="q-box"][class*="qu-pt--medium"]');
            
            comments.forEach(comment => {
                const commentText = comment.querySelector('div[class*="q-text"]');
                const commentAuthor = comment.querySelector('a[class*="q-box"][href^="/profile/"]');
                
                thread.replies.push({
                    text: commentText ? commentText.textContent.trim() : '',
                    by: commentAuthor ? commentAuthor.textContent.trim() : 'Anonymous',
                    level: 1
                });
            });
        }
    
        return thread;
    }

    getPageContent() {
        if (!this.isDiscussionPage()) {
            return null;
        }

        // Get question content
        const mainPost = {
            title: this.getTitle(),
            url: window.location.href,
            text: this.getQuestionDetails()
        };

        // Get and process all answers
        const threads = [];
        const answers = this.getTopLevelComments();
        
        answers.forEach(answer => {
            const thread = this.parseCommentThread(answer);
            if (thread) {
                threads.push(thread);
            }
        });

        return {
            mainPost,
            threads
        };
    }

    getQuestionDetails() {
        // Get additional question details if available
        const detailsElement = document.querySelector('div[class*="q-box"][class*="qu-mt--small"] div[class*="q-text"]');
        return detailsElement ? detailsElement.textContent.trim() : '';
    }

    scrollToComment(commentId) {
        const comment = document.getElementById(commentId);
        if (comment) {
            comment.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.highlightComment(comment);
        }
    }

    getCommentIndent(commentElement) {
        // Quora doesn't have traditional indentation like HN or Reddit
        // Return 0 for top-level answers and 1 for comments
        return 0;
    }

    setContentScript(contentScript) {
        this.contentScript = contentScript;
    }
}
