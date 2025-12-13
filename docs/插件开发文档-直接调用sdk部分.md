# 思源笔记插件示例 - 开发文档

## 项目概述

这是一个思源笔记（SiYuan）插件开发示例项目，展示了如何开发一个功能完整的插件。该插件演示了思源笔记插件系统的核心功能，包括UI组件集成、事件处理、数据存储、国际化等。

- **插件名称**: plugin-sample
- **版本**: 0.4.3
- **作者**: Vanessa
- **最低思源版本**: 3.4.2
- **支持平台**: 所有后端和前端环境

## 项目结构

```
plugin-sample/
├── src/                    # 源代码目录
│   ├── index.ts           # 主入口文件，包含插件核心逻辑
│   ├── index.scss         # 样式文件
│   └── i18n/              # 国际化文件
│       ├── zh_CN.json     # 简体中文
│       └── en_US.json     # 英文
├── dist/                  # 构建输出目录
├── plugin.json            # 插件配置文件
├── package.json           # Node.js 项目配置
├── webpack.config.js      # Webpack 构建配置
├── tsconfig.json          # TypeScript 配置
├── icon.png               # 插件图标（160x160）
├── preview.png            # 插件预览图（1024x768）
└── README*.md             # 说明文档
```

## 核心功能说明

### 1. 插件生命周期

插件继承自 `Plugin` 基类，实现了以下生命周期方法：

- **`onload()`**: 插件加载时调用，用于初始化插件功能
- **`onLayoutReady()`**: 布局准备就绪后调用，用于添加UI元素
- **`onunload()`**: 插件卸载时调用，用于清理资源
- **`uninstall()`**: 插件卸载时调用（永久删除）

### 2. UI组件集成

#### 2.1 顶栏图标（TopBar）
```typescript
this.addTopBar({
    icon: "iconFace",
    title: this.i18n.addTopBarIcon,
    position: "right",
    callback: () => { /* 点击事件 */ }
});
```

#### 2.2 状态栏（StatusBar）
```typescript
this.addStatusBar({
    element: statusIconElement
});
```

#### 2.3 自定义标签页（Tab）
```typescript
this.addTab({
    type: TAB_TYPE,
    init() { /* 初始化 */ },
    beforeDestroy() { /* 销毁前 */ },
    destroy() { /* 销毁 */ }
});
```

#### 2.4 停靠面板（Dock）
```typescript
this.addDock({
    config: {
        position: "LeftBottom",
        size: {width: 200, height: 0},
        icon: "iconSaving",
        title: "Custom Dock",
        hotkey: "⌥⌘W"
    },
    data: { text: "This is my custom dock" },
    type: DOCK_TYPE,
    init: (dock) => { /* 初始化 */ },
    resize() { /* 调整大小 */ },
    update() { /* 更新 */ },
    destroy() { /* 销毁 */ }
});
```

#### 2.5 设置面板（Setting）
```typescript
this.setting = new Setting({
    confirmCallback: () => { /* 确认回调 */ }
});
this.setting.addItem({
    title: "Readonly text",
    direction: "row",
    description: "Open plugin url in browser",
    createActionElement: () => { /* 创建元素 */ }
});
```

### 3. 命令系统

插件可以注册全局命令，支持快捷键绑定：

```typescript
this.addCommand({
    langKey: "showDialog",
    hotkey: "⇧⌘O",
    callback: () => { /* 命令回调 */ }
});

this.addCommand({
    langKey: "getTab",
    hotkey: "⇧⌘M",
    globalCallback: () => { /* 全局回调 */ }
});
```

### 4. Protyle编辑器集成

#### 4.1 工具栏扩展
```typescript
updateProtyleToolbar(toolbar: Array<string | IMenuItem>) {
    toolbar.push("|");
    toolbar.push({
        name: "insert-smail-emoji",
        icon: "iconEmoji",
        hotkey: "⇧⌘I",
        tipPosition: "n",
        tip: this.i18n.insertEmoji,
        click(protyle: Protyle) {
            protyle.insert("😊");
        }
    });
    return toolbar;
}
```

#### 4.2 斜杠命令（Slash）
```typescript
this.protyleSlash = [{
    filter: ["insert emoji 😊", "插入表情 😊", "crbqwx"],
    html: `<div class="b3-list-item__first">...</div>`,
    id: "insertEmoji",
    callback(protyle: Protyle) {
        protyle.insert("😊");
    }
}];
```

#### 4.3 编辑器选项
```typescript
this.protyleOptions = {
    toolbar: ["block-ref", "a", "|", "text", "strong", ...]
};
```

### 5. 事件总线（EventBus）

插件可以监听和触发系统事件：

```typescript
// 监听事件
this.eventBus.on("ws-main", this.eventBusLog);
this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
this.eventBus.on("paste", this.eventBusPaste);

// 取消监听
this.eventBus.off("ws-main", this.eventBusLog);
```

支持的事件类型包括：
- `ws-main`: WebSocket 主事件
- `click-blockicon`: 点击块图标
- `paste`: 粘贴事件
- `click-pdf`: 点击PDF
- `click-editorcontent`: 点击编辑器内容
- `switch-protyle`: 切换编辑器
- `destroy-protyle`: 销毁编辑器
- `open-menu-*`: 各种菜单打开事件
- `opened-notebook`: 打开笔记本
- `closed-notebook`: 关闭笔记本
- 等等...

### 6. 数据存储

插件可以使用内置的数据存储功能：

```typescript
// 保存数据
this.saveData(STORAGE_NAME, {readonlyText: textareaElement.value});

// 加载数据
this.loadData(STORAGE_NAME);

// 删除数据
this.removeData(STORAGE_NAME).then(() => {
    this.data[STORAGE_NAME] = {readonlyText: "Readonly"};
});
```

### 7. 对话框（Dialog）

```typescript
const dialog = new Dialog({
    title: `SiYuan ${Constants.SIYUAN_VERSION}`,
    content: `<div class="b3-dialog__content">...</div>`,
    width: this.isMobile ? "92vw" : "560px",
    height: "540px"
});
```

### 8. 菜单（Menu）

```typescript
const menu = new Menu("topBarSample", () => {
    console.log(this.i18n.byeMenu);
});
menu.addItem({
    icon: "iconSettings",
    label: "Open Setting",
    click: () => { /* 点击事件 */ }
});
menu.addSeparator();
menu.addItem({
    icon: "iconSparkles",
    label: this.data[STORAGE_NAME].readonlyText,
    type: "readonly"
});
```

### 9. 卡片系统

插件可以修改卡片显示：

```typescript
async updateCards(options: ICardData) {
    options.cards.sort((a: ICard, b: ICard) => {
        if (a.blockID < b.blockID) return -1;
        if (a.blockID > b.blockID) return 1;
        return 0;
    });
    return options;
}
```

### 10. 图标系统

插件可以添加自定义SVG图标：

```typescript
this.addIcons(`<symbol id="iconFace" viewBox="0 0 32 32">
    <path d="..."></path>
</symbol>`);
```

### 11. 平台检测

```typescript
const frontEnd = getFrontend();
this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

// 检测华为平台
platformUtils.isHuawei()
```

### 12. 常用API示例

#### 打开标签页
```typescript
// 自定义标签页
openTab({
    app: this.app,
    custom: {
        icon: "iconFace",
        title: "Custom Tab",
        data: { text: "..." },
        id: this.name + TAB_TYPE
    }
});

// 文档标签页
openTab({
    app: this.app,
    doc: { id: blockID }
});

// 搜索标签页
openTab({
    app: this.app,
    search: { k: "SiYuan" }
});

// 卡片标签页
openTab({
    app: this.app,
    card: { type: "all" }
});
```

#### 打开窗口
```typescript
openWindow({
    doc: {id: blockID}
});
```

#### 打开设置
```typescript
openSetting(this.app);
```

#### 打开属性面板
```typescript
openAttributePanel({
    nodeElement: element,
    protyle: protyle,
    focusName: "custom"
});
```

#### 获取编辑器
```typescript
const editors = getAllEditor();
const editor = editors[0];
```

#### 后端API调用
```typescript
fetchPost("/api/system/currentTime", {}, (response) => {
    console.log(response.data);
});
```

## 国际化（i18n）

插件支持多语言，通过 `src/i18n/` 目录下的JSON文件配置：

- `zh_CN.json`: 简体中文
- `en_US.json`: 英文

在代码中使用：
```typescript
this.i18n.helloPlugin
this.i18n.byePlugin
this.i18n.insertEmoji
```

## 开发配置

### 依赖管理

主要开发依赖：
- `siyuan`: 思源笔记API（1.1.6）
- `typescript`: TypeScript编译器（4.8.4）
- `webpack`: 构建工具（5.76.0）
- `esbuild-loader`: 快速构建（3.0.1）
- `sass`: CSS预处理器（1.62.1）

### 构建脚本

```json
{
  "scripts": {
    "lint": "eslint . --fix --cache",
    "dev": "webpack --mode development",
    "build": "webpack --mode production"
  }
}
```

- `pnpm run dev`: 开发模式，实时编译
- `pnpm run build`: 生产模式，生成 package.zip
- `pnpm run lint`: 代码检查和修复

### Webpack配置要点

1. **入口文件**: `src/index.ts`
2. **输出**: CommonJS格式，输出到项目根目录
3. **外部依赖**: `siyuan` 作为外部依赖，不打包
4. **样式处理**: SCSS → CSS，使用 MiniCssExtractPlugin 提取
5. **生产构建**: 
   - 复制资源文件到 `dist/`
   - 生成 `package.zip` 压缩包

### TypeScript配置

```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "module": "commonjs",
    "target": "es6"
  }
}
```

## 插件配置（plugin.json）

关键配置项说明：

- **name**: 插件包名，必须与GitHub仓库名一致
- **version**: 版本号，遵循 semver 规范
- **minAppVersion**: 最低支持的思源版本
- **backends**: 支持的后端环境（windows/linux/darwin/ios/android/harmony/docker/all）
- **frontends**: 支持的前端环境（desktop/mobile/browser-desktop/browser-mobile/desktop-window/all）
- **displayName**: 插件显示名称（多语言）
- **description**: 插件描述（多语言）
- **readme**: README文件名（多语言）

## 打包和发布

### 打包流程

1. 执行 `pnpm run build` 生成 `package.zip`
2. 压缩包包含以下文件：
   - `i18n/*` - 国际化文件
   - `icon.png` - 插件图标
   - `index.css` - 样式文件
   - `index.js` - 主代码文件
   - `plugin.json` - 插件配置
   - `preview.png` - 预览图
   - `README*.md` - 说明文档

### 发布流程

1. 在GitHub创建新的Release，使用版本号作为Tag
2. 上传 `package.zip` 作为附件
3. 提交发布
4. 首次发布需要向 [Community Bazaar](https://github.com/siyuan-note/bazaar) 提交PR

## 开发注意事项

### 1. 文件读写规范

**重要**: 插件如果需要读写 `data` 目录下的文件，必须通过内核API实现，不要直接使用 `fs` 或其他 Node.js API，否则可能导致数据同步问题。

使用相关API：`/api/file/*`（如 `/api/file/getFile`）

### 2. Daily Note 属性规范

创建日记时，思源会自动添加 `custom-dailynote-yyyymmdd` 属性。如果手动创建日记文档，需要手动添加该属性。

### 3. 移动端适配

插件需要检测运行环境，针对移动端和桌面端提供不同的UI：

```typescript
const frontEnd = getFrontend();
this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
```

### 4. 事件处理

- 使用 `preventDefault()` 时需要调用 `resolve()`，否则程序可能卡死
- 事件监听器需要正确绑定 `this` 上下文
- 卸载插件时需要移除所有事件监听器

### 5. 数据变更监听

如果需要在数据变更时执行操作，可以实现 `onDataChanged()` 方法。如果注释掉该方法，数据变更时会自动禁用并重新启用插件。

## 总结

该示例插件全面展示了思源笔记插件系统的核心功能：

1. ✅ 完整的生命周期管理
2. ✅ 丰富的UI组件集成（顶栏、状态栏、标签页、停靠面板、设置面板）
3. ✅ 命令系统和快捷键支持
4. ✅ Protyle编辑器深度集成
5. ✅ 事件总线系统
6. ✅ 数据存储功能
7. ✅ 对话框和菜单系统
8. ✅ 国际化支持
9. ✅ 平台检测和适配
10. ✅ 完整的构建和打包流程

开发者可以参考此示例，快速上手思源笔记插件开发。

