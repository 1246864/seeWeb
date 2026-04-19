# SeeWeb 代理模块设计文档

## 概述

代理模块是 SeeWeb 工具的底层基础设施，专门用于管理动态创建的 DOM 元素。它提供了一套简洁而强大的 API，用于控制这些元素的挂起（从 DOM 树移除）和恢复（重新插入 DOM 树），而不会影响业务逻辑的运行。

## 核心概念

### DOMProxy（DOM 代理类）

代理单个 DOM 元素，记录其位置信息并提供挂起/恢复功能。

**主要职责：**
- 记录被代理元素的父元素和兄弟元素位置
- 提供元素从 DOM 树的挂起和恢复能力
- 保持对原始元素的引用

**核心方法：**

```javascript
// 构造函数
const proxy = new DOMProxy(element);

// 获取被代理的元素
proxy.getElement();

// 获取父元素
proxy.getParent();

// 获取下一个兄弟元素
proxy.getNextSibling();

// 检查是否已挂起
proxy.isSuspended(); // 返回 boolean

// 记录当前位置（挂起前自动调用）
proxy.capturePosition();

// 从 DOM 树移除元素（但保留引用）
proxy.suspend(); // 返回 boolean

// 重新插入 DOM 树到原始位置
proxy.resume(); // 返回 boolean
```

### ProxyFactory（代理工厂类）

统一管理所有动态 DOM 元素的代理，提供批量操作能力。

**主要职责：**
- 创建和管理多个 DOM 代理
- 提供批量挂起/恢复功能
- 维护代理注册表

**核心方法：**

```javascript
// 创建代理工厂实例
const factory = new ProxyFactory();

// 为元素创建代理（会自动记录位置）
factory.createProxy(element, 'optional-key');

// 注册已创建的代理
factory.registerProxy('my-key', proxyInstance);

// 注销代理
factory.unregisterProxy('my-key'); // 返回 boolean

// 获取代理
factory.getProxy('my-key'); // 返回 DOMProxy 或 undefined

// 检查代理是否存在
factory.hasProxy('my-key'); // 返回 boolean

// 获取代理数量
factory.getProxyCount(); // 返回 number

// 获取所有代理的键
factory.getProxyKeys(); // 返回 string[]

// 剔除所有动态 DOM（从 DOM 树移除）
factory.suspendAll();

// 恢复所有动态 DOM（重新插入）
factory.resumeAll();

// 切换状态
factory.toggle();

// 检查当前状态
factory.isActive(); // 返回 boolean，true = 已激活，false = 已禁用

// 注册状态变化回调
factory.on((action, data) => {
    console.log('状态变化:', action, data);
});

// 清空所有代理（谨慎使用）
factory.clearAll();
```

## 设计原则

### 1. 最小干预原则

代理模块的设计哲学是"只管理 DOM 的挂载/卸载，不影响业务逻辑"。

- **不干预业务逻辑**：无论元素是否被挂起，业务代码中的元素引用都保持有效
- **位置记忆**：自动记录元素在 DOM 树中的原始位置
- **无状态泄漏**：恢复时元素完全回到原始状态，包括事件监听器等

### 2. 松耦合设计

代理模块作为独立模块存在，不与具体业务强耦合。

- **独立性强**：可以单独使用 DOMProxy 或 ProxyFactory
- **依赖注入**：通过构造函数或方法参数注入依赖
- **事件驱动**：通过回调机制通知状态变化

### 3. 安全优先

在各种边界情况下都能安全运行。

- **幂等操作**：多次挂起/恢复不会导致错误
- **空值检查**：所有方法都包含必要的空值检查
- **错误处理**：捕获并记录操作中的错误

## 使用示例

### 基础用法

```javascript
// 创建代理工厂
const factory = new ProxyFactory();

// 为元素创建代理
const element = document.createElement('div');
const proxy = factory.createProxy(element, 'my-div');

// 挂起元素（从页面移除但保留引用）
proxy.suspend();

// 恢复元素（重新显示）
proxy.resume();
```

### 批量管理

```javascript
// 注册多个元素
factory.registerProxy('box1', factory.createProxy(div1));
factory.registerProxy('box2', factory.createProxy(div2));
factory.registerProxy('box3', factory.createProxy(div3));

// 批量挂起
factory.suspendAll(); // 所有元素从页面消失

// 批量恢复
factory.resumeAll(); // 所有元素重新显示
```

### 状态监听

```javascript
// 监听状态变化
factory.on((action, data) => {
    if (action === 'suspend') {
        console.log(`已禁用，剔除了 ${data.count} 个元素`);
    } else if (action === 'resume') {
        console.log(`已启用，恢复 了 ${data.count} 个元素`);
    }
});

// 切换状态
factory.toggle();
```

## 与 SeeWeb 集成

### 初始化流程

```javascript
// 在 SeeWeb 初始化时创建代理工厂
const seeWeb = SeeWebInit.init();

// 访问代理工厂
const proxyFactory = seeWeb.proxyFactory;

// 使用代理工厂
proxyFactory.suspendAll(); // 禁用所有动态 DOM
proxyFactory.resumeAll();  // 恢复所有动态 DOM
```

### 已注册的动态 DOM 元素

SeeWeb 初始化时会自动注册以下动态 DOM 元素到代理工厂：

| 键名 | 元素 | 所属模块 |
|------|------|---------|
| choseUI-container | SeeWeb 主面板容器 | choseUI |
| choseDiv-selectionBox | 单选模式选择框 | choseDiv |
| choseDiv-exitHint | 单选模式退出提示 | choseDiv |
| choseRect-selectionRect | 扩选模式选择框 | choseRect |
| choseRect-mask | 扩选模式蒙版 | choseRect |
| choseRect-exitHint | 扩选模式退出提示 | choseRect |

## 性能考虑

### 批量操作优化

`suspendAll()` 和 `resumeAll()` 方法会遍历所有代理并逐个挂起/恢复。对于大量元素（100+）的场景，这个操作是高效的，因为：
- 操作是同步的，无需等待
- 无需重新计算布局（只是移动元素）

### 内存管理

- 代理对象会保留对原始元素的引用
- 调用 `clearAll()` 可以完全清空所有代理
- 已挂起的元素仍然占用内存（但比显示在页面上少）

## 扩展性

### 自定义代理

可以继承 `DOMProxy` 类来创建功能更强的代理：

```javascript
class CustomProxy extends DOMProxy {
    constructor(element) {
        super(element);
        this._customData = {};
    }

    setCustomData(key, value) {
        this._customData[key] = value;
    }

    getCustomData(key) {
        return this._customData[key];
    }
}
```

### 组合多个工厂

可以在一个应用中使用多个代理工厂实例，分别管理不同类型的动态 DOM：

```javascript
const uiFactory = new ProxyFactory();
const tooltipsFactory = new ProxyFactory();
const modalsFactory = new ProxyFactory();
```

## 常见问题

### Q: 挂起后的元素还能访问吗？

A: 可以。通过 `proxy.getElement()` 获取原始元素，所有属性和事件监听器都保持不变。

### Q: 如何判断元素是否可见？

A: 使用 `proxy.isSuspended()` 方法。返回 `true` 表示已从 DOM 树移除。

### Q: 能否恢复到不同的位置？

A: 可以。调用 `resume()` 会恢复到 `capturePosition()` 记录的位置。如果需要恢复到新位置，可以：
1. 先调用 `unregisterProxy(key)` 注销代理
2. 将元素移动到新位置
3. 重新创建代理

### Q: 元素被挂起时，它的事件监听器还在吗？

A: 在的。`suspend()` 只是将元素从 DOM 树移除，不会影响元素本身或其子元素上的任何属性或事件监听器。

## 总结

代理模块提供了一套优雅而强大的机制，用于管理动态创建的 DOM 元素。它的设计遵循最小干预原则，确保业务逻辑不受影响，同时提供了便捷的批量操作和状态管理能力。
