# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gleam is an AI chat assistant plugin for SiYuan Note, supporting OpenRouter AI provider integration. The plugin provides a chat interface in SiYuan's dock panel with features including context injection, multimodal support (images/audio), chat history management, and document export capabilities.

## Development Commands

### Setup
```bash
# Install dependencies
pnpm install
```

### Development
```bash
# Development mode with hot reload
pnpm run dev

# Lint and fix code
pnpm run lint

# Build for production (creates dist/ folder and package.zip)
pnpm run build
```

## Architecture Overview

### Plugin Entry Point
- **src/index.ts**: Main plugin class `PluginGleam` that extends SiYuan's `Plugin` base class
  - Initializes `DataStorage`, `AIProvider` instances, `SettingsManager`, and `ChatPanel`
  - Creates a dock panel in SiYuan's right sidebar
  - Exposes `gleamChatPanel` globally on window object for debugging

### Core Architecture Patterns

**Manager-Handler-Component Pattern**: The codebase uses a clear separation of concerns:
- **Managers** (src/ui/managers/): Coordinate business logic and state
  - `StateManager`: UI state (loading, errors, empty states)
  - `ConfigManager`: Model configuration and settings
  - `ParametersManager`: Model parameters configuration
  - `ChatManager`: Chat session management (new chat, history)
  - `EventManager`: Centralized event listener attachment
- **Handlers** (src/ui/handlers/): Orchestrate specific user actions
  - `MessageSendHandler`: Processes message sending with context injection
  - `RegenerateHandler`: Handles message regeneration
  - `HistoryHandler`: Manages chat history persistence
  - `AttachmentHandler`: Handles image/audio attachments
  - `ExportHandler`: Exports conversations to SiYuan documents
  - `ConfigHandler`: Manages configuration loading/saving
- **Components** (src/ui/components/): Reusable UI building blocks
  - `MessageRenderer`: Renders chat messages with markdown support
  - `ModelDialog`: Model selection dialog with search
  - `ParametersPanel`: Model parameters configuration panel
  - `MessageHelper`: Helper for adding/updating messages in DOM
- **Builders** (src/ui/builders/): Construct UI and initialize systems
  - `UIBuilder`: Creates HTML structure for chat panel
  - `PanelInitializer`: Initializes all handlers and managers with dependencies

### Data Flow
1. User action triggers event in `EventManager`
2. Event calls appropriate handler method
3. Handler coordinates with managers to update state
4. Handler calls `DataStorage` to persist changes
5. Handler updates UI through components
6. State changes reflected through `StateManager`

### AI Provider Architecture
- **src/api/base.ts**: `BaseAIProvider` abstract class defining provider interface
  - Methods: `chat()`, `getModels()`, `getModelsWithInfo()`
  - Handles authentication and streaming responses
- **src/api/openrouter.ts**: `OpenRouterProvider` implementation
  - All providers are registered in a `Map<string, AIProvider>` in the plugin instance

### Storage System
- **src/storage/data.ts**: `DataStorage` class manages plugin data persistence
  - Uses SiYuan's `loadData()`/`saveData()` API
  - Stores configuration (API keys, model settings) and chat history
  - Implements history limits with favorite protection (starred items never deleted)
  - Data structure: `{ config: PluginConfig, history: ChatHistory[] }`

### Context Injection
- **src/features/context-injection/**: Automatically injects current SiYuan document content as context
  - `ContextInjector`: Fetches document content using SiYuan API
  - `injector.ts`: Handles document content extraction and formatting
  - Triggered when context toggle is enabled before sending messages

### Settings Management
- **src/settings/index.ts**: `SettingsManager` creates plugin settings UI
  - Uses SiYuan's `Setting` API to add configuration items
  - Settings: OpenRouter API key, debug logging, max history count, default model
  - Settings saved to `DataStorage` on confirm

## Key Technical Details

### Internationalization
- i18n files in `src/i18n/` (en_US.json, zh_CN.json)
- Accessed via `this.plugin.i18n.keyName`

### Styling
- SCSS files in `src/styles/` using modular approach
- Entry point: `src/index.scss` imports all style modules
- Styles use SiYuan's CSS class conventions (b3-*, fn__*)

### Type System
- **src/utils/types.ts**: All TypeScript interfaces and types
  - `ChatMessage`: Individual message structure
  - `ChatHistory`: Saved conversation with metadata
  - `ModelInfo`: Model capabilities and supported parameters
  - `ModelParameters`: Runtime model configuration
  - `PluginConfig`: Plugin-wide configuration
  - `AIRequestOptions`/`AIResponse`: Provider communication

### Message Rendering
- Uses `marked` library for markdown parsing
- Custom renderer in `src/ui/utils/markdown.ts` with code highlighting
- Messages support text, images (base64 or URLs), and audio
- Images can be zoomed and copied to clipboard
- Message actions: copy, regenerate, zoom images

### Build System
- Webpack bundles TypeScript and SCSS
- Development: Output to root directory with watch mode
- Production: Output to `dist/` folder, creates `package.zip` with gzip compression
- External: `siyuan` package marked as external (provided by SiYuan runtime)

## Important Conventions

### Code Style
- Double quotes for strings
- Semicolons required
- ES6 target compilation
- No explicit return types (handled by inference)

### Error Handling
- Errors displayed via `StateManager.showError()`
- API errors caught and user-friendly messages shown
- Logger utility in `src/utils/logger.ts` for debug output (controlled by enableDebugLog setting)

### DOM Element Access
- UI elements created in `UIBuilder.createUI()` and extracted in `UIBuilder.initializeElements()`
- All element references stored as class properties in `ChatPanel`
- Event listeners attached via `EventManager` for centralized management

### Chat History Structure
- Each history item has unique ID (generated via Date.now() + random)
- History items can be favorited (prevents auto-deletion)
- Max history count applies only to non-favorited items
- History loaded/saved via `HistoryHandler`

### Export Functionality
- Exports current conversation as SiYuan document
- Base64 images automatically converted to files in SiYuan assets
- Uses SiYuan's document API (`createDocWithMd()`)
- Implemented in `ExportHandler`

## Testing Plugin in SiYuan

1. Run `pnpm run dev` to build and watch for changes
2. Create symlink in SiYuan plugins directory pointing to this repo
3. Reload SiYuan to see changes (Settings → Plugins → Reload)
4. Check browser console and SiYuan logs for debugging output
