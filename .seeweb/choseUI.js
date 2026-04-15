/**
 * 选择模式UI管理
 * 功能：提供单选模式和扩选模式的切换按钮，管理UI的显示和隐藏
 */

class ChoseUI {
    constructor(options = {}) {
        // 接收依赖注入
        this.choseDiv = options.choseDiv || window.choseDiv;
        this.choseRect = options.choseRect || window.choseRect;
        
        // 创建UI容器
        this.container = document.createElement('div')
        this.container.className = 'choseUI'
        
        // 创建标题
        this.title = document.createElement('h3')
        this.title.textContent = '选择模式'
        
        // 创建单选模式按钮
        this.singleSelectBtn = document.createElement('button')
        this.singleSelectBtn.className = 'choseUIBtn'
        this.singleSelectBtn.textContent = '单选模式'
        
        // 创建扩选模式按钮
        this.rectSelectBtn = document.createElement('button')
        this.rectSelectBtn.className = 'choseUIBtn'
        this.rectSelectBtn.textContent = '扩选模式'
        
        // 组装UI
        this.container.appendChild(this.title)
        this.container.appendChild(this.singleSelectBtn)
        this.container.appendChild(this.rectSelectBtn)
        
        // 添加到页面
        document.body.appendChild(this.container)
        
        // 初始化变量
        this.isVisible = true
        
        // 添加CSS样式
        this._addStyles()
        
        // 绑定事件
        this._bindEvents()
    }
    
    // 添加CSS样式
    _addStyles() {
        const style = document.createElement('style')
        style.textContent = `
            .choseUI {
                position: fixed;
                top: 20px;
                left: 20px;
                background-color: rgba(255, 255, 255, 0.95);
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                transition: all 0.3s ease;
                font-family: Arial, sans-serif;
            }
            
            .choseUI h3 {
                margin: 0 0 15px 0;
                font-size: 16px;
                color: #333;
                text-align: center;
            }
            
            .choseUIBtn {
                display: block;
                width: 100%;
                padding: 10px;
                margin-bottom: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background-color: #f5f5f5;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            }
            
            .choseUIBtn:hover {
                background-color: #e0e0e0;
            }
            
            .choseUIBtn:last-child {
                margin-bottom: 0;
            }
        `
        document.head.appendChild(style)
    }
    
    // 绑定事件
    _bindEvents() {
        // 单选模式按钮点击事件
        this.singleSelectBtn.addEventListener('click', () => {
            // 隐藏UI
            this.hide()
            
            // 禁用扩选模式
            if (this.choseRect) {
                this.choseRect.disable()
            }
            
            // 启用单选模式
            if (this.choseDiv) {
                this.choseDiv.enable()
            }
        })
        
        // 扩选模式按钮点击事件
        this.rectSelectBtn.addEventListener('click', () => {
            // 隐藏UI
            this.hide()
            
            // 禁用单选模式
            if (this.choseDiv) {
                this.choseDiv.disable()
            }
            
            // 启用扩选模式
            if (this.choseRect) {
                this.choseRect.enable()
            }
        })
        
        // 监听ESC键，显示UI
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // 显示UI
                this.show()
                
                // 禁用所有选择模式
                if (this.choseDiv) {
                    this.choseDiv.disable()
                }
                if (this.choseRect) {
                    this.choseRect.disable()
                }
            }
        })
    }
    
    // 显示UI
    show() {
        this.container.style.display = 'block'
        this.isVisible = true
    }
    
    // 隐藏UI
    hide() {
        this.container.style.display = 'none'
        this.isVisible = false
    }
    
    // 切换UI可见性
    toggle() {
        if (this.isVisible) {
            this.hide()
        } else {
            this.show()
        }
    }
}

// 导出实例
const choseUI = new ChoseUI()

// 如果你需要使用CommonJS模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = choseUI
}

// 如果你需要使用ES模块导出
if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = choseUI
}

// 全局导出
if (typeof window !== 'undefined') {
    window.choseUI = choseUI
}
