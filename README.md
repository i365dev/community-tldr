# Community TL;DR

A Chrome extension that uses AI to summarize Hacker News discussions, providing quick insights into lengthy threads.

## Features

- 🤖 AI-powered discussion summarization
- 📱 Support for Hacker News discussions
- 🌐 Multiple language support (English, Chinese, Japanese, Korean)
- 🔄 Custom AI endpoint configuration
- 📊 Thread-level summaries
- 🎯 Focused on key points and insights

## Installation

Since this extension is not yet available on the Chrome Web Store, you'll need to install it manually:

1. Download the latest release from the [Releases](../../releases) page
2. Unzip the downloaded file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right corner
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
2. Configure your preferred AI service:
   - Custom Endpoint (recommended)
   - OpenAI
   - Anthropic (Claude)
   - Cloudflare AI Worker
3. Set your preferred summarization language
4. Save settings and start using

## Usage

1. Visit any Hacker News discussion page
2. Click the extension icon to show the summary sidebar
3. Click "TL;DR" next to any thread to summarize it
4. View summaries in the sidebar
5. Click on summaries to jump to original comments

## Building From Source

```bash
# Install dependencies
npm install

# Development build
npm run dev

# Production build
npm run build

# The built extension will be in the `dist` folder
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.