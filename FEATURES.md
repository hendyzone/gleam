# Gleam 功能详解 / Features Documentation

[English](#english) | [中文](#中文)

---

## English

### Core Features

#### 1. AI Chat Interface
- **Real-time Chat**: Stream-based chat interface with instant responses
- **Message Display**: Clean message bubbles with role indicators (user/assistant)
- **Markdown Rendering**: Full Markdown support including:
  - Headers, lists, links
  - Code blocks with syntax highlighting
  - Tables, blockquotes
  - Inline code formatting

#### 2. Multiple AI Providers
- **OpenRouter**: Primary provider with access to multiple AI models
  - Supports all OpenRouter-compatible models
  - Automatic model list fetching
  - Model information display (input/output modalities, context length)
- **SiliconFlow**: Secondary provider support (planned)

#### 3. Model Selection
- **Search Functionality**: Quick model search with filtering
- **Model Information**: Display model capabilities and parameters
- **Default Model**: Set default model in settings
- **Model Dialog**: Easy model switching during conversation

#### 4. Context Injection
- **Automatic Injection**: Inject current document content as context
- **Toggle Control**: Enable/disable context injection per conversation
- **Document Extraction**: Extract text content from current editor
- **Smart Filtering**: Exclude code blocks, charts, and other non-text elements

#### 5. Multimodal Support
- **Image Input**: 
  - Attach images to messages
  - Support for base64 and URL formats
  - Image preview before sending
  - Image display in messages
- **Audio Input**:
  - Support for audio file input
  - Base64 encoding
  - Format specification (wav, mp3, etc.)

#### 6. Chat History
- **History Storage**: Save conversations locally
- **History Panel**: View and manage past conversations
- **History Limit**: Configurable maximum history count (1-1000)
- **Starred Conversations**: Mark important conversations
- **History Deletion**: Delete individual or all conversations
- **New Chat**: Start fresh conversations

#### 7. Parameter Configuration
- **Temperature**: Control response randomness (0.0 - 2.0)
- **Max Tokens**: Limit response length
- **Top P**: Nucleus sampling parameter
- **Frequency Penalty**: Reduce repetition in responses
- **Presence Penalty**: Encourage new topics
- **Parameter Panel**: Easy access to all parameters

#### 8. Message Actions
- **Regenerate**: Regenerate AI responses
- **Copy Text**: Copy message content to clipboard
- **Copy Image**: Copy images to clipboard
- **Image Zoom**: Zoom in on images for better viewing
- **Message ID**: Unique identifier for each message

#### 9. User Interface
- **Dock Integration**: Integrated into SiYuan dock panel
- **Responsive Design**: Adapts to panel size
- **Empty State**: Friendly message when no conversations
- **Loading States**: Visual feedback during operations
- **Error Handling**: Clear error messages
- **Tooltips**: Helpful hints for controls

#### 10. Settings
- **API Key Management**: Secure API key storage
- **Provider Configuration**: Configure multiple providers
- **Default Model**: Set default model for new conversations
- **History Management**: Configure history limits
- **Debug Mode**: Enable/disable debug logging

### Advanced Features

#### Stream Processing
- Real-time response streaming
- Chunk-by-chunk display
- Proper handling of incomplete data
- Support for both stream and non-stream responses

#### Error Handling
- Network error detection
- API error messages
- User-friendly error display
- Automatic retry mechanisms (where applicable)

#### Data Storage
- Local configuration storage
- Conversation history persistence
- Settings synchronization
- Data migration support

#### Internationalization
- English (en_US)
- Simplified Chinese (zh_CN)
- Extensible i18n system

---

## 中文

### 核心功能

#### 1. AI 聊天界面
- **实时聊天**：基于流的聊天界面，即时响应
- **消息显示**：清晰的消息气泡，带有角色指示器（用户/助手）
- **Markdown 渲染**：完整的 Markdown 支持，包括：
  - 标题、列表、链接
  - 带语法高亮的代码块
  - 表格、引用块
  - 行内代码格式化

#### 2. 多 AI 供应商
- **OpenRouter**：主要供应商，可访问多个 AI 模型
  - 支持所有 OpenRouter 兼容模型
  - 自动获取模型列表
  - 显示模型信息（输入/输出模态、上下文长度）
- **SiliconFlow**：次要供应商支持（计划中）

#### 3. 模型选择
- **搜索功能**：快速模型搜索和过滤
- **模型信息**：显示模型能力和参数
- **默认模型**：在设置中设置默认模型
- **模型对话框**：对话中轻松切换模型

#### 4. 上下文注入
- **自动注入**：将当前文档内容作为上下文注入
- **开关控制**：每个对话可启用/禁用上下文注入
- **文档提取**：从当前编辑器提取文本内容
- **智能过滤**：排除代码块、图表和其他非文本元素

#### 5. 多模态支持
- **图片输入**：
  - 为消息附加图片
  - 支持 base64 和 URL 格式
  - 发送前图片预览
  - 消息中的图片显示
- **音频输入**：
  - 支持音频文件输入
  - Base64 编码
  - 格式规范（wav、mp3 等）

#### 6. 聊天历史
- **历史存储**：本地保存对话
- **历史面板**：查看和管理过去的对话
- **历史限制**：可配置的最大历史数量（1-1000）
- **收藏对话**：标记重要对话
- **删除历史**：删除单个或所有对话
- **新对话**：开始全新对话

#### 7. 参数配置
- **温度 (Temperature)**：控制响应随机性（0.0 - 2.0）
- **最大令牌数 (Max Tokens)**：限制响应长度
- **Top P**：核采样参数
- **频率惩罚 (Frequency Penalty)**：减少响应中的重复
- **存在惩罚 (Presence Penalty)**：鼓励新话题
- **参数面板**：轻松访问所有参数

#### 8. 消息操作
- **重新生成**：重新生成 AI 回复
- **复制文本**：复制消息内容到剪贴板
- **复制图片**：复制图片到剪贴板
- **图片缩放**：放大图片以便更好地查看
- **消息 ID**：每条消息的唯一标识符

#### 9. 用户界面
- **停靠集成**：集成到思源笔记停靠面板
- **响应式设计**：适应面板大小
- **空状态**：无对话时的友好提示
- **加载状态**：操作期间的视觉反馈
- **错误处理**：清晰的错误消息
- **工具提示**：控件的有用提示

#### 10. 设置
- **API 密钥管理**：安全的 API 密钥存储
- **供应商配置**：配置多个供应商
- **默认模型**：为新对话设置默认模型
- **历史管理**：配置历史限制
- **调试模式**：启用/禁用调试日志

### 高级功能

#### 流处理
- 实时响应流
- 逐块显示
- 正确处理不完整数据
- 支持流和非流响应

#### 错误处理
- 网络错误检测
- API 错误消息
- 用户友好的错误显示
- 自动重试机制（如适用）

#### 数据存储
- 本地配置存储
- 对话历史持久化
- 设置同步
- 数据迁移支持

#### 国际化
- 英语 (en_US)
- 简体中文 (zh_CN)
- 可扩展的 i18n 系统

---

## Technical Architecture

### Component Structure
- **Managers**: State management (ConfigManager, StateManager, etc.)
- **Handlers**: Event and action handlers (MessageSendHandler, etc.)
- **Components**: UI components (MessageRenderer, ModelDialog, etc.)
- **Builders**: UI construction (UIBuilder, PanelInitializer)
- **Utils**: Utility functions (ChatUtils, MarkdownRenderer, etc.)

### Data Flow
1. User input → EventManager
2. EventManager → Handlers
3. Handlers → API Providers
4. API Providers → Stream Processing
5. Stream → Message Rendering
6. Messages → Storage

### Storage Structure
- Configuration: API keys, default model, settings
- History: Conversation messages with metadata
- State: Current conversation state
