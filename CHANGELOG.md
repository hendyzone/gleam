# Changelog

All notable changes to Gleam will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-12-14

### Added
- Improved user experience: All message content (text, tables, lists) is now selectable

### Fixed
- Table display issues

## [0.1.1] - 2025-12-14

### Added
- Export conversation to document: Export current chat conversation as a SiYuan document
- Automatic image conversion: Base64 images in conversations are automatically saved as files when exporting
- Export success notification: Visual feedback when export completes successfully

## [0.1.0] - 2025-12-14

### Added
- Initial release of Gleam plugin
- Support for OpenRouter AI provider
- Chat interface integrated into SiYuan dock panel
- Model selection with search functionality
- Context injection from current document
- Markdown rendering with code highlighting
- Multimodal support (images and audio input)
- Chat history management
- Message regeneration
- Parameter configuration panel (temperature, max tokens, etc.)
- Copy message and image to clipboard
- Image zoom and preview
- Settings panel with API key configuration
- Default model selection in settings
- Maximum history count configuration
- Debug log toggle
- Internationalization support (English and Simplified Chinese)
- Empty state display
- Loading indicators
- Error handling and user feedback

### Features
- **AI Providers**: OpenRouter integration
- **Chat Interface**: Clean, responsive chat UI
- **Context Injection**: Automatic document context inclusion
- **History Management**: Save, load, and manage conversation history
- **Model Selection**: Easy model switching with search
- **Parameter Tuning**: Customize AI behavior
- **Multimodal**: Support for text, images, and audio
- **Markdown Support**: Full Markdown rendering
- **User Experience**: Intuitive controls and feedback

### Technical Details
- Built with TypeScript
- Webpack for bundling
- SCSS for styling
- Modular architecture with managers, handlers, and components
- Event-driven design
- Local storage for configuration and history
- Stream support for real-time responses
