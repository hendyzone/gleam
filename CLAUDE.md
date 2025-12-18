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
  - Initializes `DataStorage`, `AIProvider` instances, `SettingsManager`, and `ContextInjector`
  - Creates a dock panel in SiYuan's right sidebar
  - Mounts React application using `mountReactApp()` from `src/app/mount.tsx`
  - Exposes `gleamReactRoot` globally on window object for debugging

### Core Architecture: React + Context API

**The plugin uses a modern React architecture with functional components, hooks, and Context API for state management.**

#### Directory Structure
```
src/
├── app/                          # React application root
│   ├── App.tsx                   # Root component
│   ├── AppProvider.tsx           # Context providers wrapper
│   └── mount.tsx                 # React mounting utilities
│
├── components/                   # React components
│   ├── common/                   # Reusable UI (EmptyState, ImageZoom, Notifications)
│   ├── chat/                     # Chat UI (ChatContainer, MessageList, Message, InputArea, ControlBar)
│   ├── history/                  # History panel and items
│   └── modals/                   # Modal components (ModelDialog, ParametersPanel)
│
├── contexts/                     # React Context for state management
│   ├── AppContext.tsx            # Global app resources (plugin, storage, providers, i18n)
│   ├── ChatContext.tsx           # Chat messages and streaming state
│   ├── ConfigContext.tsx         # Model configuration and parameters
│   ├── HistoryContext.tsx        # Chat history management
│   └── UIContext.tsx             # UI state (modals, notifications, attachments)
│
├── hooks/                        # Custom React hooks
│   ├── business/                 # Business logic hooks (useChat, useMessageSend, useHistory, etc.)
│   ├── data/                     # Data access hooks (useConfig, useDataStorage, useAIProvider)
│   └── utils/                    # Utility hooks (useLogger, useDebounce)
│
├── reducers/                     # State reducers for Context API
│   ├── chatReducer.ts
│   ├── configReducer.ts
│   ├── historyReducer.ts
│   └── uiReducer.ts
│
├── api/                          # AI Provider implementations
├── storage/                      # Data persistence layer
├── features/                     # Feature modules (context-injection, etc.)
├── utils/                        # Utility functions and types
└── settings/                     # Settings manager for plugin config
```

#### State Management with Context API

**AppContext** (Read-only, provides global resources):
- `plugin`: Plugin instance
- `storage`: DataStorage instance
- `providers`: Map of AI providers
- `contextInjector`: ContextInjector instance
- `i18n`: Internationalization object

**ConfigContext** (Model configuration):
- State: `config`, `allModels`, `currentModel`, `modelParameters`, etc.
- Actions: `SET_CONFIG`, `SET_CURRENT_MODEL`, `SET_MODEL_PARAMETERS`, etc.

**ChatContext** (Chat state):
- State: `messages`, `isLoading`, `streamingMessageId`, `hasContextInjected`
- Actions: `ADD_MESSAGE`, `UPDATE_MESSAGE`, `SET_MESSAGES`, `DELETE_MESSAGE`, etc.

**HistoryContext** (History management):
- State: `history`, `currentHistoryId`, `isLoadingHistory`
- Actions: `SET_HISTORY`, `ADD_HISTORY_ITEM`, `TOGGLE_FAVORITE`, etc.

**UIContext** (UI state):
- State: `showHistoryPanel`, `showModelDialog`, `notifications`, `attachments`, `imageZoomUrl`
- Actions: `TOGGLE_HISTORY_PANEL`, `ADD_NOTIFICATION`, `SHOW_IMAGE_ZOOM`, etc.

#### Custom Hooks Architecture

**Business Logic Hooks** (src/hooks/business/):
- `useChat()`: Main chat operations (addMessage, newChat)
- `useMessageSend()`: Message sending with streaming support
- `useMessageRegenerate()`: Message regeneration
- `useHistory()`: History CRUD operations
- `useAttachment()`: File attachment handling
- `useContextInjection()`: Context injection toggle
- `useModelSelection()`: Model selection and filtering
- `useModelParameters()`: Parameter management
- `useExport()`: Export to SiYuan documents

**Data Access Hooks** (src/hooks/data/):
- `useConfig()`: Access ConfigContext state and dispatch
- `useDataStorage()`: Access DataStorage instance
- `useAIProvider()`: Access AI provider instances

### Component Hierarchy

```
App
├── ChatContainer
│   ├── ControlBar (model selection, parameters, history, export buttons)
│   ├── MessageList
│   │   ├── EmptyState (when no messages)
│   │   └── Message[]
│   │       ├── MessageContent (with markdown rendering)
│   │       ├── MessageImage[] (with zoom and copy)
│   │       ├── MessageAudio[]
│   │       └── MessageActions (copy, regenerate)
│   └── InputArea
│       ├── AttachmentPreview
│       └── Textarea with file upload
├── ModelDialog (modal for model selection)
├── ParametersPanel (modal for parameter configuration)
├── HistoryPanel (side panel for chat history)
├── ImageZoom (full-screen image viewer, uses React Portal)
└── Notifications (toast notifications, uses React Portal)
```

### Data Flow

1. **User Interaction** → Component event handler (with `useCallback`)
2. **Event Handler** → Calls custom hook (e.g., `useMessageSend()`)
3. **Custom Hook** → Dispatches action to appropriate context
4. **Reducer** → Updates context state immutably
5. **Context** → Triggers re-render of subscribed components
6. **Component** → Renders updated UI (optimized with `React.memo`)

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
- Custom renderer in `src/ui/utils/markdown.ts` with code highlighting (Prism.js)
- **Streaming optimization**: Direct DOM manipulation during streaming to avoid React reconciliation flicker
  - While streaming: `useRef` + `innerHTML` for performance
  - After completion: `dangerouslySetInnerHTML` for React-managed rendering
- Messages support text, images (base64 or URLs), and audio
- Images can be zoomed (via ImageZoom component) and copied to clipboard
- Message actions: copy text, regenerate assistant responses

### Performance Optimizations
- **React.memo**: Applied to `Message` component to prevent unnecessary re-renders
- **useCallback**: All event handlers wrapped to maintain referential equality
- **useMemo**: Markdown rendering memoized for completed messages
- **Efficient streaming**: Direct DOM updates during streaming, React takes over after completion

### Error Handling
- Errors displayed via notification system (UIContext + Notifications component)
- API errors caught and user-friendly messages shown
- Logger utility in `src/utils/logger.ts` for debug output (controlled by enableDebugLog setting)

### Clipboard Operations
- **Text copying**: `src/utils/clipboard.ts` with Clipboard API and fallback to `document.execCommand`
- **Image copying**: Uses Blob API and `ClipboardItem` for image data
- Success/failure feedback via toast notifications

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
- Functional components with hooks (no class components)
- TypeScript with type inference (minimal explicit types)
- React props interfaces defined inline or in component file

### React Best Practices
- **Context Access**: Use custom hooks (`useConfig()`, `useChatContext()`, etc.) instead of direct Context.Consumer
- **Event Handlers**: Always wrap in `useCallback` with correct dependencies
- **Side Effects**: Use `useEffect` with proper dependency arrays and cleanup functions
- **Memo izat ion**: Apply `React.memo` to components that receive stable props
- **Portals**: Use `createPortal` for modals and overlays (ImageZoom, Notifications)
- **Refs**: Use `useRef` for DOM access and mutable values that don't trigger re-renders

### State Management
- **Immutable Updates**: All reducers must return new state objects (spread operator)
- **Action Types**: String constants for action types (e.g., "ADD_MESSAGE", "SET_CONFIG")
- **Context Separation**: Each context manages a single domain (chat, config, UI, history)
- **No Prop Drilling**: Use Context API to avoid passing props through multiple levels

### Error Handling
- Display user-facing errors via notification system (not console)
- Log technical errors via Logger utility for debugging
- Handle async errors with try-catch in hooks
- Provide fallback UI states for error conditions

### Chat History Structure
- Each history item has unique ID (generated via Date.now() + random)
- History items can be favorited (prevents auto-deletion)
- Max history count applies only to non-favorited items
- History managed via `useHistory()` hook and HistoryContext
- History panel displays recent conversations with search and filter

### Export Functionality
- Exports current conversation as SiYuan document
- Base64 images automatically converted to files in SiYuan assets
- Uses SiYuan's document API (`createDocWithMd()`)
- Implemented in `useExport()` hook

## Testing Plugin in SiYuan

1. Run `pnpm run dev` to build and watch for changes
2. Create symlink in SiYuan plugins directory pointing to this repo
3. Reload SiYuan to see changes (Settings → Plugins → Reload)
4. Check browser console and SiYuan logs for debugging output
