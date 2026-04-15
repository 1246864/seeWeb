/**
 * DOM元素选择工具
 * 功能：当鼠标悬停在元素上时，会在元素周围显示高亮框
 * 按Ctrl键可以在悬停过的元素之间切换
 */

// 创建选择框元素
const selectionBox = document.createElement('div')
selectionBox.className = 'choseDiv'

// 创建标签名显示元素
const tagNameDisplay = document.createElement('div')
tagNameDisplay.className = 'choseDiv_name'

// 添加到页面
selectionBox.appendChild(tagNameDisplay)
document.body.appendChild(selectionBox)

// 创建退出提示元素
const exitHint = document.createElement('div')
exitHint.className = 'exitHint'
exitHint.innerHTML = '按 ESC 退出选择模式<br>按 Ctrl 可以扩大选区'
document.body.appendChild(exitHint)

// 添加CSS样式
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

// 存储悬停过的元素列表
let hoveredElements = []
// 存储悬停过的元素列表缓存
let hoveredElementsCache = []
// 当前选中的元素索引
let currentIndex = 0
// 选择框激活状态
let isSelectionActive = false
// 鼠标位置记录
let lastMouseX = 0
let lastMouseY = 0
// 鼠标移动阈值（像素）
const MOUSE_MOVE_THRESHOLD = 10

// 禁用选择框（鼠标移动时调用）
function disableSelection() {
    selectionBox.style.pointerEvents = 'none'
    isSelectionActive = false
}

// 启用选择框（鼠标停止时调用）
function enableSelection() {
    if (hoveredElementsCache.length > 0) {
        selectionBox.style.pointerEvents = 'auto'
        isSelectionActive = true
    }
}

// 计算两点之间的距离
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

// 鼠标移动时：只有当移动距离超过阈值时才重置索引和禁用选择框
document.addEventListener('mousemove', function (e) {
    // 计算鼠标移动距离
    const distance = calculateDistance(lastMouseX, lastMouseY, e.clientX, e.clientY)

    // 检查鼠标是否靠近右上角
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const cornerDistance = calculateDistance(e.clientX, e.clientY, windowWidth - 20, 20)
    
    // 如果鼠标靠近右上角，隐藏提示框
    if (cornerDistance < 300) {
        exitHint.style.display = 'none'
    } else {
        // 只有在选择模式激活时才显示提示框
        if (isSelectionActive) {
            exitHint.style.display = 'block'
        }
    }

    // 如果移动距离超过阈值
    if (distance > MOUSE_MOVE_THRESHOLD) {
        currentIndex = 0
        disableSelection()
        // 更新鼠标位置
        lastMouseX = e.clientX
        lastMouseY = e.clientY
    }
})

// 按Ctrl键切换元素
document.addEventListener('keydown', function (e) {
    if (e.key === 'Control' && hoveredElementsCache.length > 0) {
        currentIndex = (currentIndex + 1) % hoveredElementsCache.length
        console.log('当前选中元素索引:', currentIndex)
    }
})

// 为所有非选择框元素添加鼠标悬停事件
document.querySelectorAll('body *:not(.choseDiv)').forEach(element => {
    element.addEventListener('mouseover', function () {
        if (!hoveredElements.includes(this)) {
            hoveredElements.push(this)
        }
    })

    element.addEventListener('mouseout', function () {
        const index = hoveredElements.indexOf(this)
        if (index > -1) {
            hoveredElements.splice(index, 1)
            if (index <= currentIndex && currentIndex > 0) {
                currentIndex--
            }
        }
    })
})

// 定时更新选择框位置和大小
setInterval(() => {
    // 同步悬停元素列表到缓存
    if (hoveredElements.length !== 0) {
        hoveredElementsCache = [...hoveredElements]
    }

    // 启用选择框（当有悬停元素时）
    enableSelection()

    // 更新选择框位置和样式
    if (hoveredElementsCache.length > 0) {
        const currentElement = hoveredElementsCache[currentIndex]
        if (currentElement) {
            const rect = currentElement.getBoundingClientRect()
            const x = rect.left
            const y = rect.top
            const width = rect.width
            const height = rect.height
            const padding = Math.max(2, Math.min(width, height) / 40)

            selectionBox.style.left = `${x - padding}px`
            selectionBox.style.top = `${y - padding}px`
            selectionBox.style.width = `${width + padding * 2}px`
            selectionBox.style.height = `${height + padding * 2}px`
            selectionBox.style.borderRadius = `${padding}px`

            tagNameDisplay.textContent = currentElement.tagName.toLowerCase()
        }
    }
}, 100)

// 点击选择框时获取当前元素
selectionBox.addEventListener('click', function () {
    console.log('点击选择框')
    const selectedElement = hoveredElementsCache[currentIndex]
    console.log(selectedElement)
    disableChoseDiv() // 点击选择框后禁用选择器
})

// 启用/禁用选择框的公共函数
function enableChoseDiv() {
    selectionBox.style.display = 'block'
    // 检查鼠标是否靠近右上角
    const mouseX = lastMouseX || 0
    const mouseY = lastMouseY || 0
    const windowWidth = window.innerWidth
    const cornerDistance = calculateDistance(mouseX, mouseY, windowWidth - 20, 20)
    
    // 只有当鼠标不靠近右上角时才显示提示框
    if (cornerDistance >= 100) {
        exitHint.style.display = 'block'
    }
    
    isSelectionActive = true
}

function disableChoseDiv() {
    selectionBox.style.display = 'none'
    exitHint.style.display = 'none'
    isSelectionActive = false
    hoveredElements = []
    hoveredElementsCache = []
    currentIndex = 0
}

// 按Escape键禁用选择框
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        disableChoseDiv()
    }
})

enableChoseDiv()