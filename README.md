# Community TL;DR

A Chrome extension powered by AI to generate quick summaries of community discussions. Get insights from lengthy threads without reading through everything.

## Features

- 🤖 AI-powered discussion summarization
- 🌐 Multiple community support (currently supports Hacker News, more coming soon)
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
- 📱 Thread-level summaries
- 🎯 Focus on key points and insights
- 📊 Smart content analysis

## Supported Communities

Currently supported:
- ✅ Hacker News discussions

Coming soon:
- 🔄 Reddit
- 🔄 Stack Overflow
- 🔄 GitHub Discussions
- More suggestions welcome!

## Installation

Since this extension is not yet available on the Chrome Web Store, follow these steps to install:

1. Download the latest release from the [Releases](../../releases) page
2. Unzip the downloaded file
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the unzipped folder

## Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/community-tldr.git
cd community-tldr

# Install dependencies
npm install

# Start development build with watch mode
npm run dev

# Build for production
npm run build
```

## Configuration

1. After installation, click the extension icon and go to Settings
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

1. Visit a supported community discussion page
2. Click the extension icon to show the summary sidebar
3. Use the "TL;DR" button next to threads to summarize them
4. View summaries in the sidebar
5. Click on summaries to jump to original content

## Building From Source

```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build

# The built extension will be in the `dist` folder
```

## Contributing

We welcome contributions! Here are some ways you can help:

1. 🐛 Report bugs
2. 💡 Suggest new features
3. 🌐 Add support for new communities
4. 📝 Improve documentation
5. 🔧 Submit pull requests

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Adding Support for New Communities

Interested in adding support for a new community? Check out our [Contributing Guide](CONTRIBUTING.md) for details on:
- Architecture overview
- Adding new parsers
- Testing guidelines
- PR submission process

## Future Plans

- [ ] Support for more communities
- [ ] Enhanced summarization options
- [ ] Offline mode with local AI models
- [ ] Custom prompt templates
- [ ] Summary sharing functionality
- [ ] Community voting on summaries

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors and users
- Special thanks to the open source community
- AI providers for making this possible
