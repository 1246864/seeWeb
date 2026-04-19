/**
 * 选择面板 - 专为右侧面板设计的新一代UI
 */

class ChosePanel {
    constructor(options = {}) {
        this.choseList = options.choseList;
        this.choseManager = options.choseManager;
        this.proxyFactory = options.proxyFactory;
        this.choseDiv = options.choseDiv;
        this.choseRect = options.choseRect;
        this.layoutManager = options.layoutManager;

        // 验证必需依赖
        if (!this.choseList || !this.layoutManager) {
            throw new Error('ChosePanel: choseList and layoutManager are required');
        }

        // 存储提示词映射
        this.elementPromptMap = new Map();

        this._createPanel();
        this._bindEvents();
    }

    _createElement(tag, key) {
        // 静态 UI 不使用代理工厂，避免选择时被移除
        return document.createElement(tag);
    }

    _createPanel() {
        this.container = this._createElement('div', 'chose-panel');
        this.container.style.cssText = `
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 0;
        `;

        // 1. 模式切换标签
        const tabs = this._createElement('div', 'chose-tabs');
        tabs.style.cssText = `
            display: flex;
            background: rgba(0,0,0,0.2);
            border-bottom: 1px solid rgba(255,255,255,0.08);
        `;

        this.tabCreate = this._createElement('button', 'tab-create');
        this.tabCreate.textContent = '✨ 创建';
        this.tabCreate.style.cssText = `
            flex: 1;
            padding: 12px 16px;
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border-bottom: 2px solid transparent;
        `;

        this.tabSelect = this._createElement('button', 'tab-select');
        this.tabSelect.textContent = '🔍 选择';
        this.tabSelect.style.cssText = `
            flex: 1;
            padding: 12px 16px;
            background: transparent;
            border: none;
            color: white;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border-bottom: 2px solid #a855f7;
            background: rgba(168,85,247,0.1);
        `;

        tabs.appendChild(this.tabCreate);
        tabs.appendChild(this.tabSelect);

        // 2. 创建内容区
        this.contentCreate = this._createElement('div', 'content-create');
        this.contentCreate.style.cssText = `
            display: none;
            padding: 16px;
        `;
        this.contentCreate.innerHTML = `
            <div style="font-size: 14px; color: #64748b; text-align: center; padding: 40px 20px;">
                <div style="font-size: 48px; margin-bottom: 12px;">🚧</div>
                <div>创建功能开发中...</div>
            </div>
        `;

        // 3. 选择内容区
        this.contentSelect = this._createElement('div', 'content-select');
        this.contentSelect.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding: 16px;
        `;

        // --- 选择模式 ---
        const modeSection = this._createElement('div', 'mode-section');
        modeSection.innerHTML = `
            <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">选择模式</div>
            <div style="display: flex; gap: 10px;">
                <button id="btn-single" style="flex: 1; padding: 10px 14px; background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); color: #e9d5ff; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                    ◉ 单选
                </button>
                <button id="btn-rect" style="flex: 1; padding: 10px 14px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #a7f3d0; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                    ▢ 扩选
                </button>
            </div>
        `;

        // --- 操作区 ---
        const actionSection = this._createElement('div', 'action-section');
        actionSection.innerHTML = `
            <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">操作</div>
            <div style="display: flex; gap: 10px;">
                <button id="btn-undo" style="flex: 1; padding: 10px 14px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); color: #93c5fd; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
                    ↺ 撤销
                </button>
                <button id="btn-clear" style="flex: 1; padding: 10px 14px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
                    ✕ 清除
                </button>
            </div>
        `;

        // --- 提示词区 ---
        const promptSection = this._createElement('div', 'prompt-section');
        promptSection.innerHTML = `
            <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">提示词</div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <textarea id="prompt-textarea" placeholder="请输入对选中元素的修改提示..." style="width: 100%; min-height: 80px; padding: 10px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #e2e8f0; font-size: 13px; resize: vertical; outline: none;"></textarea>
                <button id="btn-send-prompt" style="width: 100%; padding: 12px 14px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border: none; color: white; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
                    � 发送提示词
                </button>
            </div>
        `;

        // --- 选中元素列表 ---
        this.listSection = this._createElement('div', 'list-section');
        this.listSection.innerHTML = `
            <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                已选中 (<span id="list-count">0</span>)
            </div>
            <div id="selected-list" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; max-height: 200px; overflow-y: auto; padding: 8px;">
                <div style="color: #64748b; font-size: 12px; text-align: center; padding: 20px;">
                    暂无选中元素
                </div>
            </div>
        `;

        this.contentSelect.appendChild(modeSection);
        this.contentSelect.appendChild(actionSection);
        this.contentSelect.appendChild(promptSection);
        this.contentSelect.appendChild(this.listSection);

        // 组装
        this.container.appendChild(tabs);
        this.container.appendChild(this.contentCreate);
        this.container.appendChild(this.contentSelect);
    }

    _bindEvents() {
        // 标签切换
        this.tabCreate.addEventListener('click', () => {
            this.tabCreate.style.color = 'white';
            this.tabCreate.style.background = 'rgba(168,85,247,0.1)';
            this.tabCreate.style.borderBottom = '2px solid #a855f7';
            this.tabSelect.style.color = '#94a3b8';
            this.tabSelect.style.background = 'transparent';
            this.tabSelect.style.borderBottom = '2px solid transparent';
            
            this.contentCreate.style.display = 'block';
            this.contentSelect.style.display = 'none';
            
            if (this.choseManager) this.choseManager.hideAllMarkers();
        });

        this.tabSelect.addEventListener('click', () => {
            this.tabSelect.style.color = 'white';
            this.tabSelect.style.background = 'rgba(168,85,247,0.1)';
            this.tabSelect.style.borderBottom = '2px solid #a855f7';
            this.tabCreate.style.color = '#94a3b8';
            this.tabCreate.style.background = 'transparent';
            this.tabCreate.style.borderBottom = '2px solid transparent';
            
            this.contentSelect.style.display = 'flex';
            this.contentCreate.style.display = 'none';
            
            if (this.choseManager) this.choseManager.showAllMarkers();
        });

        // 按钮事件
        const btnSingle = this.container.querySelector('#btn-single');
        btnSingle.addEventListener('click', () => {
            if (this.choseDiv) {
                if (this.choseRect) this.choseRect.disable();
                this.choseDiv.enable();
            }
        });

        const btnRect = this.container.querySelector('#btn-rect');
        btnRect.addEventListener('click', () => {
            if (this.choseRect) {
                if (this.choseDiv) this.choseDiv.disable();
                this.choseRect.enable();
            }
        });

        const btnUndo = this.container.querySelector('#btn-undo');
        btnUndo.addEventListener('click', () => {
            if (this.choseList) this.choseList.undo();
        });

        const btnClear = this.container.querySelector('#btn-clear');
        btnClear.addEventListener('click', () => {
            if (this.choseList) this.choseList.clear();
        });

        const btnSendPrompt = this.container.querySelector('#btn-send-prompt');
        btnSendPrompt.addEventListener('click', () => {
            this._onSendPrompt();
        });

        // 监听选择列表变化
        if (this.choseList) {
            this.choseList.on(() => {
                this._updateList();
            });
        }
    }

    _updateList() {
        const listCount = this.container.querySelector('#list-count');
        const selectedList = this.container.querySelector('#selected-list');
        
        if (!this.choseList) return;
        
        const elements = this.choseList.getList();
        listCount.textContent = elements.length;
        
        if (elements.length === 0) {
            selectedList.innerHTML = `
                <div style="color: #64748b; font-size: 12px; text-align: center; padding: 20px;">
                    暂无选中元素
                </div>
            `;
        } else {
            selectedList.innerHTML = elements.map((el, index) => {
                const tagName = el.tagName.toLowerCase();
                const id = el.id ? `#${el.id}` : '';
                const className = el.className ? `.${el.className.split(' ')[0]}` : '';
                
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 6px;">
                        <div style="font-family: monospace; font-size: 12px; color: #e2e8f0;">
                            <span style="color: #8b5cf6;">&lt;</span>${tagName}<span style="color: #64748b;">${id}${className}</span><span style="color: #8b5cf6;">&gt;</span>
                        </div>
                        <button data-index="${index}" style="background: rgba(239,68,68,0.2); border: none; color: #fca5a5; width: 22px; height: 22px; border-radius: 4px; cursor: pointer; font-size: 12px;">×</button>
                    </div>
                `;
            }).join('');
            
            // 绑定删除按钮
            selectedList.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    const el = elements[index];
                    if (el && this.choseList) {
                        this.choseList.remove(el);
                    }
                });
            });
        }
    }

    _onSendPrompt() {
        const textarea = this.container.querySelector('#prompt-textarea');
        const prompt = textarea.value.trim();

        if (!this.choseList) {
            return;
        }

        const elements = this.choseList.getList();

        if (elements.length === 0) {
            return;
        }

        if (!prompt) {
            return;
        }

        elements.forEach(element => {
            this.elementPromptMap.set(element, prompt);
        });

        // 清空输入框
        textarea.value = '';
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

    /**
     * 获取容器元素，用于添加到布局
     */
    getElement() {
        return this.container;
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.ChosePanel = ChosePanel;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChosePanel;
}

if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = ChosePanel;
}
