/**
 * 拖动扩选工具
 * 功能：通过拖动鼠标创建矩形，选择矩形内的所有DOM元素
 * 职责：只负责扩选模式的实现，通过依赖注入与其他模块通信
 */

class ChoseRect {
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
            console.warn('ChoseRect: Missing required dependency (choseList)');
        }

        // 创建选择框元素
        this.selectionRect = this._createElement('div', 'choseRect-selectionRect');
        this.selectionRect.className = 'seeWeb_choseRect';
        this.selectionRect.style.zIndex = 9999999;

        // 创建全局蒙版
        this.mask = this._createElement('div', 'choseRect-mask');
        this.mask.className = 'seeWeb_choseRectMask';
        this.mask.style.zIndex = 9999998;

        // 创建退出提示元素
        this.exitHint = this._createElement('div', 'choseRect-exitHint');
        this.exitHint.className = 'seeWeb_exitHint';
        this.exitHint.innerHTML = '<div class="seeWeb_exitHint_title">扩选模式</div>按 ESC 或 [鼠标右键] 退出扩选模式<br>按鼠标拖动进行扩选';
        this.exitHint.style.zIndex = 9999999;

        // 添加到页面（添加到 html 标签，不是 body）
        document.documentElement.appendChild(this.selectionRect);
        document.documentElement.appendChild(this.mask);
        document.documentElement.appendChild(this.exitHint);

        // 初始化变量
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.isActive = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // 文档滚动缓存
        this.scrollTop = 0;
        this.scrollLeft = 0;

        // 添加CSS样式
        this._addStyles();

        // 绑定事件
        this._bindEvents();
    }

    _createElement(tag, key) {
        return this.proxyFactory.createElement(tag, key);
    }

    // 添加CSS样式 - 样式已统一到seeweb.css文件中
    _addStyles() {
        // 样式已统一到seeweb.css文件中，此处不再重复添加
    }

    // 绑定事件
    _bindEvents() {
        // 鼠标按下事件
        document.addEventListener('mousedown', (e) => {
            if (!this.isActive) return;

            // 只有左键点击才开始拖动
            if (e.button === 0) {
                // 获取当前文档滚动距离
                this.scrollTop = window.scrollY;
                this.scrollLeft = window.scrollX;

                this.isDragging = true;
                this.startX = e.clientX;
                this.startY = e.clientY;

                // 显示选择框
                this.selectionRect.style.display = 'block';
                this.selectionRect.style.left = `${this.startX}px`;
                this.selectionRect.style.top = `${this.startY}px`;
                this.selectionRect.style.width = '0';
                this.selectionRect.style.height = '0';
            }
        });

        // 鼠标移动事件
        document.addEventListener('mousemove', (e) => {
            if (!this.isActive) return;

            // 检查鼠标是否靠近右上角
            const windowWidth = window.innerWidth;
            const cornerDistance = this._calculateDistance(e.clientX, e.clientY, windowWidth - 20, -200);

            // 如果鼠标靠近右上角，隐藏提示框
            if (cornerDistance < 500) {
                this.exitHint.style.display = 'none';
            } else {
                if (this.isActive) {
                    this.exitHint.style.display = 'block';
                }
            }

            // 更新鼠标位置
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;

            // 如果正在拖动，更新选择框
            if (this.isDragging) {
                // 获取当前文档滚动距离
                const scrollTop = window.scrollY;
                const scrollLeft = window.scrollX;
                
                // 计算选择框起始点的绝对位置
                // this.startX = e.clientX + scrollLeft - this.scrollLeft;
                const sta_startY = this.startY - scrollTop + this.scrollTop;

                // 计算选择框的位置和大小
                const currentX = e.clientX
                const currentY = e.clientY

                const left = Math.min(this.startX, currentX);
                const top = Math.min(sta_startY, currentY);
                const width = Math.abs(currentX - this.startX);
                const height = Math.abs(currentY - sta_startY);

                // 更新选择框样式
                this.selectionRect.style.left = `${left}px`;
                this.selectionRect.style.top = `${top}px`;
                this.selectionRect.style.width = `${width}px`;
                this.selectionRect.style.height = `${height}px`;
            }
        });

        // 鼠标释放事件
        document.addEventListener('mouseup', () => {
            if (!this.isActive || !this.isDragging) return;

            this.isDragging = false;

            // 获取选择框的位置和大小
            const rect = this.selectionRect.getBoundingClientRect();

            // 选择矩形内的所有元素
            this._selectElementsInRect(rect);

            // 隐藏选择框
            this.selectionRect.style.display = 'none';
        });

        // 按Escape键禁用扩选功能
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.disable();
            }
        });

        // 鼠标右键点击退出选择器
        document.addEventListener('contextmenu', (e) => {
            if (this.isActive) {
                e.preventDefault(); // 阻止默认的右键菜单
                this.disable();
                // 显示选择模式UI
                if (this.choseUI && this.choseUI.show) {
                    this.choseUI.show();
                }
            }
        });
    }

    // 选择矩形内的所有元素
    _selectElementsInRect(rect) {
        const elements = document.querySelectorAll('body *:not(.seeWeb_choseRect):not(.seeWeb_choseDiv):not(.seeWeb_exitHint):not(.seeWeb_choseMarker)');
        const selectedElements = [];

        elements.forEach(element => {
            const elementRect = element.getBoundingClientRect();

            // 检查选择框是否完全在元素内部（这种情况不算选中）
            const isSelectionFullyInside = rect.left >= elementRect.left &&
                rect.top >= elementRect.top &&
                rect.right <= elementRect.right &&
                rect.bottom <= elementRect.bottom;

            // 如果选择框完全在元素内部，跳过
            if (isSelectionFullyInside) {
                return;
            }

            // 检查元素是否完全在选择框内，或者与选择框有实际交集
            // 检查元素与选择框有上下实际交集
            const hasTopBottomIntersection = elementRect.top > rect.top &&
                elementRect.bottom < rect.bottom &&
                elementRect.left < rect.right &&
                elementRect.right > rect.left;

            // 检查元素与选择框有左右实际交集
            const hasLeftRightIntersection = elementRect.left > rect.left &&
                elementRect.right < rect.right &&
                elementRect.top < rect.bottom &&
                elementRect.bottom > rect.top;


            // 如果完全在选择框内，或者与选择框有实际交集，直接选中
            if (hasTopBottomIntersection || hasLeftRightIntersection) {
                selectedElements.push(element);
            }
        });

        if (selectedElements.length > 0) {
            console.log('选择了', selectedElements.length, '个元素');

            // 批量添加所有选中的元素
            if (this.choseList) {
                this.choseList.addBatch(selectedElements);
            }
        }
    }

    // 计算两点之间的距离
    _calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    // 启用扩选功能
    enable() {
        // 进入选择模式，完全隐藏右侧面板，不显示浮动按钮
        if (this.layoutManager && this.layoutManager.hideForSelection) {
            this.layoutManager.hideForSelection();
        }
        
        this.isActive = true;
        this.mask.style.display = 'block';

        // 检查鼠标是否靠近右上角
        const mouseX = this.lastMouseX || 0;
        const mouseY = this.lastMouseY || 0;
        const windowWidth = window.innerWidth;
        const cornerDistance = this._calculateDistance(mouseX, mouseY, windowWidth - 20, 20);

        // 只有当鼠标不靠近右上角时才显示提示框
        if (cornerDistance >= 100) {
            this.exitHint.style.display = 'block';
        }
    }

    // 禁用扩选功能
    disable() {
        // 退出选择模式，恢复右侧面板
        if (this.layoutManager && this.layoutManager.restoreAfterSelection) {
            this.layoutManager.restoreAfterSelection();
        }
        
        this.isActive = false;
        this.isDragging = false;
        this.selectionRect.style.display = 'none';
        this.mask.style.display = 'none';
        this.exitHint.style.display = 'none';
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
    module.exports = ChoseRect;
}

// 如果你需要使用ES模块导出
if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = ChoseRect;
}

// 全局导出
if (typeof window !== 'undefined') {
    window.ChoseRect = ChoseRect;
}
