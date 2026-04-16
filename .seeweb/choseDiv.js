/**
 * DOM元素选择工具
 * 功能：当鼠标悬停在元素上时，会在元素周围显示高亮框
 * 按Ctrl键可以在悬停过的元素之间切换
 */

class ChoseDiv {
    constructor() {
        // 创建选择框元素
        this.selectionBox = document.createElement('div')
        this.selectionBox.className = 'choseDiv'

        // 创建标签名显示元素
        this.tagNameDisplay = document.createElement('div')
        this.tagNameDisplay.className = 'choseDiv_name'

        // 添加到页面
        this.selectionBox.appendChild(this.tagNameDisplay)
        document.body.appendChild(this.selectionBox)

        // 创建退出提示元素
        this.exitHint = document.createElement('div')
        this.exitHint.className = 'exitHint'
        this.exitHint.innerHTML = '<div class="seeWeb_exitHint_title">单选模式</div>按 ESC 或 [鼠标右键] 退出单选模式<br>按 Ctrl 可以扩大选区'
        document.body.appendChild(this.exitHint)

        // 初始化变量
        this.hoveredElements = []
        this.hoveredElementsCache = []
        this.currentIndex = 0
        this.isSelectionActive = false
        this.lastMouseX = 0
        this.lastMouseY = 0
        this.MOUSE_MOVE_THRESHOLD = 10

        // 添加CSS样式
        this._addStyles()

        // 绑定事件
        this._bindEvents()

        // 启动定时器
        this._startTimer()
    }

    // 添加CSS样式
    _addStyles() {
        const style = document.createElement('style')
        style.textContent = `
            .choseDiv {
                position: fixed;
                border: 2px solid #3498db;
                background-color: rgba(52, 152, 219, 0.1);
                pointer-events: none;
                z-index: 9999;
                transition: all 0.2s ease;
                display: none;
            }

            .choseDiv_name {
                position: absolute;
                top: -25px;
                left: 0;
                background-color: #3498db;
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-family: Arial, sans-serif;
                white-space: nowrap;
            }
            
            .exitHint {
                overflow: hidden;
                pointer-events: none;
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 14px;
                font-family: Arial, sans-serif;
                z-index: 9999;
                display: none;
                transition: all 0.3s ease;
                text-align: right;
            }
            
        `
        document.head.appendChild(style)
    }

    // 检查鼠标是否靠近右上角
    _checkCornerDistance(x, y) {
        const windowWidth = window.innerWidth
        const cornerDistance = this._calculateDistance(x, y, windowWidth - 20, -200)

        // 如果鼠标靠近右上角，隐藏提示框
        if (cornerDistance < 500) {
            this.exitHint.style.display = 'none'
        } else {
            if (this.isSelectionActive) {
                this.exitHint.style.display = 'block'
            }
        }
    }

    // 绑定事件
    _bindEvents() {
        // 鼠标移动事件
        document.addEventListener('mousemove', (e) => {
            if (!this.isSelectionActive) return;

            // 计算鼠标移动距离
            const distance = this._calculateDistance(this.lastMouseX, this.lastMouseY, e.clientX, e.clientY)

            // 检查鼠标是否靠近右上角
            this._checkCornerDistance(e.clientX, e.clientY)

            // 如果移动距离超过阈值
            if (distance > this.MOUSE_MOVE_THRESHOLD) {
                this.currentIndex = 0
                this._disableSelection()
                // 更新鼠标位置
                this.lastMouseX = e.clientX
                this.lastMouseY = e.clientY
            }
        })

        // 按Ctrl键切换元素
        document.addEventListener('keydown', (e) => {
            if (!this.isSelectionActive) return;

            if (e.key === 'Control' && this.hoveredElementsCache.length > 0) {
                this.currentIndex = (this.currentIndex + 1) % this.hoveredElementsCache.length
                console.log('当前选中元素索引:', this.currentIndex)
            }
        })

        // 为所有非选择框元素添加鼠标悬停事件
        this._addHoverEvents()

        // 点击选择框时获取当前元素
        this.selectionBox.addEventListener('click', () => {
            if (!this.isSelectionActive) return;

            console.log('点击选择框')
            const selectedElement = this.hoveredElementsCache[this.currentIndex]
            console.log(selectedElement)
            if (selectedElement) {
                choseList.add(selectedElement)
            }
        })

        // 按Escape键禁用选择框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSelectionActive) {
                this.disable()
            }
            // 按Ctrl+Z撤销上一次操作
            else if (e.ctrlKey && e.key === 'z') {
                e.preventDefault() // 阻止默认的撤销行为
                choseList.undo()
            }
        })

        // 鼠标右键点击退出选择器
        document.addEventListener('contextmenu', (e) => {
            if (this.isSelectionActive) {
                e.preventDefault() // 阻止默认的右键菜单
                this.disable()
                // 显示选择模式UI
                if (typeof choseUI !== 'undefined' && choseUI.show) {
                    choseUI.show()
                }
            }
        })
    }

    // 为所有元素添加悬停事件
    _addHoverEvents() {
        document.querySelectorAll('body *:not(.choseDiv)').forEach(element => {
            element.addEventListener('mouseover', () => {
                if (!this.isSelectionActive) return;

                if (!this.hoveredElements.includes(element)) {
                    this.hoveredElements.push(element)
                }
            })

            element.addEventListener('mouseout', () => {
                if (!this.isSelectionActive) return;

                const index = this.hoveredElements.indexOf(element)
                if (index > -1) {
                    this.hoveredElements.splice(index, 1)
                    if (index <= this.currentIndex && this.currentIndex > 0) {
                        this.currentIndex--
                    }
                }
            })
        })
    }

    // 启动定时器
    _startTimer() {
        setInterval(() => {
            if (!this.isSelectionActive) return;

            // 同步悬停元素列表到缓存
            if (this.hoveredElements.length !== 0) {
                this.hoveredElementsCache = [...this.hoveredElements]
            }

            // 启用选择框（当有悬停元素时）
            this._enableSelection()

            // 更新选择框位置和样式
            if (this.hoveredElementsCache.length > 0) {
                const currentElement = this.hoveredElementsCache[this.currentIndex]
                if (currentElement) {
                    const rect = currentElement.getBoundingClientRect()
                    const x = rect.left
                    const y = rect.top
                    const width = rect.width
                    const height = rect.height
                    const padding = Math.max(2, Math.min(width, height) / 40)

                    this.selectionBox.style.left = `${x - padding}px`
                    this.selectionBox.style.top = `${y - padding}px`
                    this.selectionBox.style.width = `${width + padding * 2}px`
                    this.selectionBox.style.height = `${height + padding * 2}px`
                    this.selectionBox.style.borderRadius = `${padding}px`

                    this.tagNameDisplay.textContent = currentElement.tagName.toLowerCase()
                }
            }
        }, 100)
    }

    // 禁用选择框
    _disableSelection() {
        this.selectionBox.style.pointerEvents = 'none'
    }

    // 启用选择框
    _enableSelection() {
        if (this.hoveredElementsCache.length > 0) {
            this.selectionBox.style.pointerEvents = 'auto'
        }
    }

    // 计算两点之间的距离
    _calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
    }

    // 启用选择器
    enable() {
        this.selectionBox.style.display = 'block'

        // 检查鼠标是否靠近右上角
        const mouseX = this.lastMouseX || 0
        const mouseY = this.lastMouseY || 0
        this._checkCornerDistance(mouseX, mouseY)

        this.isSelectionActive = true
    }

    // 禁用选择器
    disable() {
        this.selectionBox.style.display = 'none'
        this.exitHint.style.display = 'none'
        this.isSelectionActive = false
        this.hoveredElements = []
        this.hoveredElementsCache = []
        this.currentIndex = 0
    }

    // 撤回功能
    undo() {
        if (typeof choseList !== 'undefined' && choseList.undo) {
            choseList.undo()
        }
    }
}

// 导出实例
const choseDiv = new ChoseDiv()

// 如果你需要使用CommonJS模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = choseDiv
}

// 如果你需要使用ES模块导出
if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = choseDiv
}

// 全局导出
if (typeof window !== 'undefined') {
    window.choseDiv = choseDiv
}

// 初始启用
// choseDiv.enable()