# SeeWeb UI 重构设计文档

## 概述

本文档详细描述了 SeeWeb 工具的 UI 重构方案，包括：
- 项目结构的重新组织
- 主控制台与二级窗口的分离设计
- 动画效果的实现方案
- UI 组件的设计规范

---

## 一、项目结构重构

### 1.1 目录结构

```
.seeweb/
├── console/                    # 主控制台目录
│   ├── ConsoleLayoutManager.js # 主控制台布局管理器
│   ├── ChosePanel.js           # 选择面板（现有文件，移动至此）
│   └── console.css             # 主控制台样式
├── secondary/                  # 二级窗口目录
│   ├── SecondaryWindow.js      # 二级窗口管理器
│   ├── ViewportController.js   # 视口控制器
│   ├── ThemeEditor.js          # 主题编辑器（预留）
│   └── secondary.css           # 二级窗口样式
├── shared/                     # 共享组件
│   ├── ProxyFactory.js         # 代理工厂（现有 lib/proxy/proxy-factory.js）
│   ├── Animations.js           # 动画库
│   ├── components/             # 通用组件
│   │   ├── Button.js
│   │   ├── Input.js
│   │   └── Panel.js
│   └── shared.css              # 共享样式
├── core/                       # 核心功能（保持现有）
│   ├── choseDiv.js
│   ├── choseRect.js
│   ├── choseList.js
│   ├── choseManager.js
│   └── source-extractor.js
├── init.js                     # 入口文件（重构）
└── seeweb.css                  # 主样式文件（整合）
```

### 1.2 文件职责说明

| 模块 | 职责 |
|------|------|
| `console/ConsoleLayoutManager.js` | 管理主控制台的显示、隐藏、大小调整 |
| `secondary/SecondaryWindow.js` | 管理二级窗口的切换、显示、与主控制台的交互 |
| `shared/Animations.js` | 提供统一的动画 API，包括淡入淡出、滑动、缩放等 |
| `shared/components/` | 可复用的 UI 组件库 |

---

## 二、主控制台 UI 设计

### 2.1 主控制台布局结构

```
┌──────────────────────────────────────────────────┐
│  🎨 SeeWeb Pro              [📱] [➖]            │ ← 工具栏
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────┐      │
│  │ ✨ 创建      🔍 选择                │      │ ← 标签页
│  └──────────────────────────────────────┘      │
│                                                  │
│  [选择模式区块]                                  │
│  ◉ 单选    ▢ 扩选                               │
│                                                  │
│  [操作区块]                                      │
│  ↺ 撤销    ✕ 清除                               │
│                                                  │
│  [提示词区块]                                    │
│  ┌──────────────────────────────────────┐      │
│  │ 输入对选中元素的修改提示...          │      │
│  └──────────────────────────────────────┘      │
│  [🚀 发送提示词]                                │
│                                                  │
│  [已选中元素区块]                                │
│  ┌──────────────────────────────────────┐      │
│  │ <div#container.class>          [×] │      │
│  │ <span.text>                  [×] │      │
│  └──────────────────────────────────────┘      │
│                                                  │
└──────────────────────────────────────────────────┘
       ↑ 拖拽调整宽度
```

### 2.2 主控制台状态设计

#### 状态 1：完整显示
- 宽度：280px ~ 600px（可拖拽调整）
- 显示所有功能区块
- 左侧网页被压缩

#### 状态 2：最小化
- 主控制台隐藏
- 右下角显示浮动按钮（🎨）
- 浮动按钮可拖拽移动

#### 状态 3：选择模式隐藏
- 主控制台隐藏
- 不显示浮动按钮
- 用于全屏选择元素

---

## 三、二级窗口 UI 设计

### 3.1 二级窗口整体设计理念

二级窗口采用**全屏覆盖**设计，直接替换主控制台的位置，提供沉浸式体验。

```
┌──────────────────────────────────────────────────┐
│  [← 返回]  视口调整器                  [×]      │ ← 头部导航
├──────────────────────────────────────────────────┤
│                                                  │
│  选择预设设备尺寸，或手动输入宽度                 │
│                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │ ↔️  │ │ 📱  │ │ 📱  │ │ 💻  │           │
│  │ 自动 │ │ 手机 │ │ 平板 │ │ 小屏 │   ...     │ ← 预设按钮
│  └──────┘ └──────┘ └──────┘ └──────┘           │
│                                                  │
│  ┌──────────────────────────┐ ┌────────┐       │
│  │ 输入宽度 (px)            │ │ 应用    │       │ ← 自定义输入
│  └──────────────────────────┘ └────────┘       │
│                                                  │
│  当前宽度: 375px                                 │
│                                                  │
│  [实时预览区域 - 显示网页缩放效果]               │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 3.2 二级窗口类型（可扩展）

| 窗口类型 | 入口 | 功能描述 |
|----------|------|----------|
| 视口调整器 | 主控制台 [📱] 按钮 | 调整模拟设备尺寸，触发媒体查询 |
| 主题编辑器 | 预留 | 自定义 SeeWeb 主题颜色 |
| 设置面板 | 预留 | 全局设置、快捷键配置 |

---

## 四、动画设计方案

### 4.1 动画统一规范

所有动画使用 `cubic-bezier(0.4, 0, 0.2, 1)` 缓动函数，时长统一为 **300ms**（除非特殊说明）。

### 4.2 动画列表

#### 1. 主控制台滑入/滑出

```css
/* 滑出（隐藏） */
.seeweb-panel-slide-out {
    animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

/* 滑入（显示） */
.seeweb-panel-slide-in {
    animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
```

#### 2. 浮动按钮淡入/缩放

```css
.seeweb-floating-btn-show {
    animation: floatingBtnIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes floatingBtnIn {
    0% {
        opacity: 0;
        transform: scale(0.3) translate(0, -200px);
    }
    60% {
        transform: scale(1.1) translate(0, 0);
    }
    100% {
        opacity: 1;
        transform: scale(1);
    }
}
```

#### 3. 二级窗口淡入/模态显示

```css
.seeweb-secondary-fade-in {
    animation: fadeIn 0.25s ease-out forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

/* 内容缩放进入 */
.seeweb-secondary-content-in {
    animation: contentScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes contentScaleIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
```

#### 4. 按钮点击反馈

```css
.seeweb-btn-click {
    animation: btnClick 0.15s ease-out;
}

@keyframes btnClick {
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
}
```

#### 5. 视口变换动画

```css
/* 网页缩放动画 */
.seeweb-viewport-scale {
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                margin 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 4.3 动画 JavaScript API (shared/Animations.js)

```javascript
class Animations {
    /**
     * 元素滑入动画
     * @param {HTMLElement} element
     * @param {string} direction - 'left' | 'right' | 'up' | 'down'
     */
    static slideIn(element, direction = 'right') { }

    /**
     * 元素滑出动画
     */
    static slideOut(element, direction = 'right') { }

    /**
     * 淡入动画
     */
    static fadeIn(element, duration = 300) { }

    /**
     * 淡出动画
     */
    static fadeOut(element, duration = 300) { }

    /**
     * 缩放动画
     */
    static scale(element, fromScale, toScale, duration = 300) { }

    /**
     * 等待动画完成
     * @param {HTMLElement} element
     * @returns {Promise}
     */
    static waitForAnimation(element) {
        return new Promise(resolve => {
            element.addEventListener('animationend', resolve, { once: true });
        });
    }
}
```

---

## 五、交互流程设计

### 5.1 打开二级窗口流程

```
用户点击 [📱 视口调整器]
    ↓
主控制台开始滑出动画 (slideOutRight)
    ↓
动画完成后，主控制台隐藏
    ↓
二级窗口淡入 (fadeIn) + 内容缩放进入 (contentScaleIn)
    ↓
二级窗口完全显示，用户可操作
```

### 5.2 返回主控制台流程

```
用户点击 [← 返回]
    ↓
二级窗口淡出 (fadeOut)
    ↓
动画完成后，二级窗口隐藏
    ↓
主控制台滑入动画 (slideInRight)
    ↓
主控制台完全显示
```

### 5.3 视口调整实时反馈流程

```
用户选择预设尺寸 / 输入自定义宽度
    ↓
立即应用 transform: scale() 到 document.body
    ↓
触发 resize 事件（如需）
    ↓
实时更新"当前宽度"显示
    ↓
按钮状态切换（active 类）
```

---

## 六、色彩与设计规范

### 6.1 颜色主题

| 用途 | 颜色值 | 说明 |
|------|--------|------|
| 主色调 | `#7c3aed` | 紫色，主按钮、激活状态 |
| 主色调渐变 | `linear-gradient(135deg, #3730a3 0%, #7c3aed 100%)` | 工具栏背景 |
| 背景色 | `#27293d` | 主面板背景 |
| 内容背景 | `#1e1e2e` | 二级窗口背景 |
| 边框色 | `#374151` | 分割线、边框 |
| 主文字 | `#e2e8f0` | 标题、主要内容 |
| 次要文字 | `#94a3b8` | 副标题、辅助信息 |
| 占位文字 | `#64748b` | 输入框占位符 |

### 6.2 按钮样式规范

```css
/* 主按钮 */
.seeweb-btn-primary {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.seeweb-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

/* 次要按钮 */
.seeweb-btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    border-radius: 8px;
    padding: 10px 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.seeweb-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(124, 58, 237, 0.4);
    color: #e2e8f0;
}
```

### 6.3 阴影规范

| 层级 | 阴影值 | 使用场景 |
|------|--------|----------|
| 小阴影 | `0 2px 8px rgba(0, 0, 0, 0.15)` | 按钮悬停、小型面板 |
| 中阴影 | `0 4px 20px rgba(0, 0, 0, 0.25)` | 主面板、二级窗口 |
| 大阴影 | `0 10px 40px rgba(0, 0, 0, 0.4)` | 模态弹窗 |

---

## 七、实现步骤建议

### 阶段 1：基础架构搭建
1. 创建新的目录结构
2. 实现 `shared/Animations.js`
3. 实现基础组件 `shared/components/`

### 阶段 2：主控制台重构
1. 将现有 `LayoutManager.js` 重构为 `ConsoleLayoutManager.js`
2. 将 `ChosePanel.js` 移动到 `console/` 目录
3. 分离样式到 `console/console.css`

### 阶段 3：二级窗口实现
1. 创建 `SecondaryWindow.js` 窗口管理器
2. 实现 `ViewportController.js` 视口控制器
3. 实现主控制台 ↔ 二级窗口切换动画

### 阶段 4：整合与测试
1. 更新 `init.js` 入口文件
2. 整合所有样式文件
3. 全面测试动画与交互

---

## 八、关键代码示例

### 8.1 二级窗口管理器 (SecondaryWindow.js) 核心结构

```javascript
class SecondaryWindow {
    constructor(options) {
        this.proxyFactory = options.proxyFactory;
        this.layoutManager = options.layoutManager;
        this.currentWindow = null;
        this.container = null;
        this.isOpen = false;
    }

    /**
     * 打开指定窗口
     * @param {string} windowType - 'viewport' | 'theme' | 'settings'
     */
    async open(windowType) {
        // 1. 隐藏主控制台（带滑出动画）
        await this.layoutManager.hideWithAnimation();
        
        // 2. 创建并显示二级窗口
        this._createWindow(windowType);
        this._bindEvents();
        
        // 3. 播放入场动画
        Animations.fadeIn(this.container);
        Animations.scale(this.content, 0.9, 1);
        
        this.isOpen = true;
    }

    /**
     * 关闭二级窗口，返回主控制台
     */
    async close() {
        // 1. 播放退场动画
        await Animations.fadeOut(this.container);
        
        // 2. 移除窗口
        this._destroyWindow();
        
        // 3. 显示主控制台（带滑入动画）
        await this.layoutManager.showWithAnimation();
        
        this.isOpen = false;
    }
}
```

### 8.2 ConsoleLayoutManager 新增方法

```javascript
class ConsoleLayoutManager {
    // ... 现有代码 ...

    /**
     * 带滑出动画隐藏控制台
     */
    async hideWithAnimation() {
        return new Promise(resolve => {
            this.rightPanel.classList.add('seeweb-panel-slide-out');
            this.rightPanel.addEventListener('animationend', () => {
                this.rightPanel.style.display = 'none';
                this.rightPanel.classList.remove('seeweb-panel-slide-out');
                resolve();
            }, { once: true });
        });
    }

    /**
     * 带滑入动画显示控制台
     */
    async showWithAnimation() {
        return new Promise(resolve => {
            this.rightPanel.style.display = 'flex';
            this.rightPanel.classList.add('seeweb-panel-slide-in');
            this.rightPanel.addEventListener('animationend', () => {
                this.rightPanel.classList.remove('seeweb-panel-slide-in');
                resolve();
            }, { once: true });
        });
    }
}
```

---

## 九、注意事项与最佳实践

1. **保持现有功能不变**：重构过程中确保选择、提示词等核心功能正常工作
2. **动画性能**：使用 `transform` 和 `opacity` 属性实现动画，避免重排
3. **用户体验**：动画过程中禁用点击，防止重复触发
4. **向后兼容**：保留现有 CSS 类名，逐步迁移
5. **可扩展性**：二级窗口设计预留扩展接口，便于后续添加新功能

---

## 附录：现有文件映射

| 原文件 | 新位置 | 说明 |
|--------|--------|------|
| `LayoutManager.js` | `console/ConsoleLayoutManager.js` | 重构，新增动画方法 |
| `ChosePanel.js` | `console/ChosePanel.js` | 移动，保持功能不变 |
| `lib/proxy/proxy-factory.js` | `shared/ProxyFactory.js` | 移动，作为共享组件 |
| `seeweb.css` | 拆分到各子目录 + 主文件整合 | 样式分离 |
