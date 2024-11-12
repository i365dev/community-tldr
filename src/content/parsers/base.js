export class BaseParser {
    constructor() {
        if (this.constructor === BaseParser) {
            throw new Error('Cannot instantiate abstract BaseParser');
        }
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
        throw new Error('Method scrollToComment() must be implemented');
    }

    // Highlight specific comment
    highlightComment(commentElement) {
        if (!commentElement) return;

        // Remove existing highlights
        document.querySelectorAll('.comment-highlight').forEach(el => 
            el.classList.remove('comment-highlight')
        );
        
        // Add highlight to target comment
        commentElement.classList.add('comment-highlight');
    }

    // Get comment indentation level
    getCommentIndent(commentElement) {
        throw new Error('Method getCommentIndent() must be implemented');
    }
}