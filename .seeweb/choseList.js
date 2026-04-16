/**
 * 选中元素列表管理
 * 功能：管理选中的元素列表，并在列表修改时触发回调函数
 * 职责：只负责选中元素的数据存储和操作历史管理，通过回调机制与其他模块通信
 */

class ChoseList {
    /**
     * 构造函数
     */
    constructor() {
        this.list = [];         // 选中元素列表
        this.callbacks = [];     // 回调函数列表
        this.history = [];       // 操作历史，使用状态快照
    }

    /**
     * 保存当前状态到历史记录
     * @private
     */
    _saveState() {
        this.history.push([...this.list]);
    }

    /**
     * 添加单个元素到列表（如果已存在则移除，实现切换选择状态）
     * @param {HTMLElement} element - 要添加/移除的DOM元素
     * @returns {boolean} - 操作是否成功
     */
    add(element) {
        // 保存操作前的状态
        this._saveState();
        
        const index = this.list.indexOf(element);
        if (index > -1) {
            // 元素已存在，移除它
            this.list.splice(index, 1);
            this._triggerCallbacks('remove', element);
        } else {
            // 元素不存在，添加它
            this.list.push(element);
            this._triggerCallbacks('add', element);
        }
        return true;
    }

    /**
     * 批量添加元素到列表
     * @param {Array<HTMLElement>} elements - 要添加的DOM元素数组
     * @returns {boolean} - 操作是否成功
     */
    addBatch(elements) {
        if (!elements || elements.length === 0) {
            return false;
        }
        
        // 保存操作前的状态
        this._saveState();
        
        // 使用Set优化去重检查，时间复杂度从O(n²)降低到O(n)
        const existingSet = new Set(this.list);
        const addedElements = elements.filter(element => !existingSet.has(element));
        
        // 添加新元素
        if (addedElements.length > 0) {
            addedElements.forEach(element => {
                this.list.push(element);
            });
            this._triggerCallbacks('batchAdd', addedElements);
        }
        return true;
    }

    /**
     * 从列表中移除单个元素
     * @param {HTMLElement} element - 要移除的DOM元素
     * @returns {boolean} - 移除是否成功
     */
    remove(element) {
        const index = this.list.indexOf(element);
        if (index > -1) {
            // 保存操作前的状态
            this._saveState();
            this.list.splice(index, 1);
            this._triggerCallbacks('remove', element);
            return true;
        }
        return false;
    }

    /**
     * 批量移除元素
     * @param {Array<HTMLElement>} elements - 要移除的DOM元素数组
     * @returns {boolean} - 操作是否成功
     */
    removeBatch(elements) {
        if (!elements || elements.length === 0) {
            return false;
        }
        
        // 保存操作前的状态
        this._saveState();
        
        const removedElements = [];
        elements.forEach(element => {
            const index = this.list.indexOf(element);
            if (index > -1) {
                this.list.splice(index, 1);
                removedElements.push(element);
            }
        });
        
        if (removedElements.length > 0) {
            this._triggerCallbacks('batchRemove', removedElements);
        }
        return true;
    }

    /**
     * 清空列表
     */
    clear() {
        if (this.list.length === 0) {
            return;
        }
        // 保存操作前的状态
        this._saveState();
        const removedElements = [...this.list];
        this.list = [];
        this._triggerCallbacks('clear', removedElements);
    }

    /**
     * 撤销上一次操作（使用状态快照）
     * @returns {boolean} - 撤销是否成功
     */
    undo() {
        if (this.history.length === 0) {
            return false;
        }
        
        const previousState = this.history.pop();
        const currentList = [...this.list];
        
        // 恢复到之前的状态
        this.list = [...previousState];
        
        // 计算差异，触发回调
        const added = this.list.filter(el => !currentList.includes(el));
        const removed = currentList.filter(el => !this.list.includes(el));
        
        if (removed.length > 0) {
            removed.forEach(el => this._triggerCallbacks('remove', el));
        }
        if (added.length > 0) {
            added.forEach(el => this._triggerCallbacks('add', el));
        }
        
        return true;
    }

    /**
     * 获取列表长度
     * @returns {number} - 列表长度
     */
    get length() {
        return this.list.length;
    }

    /**
     * 获取列表内容
     * @returns {Array} - 列表内容
     */
    getList() {
        return [...this.list];
    }

    /**
     * 检查元素是否在列表中
     * @param {HTMLElement} element - 要检查的DOM元素
     * @returns {boolean} - 元素是否在列表中
     */
    includes(element) {
        return this.list.includes(element);
    }

    /**
     * 注册回调函数
     * @param {Function} callback - 回调函数，接收两个参数：action（操作类型）和data（操作数据）
     * @returns {number} - 回调函数的索引，可用于取消注册
     */
    on(callback) {
        if (typeof callback === 'function') {
            this.callbacks.push(callback);
            return this.callbacks.length - 1;
        }
        return -1;
    }

    /**
     * 取消注册回调函数
     * @param {number} index - 回调函数的索引
     * @returns {boolean} - 取消注册是否成功
     */
    off(index) {
        if (index >= 0 && index < this.callbacks.length) {
            this.callbacks.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * 触发回调函数
     * @private
     * @param {string} action - 操作类型：add、remove、clear、batchAdd、batchRemove
     * @param {*} data - 操作数据
     */
    _triggerCallbacks(action, data) {
        this.callbacks.forEach(callback => {
            try {
                callback(action, data);
            } catch (error) {
                console.error('回调函数执行出错:', error);
            }
        });
    }
}

// 导出类（不直接创建实例，由外部负责依赖注入）

// 如果你需要使用CommonJS模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChoseList;
}

// 如果你需要使用ES模块导出
if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = ChoseList;
}

// 全局导出
if (typeof window !== 'undefined') {
    window.ChoseList = ChoseList;
}