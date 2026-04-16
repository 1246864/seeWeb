# SeeWeb DOM 元素选择工具使用说明书

## 项目概述

SeeWeb 是一个轻量级的 DOM 元素选择工具，提供了直观的界面和灵活的选择方式，帮助开发者快速选择和管理网页中的 DOM 元素。

### 核心功能

- **单选模式**：通过鼠标悬停选择单个元素，按 Ctrl 键可在悬停过的元素之间切换
- **扩选模式**：通过拖动鼠标创建矩形，选择矩形内的所有元素
- **元素管理**：支持添加、移除、批量操作和撤销操作
- **视觉反馈**：为选中元素添加红色边框，为正在选择的元素添加蓝色/绿色边框
- **用户友好**：提供清晰的操作提示和直观的用户界面

## 安装和初始化

### 方法一：直接引入脚本

在 HTML 文件中按顺序引入所有核心文件：

```html
<!-- 核心样式文件 -->
<link rel="stylesheet" href=".seeweb/seeweb.css">

<!-- 核心脚本文件 -->
<script src=".seeweb/choseList.js"></script>
<script src=".seeweb/choseDiv.js"></script>
<script src=".seeweb/choseRect.js"></script>
<script src=".seeweb/choseManager.js"></script>
<script src=".seeweb/choseUI.js"></script>
<script src=".seeweb/init.js"></script>
```

### 方法二：模块化引入

如果使用模块化系统，可以通过 CommonJS 或 ES 模块引入：

```javascript
// CommonJS
const SeeWebInit = require('./.seeweb/init.js');

// ES 模块
import SeeWebInit from './.seeweb/init.js';

// 初始化
const instances = SeeWebInit.init();
```

## 基本使用方法

### 初始化

当页面加载完成后，SeeWeb 会自动初始化。如果需要手动初始化，可以调用：

```javascript
// 手动初始化
const seeWeb = SeeWebInit.init();
```

### 选择模式切换

初始化后，会在页面左上角显示选择模式UI，包含以下按钮：

- **单选模式**：进入单选模式，通过鼠标悬停选择元素
- **扩选模式**：进入扩选模式，通过拖动鼠标选择多个元素
- **撤回**：撤销上一次选择操作

### 单选模式操作

1. 点击"单选模式"按钮进入单选模式
2. 鼠标悬停在元素上，会显示蓝色高亮框
3. 按 Ctrl 键可以在悬停过的元素之间切换
4. 点击高亮框将元素添加到选择列表
5. 按 ESC 键或右键点击退出单选模式

### 扩选模式操作

1. 点击"扩选模式"按钮进入扩选模式
2. 按住鼠标左键拖动，创建绿色矩形选择框
3. 释放鼠标，选择框内的所有元素会被添加到选择列表
4. 按 ESC 键或右键点击退出扩选模式

### 查看和管理选中元素

- 选中的元素会显示红色边框，表示已被选中
- 可以通过"撤回"按钮撤销上一次选择操作
- 可以再次点击已选中的元素将其从选择列表中移除

## API 参考

### 核心实例

初始化后，会在全局 `window` 对象上暴露以下实例：

- `window.seeWeb`：包含所有核心实例的对象
- `window.choseList`：选择列表实例
- `window.choseDiv`：单选模式选择器实例
- `window.choseRect`：扩选模式选择器实例
- `window.choseUI`：选择模式UI实例
- `window.choseManager`：选择管理器实例

### choseList 实例方法

- `add(element)`：添加单个元素到选择列表（如果已存在则移除）
- `addBatch(elements)`：批量添加元素到选择列表
- `remove(element)`：从选择列表中移除单个元素
- `removeBatch(elements)`：批量移除元素
- `clear()`：清空选择列表
- `undo()`：撤销上一次操作
- `getList()`：获取选择列表内容
- `includes(element)`：检查元素是否在选择列表中
- `on(callback)`：注册回调函数，监听列表变化

### choseDiv 实例方法

- `enable()`：启用单选模式
- `disable()`：禁用单选模式
- `undo()`：撤销上一次操作

### choseRect 实例方法

- `enable()`：启用扩选模式
- `disable()`：禁用扩选模式
- `undo()`：撤销上一次操作

### choseUI 实例方法

- `show()`：显示选择模式UI
- `hide()`：隐藏选择模式UI
- `toggle()`：切换选择模式UI可见性

### choseManager 实例方法

- `syncAllMarkerBoxes()`：同步所有选中元素的表示框位置

## 示例代码

### 基本使用示例

```javascript
// 初始化
const seeWeb = SeeWebInit.init();

// 获取核心实例
const { choseList, choseDiv, choseRect, choseUI, choseManager } = seeWeb;

// 注册选择列表变化回调
choseList.on((action, data) => {
    console.log(`选择列表变化: ${action}`, data);
});

// 手动启用单选模式
choseDiv.enable();

// 手动添加元素到选择列表
const element = document.getElementById('myElement');
choseList.add(element);

// 撤销上一次操作
choseList.undo();

// 清空选择列表
choseList.clear();
```

### 自定义初始化示例

```javascript
// 自定义初始化
const ChoseList = require('./.seeweb/choseList.js');
const ChoseDiv = require('./.seeweb/choseDiv.js');
const ChoseRect = require('./.seeweb/choseRect.js');
const ChoseUI = require('./.seeweb/choseUI.js');
const ChoseManager = require('./.seeweb/choseManager.js');

// 创建实例
const choseList = new ChoseList();
const choseUI = new ChoseUI({ choseList });
const choseDiv = new ChoseDiv({ choseList, choseUI });
const choseRect = new ChoseRect({ choseList, choseUI });
const choseManager = new ChoseManager({ choseList });

// 注入依赖
choseUI.choseDiv = choseDiv;
choseUI.choseRect = choseRect;

// 导出实例
window.mySeeWeb = {
    choseList,
    choseDiv,
    choseRect,
    choseUI,
    choseManager
};

// 启用UI
choseUI.show();
```

## 常见问题解答

### Q: 为什么选择模式UI没有显示？
A: 请确保所有核心文件都已正确引入，并且页面已完全加载。可以尝试手动调用 `choseUI.show()` 显示UI。

### Q: 为什么选择元素后没有显示红色边框？
A: 请检查 `choseManager` 是否正确初始化，并且 `choseList` 的变化回调是否正常工作。

### Q: 如何在自定义环境中使用？
A: 可以通过模块化引入的方式，手动创建实例并注入依赖，具体参考"自定义初始化示例"。

### Q: 如何扩展功能？
A: 可以通过继承核心类或监听 `choseList` 的变化回调来扩展功能。

### Q: 支持哪些浏览器？
A: 支持所有现代浏览器，包括 Chrome、Firefox、Safari 和 Edge。

## 故障排除

### 问题：选择模式无法切换
- 检查是否正确引入了所有核心文件
- 检查浏览器控制台是否有错误信息
- 尝试手动初始化 `SeeWebInit.init()`

### 问题：元素选择后没有视觉反馈
- 检查 `choseManager` 是否正确初始化
- 检查 `choseList` 是否正确绑定了回调
- 尝试手动调用 `choseManager.syncAllMarkerBoxes()`

### 问题：撤销操作不起作用
- 检查操作历史是否正确记录
- 确保 `choseList.undo()` 方法被正确调用
- 检查是否有足够的操作历史可以撤销

## 版本信息

- **版本**：1.0.0
- **更新日期**：2026-04-16
- **主要功能**：DOM元素选择、单选模式、扩选模式、元素管理、撤销操作

## 贡献

欢迎提交 issue 和 pull request 来改进这个项目。

## 许可证

MIT License
