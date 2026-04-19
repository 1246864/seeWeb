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
     * @param {Object} options.proxyFactory - 代理工厂实例
     * @param {Object} options.layoutManager - 布局管理器实例
     */
    constructor(options = {}) {
        // 依赖注入，确保模块松耦合
        this.choseList = options.choseList;
        this.proxyFactory = options.proxyFactory;
        this.layoutManager = options.layoutManager;

        // 验证必要依赖
        if (!this.choseList) {
            console.warn('ChoseDiv: Missing required dependency (choseList)');
        }

        // 创建选择框元素
        this.selectionBox = this._createElement('div', 'choseDiv-selectionBox');
        this.selectionBox.className = 'seeWeb_choseDiv';
        this.selectionBox.style.zIndex = 9999999;
        this.selectionBox.style.pointerEvents = 'none'; // 让鼠标事件穿透，不干扰选择

        // 创建标签名显示元素
        this.tagNameDisplay = this._createElement('div', 'choseDiv-tagNameDisplay');
        this.tagNameDisplay.className = 'seeWeb_choseDiv_name';

        // 添加到页面（添加到 html 标签，不是 body）
        this.selectionBox.appendChild(this.tagNameDisplay);
        document.documentElement.appendChild(this.selectionBox);

        // 创建退出提示元素
        this.exitHint = this._createElement('div', 'choseDiv-exitHint');
        this.exitHint.className = 'seeWeb_exitHint';
        this.exitHint.innerHTML = '<div class="seeWeb_exitHint_title">单选模式</div>按 ESC 或 [鼠标右键] 退出单选模式<br>按 Ctrl 可以扩大选区';
        this.exitHint.style.zIndex = 9999999;
        document.documentElement.appendChild(this.exitHint);

        // 初始化变量
        this.hoveredElements = [];
        this.hoveredElementsCache = [];
        this.currentIndex = 0;
        this.isSelectionActive = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.currentElement = null; // 当前选中的元素

        // 添加CSS样式
        this._addStyles();

        // 绑定事件
        this._bindEvents();

        // 启动定时器
        this._startTimer();
    }

    // 辅助方法：直接创建元素（不使用代理，避免被 suspendAll 移除）
    _createElement(tag, key) {
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

            // 更新鼠标位置（每次都要更新）
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;

            // 检查鼠标是否靠近右上角
            this._checkCornerDistance(e.clientX, e.clientY);

            // 更新选择框
            this._updateSelectionBox(e.clientX, e.clientY);
        });

        // 按Ctrl键切换元素（父元素）
        document.addEventListener('keydown', (e) => {
            if (!this.isSelectionActive) return;

            if (e.key === 'Control') {
                e.preventDefault();
                this._selectParentElement();
            }
        });

        // 点击页面（除了我们自己的 UI）时，选择当前元素
        document.addEventListener('click', (e) => {
            if (!this.isSelectionActive) return;
            
            // 如果点击的是我们自己的 UI，忽略
            if (e.target.closest('.seeWeb_choseDiv') || 
                e.target.closest('.seeWeb_exitHint') ||
                e.target.closest('.seeWeb-chose-panel') ||
                e.target.closest('.seeWeb-layout')) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            this._selectCurrentElement();
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
            }
        });
    }

    // 更新选择框（根据鼠标位置）
    _updateSelectionBox(x, y) {
        let element = null;
        
        // 先找到所有标记框，暂时隐藏它们
        const markers = document.querySelectorAll('.seeWeb_choseMarker');
        markers.forEach(marker => {
            marker.style.display = 'none';
        });

        // 现在获取鼠标下方的元素
        element = document.elementFromPoint(x, y);

        // 恢复标记框的显示 - 直接清除内联样式，让 CSS 类控制显示
        markers.forEach(marker => {
            marker.style.display = '';
        });

        if (!element) return;

        // 如果元素是我们自己的 UI，跳过
        if (element.closest('.seeWeb_choseDiv') || 
            element.closest('.seeWeb_exitHint') ||
            element.closest('.seeWeb-chose-panel') ||
            element.closest('.seeWeb-layout')) {
            return;
        }

        // 当前选中的元素
        this.currentElement = element;
        this.hoveredElementsCache = [element];
        this.currentIndex = 0;

        // 更新选择框的位置和尺寸
        const rect = element.getBoundingClientRect();
        const padding = Math.max(2, Math.min(rect.width, rect.height) / 40);

        this.selectionBox.style.left = `${rect.left - padding}px`;
        this.selectionBox.style.top = `${rect.top - padding}px`;
        this.selectionBox.style.width = `${rect.width + padding * 2}px`;
        this.selectionBox.style.height = `${rect.height + padding * 2}px`;
        this.selectionBox.style.borderRadius = `${padding}px`;

        // 设置标签显示的内容为当前元素的标签名（小写）
        this.tagNameDisplay.textContent = element.tagName.toLowerCase();
    }

    // 选择父元素
    _selectParentElement() {
        if (!this.currentElement || !this.currentElement.parentElement) return;
        
        const parent = this.currentElement.parentElement;
        if (parent && parent !== document.documentElement && parent !== document.body) {
            this.currentElement = parent;
            this.hoveredElementsCache = [parent];
            
            // 更新选择框
            const rect = parent.getBoundingClientRect();
            const padding = Math.max(2, Math.min(rect.width, rect.height) / 40);
            
            this.selectionBox.style.left = `${rect.left - padding}px`;
            this.selectionBox.style.top = `${rect.top - padding}px`;
            this.selectionBox.style.width = `${rect.width + padding * 2}px`;
            this.selectionBox.style.height = `${rect.height + padding * 2}px`;
            this.selectionBox.style.borderRadius = `${padding}px`;
            
            this.tagNameDisplay.textContent = parent.tagName.toLowerCase();
            
            console.log('选择父元素:', parent);
        }
    }

    // 选择当前元素
    _selectCurrentElement() {
        if (!this.currentElement) {
            console.warn('没有当前元素');
            return;
        }
        
        console.log('点击选择元素:', this.currentElement);
        
        if (this.choseList) {
            this.choseList.add(this.currentElement);
        }
    }

    // 我们不再需要定时器了，直接在 mousemove 时更新
    _startTimer() {
        // 空实现
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
        console.log('✅ choseDiv.enable() 被调用');
        console.log('this.selectionBox:', this.selectionBox);
        
        // 重置状态
        this.currentElement = null;
        this.hoveredElementsCache = [];
        
        // 进入选择模式，完全隐藏右侧面板，不显示浮动按钮
        if (this.layoutManager && this.layoutManager.hideForSelection) {
            this.layoutManager.hideForSelection();
        }
        
        // 显示选择框，但先不设置固定位置，等鼠标移动
        this.selectionBox.style.display = 'block';

        // 检查鼠标是否靠近右上角
        const mouseX = this.lastMouseX || 0;
        const mouseY = this.lastMouseY || 0;
        this._checkCornerDistance(mouseX, mouseY);

        this.isSelectionActive = true;
        console.log('✅ choseDiv 启用成功');
    }

    // 禁用选择器
    disable() {
        console.log('❌ choseDiv.disable() 被调用');
        
        // 退出选择模式，恢复右侧面板
        if (this.layoutManager && this.layoutManager.restoreAfterSelection) {
            this.layoutManager.restoreAfterSelection();
        }
        
        this.selectionBox.style.display = 'none';
        this.exitHint.style.display = 'none';
        this.isSelectionActive = false;
        this.hoveredElements = [];
        this.hoveredElementsCache = [];
        this.currentIndex = 0;
        this.currentElement = null; // 重置当前元素！
        
        console.log('❌ choseDiv 禁用成功');
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
