# Contributing to Community TL;DR

We love your input! We want to make contributing to Community TL;DR as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Adding support for new communities

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Adding Support for New Communities

To add support for a new community, you'll need to:

1. Create a new parser in `src/content/parsers/`:
```javascript
// Example: src/content/parsers/reddit.js
export class RedditParser extends BaseParser {
    isDiscussionPage() {
        // Implementation
    }

    getPageContent() {
        // Implementation
    }

    parseCommentThread(commentElement) {
        // Implementation
    }

    // ... other required methods
}
```

2. Update the community registry in `src/content/registry.js`:
```javascript
import { HNParser } from './parsers/hn';
import { RedditParser } from './parsers/reddit';

export const COMMUNITY_PARSERS = {
    'news.ycombinator.com': HNParser,
    'reddit.com': RedditParser,
    // Add your new parser here
};
```

3. Add necessary styles in `src/styles/`:
```css
/* styles/reddit.css */
.tldr-reddit-specific-class {
    /* Your styles */
}
```

4. Update the manifest to include new permissions if needed:
```json
{
    "host_permissions": [
        "https://news.ycombinator.com/*",
        "https://www.reddit.com/*"
        // Add your new domain
    ]
}
```

### Parser Requirements

Your parser must implement these methods:

- `isDiscussionPage()`: Detect if current page is a discussion
- `getPageContent()`: Extract main post content
- `parseCommentThread()`: Parse comment thread structure
- `getTopLevelComments()`: Get top-level comments
- `scrollToComment()`: Handle comment navigation

## Code Style Guidelines

- Use meaningful variable names
- Write comments for complex logic
- Follow the existing code style
- Use TypeScript for new code if possible
- Keep functions small and focused

## Testing

- Add appropriate test cases
- Test across different browsers
- Test with various content types
- Verify error handling

## Community Parser Template

Here's a template for new community parsers:

```javascript
export class CommunityParser extends BaseParser {
    constructor() {
        super();
        this.communitySpecific = {};
    }

    isDiscussionPage() {
        // Return boolean indicating if current page is a discussion
        return false;
    }

    getPageContent() {
        // Return {
        //     title: string,
        //     text: string,
        //     url: string,
        //     author: string
        // }
        return null;
    }

    parseCommentThread(commentElement) {
        // Return {
        //     id: string,
        //     root: Comment,
        //     replies: Comment[],
        //     level: number
        // }
        return null;
    }

    getTopLevelComments() {
        // Return HTMLElement[]
        return [];
    }

    scrollToComment(commentId) {
        // Implement smooth scroll to comment
    }
}
```

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the documentation for new communities
3. Update the version numbers following [SemVer](http://semver.org/)
4. The PR will be merged once you have sign-off from maintainers

## Any questions?

Feel free to ask in issues or discussions!