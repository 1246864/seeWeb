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
`
document.head.appendChild(style)

// 存储悬停过的元素列表
let hoveredElements = []
// 存储悬停过的元素列表缓存
let hoveredElementsCache = []
// 当前选中的元素索引
let currentIndex = 0

// 鼠标移动时重置索引
document.addEventListener('mousemove', function () {
    currentIndex = 0
    selectionBox.style.pointerEvents = 'none'
})

// 按Ctrl键切换元素
document.addEventListener('keydown', function (e) {
    
    if (e.key === 'Control' && hoveredElementsCache.length > 0) {
        // 循环切换索引
        currentIndex = (currentIndex + 1) % hoveredElementsCache.length
        console.log('当前选中元素索引:', currentIndex)
    }
})

// 为所有非选择框元素添加鼠标悬停事件
document.querySelectorAll('body *:not(.choseDiv)').forEach(element => {
    element.addEventListener('mouseover', function () {
        // 避免重复添加相同元素
        if (!hoveredElements.includes(this)) {
            hoveredElements.push(this)
        }
    })

    element.addEventListener('mouseout', function () {
        // 从列表中移除当前元素
        const index = hoveredElements.indexOf(this)
        if (index > -1) {
            hoveredElements.splice(index, 1)
            // 如果移除的是当前选中的元素，重置索引
            if (index <= currentIndex && currentIndex > 0) {
                currentIndex--
            }
        }
    })
})

// 定时更新选择框位置和大小
setInterval(() => {
    if (hoveredElements.length != 0) {
        hoveredElementsCache = [...hoveredElements]
    }
    selectionBox.style.pointerEvents = 'auto'
    if (hoveredElementsCache.length > 0) {
        const currentElement = hoveredElementsCache[currentIndex]
        if (currentElement) {
            const rect = currentElement.getBoundingClientRect() // 获取元素的矩形信息
            const x = rect.left
            const y = rect.top
            const width = rect.width
            const height = rect.height
            const padding = Math.max(2, Math.min(width, height) / 40) // 计算内边距

            // 更新选择框样式
            selectionBox.style.left = `${x - padding}px`
            selectionBox.style.top = `${y - padding}px`
            selectionBox.style.width = `${width + padding * 2}px`
            selectionBox.style.height = `${height + padding * 2}px`
            selectionBox.style.borderRadius = `${padding}px`

            // 更新标签名显示
            tagNameDisplay.textContent = currentElement.tagName.toLowerCase()
        }
    }
}, 100)

selectionBox.addEventListener('click', function () {
    // 点击选择框时，切换显示状态
    // selectionBox.style.display = this.style.display === 'none' ? 'block' : 'none'
    console.log('点击选择框')
    var choseItem = hoveredElementsCache[currentIndex]
    console.log(choseItem)
})

function enableChoseDiv() {
    selectionBox.style.display = 'auto'
}
function disableChoseDiv() {
    selectionBox.style.display = 'none'
}
//检测esc键
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        disableChoseDiv()
    }
})
