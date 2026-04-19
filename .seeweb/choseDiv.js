/**
 * DOM元素选择工具
 * 功能：当鼠标悬停在元素上时，会在元素周围显示高亮框
 * 按Ctrl键可以在悬停过的元素之间切换
 * 职责：只负责单选模式的实现，通过依赖注入与其他模块通信
 */

class ChoseDiv {
    /**
     * 构造函数
     * @param {Object} options - 配置选项
     * @param {Object} options.choseList - 选择列表实例
     * @param {Object} options.choseUI - 选择模式UI实例
     * @param {Object} options.proxyFactory - 代理工厂实例
     * @param {Object} options.uiManager - UI管理器实例
     */
    constructor(options = {}) {
        // 依赖注入，确保模块松耦合
        this.choseList = options.choseList;
        this.choseUI = options.choseUI;
        this.proxyFactory = options.proxyFactory;
        this.uiManager = options.uiManager;

        // 验证必要依赖
        if (!this.choseList) {
            console.warn('ChoseDiv: Missing required dependency (choseList)');
        }

        // 创建选择框元素
        this.selectionBox = this._createElement('div', 'choseDiv-selectionBox');
        this.selectionBox.className = 'seeWeb_choseDiv';

        // 创建标签名显示元素
        this.tagNameDisplay = this._createElement('div', 'choseDiv-tagNameDisplay');
        this.tagNameDisplay.className = 'seeWeb_choseDiv_name';

        // 添加到页面
        this.selectionBox.appendChild(this.tagNameDisplay);
        document.body.appendChild(this.selectionBox);

        // 创建退出提示元素
        this.exitHint = this._createElement('div', 'choseDiv-exitHint');
        this.exitHint.className = 'seeWeb_exitHint';
        this.exitHint.innerHTML = '<div class="seeWeb_exitHint_title">单选模式</div>按 ESC 或 [鼠标右键] 退出单选模式<br>按 Ctrl 可以扩大选区';
        document.body.appendChild(this.exitHint);

        // 初始化变量
        this.hoveredElements = [];
        this.hoveredElementsCache = [];
        this.currentIndex = 0;
        this.isSelectionActive = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.MOUSE_MOVE_THRESHOLD = 10;

        // 添加CSS样式
        this._addStyles();

        // 绑定事件
        this._bindEvents();

        // 启动定时器
        this._startTimer();
    }

    // 辅助方法：使用代理工厂创建元素
    _createElement(tag, key) {
        if (this.proxyFactory) {
            return this.proxyFactory.createElement(tag, key);
        }
        return document.createElement(tag);
    }

    // 添加CSS样式 - 样式已统一到seeweb.css文件中
    _addStyles() {
        // 样式已统一到seeweb.css文件中，此处不再重复添加
    }

    // 检查鼠标是否靠近右上角
    _checkCornerDistance(x, y) {
        const windowWidth = window.innerWidth;
        const cornerDistance = this._calculateDistance(x, y, windowWidth - 20, -200);

        // 如果鼠标靠近右上角，隐藏提示框
        if (cornerDistance < 500) {
            this.exitHint.style.display = 'none';
        } else {
            if (this.isSelectionActive) {
                this.exitHint.style.display = 'block';
            }
        }
    }

    // 绑定事件
    _bindEvents() {
        // 鼠标移动事件
        document.addEventListener('mousemove', (e) => {
            if (!this.isSelectionActive) return;

            // 计算鼠标移动距离
            const distance = this._calculateDistance(this.lastMouseX, this.lastMouseY, e.clientX, e.clientY);

            // 检查鼠标是否靠近右上角
            this._checkCornerDistance(e.clientX, e.clientY);

            // 如果移动距离超过阈值
            if (distance > this.MOUSE_MOVE_THRESHOLD) {
                this.currentIndex = 0;
                this._disableSelection();
                // 更新鼠标位置
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        // 按Ctrl键切换元素
        document.addEventListener('keydown', (e) => {
            if (!this.isSelectionActive) return;

            if (e.key === 'Control' && this.hoveredElementsCache.length > 0) {
                this.currentIndex = (this.currentIndex + 1) % this.hoveredElementsCache.length;
                console.log('当前选中元素索引:', this.currentIndex);
            }
        });

        // 为所有非选择框元素添加鼠标悬停事件
        this._addHoverEvents();

        // 点击选择框时获取当前元素
        this.selectionBox.addEventListener('click', () => {
            if (!this.isSelectionActive) return;

            console.log('点击选择框');
            const selectedElement = this.hoveredElementsCache[this.currentIndex];
            console.log(selectedElement);
            if (selectedElement && this.choseList) {
                this.choseList.add(selectedElement);
            }
        });

        // 按Escape键禁用选择框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSelectionActive) {
                this.disable();
            }
            // 按Ctrl+Z撤销上一次操作
            else if (e.ctrlKey && e.key === 'z' && this.choseList) {
                e.preventDefault(); // 阻止默认的撤销行为
                this.choseList.undo();
            }
        });

        // 鼠标右键点击退出选择器
        document.addEventListener('contextmenu', (e) => {
            if (this.isSelectionActive) {
                e.preventDefault(); // 阻止默认的右键菜单
                this.disable();
                // 显示选择模式UI
                if (this.choseUI && this.choseUI.show) {
                    this.choseUI.show();
                }
            }
        });
    }

    // 为所有元素添加悬停事件
    _addHoverEvents() {
        document.querySelectorAll('body *:not(.seeWeb_choseDiv)').forEach(element => {
            element.addEventListener('mouseover', () => {
                if (!this.isSelectionActive) return;

                if (!this.hoveredElements.includes(element)) {
                    this.hoveredElements.push(element);
                }
            });

            element.addEventListener('mouseout', () => {
                if (!this.isSelectionActive) return;

                const index = this.hoveredElements.indexOf(element);
                if (index > -1) {
                    this.hoveredElements.splice(index, 1);
                    if (index <= this.currentIndex && this.currentIndex > 0) {
                        this.currentIndex--;
                    }
                }
            });
        });
    }

    // 启动定时器
    _startTimer() {
        setInterval(() => {
            if (!this.isSelectionActive) return;

            // 同步悬停元素列表到缓存
            if (this.hoveredElements.length !== 0) {
                this.hoveredElementsCache = [...this.hoveredElements];
            }

            // 启用选择框（当有悬停元素时）
            this._enableSelection();

            // 更新选择框位置和样式
            if (this.hoveredElementsCache.length > 0) {
                const currentElement = this.hoveredElementsCache[this.currentIndex];
                if (currentElement) {
                    const rect = currentElement.getBoundingClientRect();
                    const x = rect.left;
                    const y = rect.top;
                    const width = rect.width;
                    const height = rect.height;
                    const padding = Math.max(2, Math.min(width, height) / 40);

                    this.selectionBox.style.left = `${x - padding}px`;
                    this.selectionBox.style.top = `${y - padding}px`;
                    this.selectionBox.style.width = `${width + padding * 2}px`;
                    this.selectionBox.style.height = `${height + padding * 2}px`;
                    this.selectionBox.style.borderRadius = `${padding}px`;

                    // 设置标签显示的内容为当前元素的标签名（小写）
                    this.tagNameDisplay.textContent = currentElement.tagName.toLowerCase();

                    // 获取标签显示元素的左侧位置
                    const left = this.tagNameDisplay.getBoundingClientRect().left;

                    // 确保标签提示不会跑到屏幕外面
                    // 如果标签左侧超出屏幕左侧边界（小于等于-5px），则调整位置使其显示在屏幕内
                    if (left <= -5) {
                        this.tagNameDisplay.style.left = `${-left + 15}px`;
                    }
                    // 如果标签左侧距离屏幕左侧过远（大于等于20px），则重置位置
                    else if (left >= 20) {
                        this.tagNameDisplay.style.left = '0px';
                    }
                }
            }
        }, 100);
    }

    // 禁用选择框
    _disableSelection() {
        this.selectionBox.style.pointerEvents = 'none';
    }

    // 启用选择框
    _enableSelection() {
        if (this.hoveredElementsCache.length > 0) {
            this.selectionBox.style.pointerEvents = 'auto';
        }
    }

    // 计算两点之间的距离
    _calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    // 启用选择器
    enable() {
        // 隐藏所有其他 UI 窗口
        if (this.uiManager && typeof this.uiManager.hideAll === 'function') {
            this.uiManager.hideAll();
        }

        this.selectionBox.style.display = 'block';

        // 检查鼠标是否靠近右上角
        const mouseX = this.lastMouseX || 0;
        const mouseY = this.lastMouseY || 0;
        this._checkCornerDistance(mouseX, mouseY);

        this.isSelectionActive = true;
    }

    // 禁用选择器
    disable() {
        this.selectionBox.style.display = 'none';
        this.exitHint.style.display = 'none';
        this.isSelectionActive = false;
        this.hoveredElements = [];
        this.hoveredElementsCache = [];
        this.currentIndex = 0;
        
        // 恢复显示所有 UI
        if (this.uiManager && typeof this.uiManager.showAll === 'function') {
            this.uiManager.showAll();
        }
    }

    // 撤回功能
    undo() {
        if (this.choseList && this.choseList.undo) {
            this.choseList.undo();
        }
    }
}

// 导出类（不直接创建实例，由外部负责依赖注入）

// 如果你需要使用CommonJS模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChoseDiv;
}

// 如果你需要使用ES模块导出
if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = ChoseDiv;
}

// 全局导出
if (typeof window !== 'undefined') {
    window.ChoseDiv = ChoseDiv;
}
