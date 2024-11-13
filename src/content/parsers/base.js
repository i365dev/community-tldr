export class BaseParser {
    constructor() {
        if (this.constructor === BaseParser) {
            throw new Error('Cannot instantiate abstract BaseParser');
        }
    }

    // Optional initialization method
    async initialize() {
        // Default empty implementation
        return Promise.resolve();
    }

    // Check if current page is a discussion
    isDiscussionPage() {
        throw new Error('Method isDiscussionPage() must be implemented');
    }

    // Get page title
    getTitle() {
        throw new Error('Method getTitle() must be implemented');
    }

    // Get page content including main post and metadata
    getPageContent() {
        throw new Error('Method getPageContent() must be implemented');
    }

    // Parse a comment thread starting from the given element
    parseCommentThread(commentElement) {
        throw new Error('Method parseCommentThread() must be implemented');
    }

    // Get all top-level comments
    getTopLevelComments() {
        throw new Error('Method getTopLevelComments() must be implemented');
    }

    // Scroll to specific comment
    scrollToComment(commentId) {
        if (!commentId) return;
        
        const comment = document.getElementById(commentId);
        if (comment) {
            comment.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.highlightComment(comment);
        }
    }

    // Highlight specific comment
    highlightComment(commentElement) {
        if (!commentElement) return;

        // Remove existing highlights
        document.querySelectorAll('.comment-highlight').forEach(el => 
            el.classList.remove('comment-highlight')
        );
        
        // Add new highlight
        commentElement.classList.add('comment-highlight');

        // Add highlight styles if they don't exist
        if (!document.getElementById('highlight-styles')) {
            const style = document.createElement('style');
            style.id = 'highlight-styles';
            style.textContent = `
                .comment-highlight {
                    background-color: rgba(255, 255, 0, 0.2) !important;
                    border-left: 3px solid #f90 !important;
                    transition: all 0.3s ease;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Get comment indentation level
    getCommentIndent(commentElement) {
        throw new Error('Method getCommentIndent() must be implemented');
    }

    // Optional method to handle cleanup
    destroy() {
        // Default empty implementation
    }
}