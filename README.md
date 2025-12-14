# Gleam

[中文](README_zh_CN.md)

AI chat assistant plugin for SiYuan Note. Currently supports OpenRouter AI provider.

## Features

- 🤖 **OpenRouter Support**: Currently supports OpenRouter AI provider (access to multiple AI models)
- 💬 **Chat Interface**: Clean and intuitive chat interface integrated into SiYuan
- 📝 **Context Injection**: Automatically inject current document content as context
- 🎨 **Markdown Rendering**: Full Markdown support with code highlighting
- 📎 **Multimodal Support**: Support for images and audio input
- 📚 **Chat History**: Save and manage conversation history
- ⚙️ **Model Selection**: Easy model selection with search functionality
- 🔧 **Parameter Configuration**: Customize temperature, max tokens, and other parameters
- 🔄 **Regenerate**: Regenerate AI responses with one click
- 📋 **Copy & Export**: Copy messages or images to clipboard
- 📄 **Export to Document**: Export current conversation as a SiYuan document with automatic image conversion

## Installation

1. Open SiYuan Note
2. Go to Settings → Community Marketplace
3. Search for "Gleam" or "萤窗"
4. Click Install

## Quick Start

### 1. Configure API Key

1. Open SiYuan Settings
2. Navigate to **Plugins** → **Gleam**
3. Enter your OpenRouter API Key (starts with `sk-`)
4. Click Save

### 2. Select Model

1. Open the Gleam dock panel (right sidebar)
2. Click the model selection button
3. Search and select your preferred model
4. Start chatting!

### 3. Use Context Injection

1. Open a document in SiYuan
2. Enable "Context Injection" toggle in the chat panel
3. The current document content will be automatically included as context

## Configuration

### Settings

- **OpenRouter API Key**: Your API key for OpenRouter service
- **Default Model**: Default model to use for new conversations
- **Max History Count**: Maximum number of unstarred history items (1-1000)
- **Enable Debug Log**: Enable debug logging for troubleshooting

### Model Parameters

Click the parameters button (⚙️) to configure:
- **Temperature**: Controls randomness (0.0 - 2.0)
- **Max Tokens**: Maximum tokens in response
- **Top P**: Nucleus sampling parameter
- **Frequency Penalty**: Reduce repetition
- **Presence Penalty**: Encourage new topics

## Usage Tips

- **Insert Document**: Click the document icon to insert current document content into input
- **Image Input**: Click the image icon to attach images to your message
- **Audio Input**: Support for audio input (requires model support)
- **History Management**: Click history button to view and manage past conversations
- **New Chat**: Start a fresh conversation with the new chat button
- **Regenerate**: Click regenerate button on any AI message to get a new response
- **Text Selection**: Select and copy text directly from message bubbles (including tables and formatted content)
- **Export to Document**: Click the export button (📄) to export the current conversation as a SiYuan document. Base64 images will be automatically converted to files

## Supported Models

Gleam supports all models available through OpenRouter, including:
- OpenAI models (GPT-4, GPT-3.5, etc.)
- Anthropic models (Claude 3, etc.)
- Google models (Gemini, etc.)
- And many more...

## Requirements

- SiYuan Note version 3.4.2 or higher
- Desktop environment (Windows, macOS, Linux, Docker)
- Valid OpenRouter API key

## Development

### Prerequisites

- Node.js
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Development mode with hot reload
pnpm run dev

# Build for production
pnpm run build
```

## License

MIT

## Author

hendyzone

## Links

- [GitHub Repository](https://github.com/hendyzone/Gleam.git)
- [SiYuan Note](https://b3log.org/siyuan/)
