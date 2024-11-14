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

To add support for a new community (e.g., Twitter), you'll need to create two main components:

1. Create a Parser (`src/content/parsers/twitter.js`):
```javascript
export class TwitterParser extends BaseParser {
    isDiscussionPage() {
        return window.location.pathname.includes('/status/');
    }

    getTitle() {
        // Get thread title or first tweet content
        return document.querySelector('[data-testid="tweetText"]')?.textContent || '';
    }

    getTopLevelComments() {
        // Get top-level replies only
        const comments = document.querySelectorAll('[data-testid="tweet"]');
        return Array.from(comments).filter(comment => {
            // Filter for top-level comments only
            return true; // Implement your logic
        });
    }
}
```

2. Create a Summarizer (`src/content/platforms/TwitterSummarizer.js`):
```javascript
import { BaseSummarizer } from '../base/BaseSummarizer';
import { TwitterParser } from '../parsers/twitter';
import { renderMarkdown } from '../utils/markdown';

export class TwitterSummarizer extends BaseSummarizer {
    constructor() {
        super();
        this.parser = new TwitterParser();
        this.parser.setContentScript(this);
        this.setupCommentObserver();
    }

    setupCommentObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    // Check for new comments and add TLDR buttons
                    const comments = document.querySelectorAll('[data-testid="tweet"]');
                    if (comments.length > 0) {
                        this.addTLDRLinks();
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    addTLDRLinks() {
        const topLevelComments = this.parser.getTopLevelComments();

        topLevelComments.forEach(comment => {
            if (!comment.querySelector('.tldr-summarize-btn')) {
                const tldrContainer = document.createElement('span');
                tldrContainer.className = 'tldr-btn-container';
                
                const tldrLink = document.createElement('a');
                tldrLink.textContent = 'TL;DR';
                tldrLink.className = 'tldr-summarize-btn';
                tldrLink.style.marginLeft = '10px';
                
                tldrLink.addEventListener('mousedown', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    this.summarizeThread({
                        id: comment.id,
                        text: comment.innerText
                    });
                });
                
                // Add TLDR button to the tweet actions area
                const actionsBar = comment.querySelector('[role="group"]');
                if (actionsBar) {
                    actionsBar.appendChild(tldrContainer);
                }
            }
        });
    }
}
```

3. Update index.js to include the new platform:
```javascript
// src/content/index.js
import { RedditSummarizer } from './platforms/RedditSummarizer';
import { HNSummarizer } from './platforms/HNSummarizer';
import { TwitterSummarizer } from './platforms/TwitterSummarizer';

const PLATFORM_HANDLERS = {
    'news.ycombinator.com': HNSummarizer,
    'reddit.com': RedditSummarizer,
    'www.reddit.com': RedditSummarizer,
    'twitter.com': TwitterSummarizer
};

function initializeSummarizer() {
    const hostname = window.location.hostname;
    const SummarizerClass = Object.entries(PLATFORM_HANDLERS).find(([domain]) => 
        hostname.includes(domain)
    )?.[1];

    if (!SummarizerClass) {
        console.log('Site not supported');
        return;
    }

    const summarizer = new SummarizerClass();
    summarizer.init();
}

initializeSummarizer();
```

4. Update manifest.json:
```json
{
    "host_permissions": [
        "https://news.ycombinator.com/*",
        "*://*.reddit.com/*",
        "https://twitter.com/*"
    ],
    "content_scripts": [{
        "matches": [
            "https://news.ycombinator.com/*",
            "*://*.reddit.com/*",
            "https://twitter.com/*"
        ],
        "js": ["content.js"],
        "css": ["styles/content.css"]
    }]
}
```

### Key Components Requirements

When implementing a new platform, ensure your components handle:

1. Parser:
   - Discussion page detection
   - Comment extraction
   - Thread structure parsing

2. Summarizer:
   - Dynamic content loading (using MutationObserver if needed)
   - TLDR button insertion
   - Summary UI updates
   - Platform-specific event handling

3. Error Handling:
   - Graceful degradation if elements aren't found
   - Proper error messages
   - Recovery from failed summarizations

## Code Style Guidelines

- Use meaningful variable names
- Document platform-specific quirks
- Keep functions small and focused
- Handle dynamic content loading properly
- Test across different states of the platform's UI

## Testing New Platforms

- Test with various thread lengths
- Test with dynamic content loading
- Verify proper event handling
- Check for memory leaks with long-running observers
- Test error cases and recovery

## Pull Request Process

1. Update the README.md with details of the new platform
2. Include screenshots of the integration
3. Document any platform-specific limitations
4. Update version numbers following SemVer

## Questions?

Feel free to open an issue for any questions about implementing new platforms!
