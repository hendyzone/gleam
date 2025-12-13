# Gleam 插件设计文档

## 1. 项目概述

### 1.1 项目简介

Gleam 是一个思源笔记插件，提供在侧边栏与 AI 模型对话的功能。支持多个 AI 供应商（OpenRouter、SiliconFlow），具备对话历史管理、上下文注入、模型选择等特性。

### 1.2 核心功能

- **多供应商支持**：支持 OpenRouter 和 SiliconFlow 两个 AI 供应商
- **流式响应**：实时显示 AI 回复内容
- **对话历史**：保存、查看、加载历史对话记录
- **上下文注入**：将当前文档内容作为上下文注入到 AI 请求中
- **模型选择**：支持从 API 获取模型列表并选择
- **API 密钥管理**：每个供应商独立配置 API 密钥
- **国际化支持**：支持中英文界面

### 1.3 技术栈

- **语言**：TypeScript
- **构建工具**：Webpack
- **样式**：CSS（使用思源笔记 CSS 变量）
- **打包工具**：archiver (Node.js)

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────┐
│          思源笔记主程序                    │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────▼──────────┐
        │   Plugin (index.ts) │
        │   - 生命周期管理      │
        │   - 侧边栏面板初始化   │
        └─────────┬───────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────────┐          ┌──────▼───────┐
│ ChatPanel  │          │SettingsPanel│
│ - UI渲染    │          │ - 配置管理    │
│ - 事件处理  │          │ - API密钥     │
└───┬────────┘          └──────────────┘
    │
    ├──────────┬──────────┬──────────┐
    │          │          │          │
┌───▼──┐  ┌───▼──┐  ┌───▼──┐  ┌───▼────┐
│Storage│  │Context│  │OpenRouter│  │SiliconFlow│
│       │  │Injector│  │Provider  │  │Provider   │
└───────┘  └───────┘  └──────────┘  └───────────┘
```

### 2.2 模块划分

#### 2.2.1 核心模块

- **`src/index.ts`**：插件主入口，负责生命周期管理和侧边栏面板初始化
- **`src/ui/chatPanel.ts`**：对话面板 UI 组件，处理用户交互和消息显示
- **`src/ui/settingsPanel.ts`**：设置面板 UI 组件，处理配置管理

#### 2.2.2 API 模块

- **`src/api/base.ts`**：AI 提供者基础接口和抽象类
- **`src/api/openrouter.ts`**：OpenRouter API 实现
- **`src/api/siliconflow.ts`**：SiliconFlow API 实现

#### 2.2.3 数据模块

- **`src/storage/data.ts`**：数据持久化管理，使用思源笔记 API 存储配置和历史

#### 2.2.4 工具模块

- **`src/utils/types.ts`**：TypeScript 类型定义
- **`src/utils/context.ts`**：上下文注入功能实现

## 3. 数据流设计

### 3.1 对话流程

```
用户输入
  │
  ▼
ChatPanel.handleSend()
  │
  ├─► 获取配置 (Storage.getConfig())
  │
  ├─► 上下文注入? (ContextInjector.getCurrentDocumentContent())
  │
  ├─► 构建消息列表
  │
  ├─► 调用 AI Provider
  │   │
  │   ├─► OpenRouterProvider.chat()
  │   │   └─► 流式响应处理
  │   │
  │   └─► SiliconFlowProvider.chat()
  │       └─► 流式响应处理
  │
  ├─► 实时更新 UI (onChunk 回调)
  │
  └─► 保存对话历史 (Storage.addHistoryItem())
```

### 3.2 配置管理流程

```
用户打开设置
  │
  ▼
SettingsPanel.show()
  │
  ├─► 加载配置 (Storage.getConfig())
  │
  ├─► 显示配置表单
  │
  ├─► 用户修改配置
  │
  └─► 保存配置 (Storage.saveConfig())
      │
      └─► 刷新模型列表 (ChatPanel.loadModels())
```

### 3.3 数据存储结构

```typescript
interface PluginData {
  config: {
    openrouter: {
      apiKey: string;
      baseURL: string;  // 'https://openrouter.ai/api/v1'
    };
    siliconflow: {
      apiKey: string;
      baseURL: string;  // 'https://api.siliconflow.cn/v1'
    };
    currentProvider: 'openrouter' | 'siliconflow';
    currentModel: string;
    enableContext: boolean;
  };
  history: Array<{
    id: string;              // 'chat-{timestamp}'
    title: string;           // 第一条消息的前50个字符
    messages: ChatMessage[]; // 对话消息列表
    timestamp: number;        // 时间戳
  }>;
}
```

## 4. API 设计

### 4.1 AI Provider 接口

```typescript
interface AIProvider {
  name: Provider;
  chat(
    options: AIRequestOptions & { apiKey?: string },
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse>;
  getModels(apiKey: string): Promise<string[]>;
}
```

### 4.2 统一请求格式

```typescript
interface AIRequestOptions {
  messages: ChatMessage[];
  model: string;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}
```

### 4.3 流式响应处理

两个供应商都使用 Server-Sent Events (SSE) 格式：

```
data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":" World"}}]}

data: [DONE]
```

## 5. UI/UX 设计

### 5.1 对话面板布局

```
┌─────────────────────────────────┐
│ [Provider] [Model] [Context] [H] [⚙] │  Header
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐    │
│  │ User Message           │    │  Messages
│  └─────────────────────────┘    │  Area
│  ┌─────────────────────────┐    │
│  │ Assistant Response      │    │
│  └─────────────────────────┘    │
│                                 │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Input textarea              │ │  Input
│ └─────────────────────────────┘ │  Area
│ [Send Button]                   │
└─────────────────────────────────┘
```

### 5.2 设置面板

- 模态对话框形式
- 包含两个供应商的 API 密钥输入
- 保存/取消按钮

### 5.3 历史记录面板

- 可折叠面板
- 显示历史对话标题和时间
- 点击加载历史对话

### 5.4 样式规范

- 使用思源笔记 CSS 变量（`--b3-*`）
- 使用思源笔记工具类（`fn__*`, `ft__*`）
- 响应式设计，适配不同窗口大小
- 保持与思源笔记整体风格一致

## 6. 关键技术实现

### 6.1 流式响应处理

```typescript
// 读取 SSE 流
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(line => line.trim() !== '');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') return;
      
      const parsed = JSON.parse(data);
      const content = parsed.choices?.[0]?.delta?.content || '';
      onChunk?.(content);  // 实时更新 UI
    }
  }
}
```

### 6.2 上下文注入

```typescript
// 获取当前文档内容
const response = await fetch('/api/block/getBlockInfo', {
  method: 'POST',
  body: JSON.stringify({ id: currentBlockId })
});

// 构建上下文提示词
const contextPrompt = `以下是当前文档的内容，请作为上下文参考：

${documentContent}

请基于以上内容回答用户的问题。`;

// 添加到消息列表
messages = [
  { role: 'system', content: contextPrompt },
  ...userMessages
];
```

### 6.3 数据持久化

使用思源笔记提供的 `loadData` 和 `saveData` API：

```typescript
// 加载数据
const data = await this.plugin.loadData('data.json');

// 保存数据
await this.plugin.saveData('data.json', data);
```

### 6.4 侧边栏面板创建

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
    this.element.appendChild(dockElement);
  }
});
```

## 7. 错误处理

### 7.1 网络错误

- 捕获 fetch 异常
- 显示用户友好的错误消息
- 支持重试机制（可选）

### 7.2 API 错误

- 解析 API 返回的错误信息
- 区分不同类型的错误（认证失败、限流、模型不存在等）
- 提供相应的错误提示

### 7.3 数据错误

- 验证配置数据的完整性
- 处理缺失或损坏的历史记录
- 提供默认值

## 8. 性能优化

### 8.1 流式响应

- 使用流式响应减少等待时间
- 实时更新 UI，提升用户体验

### 8.2 历史记录

- 限制历史记录数量（避免存储过大）
- 延迟加载历史记录列表

### 8.3 模型列表

- 缓存模型列表，避免频繁请求
- 仅在切换供应商时重新加载

## 9. 安全考虑

### 9.1 API 密钥存储

- 使用思源笔记提供的安全存储 API
- 不在代码中硬编码密钥
- 密钥输入使用 password 类型

### 9.2 数据验证

- 验证用户输入的 API 密钥格式
- 验证模型名称的有效性
- 防止 XSS 攻击（转义用户输入）

## 10. 扩展性设计

### 10.1 添加新供应商

1. 创建新的 Provider 类，继承 `BaseAIProvider`
2. 实现 `chat` 和 `getModels` 方法
3. 在 `ChatPanel` 中注册新供应商
4. 更新配置类型定义

### 10.2 添加新功能

- 模块化设计便于扩展
- 清晰的接口定义
- 松耦合的组件设计

## 11. 开发规范

### 11.1 代码风格

- 使用 TypeScript 严格模式
- 遵循 ESLint 规范
- 使用有意义的变量和函数名
- 添加必要的注释

### 11.2 文件组织

```
src/
├── index.ts           # 主入口
├── index.css          # 样式文件
├── api/               # API 模块
│   ├── base.ts
│   ├── openrouter.ts
│   └── siliconflow.ts
├── ui/                # UI 组件
│   ├── chatPanel.ts
│   └── settingsPanel.ts
├── storage/           # 数据存储
│   └── data.ts
├── utils/             # 工具函数
│   ├── types.ts
│   └── context.ts
└── i18n/              # 国际化
    ├── zh_CN.json
    └── en_US.json
```

### 11.3 提交规范

- 清晰的提交信息
- 功能完整后再提交
- 确保代码通过编译和 lint 检查

## 12. 测试策略

### 12.1 单元测试（未来）

- API 提供者测试
- 数据存储测试
- 工具函数测试

### 12.2 集成测试（未来）

- 端到端对话流程测试
- 配置管理测试
- 历史记录功能测试

### 12.3 手动测试

- 在不同思源笔记版本中测试
- 测试不同供应商的 API
- 测试各种边界情况

## 13. 部署流程

### 13.1 开发环境

```bash
npm install
npm run dev  # 监听模式，自动重新编译
```

### 13.2 生产构建

```bash
npm run build      # 编译 TypeScript 和 CSS
npm run package   # 生成 package.zip
```

### 13.3 发布流程

1. 更新 `plugin.json` 中的版本号
2. 运行 `npm run package` 生成 package.zip
3. 在 GitHub 创建 Release，上传 package.zip
4. 如果是首次发布，需要 PR 到社区集市仓库

## 14. 已知限制

1. 依赖思源笔记的 API，版本更新可能需要适配
2. 流式响应需要浏览器支持 ReadableStream
3. 上下文注入依赖于当前文档的可用性
4. 模型列表获取失败时使用默认列表

## 15. 未来改进

1. 支持更多 AI 供应商
2. 支持自定义提示词模板
3. 支持对话导出功能
4. 支持快捷键操作
5. 支持语音输入（如果浏览器支持）
6. 添加单元测试和集成测试
7. 优化移动端体验

