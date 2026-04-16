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
     */
    constructor(options = {}) {
        // 依赖注入，确保模块松耦合
        this.choseDiv = options.choseDiv;
        this.choseRect = options.choseRect;
        this.choseList = options.choseList;
        
        // 验证必要依赖
        if (!this.choseDiv || !this.choseRect) {
            console.warn('ChoseUI: Missing required dependencies (choseDiv or choseRect)');
        }
        
        // 创建UI容器
        this.container = document.createElement('div');
        this.container.className = 'seeWeb_choseUI';
        
        // 创建标题
        this.title = document.createElement('h3');
        this.title.textContent = '选择模式';
        
        // 创建单选模式按钮
        this.singleSelectBtn = document.createElement('button');
        this.singleSelectBtn.className = 'seeWeb_choseUIBtn';
        this.singleSelectBtn.textContent = '单选模式';
        
        // 创建扩选模式按钮
        this.rectSelectBtn = document.createElement('button');
        this.rectSelectBtn.className = 'seeWeb_choseUIBtn';
        this.rectSelectBtn.textContent = '扩选模式';
        
        // 创建撤回按钮
        this.undoBtn = document.createElement('button');
        this.undoBtn.className = 'seeWeb_choseUIBtn';
        this.undoBtn.textContent = '撤回';
        
        // 组装UI
        this.container.appendChild(this.title);
        this.container.appendChild(this.singleSelectBtn);
        this.container.appendChild(this.rectSelectBtn);
        this.container.appendChild(this.undoBtn);
        
        // 添加到页面
        document.body.appendChild(this.container);
        
        // 初始化变量
        this.isVisible = true;
        
        // 添加CSS样式
        this._addStyles();
        
        // 绑定事件
        this._bindEvents();
    }
    
    // 添加CSS样式 - 样式已统一到seeweb.css文件中
    _addStyles() {
        // 样式已统一到seeweb.css文件中，此处不再重复添加
    }
    
    // 绑定事件
    _bindEvents() {
        // 单选模式按钮点击事件
        this.singleSelectBtn.addEventListener('click', () => {
            // 隐藏UI
            this.hide();
            
            // 禁用扩选模式
            if (this.choseRect) {
                this.choseRect.disable();
            }
            
            // 启用单选模式
            if (this.choseDiv) {
                this.choseDiv.enable();
            }
        });
        
        // 扩选模式按钮点击事件
        this.rectSelectBtn.addEventListener('click', () => {
            // 隐藏UI
            this.hide();
            
            // 禁用单选模式
            if (this.choseDiv) {
                this.choseDiv.disable();
            }
            
            // 启用扩选模式
            if (this.choseRect) {
                this.choseRect.enable();
            }
        });
        
        // 撤回按钮点击事件
        this.undoBtn.addEventListener('click', () => {
            // 调用撤回功能
            if (this.choseList) {
                this.choseList.undo();
            } else if (this.choseDiv) {
                this.choseDiv.undo();
            } else if (this.choseRect) {
                this.choseRect.undo();
            }
        });
        
        // 监听ESC键，显示UI
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // 显示UI
                this.show();
                
                // 禁用所有选择模式
                if (this.choseDiv) {
                    this.choseDiv.disable();
                }
                if (this.choseRect) {
                    this.choseRect.disable();
                }
            }
        });
    }
    
    // 显示UI
    show() {
        this.container.style.display = 'block';
        this.isVisible = true;
    }
    
    // 隐藏UI
    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
    }
    
    // 切换UI可见性
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// 导出类（不直接创建实例，由外部负责依赖注入）

// 如果你需要使用CommonJS模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChoseUI;
}

// 如果你需要使用ES模块导出
if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = ChoseUI;
}

// 全局导出
if (typeof window !== 'undefined') {
    window.ChoseUI = ChoseUI;
}
