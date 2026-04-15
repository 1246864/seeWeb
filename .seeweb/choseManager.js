/**
 * 选择管理器
 * 功能：统一管理选择器，为选中元素添加边框示意，并同步更新位置
 */

// 选择管理器不需要直接依赖扩选工具
// 扩选工具会通过choseList间接与管理器交互

// 存储元素与表示框的映射
const elementBoxMap = new Map();

// 添加CSS样式
const markerStyle = document.createElement('style');
markerStyle.textContent = `
    .choseMarker {
        position: fixed;
        border: 2px solid #e74c3c;
        background-color: rgba(231, 76, 60, 0.1);
        pointer-events: none;
        z-index: 9998;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        border-radius: 0;
        transition: all 0.2s ease;
    }
`;
document.head.appendChild(markerStyle);

/**
 * 为元素创建表示框
 * @param {HTMLElement} element - 要创建表示框的元素
 */
function createMarkerBox(element) {
    // 检查元素是否已有表示框
    if (elementBoxMap.has(element)) {
        return;
    }
    
    // 创建表示框
    const markerBox = document.createElement('div');
    markerBox.className = 'choseMarker';
    document.body.appendChild(markerBox);
    
    // 更新表示框位置
    updateMarkerBoxPosition(element, markerBox);
    
    // 存储映射关系
    elementBoxMap.set(element, markerBox);
}

/**
 * 更新表示框位置
 * @param {HTMLElement} element - 元素
 * @param {HTMLElement} markerBox - 表示框
 */
function updateMarkerBoxPosition(element, markerBox) {
    try {
        const rect = element.getBoundingClientRect();
        const x = rect.left;
        const y = rect.top;
        const width = rect.width;
        const height = rect.height;
        const padding = Math.max(2, Math.min(width, height) / 40);
        
        markerBox.style.left = `${x - padding}px`;
        markerBox.style.top = `${y - padding}px`;
        markerBox.style.width = `${width + padding * 2}px`;
        markerBox.style.height = `${height + padding * 2}px`;
        markerBox.style.borderRadius = `${padding}px`;
    } catch (error) {
        console.error('更新表示框位置失败:', error);
    }
}

/**
 * 移除元素的表示框
 * @param {HTMLElement} element - 要移除表示框的元素
 */
function removeMarkerBox(element) {
    const markerBox = elementBoxMap.get(element);
    if (markerBox) {
        markerBox.remove();
        elementBoxMap.delete(element);
    }
}

/**
 * 同步所有表示框位置
 */
function syncAllMarkerBoxes() {
    elementBoxMap.forEach((markerBox, element) => {
        updateMarkerBoxPosition(element, markerBox);
    });
}

// 监听choseList的变化
choseList.on((action, data) => {
    if (action === 'add') {
        console.log('添加元素:', data);
        // 为新元素创建表示框
        createMarkerBox(data);
        // 同步所有表示框位置
        syncAllMarkerBoxes();
    } else if (action === 'remove') {
        console.log('移除元素:', data);
        // 移除元素的表示框
        removeMarkerBox(data);
        // 同步所有表示框位置
        syncAllMarkerBoxes();
    } else if (action === 'batchAdd') {
        console.log('批量添加元素:', data);
        // 为所有新元素创建表示框
        data.forEach(element => {
            createMarkerBox(element);
        });
        // 同步所有表示框位置
        syncAllMarkerBoxes();
    } else if (action === 'batchRemove') {
        console.log('批量移除元素:', data);
        // 移除所有元素的表示框
        data.forEach(element => {
            removeMarkerBox(element);
        });
        // 同步所有表示框位置
        syncAllMarkerBoxes();
    } else if (action === 'clear') {
        console.log('清空元素列表');
        // 移除所有表示框
        elementBoxMap.forEach((markerBox) => {
            markerBox.remove();
        });
        elementBoxMap.clear();
    }
});

// 监听窗口大小变化，同步表示框位置
window.addEventListener('resize', syncAllMarkerBoxes);

// 每0.1秒同步一次表示框位置
setInterval(syncAllMarkerBoxes, 10);

// 导出方法
if (typeof window !== 'undefined') {
    window.choseManager = {
        syncAllMarkerBoxes
    };
}

// 如果你需要使用CommonJS模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        syncAllMarkerBoxes
    };
}

// 如果你需要使用ES模块导出
if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = {
        syncAllMarkerBoxes
    };
}