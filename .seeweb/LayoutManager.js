/**
 * 布局管理器 - 专业的工具级布局
 * 功能：管理渲染区域和工具面板
 */

class LayoutManager {
    constructor(options = {}) {
        this.proxyFactory = options.proxyFactory;
        
        // 验证必需依赖
        if (!this.proxyFactory) {
            throw new Error('LayoutManager: proxyFactory is required');
        }
        
        this.panelWidth = 360;
        this.isInitialized = false;
        this.isMinimized = false;
        this.wrapper = null;
        this.renderArea = null;
        this.rightPanel = null;
        this.toolbar = null;
        this.floatingButton = null;
        this.choseManager = null;
        
        this._createLayout();
    }

    setChoseManager(cm) {
        this.choseManager = cm;
    }

    _createElement(tag, key) {
        return this.proxyFactory.createElement(tag, key);
    }

    _bindResizerEvents() {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        this.resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = this.rightPanel.offsetWidth;
            
            // 添加全局事件
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            // 防止选择文本
            e.preventDefault();
        });

        const onMouseMove = (e) => {
            if (!isResizing) return;
            
            // 计算新宽度（从右边拖）
            const deltaX = startX - e.clientX;
            let newWidth = startWidth + deltaX;
            
            // 限制范围
            newWidth = Math.max(280, Math.min(600, newWidth));
            
            // 更新
            this.panelWidth = newWidth;
            this.rightPanel.style.width = `${newWidth}px`;
            document.body.style.width = `calc(100% - ${newWidth}px)`;
            document.body.style.marginRight = `${newWidth}px`;
        };

        const onMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }

    _createLayout() {
        // 1. 创建包装器
        this.wrapper = this._createElement('div', 'layout-wrapper');
        this.wrapper.className = 'seeweb-layout';

        // 2. 创建渲染占位区 (不移动 body，只占位置)
        this.renderArea = this._createElement('div', 'render-area');
        this.renderArea.className = 'seeweb-render-area';

        // 3. 创建拖拽分割器
        this.resizer = this._createElement('div', 'resizer');
        this.resizer.className = 'seeweb-resizer';
        this._bindResizerEvents();

        // 4. 创建右侧面板
        this.rightPanel = this._createElement('div', 'right-panel');
        this.rightPanel.className = 'seeweb-right-panel';
        this.rightPanel.style.width = `${this.panelWidth}px`;
        this.rightPanel.appendChild(this.resizer);

        // 4. 创建顶部工具栏
        this.toolbar = this._createElement('div', 'top-toolbar');
        this.toolbar.className = 'seeweb-toolbar';

        // 工具栏标题
        const titleWrapper = this._createElement('div', 'toolbar-title-wrapper');
        titleWrapper.className = 'seeweb-toolbar-title-wrapper';
        titleWrapper.innerHTML = `
            <div class="seeweb-toolbar-title">
                <span style="font-size: 24px;">🎨</span> SeeWeb Pro
            </div>
            <div class="seeweb-toolbar-subtitle">DOM 设计与编辑工具</div>
        `;
        this.toolbar.appendChild(titleWrapper);

        // 最小化按钮
        this.minimizeBtn = this._createElement('button', 'minimize-btn');
        this.minimizeBtn.className = 'seeweb-minimize-btn';
        this.minimizeBtn.innerHTML = '➖';
        this.minimizeBtn.addEventListener('click', () => this.minimize());
        this.toolbar.appendChild(this.minimizeBtn);

        // 5. 创建面板内容区域
        this.panelContent = this._createElement('div', 'panel-content');
        this.panelContent.className = 'seeweb-panel-content';

        // 组装
        this.rightPanel.appendChild(this.toolbar);
        this.rightPanel.appendChild(this.panelContent);
        
        this.wrapper.appendChild(this.renderArea);
        this.wrapper.appendChild(this.rightPanel);

        // 6. 保存原始状态
        this.originalHtmlStyle = {
            overflow: document.documentElement.style.overflow,
            height: document.documentElement.style.height
        };
        this.originalBodyStyle = {
            width: document.body.style.width,
            marginRight: document.body.style.marginRight
        };

        // 7. 创建浮动恢复按钮 - 使用代理工厂
        this.floatingButton = this._createElement('div', 'floating-button');
        this.floatingButton.className = 'seeweb-floating-button';
        this.floatingButton.innerHTML = '🎨';
        
        // 添加拖拽功能（要在点击事件之前添加）
        this._addDragFunctionality();
        
        // 添加点击事件（在拖拽功能之后）
        this.floatingButton.addEventListener('click', (e) => {
            if (!this.dragClickPrevented) {
                this.restoreFromMinimized();
            }
        });
    }

    /**
     * 初始化布局 - 用 CSS 而不是移动 body
     */
    init() {
        if (this.isInitialized) return;

        // 设置 body 样式 - 只压缩右边
        document.body.style.width = `calc(100% - ${this.panelWidth}px)`;
        document.body.style.marginRight = `${this.panelWidth}px`;
        document.body.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

        // 把 wrapper 插入到 html 下
        document.documentElement.appendChild(this.wrapper);

        // 确保 html 滚动正常
        document.documentElement.style.height = '100%';

        this.isInitialized = true;
    }

    /**
     * 最小化 - 隐藏面板
     */
    minimize() {
        if (!this.isInitialized || this.isMinimized) return;
        
        // 隐藏标记框
        if (this.choseManager) {
            this.choseManager.hideAllMarkers();
        }

        // 恢复 body 原始样式
        document.body.style.width = this.originalBodyStyle.width || '';
        document.body.style.marginRight = this.originalBodyStyle.marginRight || '';

        // 面板滑出动画
        this.rightPanel.style.transform = `translateX(${this.panelWidth}px)`;

        // 动画结束后隐藏面板并显示浮动按钮
        setTimeout(() => {
            // 隐藏 wrapper
            this.wrapper.style.display = 'none';

            // 显示浮动按钮
            try {
                if (this.floatingButton.parentNode) {
                    this.floatingButton.parentNode.removeChild(this.floatingButton);
                }
            } catch (e) {}
            document.body.appendChild(this.floatingButton);
            this.floatingButton.style.display = 'flex';

            this.isMinimized = true;
        }, 300);
    }

    /**
     * 从最小化状态恢复
     */
    restoreFromMinimized() {
        if (!this.isMinimized) return;

        // 隐藏并移除浮动按钮
        this.floatingButton.style.display = 'none';
        if (this.floatingButton.parentNode) {
            this.floatingButton.parentNode.removeChild(this.floatingButton);
        }

        // 压缩 body 右边
        document.body.style.width = `calc(100% - ${this.panelWidth}px)`;
        document.body.style.marginRight = `${this.panelWidth}px`;

        // 显示 wrapper
        this.wrapper.style.display = 'flex';

        // 面板初始位置（在屏幕外）
        this.rightPanel.style.transform = `translateX(${this.panelWidth}px)`;

        // 强制重排
        void this.rightPanel.offsetWidth;

        // 面板滑入动画
        this.rightPanel.style.transform = 'translateX(0)';

        // 显示标记框
        if (this.choseManager) {
            this.choseManager.showAllMarkers();
        }

        this.isMinimized = false;
    }

    /**
     * 为选择模式隐藏 - 不显示浮动按钮
     */
    hideForSelection() {
        if (!this.isInitialized) return;
        
        // 保存当前状态
        this.wasMinimized = this.isMinimized;
        this.savedPanelWidth = this.panelWidth;
        
        // 如果已经最小化了，先恢复
        if (this.isMinimized) {
            this.restoreFromMinimized();
        }
        
        // 恢复 body 原始样式
        document.body.style.width = this.originalBodyStyle.width || '';
        document.body.style.marginRight = this.originalBodyStyle.marginRight || '';

        // 面板滑出动画
        this.rightPanel.style.transform = `translateX(${this.panelWidth}px)`;

        // 动画结束后隐藏面板
        setTimeout(() => {
            // 隐藏 wrapper
            this.wrapper.style.display = 'none';

            // 不显示浮动按钮
            this.isSelectionMode = true;
        }, 300);
    }

    /**
     * 选择模式后恢复
     */
    restoreAfterSelection() {
        if (!this.isSelectionMode) return;

        const widthToUse = this.savedPanelWidth || this.panelWidth;
        
        // 压缩 body 右边
        document.body.style.width = `calc(100% - ${widthToUse}px)`;
        document.body.style.marginRight = `${widthToUse}px`;

        // 显示 wrapper
        this.wrapper.style.display = 'flex';

        // 面板初始位置（在屏幕外）
        this.rightPanel.style.transform = `translateX(${widthToUse}px)`;

        // 强制重排
        void this.rightPanel.offsetWidth;

        // 面板滑入动画
        this.rightPanel.style.transform = 'translateX(0)';

        this.isSelectionMode = false;
    }

    /**
     * 完全恢复原始布局
     */
    restore() {
        if (!this.isInitialized) return;

        if (this.isMinimized) {
            // 如果是最小化状态，先移除浮动按钮
            if (this.floatingButton.parentNode) {
                this.floatingButton.parentNode.removeChild(this.floatingButton);
            }
        } else {
            // 把 body 放回原处
            if (this.originalBodyNextSibling) {
                this.originalBodyParent.insertBefore(document.body, this.originalBodyNextSibling);
            } else {
                this.originalBodyParent.appendChild(document.body);
            }
        }

        // 恢复样式
        Object.assign(document.body.style, this.originalBodyStyle);

        // 移除 wrapper
        if (this.wrapper.parentNode) {
            this.wrapper.parentNode.removeChild(this.wrapper);
        }

        // 恢复 html 样式
        document.documentElement.style.overflow = '';
        document.documentElement.style.height = '';

        this.isInitialized = false;
        this.isMinimized = false;
    }

    /**
     * 添加内容到右侧面板
     */
    addToPanel(element, sectionTitle) {
        if (sectionTitle) {
            const section = this._createElement('div', 'panel-section');
            section.className = 'seeweb-panel-section';
            
            const header = this._createElement('div', 'panel-section-header');
            header.className = 'seeweb-panel-section-header';
            header.textContent = sectionTitle;
            
            const content = this._createElement('div', 'panel-section-content');
            content.className = 'seeweb-panel-section-content';
            content.appendChild(element);
            
            section.appendChild(header);
            section.appendChild(content);
            this.panelContent.appendChild(section);
        } else {
            this.panelContent.appendChild(element);
        }
    }

    /**
     * 获取渲染区域
     */
    getRenderArea() {
        return this.renderArea;
    }

    /**
     * 添加拖拽功能到浮动按钮
     */
    _addDragFunctionality() {
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let startTop = 0;
        let startRight = 0;
        this.dragClickPrevented = false;

        this.floatingButton.addEventListener('mousedown', (e) => {
            // 只有当点击的是按钮本身（不是内部元素）时才开始拖拽
            if (e.target === this.floatingButton) {
                isDragging = true;
                this.dragClickPrevented = false;
                startX = e.clientX;
                startY = e.clientY;
                startTop = parseInt(this.floatingButton.style.top) || 20;
                startRight = parseInt(this.floatingButton.style.right) || 20;
                
                // 改变鼠标样式
                document.body.style.cursor = 'grabbing';
                
                // 防止默认行为
                e.preventDefault();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            // 计算新位置
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // 检查是否有明显移动
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                this.dragClickPrevented = true;
            }
            
            // 计算新的 top 和 right 值
            let newTop = startTop + deltaY;
            let newRight = startRight - deltaX;
            
            // 限制在视口内
            const buttonWidth = 60;
            const buttonHeight = 60;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            newTop = Math.max(10, Math.min(viewportHeight - buttonHeight - 10, newTop));
            newRight = Math.max(10, Math.min(viewportWidth - buttonWidth - 10, newRight));
            
            // 更新位置
            this.floatingButton.style.top = `${newTop}px`;
            this.floatingButton.style.right = `${newRight}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = 'default';
                
                // 延迟重置标志，确保点击事件已经被阻止
                setTimeout(() => {
                    this.dragClickPrevented = false;
                }, 50);
            }
        });
    }

    /**
     * 获取右侧面板内容容器
     */
    getPanelContent() {
        return this.panelContent;
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.LayoutManager = LayoutManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayoutManager;
}

if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = LayoutManager;
}
