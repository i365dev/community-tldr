import { log } from '../utils/logger';

// Base class for platform-specific content preparers
class ContentPreparer {
    // Default templates for summary generation
    static templates = {
        threadPrompt: `
Please analyze this discussion thread focusing on:
1. Main points and arguments made
2. Key insights and unique perspectives
3. Areas of consensus or disagreements
4. Notable conclusions
`,
        postPrompt: `
Please provide a comprehensive summary focusing on:
1. Main topic and key points from the original post
2. Major themes and insights from the discussion
3. Significant agreements or disagreements
4. Overall conclusions and important takeaways
`
    };

    // Abstract methods to be implemented by platform-specific preparers
    prepareCommentContent(thread) {
        throw new Error('Method must be implemented by platform-specific preparer');
    }

    preparePostContent(content) {
        throw new Error('Method must be implemented by platform-specific preparer');
    }

    // Utility method to remove duplicate replies
    dedupReplies(replies, idKey = 'id') {
        const uniqueReplies = new Map();
        replies.forEach(reply => {
            if (!uniqueReplies.has(reply[idKey])) {
                uniqueReplies.set(reply[idKey], reply);
            }
        });
        return Array.from(uniqueReplies.values());
    }

    // Get standardized author name across platforms
    getAuthorName(content, defaultName = 'Unknown') {
        return content.by || content.author || content.username || content.root.by || defaultName;
    }
}

// HackerNews specific content preparer
class HNContentPreparer extends ContentPreparer {
    prepareCommentContent(thread) {
        const uniqueReplies = this.dedupReplies(thread.replies);

        return `
Thread started by ${this.getAuthorName(thread.root)}:
${thread.root.text}

Discussion (${uniqueReplies.length} unique replies):
${uniqueReplies.map(reply => 
    `[${this.getAuthorName(reply)}]: ${reply.text}`
).join('\n\n')}

${ContentPreparer.templates.threadPrompt}`;
    }

    preparePostContent(content) {
        const uniqueComments = this.dedupReplies(content.comments || []);
        
        return `
Title: ${content.title || 'No Title'}
Author: ${this.getAuthorName(content)}
URL: ${content.url || 'No URL provided'}
Content: ${content.text || 'No content available'}

Discussion Overview (${content.commentCount || 0} total comments):
${uniqueComments.map(comment => `
[${this.getAuthorName(comment)}]: ${comment.text}
${(comment.replies || []).map(reply => 
    `  └─ [${this.getAuthorName(reply)}]: ${reply.text}`
).join('\n')}
`).join('\n')}

${ContentPreparer.templates.postPrompt}`;
    }
}

// Reddit specific content preparer
class RedditContentPreparer extends ContentPreparer {
    prepareCommentContent(thread) {
        const uniqueReplies = this.dedupReplies(thread.replies);

        return `
Thread started by u/${this.getAuthorName(thread.root)}:
${thread.root.text}

Discussion (${uniqueReplies.length} unique replies):
${uniqueReplies.map(reply => 
    `u/${this.getAuthorName(reply)}: ${reply.text}`
).join('\n\n')}

${ContentPreparer.templates.threadPrompt}`;
    }

    preparePostContent(content) {
        const uniqueComments = this.dedupReplies(content.comments || []);
        
        return `
Title: ${content.title || 'No Title'}
Posted by u/${this.getAuthorName(content)}
URL: ${content.url || 'No URL provided'}
Content: ${content.text || content.selftext || 'No content available'}

Discussion Overview (${content.commentCount || 0} total comments):
${uniqueComments.map(comment => `
u/${this.getAuthorName(comment)}: ${comment.text}
${(comment.replies || []).map(reply => 
    `  └─ u/${this.getAuthorName(reply)}: ${reply.text}`
).join('\n')}
`).join('\n')}

${ContentPreparer.templates.postPrompt}`;
    }
}

// Main content summarizer class that handles all platforms
export class ContentSummarizer {
    constructor(parser) {
        this.parser = parser;
        this.settings = null;
        // Select appropriate content preparer based on current platform
        this.preparer = this.getContentPreparer();
        this.initialize();
    }

    // Initialize summarizer with user settings
    async initialize() {
        try {
            this.settings = await this.loadSettings();
        } catch (error) {
            log.error('Failed to initialize summarizer:', error);
        }
    }

    // Load user settings from storage
    async loadSettings() {
        try {
            return await chrome.storage.sync.get({
                aiProvider: 'custom',
                apiKey: '',
                endpoint: '',
                model: 'gpt-3.5-turbo',
                summaryLength: 'medium',
                language: 'chinese',
                autoSummarize: false
            });
        } catch (error) {
            log.error('Failed to load settings:', error);
            return {};
        }
    }

    // Factory method to get platform-specific content preparer
    getContentPreparer() {
        const hostname = window.location.hostname;
        if (hostname.includes('news.ycombinator.com')) {
            return new HNContentPreparer();
        } else if (hostname.includes('reddit.com')) {
            return new RedditContentPreparer();
        }
        throw new Error('Unsupported platform');
    }

    // Generate summary for a specific piece of content
    async summarize(data) {
        try {
            log.debug('Summarizing content:', data);
            const { type, content } = data;
            
            // Prepare content based on type
            const summaryContent = type === 'comment' 
                ? this.preparer.prepareCommentContent(content)
                : this.preparer.preparePostContent(content);

            // Send request to AI service
            const response = await chrome.runtime.sendMessage({
                type: 'SUMMARIZE',
                data: {
                    content: summaryContent,
                    type: type,
                    language: this.settings?.language || 'chinese'
                }
            });

            if (!response.success) {
                throw new Error(response.error || 'Failed to generate summary');
            }

            // Return formatted summary result
            return {
                id: content.id,
                type: type,
                summary: response.data,
                author: this.preparer.getAuthorName(content),
                replyCount: content.replies?.length || 0,
                title: content.title,
                threadCount: content.commentCount
            };
        } catch (error) {
            log.error('Summarization error:', error);
            throw error;
        }
    }

    // Generate summary for entire discussion
    async summarizeAll() {
        try {
            if (!this.parser) {
                throw new Error('Parser not initialized');
            }

            // Get full page content
            const pageContent = this.parser.getPageContent();
            if (!pageContent) {
                throw new Error('Could not extract page content');
            }

            log.debug('Page content extracted:', {
                title: pageContent.mainPost.title,
                commentCount: pageContent.threads?.length
            });

            // Update UI with loading state
            window.postMessage({
                type: 'TLDR_UPDATE_STATE',
                data: {
                    loading: true,
                    message: 'Analyzing discussion content...'
                }
            }, '*');

            // Process and summarize content
            const result = await this.summarize({
                type: 'main_post',
                content: {
                    ...pageContent.mainPost,
                    comments: pageContent.threads?.map(thread => ({
                        id: thread.root.id,
                        by: thread.root.by,
                        text: thread.root.text,
                        replies: thread.replies
                    })),
                    commentCount: this.parser.getTopLevelComments().length
                }
            });

            // Update UI with completed summary
            window.postMessage({
                type: 'TLDR_UPDATE_STATE',
                data: {
                    loading: false,
                    summary: result
                }
            }, '*');

            return {
                success: true,
                summary: result
            };
        } catch (error) {
            log.error('Failed to summarize content:', error);
            
            // Update UI with error state
            window.postMessage({
                type: 'TLDR_UPDATE_STATE',
                data: {
                    loading: false,
                    error: error.message
                }
            }, '*');

            return {
                success: false,
                error: error.message
            };
        }
    }
}