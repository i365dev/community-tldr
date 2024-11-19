# Community TL;DR

A Chrome extension powered by AI to generate quick summaries of community discussions. Get insights from lengthy threads without reading through everything.

[![Available in the Chrome Web Store](https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/UV4C4ybeBTsZt43U4xis.png)](https://chromewebstore.google.com/detail/community-tldr/kikhlploiflbfpdliimemhelcpneobfm)

## Features

- 🤖 AI-powered discussion summarization
- 🌐 Support for major communities (Hacker News, Reddit)
- 🌍 Multiple language support
  - English
  - Chinese (中文)
  - Japanese (日本語)
  - Korean (한국어)
- ⚙️ Flexible AI backend
  - Custom API endpoint
  - OpenAI API
  - Anthropic Claude
  - Cloudflare AI Worker
- 📱 Thread-level summaries with side-by-side view
- 🎯 Focus on key points and insights
- 📊 Smart content analysis and language translation

## Supported Communities

Currently supported:

- ✅ Hacker News discussions
- ✅ Reddit threads

Coming soon:
- 🔄 Twitter threads
- 🔄 GitHub Discussions
- More suggestions welcome!

## Installation

### Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store page](https://chromewebstore.google.com/detail/community-tldr/kikhlploiflbfpdliimemhelcpneobfm)
2. Click "Add to Chrome"
3. Follow the installation prompts

### Manual Installation (Development)

1. Clone the repository
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Load unpacked extension from `dist` folder

## Configuration

1. Click the extension icon and go to Settings
2. Configure your AI service:
   - Custom Endpoint (recommended)
   - OpenAI
   - Anthropic (Claude)
   - Cloudflare AI Worker
3. Set your preferred:
   - Summary language
   - Summary length
   - Auto-summarize options
4. Save settings and start using

## Usage

1. Visit a supported site (Hacker News or Reddit)
2. Click the extension icon or use the TL;DR button
3. Choose summarization options:
   - Full discussion summary
   - Individual thread summary
4. View summaries in the sidebar
5. Click summaries to navigate to original content

## Development

```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build
```

## Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for:
- Adding new community support
- Improving summarization
- Bug fixes and feature enhancements
- Documentation improvements

### Adding Support for New Communities

Check our [Contributing Guide](CONTRIBUTING.md) for:
- Architecture overview
- Parser implementation
- Testing requirements
- PR submission process

## Roadmap

- [ ] Support for more communities (Twitter, GitHub)
- [ ] Enhanced summarization algorithms
- [ ] Custom prompt templates
- [ ] Community-driven improvements
- [ ] Performance optimizations

## Privacy & Security

- No user data collection
- Local storage for settings only
- Secure API handling
- Privacy-focused design

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Chrome Web Store](https://chromewebstore.google.com/detail/community-tldr/kikhlploiflbfpdliimemhelcpneobfm)
- [GitHub Repository](https://github.com/yourusername/community-tldr)
- [Report Issues](https://github.com/yourusername/community-tldr/issues)

## Acknowledgments

- Open source community
- AI service providers
- Early users and contributors
