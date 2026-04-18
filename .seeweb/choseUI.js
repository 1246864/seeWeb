/**
 * 选择模式UI管理
 * 功能：提供单选模式和扩选模式的切换按钮，管理UI的显示和隐藏
 * 职责：只负责UI渲染和用户交互，通过依赖注入与选择器组件通信
 */

class ChoseUI {
    /**
     * 构造函数
     * @param {Object} options - 配置选项
     * @param {Object} options.choseDiv - 单选模式选择器实例
     * @param {Object} options.choseRect - 扩选模式选择器实例
     * @param {Object} options.choseList - 选择列表实例（用于撤回操作）
     * @param {Object} options.choseManager - 选择管理器实例（用于控制标记框显示/隐藏）
     * @param {Object} options.proxyFactory - 代理工厂实例
     */
    constructor(options = {}) {
        this.choseDiv = options.choseDiv;
        this.choseRect = options.choseRect;
        this.choseList = options.choseList;
        this.choseManager = options.choseManager;
        this.proxyFactory = options.proxyFactory;

        // 拖动状态标志
        this._isDragging = false;
        this._justFinishedDragging = false;

        if (!this.choseDiv || !this.choseRect) {
            console.warn('ChoseUI: Missing required dependencies (choseDiv or choseRect)');
        }

        this.isVisible = true;

        this._createUI();
        this._bindEvents();
    }

    _createUI() {
        // 使用代理工厂创建元素，自动注册管理
        const createEl = (tag, key) => {
            return this.proxyFactory ? this.proxyFactory.createElement(tag, key) : document.createElement(tag);
        };

        this.container = createEl('div', 'choseUI-container');
        this.container.className = 'seeWeb_choseUI';

        const header = createEl('div', 'choseUI-header');
        header.className = 'seeWeb_choseUI_header';
        header.style.cursor = 'move';

        const icon = createEl('span', 'choseUI-icon');
        icon.className = 'seeWeb_choseUI_icon';
        icon.innerHTML = '◈';

        const title = createEl('span', 'choseUI-title');
        title.className = 'seeWeb_choseUI_title';
        title.textContent = 'SeeWeb';

        this.minimizeBtn = createEl('button', 'choseUI-minimizeBtn');
        this.minimizeBtn.className = 'seeWeb_choseUI_minimizeBtn';
        this.minimizeBtn.innerHTML = '−';

        header.appendChild(icon);
        header.appendChild(title);
        header.appendChild(this.minimizeBtn);

        // 添加选项卡
        const tabs = createEl('div', 'choseUI-tabs');
        tabs.className = 'seeWeb_choseUI_tabs';

        this.createTab = createEl('button', 'choseUI-createTab');
        this.createTab.className = 'seeWeb_choseUI_tab seeWeb_choseUI_tab_active';
        this.createTab.textContent = '创建';

        this.selectTab = createEl('button', 'choseUI-selectTab');
        this.selectTab.className = 'seeWeb_choseUI_tab';
        this.selectTab.textContent = '选择';

        tabs.appendChild(this.createTab);
        tabs.appendChild(this.selectTab);

        // 创建选项卡内容
        this.createContent = createEl('div', 'choseUI-createContent');
        this.createContent.className = 'seeWeb_choseUI_tabContent';

        const createSection = createEl('div', 'choseUI-createSection');
        createSection.className = 'seeWeb_choseUI_section';

        const createLabel = createEl('div', 'choseUI-createLabel');
        createLabel.className = 'seeWeb_choseUI_label';
        createLabel.textContent = '创建元素';
        createSection.appendChild(createLabel);

        const createButtons = createEl('div', 'choseUI-createButtons');
        createButtons.className = 'seeWeb_choseUI_createButtons';

        this.createBtn = createEl('button', 'choseUI-createBtn');
        this.createBtn.className = 'seeWeb_choseUIBtn seeWeb_choseUIBtn_primary';
        this.createBtn.innerHTML = '<span class="seeWeb_choseUIBtn_icon">＋</span><span>创建</span>';

        createButtons.appendChild(this.createBtn);
        createSection.appendChild(createButtons);

        this.createContent.appendChild(createSection);

        this.selectContent = createEl('div', 'choseUI-selectContent');
        this.selectContent.className = 'seeWeb_choseUI_tabContent';
        this.selectContent.style.display = 'none';

        const modeSection = createEl('div', 'choseUI-modeSection');
        modeSection.className = 'seeWeb_choseUI_section';

        const modeLabel = createEl('div', 'choseUI-modeLabel');
        modeLabel.className = 'seeWeb_choseUI_label';
        modeLabel.textContent = '选择模式';
        modeSection.appendChild(modeLabel);

        const modeButtons = createEl('div', 'choseUI-modeButtons');
        modeButtons.className = 'seeWeb_choseUI_modeButtons';

        this.singleSelectBtn = createEl('button', 'choseUI-singleSelectBtn');
        this.singleSelectBtn.className = 'seeWeb_choseUIBtn seeWeb_choseUIBtn_primary';
        this.singleSelectBtn.innerHTML = '<span class="seeWeb_choseUIBtn_icon">◉</span><span>单选</span>';

        this.rectSelectBtn = createEl('button', 'choseUI-rectSelectBtn');
        this.rectSelectBtn.className = 'seeWeb_choseUIBtn seeWeb_choseUIBtn_primary';
        this.rectSelectBtn.innerHTML = '<span class="seeWeb_choseUIBtn_icon">▢</span><span>扩选</span>';

        modeButtons.appendChild(this.singleSelectBtn);
        modeButtons.appendChild(this.rectSelectBtn);
        modeSection.appendChild(modeButtons);

        const actionSection = createEl('div', 'choseUI-actionSection');
        actionSection.className = 'seeWeb_choseUI_section';

        const actionLabel = createEl('div', 'choseUI-actionLabel');
        actionLabel.className = 'seeWeb_choseUI_label';
        actionLabel.textContent = '操作';
        actionSection.appendChild(actionLabel);

        const actionButtons = createEl('div', 'choseUI-actionButtons');
        actionButtons.className = 'seeWeb_choseUI_actionButtons';

        this.undoBtn = createEl('button', 'choseUI-undoBtn');
        this.undoBtn.className = 'seeWeb_choseUIBtn seeWeb_choseUIBtn_secondary';
        this.undoBtn.innerHTML = '<span class="seeWeb_choseUIBtn_icon">↺</span><span>撤销</span>';

        this.clearBtn = createEl('button', 'choseUI-clearBtn');
        this.clearBtn.className = 'seeWeb_choseUIBtn seeWeb_choseUIBtn_secondary';
        this.clearBtn.innerHTML = '<span class="seeWeb_choseUIBtn_icon">✕</span><span>清除</span>';

        actionButtons.appendChild(this.undoBtn);
        actionButtons.appendChild(this.clearBtn);
        actionSection.appendChild(actionButtons);

        this.selectContent.appendChild(modeSection);
        this.selectContent.appendChild(actionSection);

        this.container.appendChild(header);
        this.container.appendChild(tabs);
        this.container.appendChild(this.createContent);
        this.container.appendChild(this.selectContent);

        document.body.appendChild(this.container);
    }

    _bindEvents() {
        // 选项卡切换事件
        this.createTab.addEventListener('click', () => {
            // 激活创建选项卡
            this.createTab.classList.add('seeWeb_choseUI_tab_active');
            this.selectTab.classList.remove('seeWeb_choseUI_tab_active');

            // 显示创建内容，隐藏选择内容
            this.createContent.style.display = 'block';
            this.selectContent.style.display = 'none';

            // 隐藏所有选中元素的标记框
            if (this.choseManager && typeof this.choseManager.hideAllMarkers === 'function') {
                this.choseManager.hideAllMarkers();
            }
        });

        this.selectTab.addEventListener('click', () => {
            // 激活选择选项卡
            this.selectTab.classList.add('seeWeb_choseUI_tab_active');
            this.createTab.classList.remove('seeWeb_choseUI_tab_active');

            // 显示选择内容，隐藏创建内容
            this.selectContent.style.display = 'block';
            this.createContent.style.display = 'none';

            // 显示所有选中元素的标记框
            if (this.choseManager && typeof this.choseManager.showAllMarkers === 'function') {
                this.choseManager.showAllMarkers();
            }
        });

        // 创建按钮点击事件（空实现，待后续扩展）
        this.createBtn.addEventListener('click', () => {
            // 后续实现创建元素的逻辑
            console.log('创建按钮点击，待实现创建逻辑');
        });

        this.singleSelectBtn.addEventListener('click', () => {
            this.hide();
            if (this.choseRect) {
                this.choseRect.disable();
            }
            if (this.choseDiv) {
                this.choseDiv.enable();
            }
        });

        this.rectSelectBtn.addEventListener('click', () => {
            this.hide();
            if (this.choseDiv) {
                this.choseDiv.disable();
            }
            if (this.choseRect) {
                this.choseRect.enable();
            }
        });

        this.undoBtn.addEventListener('click', () => {
            if (this.choseList && typeof this.choseList.undo === 'function') {
                this.choseList.undo();
            } else if (this.choseDiv && typeof this.choseDiv.undo === 'function') {
                this.choseDiv.undo();
            } else if (this.choseRect && typeof this.choseRect.undo === 'function') {
                this.choseRect.undo();
            }
        });

        this.clearBtn.addEventListener('click', () => {
            if (this.choseList && typeof this.choseList.clear === 'function') {
                this.choseList.clear();
            }
        });

        // 最小化按钮点击事件
        this.minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            this._toggleMinimize();
        });

        // 点击最小化圆片恢复UI
        this.container.addEventListener('click', (e) => {
            // 如果正在拖动或刚刚完成拖动，忽略点击事件
            if (this._isDragging || this._justFinishedDragging) {
                return;
            }
            if (this.container.classList.contains('seeWeb_choseUI_minimized')) {
                this._toggleMinimize();
            }
        });

        // 拖动功能
        this._initDrag();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.show();
                if (this.choseDiv) {
                    this.choseDiv.disable();
                }
                if (this.choseRect) {
                    this.choseRect.disable();
                }
            }
        });
    }

    _initDrag() {
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;
        let hasMoved = false;

        const header = this.container.querySelector('.seeWeb_choseUI_header');

        header.addEventListener('mousedown', (e) => {
            this._isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;

            const rect = this.container.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this._isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            // 如果移动距离超过阈值，才认为是拖动
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                hasMoved = true;
            }

            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;

            // 边界检测，确保不会拖到屏幕外
            const containerWidth = this.container.offsetWidth;
            const containerHeight = this.container.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // 限制左边界
            if (newLeft < 0) {
                newLeft = 0;
            }
            // 限制右边界
            if (newLeft + containerWidth > windowWidth) {
                newLeft = windowWidth - containerWidth;
            }
            // 限制上边界
            if (newTop < 0) {
                newTop = 0;
            }
            // 限制下边界
            if (newTop + containerHeight > windowHeight) {
                newTop = windowHeight - containerHeight;
            }

            this.container.style.left = `${newLeft}px`;
            this.container.style.top = `${newTop}px`;
        });

        document.addEventListener('mouseup', () => {
            if (this._isDragging) {
                this._isDragging = false;
                // 如果有移动，设置刚刚完成拖动的标志
                if (hasMoved) {
                    this._justFinishedDragging = true;
                    // 短暂延迟后重置标志，确保点击事件被忽略
                    setTimeout(() => {
                        this._justFinishedDragging = false;
                    }, 100);
                }
                document.body.style.userSelect = '';

                // 如果是最小化状态且没有移动过（点击），恢复UI
                if (!hasMoved && this.container.classList.contains('seeWeb_choseUI_minimized')) {
                    this._toggleMinimize();
                }
            }
        });
    }

    _toggleMinimize() {
        const sections = this.container.querySelectorAll('.seeWeb_choseUI_section');
        const tabs = this.container.querySelector('.seeWeb_choseUI_tabs');
        const isMinimized = this.container.classList.contains('seeWeb_choseUI_minimized');

        if (isMinimized) {
            // 恢复正常状态，直接使用圆片当前位置
            this.container.classList.remove('seeWeb_choseUI_minimized');

            // 边界检测，确保恢复后不会超出屏幕
            let newLeft = this.container.offsetLeft;
            let newTop = this.container.offsetTop;
            const containerWidth = this.container.offsetWidth;
            const containerHeight = this.container.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            if (newLeft + containerWidth > windowWidth) {
                newLeft = windowWidth - containerWidth;
            }
            if (newTop + containerHeight > windowHeight) {
                newTop = windowHeight - containerHeight;
            }
            if (newLeft < 0) newLeft = 0;
            if (newTop < 0) newTop = 0;

            this.container.style.left = `${newLeft}px`;
            this.container.style.top = `${newTop}px`;

            sections.forEach(section => {
                section.style.display = 'block';
            });
            if (tabs) {
                tabs.style.display = 'flex';
            }
            this.minimizeBtn.innerHTML = '−';
        } else {
            // 保存当前位置
            this.previousPosition = {
                left: this.container.style.left,
                top: this.container.style.top
            };

            // 最小化 - 变成小圆片并回到左上角
            this.container.classList.add('seeWeb_choseUI_minimized');
            this.container.style.left = '10px';
            this.container.style.top = '10px';
            sections.forEach(section => {
                section.style.display = 'none';
            });
            if (tabs) {
                tabs.style.display = 'none';
            }
            this.minimizeBtn.innerHTML = '+';
        }
    }

    show() {
        this.container.style.display = 'flex';
        this.isVisible = true;
    }

    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChoseUI;
}

if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = ChoseUI;
}

if (typeof window !== 'undefined') {
    window.ChoseUI = ChoseUI;
}
