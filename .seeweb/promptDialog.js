
/**
 * 提示词对话框
 * 功能：当选择了多个元素时弹出对话框，让用户为选中的元素填写提示词
 * 职责：管理提示词输入界面，存储元素与提示词的映射关系
 */

class PromptDialog {
    /**
     * 构造函数
     * @param {Object} options - 配置选项
     * @param {Object} options.choseList - 选择列表实例
     * @param {Object} options.choseManager - 选择管理器实例
     * @param {Object} options.proxyFactory - 代理工厂实例
     * @param {Object} options.uiManager - UI管理器实例
     * @param {string} options.uiKey - 组件在uiManager中的key
     */
    constructor(options = {}) {
        this.choseList = options.choseList;
        this.choseManager = options.choseManager;
        this.proxyFactory = options.proxyFactory;
        this.uiManager = options.uiManager;
        this.uiKey = options.uiKey;

        this.elementPromptMap = new Map();
        this._dialog = null;
        this._textarea = null;
        this._elementInfo = null;
        
        // 拖动状态标志
        this._isDragging = false;
        this._justFinishedDragging = false;

        this._bindChoseListEvents();
        this._createDialog();
        this._initDrag();
    }

    _createElement(tag, key) {
        if (this.proxyFactory) {
            return this.proxyFactory.createElement(tag, key);
        }
        return document.createElement(tag);
    }

    _bindChoseListEvents() {
        if (!this.choseList) {
            return;
        }

        this.choseList.on((action, data) => {
            // 只在清空时隐藏对话框，不再在添加元素时自动弹出
            if (action === 'clear') {
                this.hide();
                this.elementPromptMap.clear();
            }
        });
    }

    _createDialog() {
        const container = this._createElement('div', 'promptDialog-container');
        container.className = 'seeWeb_promptDialog';

        const header = this._createElement('div', 'promptDialog-header');
        header.className = 'seeWeb_promptDialog_header';
        header.style.cursor = 'move';

        const title = this._createElement('span', 'promptDialog-title');
        title.className = 'seeWeb_promptDialog_title';
        title.textContent = '设置提示词';

        const closeBtn = this._createElement('span', 'promptDialog-close');
        closeBtn.className = 'seeWeb_promptDialog_close';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide();
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        const body = this._createElement('div', 'promptDialog-body');
        body.className = 'seeWeb_promptDialog_body';

        this._elementInfo = this._createElement('div', 'promptDialog-elementInfo');
        this._elementInfo.className = 'seeWeb_promptDialog_elementInfo';
        this._elementInfo.textContent = '已选择 0 个元素';

        const textareaWrapper = this._createElement('div', 'promptDialog-textareaWrapper');
        textareaWrapper.className = 'seeWeb_promptDialog_textareaWrapper';

        const label = this._createElement('label', 'promptDialog-label');
        label.className = 'seeWeb_promptDialog_label';
        label.textContent = '提示词：';

        this._textarea = this._createElement('textarea', 'promptDialog-textarea');
        this._textarea.className = 'seeWeb_promptDialog_textarea';
        this._textarea.placeholder = '请输入对这些元素的修改提示...';

        textareaWrapper.appendChild(label);
        textareaWrapper.appendChild(this._textarea);

        body.appendChild(this._elementInfo);
        body.appendChild(textareaWrapper);

        const footer = this._createElement('div', 'promptDialog-footer');
        footer.className = 'seeWeb_promptDialog_footer';

        const cancelBtn = this._createElement('button', 'promptDialog-cancel');
        cancelBtn.className = 'seeWeb_promptDialog_btn seeWeb_promptDialog_btnCancel';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => this.hide());

        const confirmBtn = this._createElement('button', 'promptDialog-confirm');
        confirmBtn.className = 'seeWeb_promptDialog_btn seeWeb_promptDialog_btnConfirm';
        confirmBtn.textContent = '确认添加';
        confirmBtn.addEventListener('click', () => this._onConfirm());

        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);

        container.appendChild(header);
        container.appendChild(body);
        container.appendChild(footer);

        document.body.appendChild(container);
        this._dialog = container;
    }

    _updateElementInfo() {
        if (!this.choseList) {
            return;
        }

        const elements = this.choseList.list;
        const count = elements.length;

        if (count === 0) {
            this._elementInfo.textContent = '未选择任何元素';
            return;
        }

        const tags = elements.map(el => {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : '';
            const cls = el.className ? `.${el.className.split(' ')[0]}` : '';
            return `<${tag}${id}${cls}>`;
        });

        const displayTags = tags.slice(0, 3);
        const moreText = tags.length > 3 ? ` 等${tags.length}个` : '';
        this._elementInfo.innerHTML = `已选择 ${count} 个元素：${displayTags.join(', ')}${moreText}`;
    }

    _onConfirm() {
        const prompt = this._textarea.value.trim();

        if (!this.choseList) {
            return;
        }

        const elements = this.choseList.list;

        if (elements.length === 0) {
            this.hide();
            return;
        }

        elements.forEach(element => {
            this.elementPromptMap.set(element, prompt);
        });

        console.log('PromptDialog: 已为', elements.length, '个元素添加提示词:', prompt);

        this._textarea.value = '';
        this.hide();
    }

    show() {
        if (this._dialog) {
            this._updateElementInfo();
        }
        
        if (this.uiManager && this.uiKey) {
            this.uiManager.show(this.uiKey);
            
            // 居中显示
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const dialogWidth = this._dialog.offsetWidth;
            const dialogHeight = this._dialog.offsetHeight;
            
            let left = (windowWidth - dialogWidth) / 2;
            let top = (windowHeight - dialogHeight) / 2;
            
            if (left < 0) left = 0;
            if (top < 0) top = 0;
            if (left + dialogWidth > windowWidth) left = windowWidth - dialogWidth;
            if (top + dialogHeight > windowHeight) top = windowHeight - dialogHeight;
            
            this._dialog.style.left = `${left}px`;
            this._dialog.style.top = `${top}px`;
        }
    }

    hide() {
        if (this.uiManager && this.uiKey) {
            this.uiManager.hide(this.uiKey);
        }
    }

    _isVisible() {
        return this._dialog && this._dialog.style.display === 'block';
    }

    getPromptMap() {
        return this.elementPromptMap;
    }

    getPromptForElement(element) {
        return this.elementPromptMap.get(element);
    }

    getAllPrompts() {
        const result = [];
        this.elementPromptMap.forEach((prompt, element) => {
            result.push({
                element: element,
                prompt: prompt,
                tagName: element.tagName,
                outerHTML: element.outerHTML
            });
        });
        return result;
    }

    clearPrompts() {
        this.elementPromptMap.clear();
    }

    _initDrag() {
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;
        let hasMoved = false;

        const header = this._dialog.querySelector('.seeWeb_promptDialog_header');

        header.addEventListener('mousedown', (e) => {
            this._isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;

            const rect = this._dialog.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this._isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                hasMoved = true;
            }

            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;

            const containerWidth = this._dialog.offsetWidth;
            const containerHeight = this._dialog.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            if (newLeft < 0) {
                newLeft = 0;
            }
            if (newLeft + containerWidth > windowWidth) {
                newLeft = windowWidth - containerWidth;
            }
            if (newTop < 0) {
                newTop = 0;
            }
            if (newTop + containerHeight > windowHeight) {
                newTop = windowHeight - containerHeight;
            }

            this._dialog.style.left = `${newLeft}px`;
            this._dialog.style.top = `${newTop}px`;
        });

        document.addEventListener('mouseup', () => {
            if (this._isDragging) {
                this._isDragging = false;
                if (hasMoved) {
                    this._justFinishedDragging = true;
                    setTimeout(() => {
                        this._justFinishedDragging = false;
                    }, 100);
                }
                document.body.style.userSelect = '';
            }
        });
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptDialog;
}

if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = PromptDialog;
}

if (typeof window !== 'undefined') {
    window.PromptDialog = PromptDialog;
}
