export class HNParser {
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

        const mainPost = {
            title: this.getTitle(),
            url: document.querySelector('.titleline a')?.href,
            text: document.querySelector('.toptext')?.textContent,
            by: document.querySelector('.hnuser')?.textContent,
            time: document.querySelector('.age')?.textContent
        };

        const threads = this.getTopLevelComments().map(comment => this.parseCommentThread(comment));

        return {
            mainPost,
            threads
        };
    }

    getTopLevelComments() {
        return Array.from(document.querySelectorAll('.comment-tree > tbody > tr.athing.comtr'));
    }

    parseCommentThread(rootComment) {
        console.log('Parsing comment thread for:', rootComment?.id);
        
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
        
        console.log('Root comment parsed:', thread.root);
    
        let currentElement = rootComment.nextElementSibling;
        const rootIndent = this.getCommentIndent(rootComment);
        console.log('Root indent level:', rootIndent);
        
        while (currentElement) {
            const isComment = currentElement.classList.contains('comtr');
            if (!isComment) {
                currentElement = currentElement.nextElementSibling;
                continue;
            }
    
            const currentIndent = this.getCommentIndent(currentElement);
            console.log('Current element indent:', currentIndent);
            
            if (currentIndent <= rootIndent) {
                break;
            }
    
            const reply = this.parseComment(currentElement);
            if (reply) {
                reply.level = currentIndent - rootIndent;
                thread.replies.push(reply);
                console.log('Added reply:', reply);
            }
    
            currentElement = currentElement.nextElementSibling;
        }
    
        console.log('Finished parsing thread:', thread);
        return thread;
    }
    
    parseComment(commentElement) {
        if (!commentElement) {
            console.warn('Null comment element provided');
            return null;
        }
    
        const commentText = commentElement.querySelector('.commtext');
        const userElement = commentElement.querySelector('.hnuser');
        const ageElement = commentElement.querySelector('.age');
        const scoreElement = commentElement.querySelector('.score');
    
        const comment = {
            id: commentElement.id,
            text: commentText?.textContent?.trim() || '',
            by: userElement?.textContent || '',
            time: ageElement?.getAttribute('title') || ageElement?.textContent || '',
            score: scoreElement?.textContent || '',
            element: commentElement,
            level: this.getCommentIndent(commentElement)
        };
    
        console.log('Parsed comment:', comment);
        return comment;
    }

    getCommentIndent(commentElement) {
        const indentElement = commentElement.querySelector('.ind img');
        if (!indentElement) return 0;
        
        // HN uses width attribute for indentation, each level is 40px
        const width = parseInt(indentElement.getAttribute('width') || '0', 10);
        return Math.floor(width / 40);  // Convert pixels to level
    }

    highlightComment(commentElement) {
        if (!commentElement) return;

        document.querySelectorAll('.comment-highlight').forEach(el => 
            el.classList.remove('comment-highlight')
        );
        
        commentElement.classList.add('comment-highlight');
    }

    scrollToComment(commentId) {
        const comment = document.getElementById(commentId);
        if (comment) {
            comment.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.highlightComment(comment);
        }
    }

    getCommentChain(commentElement) {
        const chain = [];
        let current = commentElement;

        while (current) {
            const parentLink = current.querySelector('.parent a');
            if (!parentLink) break;

            const parentId = parentLink.getAttribute('href').split('=')[1];
            const parentElement = document.getElementById(parentId);
            
            if (!parentElement) break;
            
            chain.unshift(this.parseComment(parentElement));
            current = parentElement;
        }

        return chain;
    }
}
