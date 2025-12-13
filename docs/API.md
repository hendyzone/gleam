# Gleam 插件 API 文档

## 内部 API

### DataStorage

数据存储管理类。

#### 方法

##### `getData(): Promise<PluginData>`

获取所有插件数据（配置和历史记录）。

**返回**：`Promise<PluginData>`

##### `saveData(data: PluginData): Promise<void>`

保存所有插件数据。

**参数**：
- `data: PluginData` - 要保存的数据

##### `getConfig(): Promise<PluginConfig>`

获取配置。

**返回**：`Promise<PluginConfig>`

##### `saveConfig(config: PluginConfig): Promise<void>`

保存配置。

**参数**：
- `config: PluginConfig` - 要保存的配置

##### `getHistory(): Promise<ChatHistory[]>`

获取历史记录列表。

**返回**：`Promise<ChatHistory[]>`

##### `addHistoryItem(item: ChatHistory): Promise<void>`

添加历史记录项。

**参数**：
- `item: ChatHistory` - 历史记录项

##### `deleteHistoryItem(id: string): Promise<void>`

删除历史记录项。

**参数**：
- `id: string` - 历史记录 ID

##### `clearHistory(): Promise<void>`

清空所有历史记录。

### ContextInjector

上下文注入器类。

#### 方法

##### `getCurrentDocumentContent(): Promise<string>`

获取当前文档内容。

**返回**：`Promise<string>` - 文档文本内容

##### `buildContextPrompt(documentContent: string): string`

构建上下文提示词。

**参数**：
- `documentContent: string` - 文档内容

**返回**：`string` - 格式化后的提示词

### AIProvider

AI 提供者接口。

#### 方法

##### `chat(options: AIRequestOptions & { apiKey?: string }, onChunk?: (chunk: string) => void): Promise<AIResponse>`

发送聊天请求。

**参数**：
- `options: AIRequestOptions & { apiKey?: string }` - 请求选项
  - `messages: ChatMessage[]` - 消息列表
  - `model: string` - 模型名称
  - `stream?: boolean` - 是否流式响应
  - `temperature?: number` - 温度参数
  - `maxTokens?: number` - 最大 token 数
  - `apiKey?: string` - API 密钥
- `onChunk?: (chunk: string) => void` - 流式响应回调

**返回**：`Promise<AIResponse>`

##### `getModels(apiKey: string): Promise<string[]>`

获取可用模型列表。

**参数**：
- `apiKey: string` - API 密钥

**返回**：`Promise<string[]>` - 模型名称列表

### OpenRouterProvider

OpenRouter API 提供者实现。

继承自 `BaseAIProvider`，实现 OpenRouter 特定的 API 调用。

**Base URL**: `https://openrouter.ai/api/v1`

**端点**：
- `/chat/completions` - 聊天完成
- `/models` - 获取模型列表

### SiliconFlowProvider

SiliconFlow API 提供者实现。

继承自 `BaseAIProvider`，实现 SiliconFlow 特定的 API 调用。

**Base URL**: `https://api.siliconflow.cn/v1`

**端点**：
- `/chat/completions` - 聊天完成
- `/models` - 获取模型列表

## 外部 API（思源笔记）

### loadData / saveData

思源笔记提供的插件数据存储 API。

```typescript
// 加载数据
const data = await plugin.loadData('data.json');

// 保存数据
await plugin.saveData('data.json', data);
```

### addDock

思源笔记提供的侧边栏面板 API。

```typescript
plugin.addDock({
  config: {
    position: 'RightBottom',
    size: { width: 300, height: 0 },
    icon: 'iconSparkles',
    title: 'Gleam'
  },
  data: [{ text: '' }],
  type: 'dock',
  init() {
    // 初始化逻辑
  },
  destroy() {
    // 清理逻辑
  }
});
```

### /api/block/getBlockInfo

获取块信息 API（用于上下文注入）。

```typescript
const response = await fetch('/api/block/getBlockInfo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: blockId })
});
```

## 类型定义

### PluginData

```typescript
interface PluginData {
  config: PluginConfig;
  history: ChatHistory[];
}
```

### PluginConfig

```typescript
interface PluginConfig {
  openrouter: ProviderConfig;
  siliconflow: ProviderConfig;
  currentProvider: 'openrouter' | 'siliconflow';
  currentModel: string;
  enableContext: boolean;
}
```

### ProviderConfig

```typescript
interface ProviderConfig {
  apiKey: string;
  baseURL: string;
}
```

### ChatMessage

```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

### ChatHistory

```typescript
interface ChatHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}
```

### AIRequestOptions

```typescript
interface AIRequestOptions {
  messages: ChatMessage[];
  model: string;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}
```

### AIResponse

```typescript
interface AIResponse {
  content: string;
  done: boolean;
}
```

## 错误处理

### 错误类型

1. **NetworkError**: 网络连接错误
2. **APIError**: API 返回的错误
3. **ConfigError**: 配置错误（如缺少 API 密钥）
4. **ValidationError**: 数据验证错误

### 错误处理示例

```typescript
try {
  const response = await provider.chat(options, onChunk);
} catch (error) {
  if (error instanceof NetworkError) {
    showError(i18n.networkError);
  } else if (error instanceof APIError) {
    showError(error.message || i18n.apiError);
  } else {
    showError(i18n.unknownError);
  }
}
```

## 使用示例

### 发送消息

```typescript
const config = await storage.getConfig();
const provider = providers.get(config.currentProvider);

const messages = [
  { role: 'user', content: 'Hello!' }
];

let fullContent = '';
await provider.chat(
  {
    messages,
    model: config.currentModel,
    stream: true,
    apiKey: config.openrouter.apiKey
  },
  (chunk) => {
    fullContent += chunk;
    updateUI(fullContent);
  }
);
```

### 获取模型列表

```typescript
const provider = new OpenRouterProvider();
const models = await provider.getModels(apiKey);
console.log(models); // ['openai/gpt-4', 'openai/gpt-3.5-turbo', ...]
```

### 保存配置

```typescript
const storage = new DataStorage(plugin);
const config = await storage.getConfig();
config.openrouter.apiKey = 'sk-...';
await storage.saveConfig(config);
```

