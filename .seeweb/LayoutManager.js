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
        // 静态 UI 不使用代理工厂，避免选择时被移除
        return document.createElement(tag);
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
        this.wrapper.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            background: transparent;
            z-index: 9999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // 2. 创建渲染占位区 (不移动 body，只占位置)
        this.renderArea = this._createElement('div', 'render-area');
        this.renderArea.className = 'seeweb-render-area';
        this.renderArea.style.cssText = `
            flex: 1;
            min-width: 0;
            background: transparent;
            position: relative;
        `;

        // 3. 创建拖拽分割器
        this.resizer = this._createElement('div', 'resizer');
        this.resizer.style.cssText = `
            width: 6px;
            cursor: col-resize;
            background: transparent;
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 1;
            transition: background 0.2s;
        `;
        this.resizer.addEventListener('mouseenter', () => {
            this.resizer.style.background = 'rgba(124, 58, 247, 0.3)';
        });
        this.resizer.addEventListener('mouseleave', () => {
            this.resizer.style.background = 'transparent';
        });
        this._bindResizerEvents();

        // 4. 创建右侧面板
        this.rightPanel = this._createElement('div', 'right-panel');
        this.rightPanel.className = 'seeweb-right-panel';
        this.rightPanel.style.cssText = `
            width: ${this.panelWidth}px;
            min-width: 280px;
            max-width: 600px;
            background: #27293d;
            display: flex;
            flex-direction: column;
            color: #e2e8f0;
            border-left: 1px solid #374151;
            box-shadow: -4px 0 20px rgba(0,0,0,0.15);
            position: relative;
        `;
        this.rightPanel.appendChild(this.resizer);

        // 4. 创建顶部工具栏
        this.toolbar = this._createElement('div', 'top-toolbar');
        this.toolbar.className = 'seeweb-toolbar';
        this.toolbar.style.cssText = `
            padding: 12px 16px;
            background: linear-gradient(135deg, #3730a3 0%, #7c3aed 100%);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
            justify-content: space-between;
        `;

        // 工具栏标题
        const titleWrapper = this._createElement('div', 'toolbar-title-wrapper');
        titleWrapper.innerHTML = `
            <div style="font-size: 18px; font-weight: 700; color: white; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">🎨</span> SeeWeb Pro
            </div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 2px;">DOM 设计与编辑工具</div>
        `;
        this.toolbar.appendChild(titleWrapper);

        // 最小化按钮
        this.minimizeBtn = this._createElement('button', 'minimize-btn');
        this.minimizeBtn.innerHTML = '➖';
        this.minimizeBtn.style.cssText = `
            background: rgba(255,255,255,0.15);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        `;
        this.minimizeBtn.addEventListener('mouseenter', () => {
            this.minimizeBtn.style.background = 'rgba(255,255,255,0.25)';
        });
        this.minimizeBtn.addEventListener('mouseleave', () => {
            this.minimizeBtn.style.background = 'rgba(255,255,255,0.15)';
        });
        this.minimizeBtn.addEventListener('click', () => this.minimize());
        this.toolbar.appendChild(this.minimizeBtn);

        // 5. 创建面板内容区域
        this.panelContent = this._createElement('div', 'panel-content');
        this.panelContent.className = 'seeweb-panel-content';
        this.panelContent.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 0;
        `;

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
        this.floatingButton.innerHTML = '🎨';
        this.floatingButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #3730a3 0%, #7c3aed 100%);
            border-radius: 50%;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            cursor: pointer;
            z-index: 9999998;
            box-shadow: 0 4px 20px rgba(124, 58, 247, 0.4);
            transition: all 0.2s;
        `;
        this.floatingButton.addEventListener('mouseenter', () => {
            this.floatingButton.style.transform = 'scale(1.1)';
        });
        this.floatingButton.addEventListener('mouseleave', () => {
            this.floatingButton.style.transform = 'scale(1)';
        });
        this.floatingButton.addEventListener('click', () => this.restoreFromMinimized());
    }

    /**
     * 初始化布局 - 用 CSS 而不是移动 body
     */
    init() {
        if (this.isInitialized) return;

        // 设置 body 样式 - 只压缩右边
        document.body.style.width = `calc(100% - ${this.panelWidth}px)`;
        document.body.style.marginRight = `${this.panelWidth}px`;

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

        // 隐藏 wrapper
        this.wrapper.style.display = 'none';

        // 不显示浮动按钮
        this.isSelectionMode = true;
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
            section.style.cssText = `
                border-bottom: 1px solid rgba(255,255,255,0.08);
            `;
            
            const header = this._createElement('div', 'panel-section-header');
            header.style.cssText = `
                padding: 14px 18px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #94a3b8;
                background: rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            header.textContent = sectionTitle;
            
            const content = this._createElement('div', 'panel-section-content');
            content.style.cssText = `
                padding: 16px 18px;
            `;
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
