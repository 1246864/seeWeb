/**
 * 拖动扩选工具
 * 功能：通过拖动鼠标创建矩形，选择矩形内的所有DOM元素
 */

// 避免变量重复声明
if (typeof window !== 'undefined' && !window.ChoseRect) {
    window.ChoseRect = class ChoseRect {
        constructor() {
            // 创建选择框元素
            this.selectionRect = document.createElement('div')
            this.selectionRect.className = 'choseRect'
            
            // 创建全局蒙版
            this.mask = document.createElement('div')
            this.mask.className = 'choseRectMask'
            
            // 创建退出提示元素
            this.exitHint = document.createElement('div')
            this.exitHint.className = 'exitHint'
            this.exitHint.innerHTML = '按 ESC 退出扩选模式<br>按鼠标拖动进行扩选'
            
            // 添加到页面
            document.body.appendChild(this.selectionRect)
            document.body.appendChild(this.mask)
            document.body.appendChild(this.exitHint)
            
            // 初始化变量
            this.isDragging = false
            this.startX = 0
            this.startY = 0
            this.isActive = false
            this.lastMouseX = 0
            this.lastMouseY = 0
            
            // 添加CSS样式
            this._addStyles()
            
            // 绑定事件
            this._bindEvents()
        }

        // 添加CSS样式
        _addStyles() {
            const style = document.createElement('style')
            style.textContent = `
                .choseRect {
                    position: fixed;
                    border: 2px solid #2ecc71;
                    background-color: rgba(46, 204, 113, 0.2);
                    pointer-events: none;
                    z-index: 9999;
                    display: none;
                }
                
                .choseRectMask {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: transparent;
                    pointer-events: auto;
                    z-index: 9998;
                    display: none;
                }
            `
            document.head.appendChild(style)
        }

        // 绑定事件
        _bindEvents() {
            // 鼠标按下事件
            document.addEventListener('mousedown', (e) => {
                if (!this.isActive) return;
                
                // 只有左键点击才开始拖动
                if (e.button === 0) {
                    this.isDragging = true
                    this.startX = e.clientX
                    this.startY = e.clientY
                    
                    // 显示选择框
                    this.selectionRect.style.display = 'block'
                    this.selectionRect.style.left = `${this.startX}px`
                    this.selectionRect.style.top = `${this.startY}px`
                    this.selectionRect.style.width = '0'
                    this.selectionRect.style.height = '0'
                }
            })
            
            // 鼠标移动事件
            document.addEventListener('mousemove', (e) => {
                if (!this.isActive) return;
                
                // 检查鼠标是否靠近右上角
                const windowWidth = window.innerWidth
                const cornerDistance = this._calculateDistance(e.clientX, e.clientY, windowWidth - 20, 20)
                
                // 如果鼠标靠近右上角，隐藏提示框
                if (cornerDistance < 300) {
                    this.exitHint.style.display = 'none'
                } else {
                    if (this.isActive) {
                        this.exitHint.style.display = 'block'
                    }
                }
                
                // 更新鼠标位置
                this.lastMouseX = e.clientX
                this.lastMouseY = e.clientY
                
                // 如果正在拖动，更新选择框
                if (this.isDragging) {
                    // 计算选择框的位置和大小
                    const currentX = e.clientX
                    const currentY = e.clientY
                    
                    const left = Math.min(this.startX, currentX)
                    const top = Math.min(this.startY, currentY)
                    const width = Math.abs(currentX - this.startX)
                    const height = Math.abs(currentY - this.startY)
                    
                    // 更新选择框样式
                    this.selectionRect.style.left = `${left}px`
                    this.selectionRect.style.top = `${top}px`
                    this.selectionRect.style.width = `${width}px`
                    this.selectionRect.style.height = `${height}px`
                }
            })
            
            // 鼠标释放事件
            document.addEventListener('mouseup', () => {
                if (!this.isActive || !this.isDragging) return;
                
                this.isDragging = false
                
                // 获取选择框的位置和大小
                const rect = this.selectionRect.getBoundingClientRect()
                
                // 选择矩形内的所有元素
                this._selectElementsInRect(rect)
                
                // 隐藏选择框
                this.selectionRect.style.display = 'none'
            })
            
            // 按Escape键禁用扩选功能
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isActive) {
                    this.disable()
                }
            })
        }

        // 选择矩形内的所有元素
        _selectElementsInRect(rect) {
            const elements = document.querySelectorAll('body *:not(.choseRect):not(.choseDiv):not(.exitHint):not(.choseMarker)')
            const selectedElements = []
            
            elements.forEach(element => {
                const elementRect = element.getBoundingClientRect()
                
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
            })
            
            if (selectedElements.length > 0) {
                console.log('选择了', selectedElements.length, '个元素')
                
                // 批量添加所有选中的元素
                choseList.addBatch(selectedElements)
            }
        }
        
        // 计算两点之间的距离
        _calculateDistance(x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
        }
        
        // 启用扩选功能
        enable() {
            this.isActive = true
            this.mask.style.display = 'block'
            
            // 检查鼠标是否靠近右上角
            const mouseX = this.lastMouseX || 0
            const mouseY = this.lastMouseY || 0
            const windowWidth = window.innerWidth
            const cornerDistance = this._calculateDistance(mouseX, mouseY, windowWidth - 20, 20)
            
            // 只有当鼠标不靠近右上角时才显示提示框
            if (cornerDistance >= 100) {
                this.exitHint.style.display = 'block'
            }
        }
        
        // 禁用扩选功能
        disable() {
            this.isActive = false
            this.isDragging = false
            this.selectionRect.style.display = 'none'
            this.mask.style.display = 'none'
            this.exitHint.style.display = 'none'
        }
    }

    // 导出实例
    window.choseRect = new window.ChoseRect();

}

// 如果你需要使用CommonJS模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.choseRect || new window.ChoseRect();
}

// 如果你需要使用ES模块导出
if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = window.choseRect || new window.ChoseRect();
}