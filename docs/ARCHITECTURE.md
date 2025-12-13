# Gleam 插件架构文档

## 架构概览

Gleam 插件采用模块化、分层架构设计，确保代码的可维护性和可扩展性。

## 分层架构

```
┌─────────────────────────────────────┐
│          Presentation Layer          │  UI 层
│  (ChatPanel, SettingsPanel)         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Application Layer             │  应用层
│  (Business Logic, Event Handling)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│          Service Layer                │  服务层
│  (API Providers, Storage, Context)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│          Data Layer                   │  数据层
│  (Plugin Data, Configuration)        │
└──────────────────────────────────────┘
```

## 核心组件

### 1. Plugin (index.ts)

**职责**：
- 插件生命周期管理（onload, onunload）
- 侧边栏面板初始化
- 组件协调

**关键方法**：
- `onload()`: 插件加载时调用
- `onunload()`: 插件卸载时调用
- `addDock()`: 创建侧边栏面板

### 2. ChatPanel (ui/chatPanel.ts)

**职责**：
- 对话界面渲染
- 用户输入处理
- 消息显示和管理
- 历史记录管理
- 供应商和模型选择

**关键方法**：
- `handleSend()`: 处理用户发送消息
- `addMessage()`: 添加消息到界面
- `loadModels()`: 加载模型列表
- `loadChatFromHistory()`: 从历史记录加载对话

**状态管理**：
- `currentMessages`: 当前对话消息列表
- `isLoading`: 是否正在加载

### 3. SettingsPanel (ui/settingsPanel.ts)

**职责**：
- 设置界面渲染
- API 密钥配置
- 配置保存和加载

**关键方法**：
- `show()`: 显示设置面板
- `hide()`: 隐藏设置面板
- `saveSettings()`: 保存设置
- `loadSettings()`: 加载设置

### 4. DataStorage (storage/data.ts)

**职责**：
- 配置数据持久化
- 历史记录管理
- 数据序列化/反序列化

**关键方法**：
- `getData()`: 获取所有数据
- `saveData()`: 保存所有数据
- `getConfig()`: 获取配置
- `saveConfig()`: 保存配置
- `getHistory()`: 获取历史记录
- `addHistoryItem()`: 添加历史记录项
- `deleteHistoryItem()`: 删除历史记录项

### 5. AI Providers (api/)

**职责**：
- 与 AI 服务 API 通信
- 流式响应处理
- 错误处理

**接口设计**：
```typescript
interface AIProvider {
  name: Provider;
  chat(options, onChunk?): Promise<AIResponse>;
  getModels(apiKey): Promise<string[]>;
}
```

**实现类**：
- `OpenRouterProvider`: OpenRouter API 实现
- `SiliconFlowProvider`: SiliconFlow API 实现

### 6. ContextInjector (utils/context.ts)

**职责**：
- 获取当前文档内容
- 构建上下文提示词
- 文档内容提取

**关键方法**：
- `getCurrentDocumentContent()`: 获取当前文档内容
- `buildContextPrompt()`: 构建上下文提示词

## 数据流

### 发送消息流程

```
User Input
    │
    ▼
ChatPanel.handleSend()
    │
    ├─► Validate Input
    │
    ├─► Storage.getConfig()
    │   └─► Load API keys, model, provider
    │
    ├─► ContextInjector.getCurrentDocumentContent()
    │   └─► Fetch current document via SiYuan API
    │
    ├─► Build Messages Array
    │   ├─► Add system message (if context enabled)
    │   └─► Add user message
    │
    ├─► Get AI Provider
    │   └─► providers.get(currentProvider)
    │
    ├─► Provider.chat()
    │   ├─► Build API Request
    │   ├─► Send HTTP Request
    │   ├─► Stream Response
    │   │   └─► onChunk callback → Update UI
    │   └─► Return Full Response
    │
    ├─► Update currentMessages
    │
    └─► Storage.addHistoryItem()
        └─► Save to persistent storage
```

### 加载配置流程

```
SettingsPanel.show()
    │
    ├─► Storage.getConfig()
    │   └─► Load from persistent storage
    │
    ├─► Populate Form Fields
    │
    └─► User Modifies Settings
        │
        └─► SettingsPanel.saveSettings()
            ├─► Get Form Values
            ├─► Update Config Object
            └─► Storage.saveConfig()
                └─► Save to persistent storage
```

## 模块依赖关系

```
index.ts
  ├─► ChatPanel
  │   ├─► DataStorage
  │   ├─► ContextInjector
  │   ├─► OpenRouterProvider
  │   └─► SiliconFlowProvider
  │
  └─► SettingsPanel
      └─► DataStorage

DataStorage
  └─► Plugin (for loadData/saveData)

OpenRouterProvider / SiliconFlowProvider
  └─► BaseAIProvider
```

## 设计模式

### 1. 策略模式 (Strategy Pattern)

用于 AI Provider 的实现：

```typescript
// 策略接口
interface AIProvider {
  chat(options, onChunk?): Promise<AIResponse>;
}

// 具体策略
class OpenRouterProvider implements AIProvider { ... }
class SiliconFlowProvider implements AIProvider { ... }

// 上下文
class ChatPanel {
  private providers: Map<string, AIProvider>;
  
  // 动态选择策略
  getProvider(name: string): AIProvider {
    return this.providers.get(name);
  }
}
```

### 2. 观察者模式 (Observer Pattern)

用于流式响应更新：

```typescript
// 订阅者（UI）
const onChunk = (chunk: string) => {
  contentElement.textContent += chunk;
  scrollToBottom();
};

// 发布者（Provider）
await provider.chat(options, onChunk);
```

### 3. 单例模式 (Singleton Pattern)

用于全局访问：

```typescript
// 全局访问点
(window as any).gleamChatPanel = this.chatPanel;
(window as any).gleamSettingsPanel = this.settingsPanel;
```

## 错误处理策略

### 分层错误处理

1. **API 层**：捕获网络和 API 错误
2. **服务层**：转换错误为业务错误
3. **UI 层**：显示用户友好的错误消息

### 错误类型

```typescript
// 网络错误
catch (error: NetworkError) {
  showError(i18n.networkError);
}

// API 错误
catch (error: APIError) {
  showError(error.message || i18n.apiError);
}

// 配置错误
if (!apiKey) {
  showError(i18n.apiKeyRequired);
}
```

## 性能优化策略

### 1. 延迟加载

- 历史记录列表延迟加载
- 模型列表按需加载

### 2. 缓存

- 模型列表缓存（切换供应商时重新加载）
- 配置数据缓存

### 3. 流式处理

- 使用流式响应减少等待时间
- 实时更新 UI

## 扩展点

### 添加新供应商

1. 创建新的 Provider 类
2. 实现 `AIProvider` 接口
3. 在 `ChatPanel` 中注册
4. 更新类型定义

### 添加新功能

1. 创建新的模块/组件
2. 遵循现有架构模式
3. 更新相关接口

## 技术决策

### 为什么使用 TypeScript？

- 类型安全
- 更好的 IDE 支持
- 便于维护

### 为什么模块化设计？

- 代码复用
- 易于测试
- 便于扩展

### 为什么使用流式响应？

- 提升用户体验
- 减少等待时间
- 实时反馈

