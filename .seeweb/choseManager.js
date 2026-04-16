/**
 * 选择管理器
 * 功能：统一管理选择器，为选中元素添加边框示意，并同步更新位置
 * 职责：只负责选中元素的视觉表示，通过依赖注入与选择列表通信
 */

class ChoseManager {
    /**
     * 构造函数
     * @param {Object} options - 配置选项
     * @param {Object} options.choseList - 选择列表实例
     */
    constructor(options = {}) {
        // 依赖注入，确保模块松耦合
        this.choseList = options.choseList;
        
        // 验证必要依赖
        if (!this.choseList) {
            console.warn('ChoseManager: Missing required dependency (choseList)');
        }
        
        // 存储元素与表示框的映射
        this.elementBoxMap = new Map();
        
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
        // 监听choseList的变化
        if (this.choseList) {
            this.choseList.on((action, data) => {
                if (action === 'add') {
                    console.log('添加元素:', data);
                    // 为新元素创建表示框
                    this.createMarkerBox(data);
                    // 同步所有表示框位置
                    this.syncAllMarkerBoxes();
                } else if (action === 'remove') {
                    console.log('移除元素:', data);
                    // 移除元素的表示框
                    this.removeMarkerBox(data);
                    // 同步所有表示框位置
                    this.syncAllMarkerBoxes();
                } else if (action === 'batchAdd') {
                    console.log('批量添加元素:', data);
                    // 为所有新元素创建表示框
                    data.forEach(element => {
                        this.createMarkerBox(element);
                    });
                    // 同步所有表示框位置
                    this.syncAllMarkerBoxes();
                } else if (action === 'batchRemove') {
                    console.log('批量移除元素:', data);
                    // 移除所有元素的表示框
                    data.forEach(element => {
                        this.removeMarkerBox(element);
                    });
                    // 同步所有表示框位置
                    this.syncAllMarkerBoxes();
                } else if (action === 'clear') {
                    console.log('清空元素列表');
                    // 移除所有表示框
                    this.elementBoxMap.forEach((markerBox) => {
                        markerBox.remove();
                    });
                    this.elementBoxMap.clear();
                }
            });
        }
        
        // 监听窗口大小变化，同步表示框位置
        window.addEventListener('resize', () => this.syncAllMarkerBoxes());
        
        // 每0.1秒同步一次表示框位置
        setInterval(() => this.syncAllMarkerBoxes(), 10);
    }
    
    /**
     * 为元素创建表示框
     * @param {HTMLElement} element - 要创建表示框的元素
     */
    createMarkerBox(element) {
        // 检查元素是否已有表示框
        if (this.elementBoxMap.has(element)) {
            return;
        }
        
        // 创建表示框
        const markerBox = document.createElement('div');
        markerBox.className = 'seeWeb_choseMarker';
        document.body.appendChild(markerBox);
        
        // 更新表示框位置
        this.updateMarkerBoxPosition(element, markerBox);
        
        // 存储映射关系
        this.elementBoxMap.set(element, markerBox);
    }
    
    /**
     * 更新表示框位置
     * @param {HTMLElement} element - 元素
     * @param {HTMLElement} markerBox - 表示框
     */
    updateMarkerBoxPosition(element, markerBox) {
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
    removeMarkerBox(element) {
        const markerBox = this.elementBoxMap.get(element);
        if (markerBox) {
            markerBox.remove();
            this.elementBoxMap.delete(element);
        }
    }
    
    /**
     * 同步所有表示框位置
     */
    syncAllMarkerBoxes() {
        this.elementBoxMap.forEach((markerBox, element) => {
            this.updateMarkerBoxPosition(element, markerBox);
        });
    }
}

// 导出类（不直接创建实例，由外部负责依赖注入）

// 如果你需要使用CommonJS模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChoseManager;
}

// 如果你需要使用ES模块导出
if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = ChoseManager;
}

// 全局导出
if (typeof window !== 'undefined') {
    window.ChoseManager = ChoseManager;
}