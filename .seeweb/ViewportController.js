/**
 * 视口控制器
 */
class ViewportController {
    constructor(options = {}) {
        this.proxyFactory = options.proxyFactory;
        this.layoutManager = options.layoutManager;
        
        this.container = null;
        this._createElement = options.proxyFactory.createElement.bind(options.proxyFactory);
        
        this._init();
    }

    _init() {
        this._createUI();
        this._bindEvents();
    }

    _createUI() {
        // 创建容器
        this.container = this._createElement('div', 'viewport-controller');
        this.container.className = 'seeweb-viewport-controller';
        
        // 内容区
        const content = this._createElement('div', 'viewport-content');
        content.className = 'seeweb-viewport-content';
        
        // 描述
        const desc = this._createElement('div', 'viewport-desc');
        desc.className = 'seeweb-viewport-desc';
        desc.textContent = '选择预设设备尺寸，或手动输入宽度';
        content.appendChild(desc);
        
        // 预设按钮
        const presets = this._createElement('div', 'viewport-presets');
        presets.className = 'seeweb-viewport-presets';
        
        const presetSizes = [
            { name: '自动', width: null, icon: '↔️' },
            { name: '手机', width: 375, icon: '📱' },
            { name: '平板', width: 768, icon: '📱' },
            { name: '小屏', width: 1024, icon: '💻' },
            { name: '桌面', width: 1440, icon: '🖥️' }
        ];
        
        presetSizes.forEach(preset => {
            const btn = this._createElement('button', `viewport-btn-${preset.name}`);
            btn.className = 'seeweb-viewport-btn';
            btn.innerHTML = `<span class="icon">${preset.icon}</span><span class="name">${preset.name}</span>`;
            btn.dataset.width = preset.width;
            
            btn.addEventListener('click', () => {
                if (this.layoutManager) {
                    this.layoutManager.setSimulatedViewport(preset.width);
                }
            });
            presets.appendChild(btn);
        });
        content.appendChild(presets);
        
        // 自定义输入
        const customInput = this._createElement('div', 'viewport-custom');
        customInput.className = 'seeweb-viewport-custom';
        
        const input = this._createElement('input', 'viewport-input');
        input.className = 'seeweb-viewport-input';
        input.type = 'number';
        input.placeholder = '输入宽度 (px)';
        input.min = '320';
        input.max = '3840';
        
        const applyBtn = this._createElement('button', 'viewport-apply-btn');
        applyBtn.className = 'seeweb-viewport-apply-btn';
        applyBtn.textContent = '应用';
        applyBtn.addEventListener('click', () => {
            const width = parseInt(input.value);
            if (width && width >= 320 && width <= 3840 && this.layoutManager) {
                this.layoutManager.setSimulatedViewport(width);
            }
        });
        
        customInput.appendChild(input);
        customInput.appendChild(applyBtn);
        content.appendChild(customInput);
        
        // 当前宽度显示
        const current = this._createElement('div', 'viewport-current');
        current.className = 'seeweb-viewport-current';
        current.innerHTML = '当前宽度: <span class="seeweb-viewport-width">自动</span>';
        content.appendChild(current);
        
        this.container.appendChild(content);
    }

    _bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', this._onKeyDown.bind(this));
    }

    _onKeyDown(e) {
        if (e.key === 'Escape') {
            if (this.layoutManager) {
                this.layoutManager.showMorePanel();
            }
        }
    }

    show() {
        // 已在LayoutManager中处理
    }

    getElement() {
        return this.container;
    }

    destroy() {
        document.removeEventListener('keydown', this._onKeyDown);
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

if (typeof window !== 'undefined') {
    window.ViewportController = ViewportController;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewportController;
}
if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = ViewportController;
}
