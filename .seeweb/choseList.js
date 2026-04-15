/**
 * 选中元素列表管理
 * 功能：管理选中的元素列表，并在列表修改时触发回调函数
 */

class ChoseList {
    constructor() {
        this.list = [];
        this.callbacks = [];
        this.history = []; // 操作历史，用于撤销
    }

    /**
     * 添加元素到列表（如果已存在则移除，实现切换选择状态）
     * @param {HTMLElement} element - 要添加/移除的DOM元素
     * @returns {boolean} - 操作是否成功
     */
    add(element) {
        const index = this.list.indexOf(element);
        if (index > -1) {
            // 元素已存在，移除它
            this.list.splice(index, 1);
            // 记录操作历史
            this.history.push({ action: 'remove', element: element });
            this._triggerCallbacks('remove', element);
            return true;
        } else {
            // 元素不存在，添加它
            this.list.push(element);
            // 记录操作历史
            this.history.push({ action: 'add', element: element });
            this._triggerCallbacks('add', element);
            return true;
        }
    }

    /**
     * 从列表中移除元素
     * @param {HTMLElement} element - 要移除的DOM元素
     * @returns {boolean} - 移除是否成功
     */
    remove(element) {
        const index = this.list.indexOf(element);
        if (index > -1) {
            this.list.splice(index, 1);
            // 记录操作历史
            this.history.push({ action: 'remove', element: element });
            this._triggerCallbacks('remove', element);
            return true;
        }
        return false;
    }

    /**
     * 清空列表
     */
    clear() {
        const removedElements = [...this.list];
        this.list = [];
        // 记录操作历史
        this.history.push({ action: 'clear', elements: removedElements });
        this._triggerCallbacks('clear', removedElements);
    }

    /**
     * 撤销上一次操作
     * @returns {boolean} - 撤销是否成功
     */
    undo() {
        if (this.history.length === 0) {
            return false;
        }
        
        const lastAction = this.history.pop();
        
        if (lastAction.action === 'add') {
            // 撤销添加操作，即移除元素
            const index = this.list.indexOf(lastAction.element);
            if (index > -1) {
                this.list.splice(index, 1);
                this._triggerCallbacks('remove', lastAction.element);
            }
        } else if (lastAction.action === 'remove') {
            // 撤销移除操作，即添加元素
            if (!this.list.includes(lastAction.element)) {
                this.list.push(lastAction.element);
                this._triggerCallbacks('add', lastAction.element);
            }
        } else if (lastAction.action === 'clear') {
            // 撤销清空操作，即重新添加所有元素
            lastAction.elements.forEach(element => {
                if (!this.list.includes(element)) {
                    this.list.push(element);
                    this._triggerCallbacks('add', element);
                }
            });
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
     * @param {string} action - 操作类型：add、remove、clear
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

// 导出实例
const choseList = new ChoseList();

// 如果你需要使用CommonJS模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = choseList;
}

// 如果你需要使用ES模块导出
if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = choseList;
}