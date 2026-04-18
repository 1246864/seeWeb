/**
 * DOM代理类
 * 功能：代理单个DOM元素，记录其位置信息，支持挂起（剔除）和恢复
 * 职责：管理单个动态DOM元素的挂载/卸载状态
 */

class DOMProxy {
    /**
     * 构造函数
     * @param {HTMLElement} element - 要代理的DOM元素
     */
    constructor(element) {
        if (!element) {
            throw new Error('DOMProxy: element参数不能为空');
        }

        this._element = element;
        this._parent = null;
        this._nextSibling = null;
        this._isSuspended = false;
    }

    /**
     * 获取原始元素
     * @returns {HTMLElement}
     */
    getElement() {
        return this._element;
    }

    /**
     * 获取父元素
     * @returns {HTMLElement|null}
     */
    getParent() {
        return this._parent;
    }

    /**
     * 获取下一个兄弟元素
     * @returns {HTMLElement|null}
     */
    getNextSibling() {
        return this._nextSibling;
    }

    /**
     * 检查是否已被挂起（从DOM树中移除）
     * @returns {boolean}
     */
    isSuspended() {
        return this._isSuspended;
    }

    /**
     * 记录当前位置信息（父元素和兄弟元素）
     * 如果元素已在DOM树中，会自动记录其位置
     */
    capturePosition() {
        if (this._element.parentNode) {
            this._parent = this._element.parentNode;
            this._nextSibling = this._element.nextSibling;
        }
        return this;
    }

    /**
     * 挂起元素（从DOM树中移除但保留引用）
     * @returns {boolean} 是否成功挂起
     */
    suspend() {
        if (this._isSuspended) {
            return false;
        }

        if (!this._element.parentNode) {
            return false;
        }

        // 重新获取当前位置信息（因为之前capturePosition时可能元素还在DOM树外）
        this._parent = this._element.parentNode;
        this._nextSibling = this._element.nextSibling;

        // 从DOM树中移除
        this._element.remove();
        this._isSuspended = true;

        return true;
    }

    /**
     * 恢复元素（重新插入DOM树到原始位置）
     * @returns {boolean} 是否成功恢复
     */
    resume() {
        if (!this._isSuspended) {
            return false;
        }

        if (!this._parent || !this._parent.isConnected) {
            return false;
        }

        // 检查 nextSibling 是否仍然有效（在 DOM 树中）
        let insertBeforeNode = null;
        if (this._nextSibling && this._nextSibling.parentNode === this._parent) {
            insertBeforeNode = this._nextSibling;
        }

        // 重新插入到DOM树
        if (insertBeforeNode) {
            this._parent.insertBefore(this._element, insertBeforeNode);
        } else {
            this._parent.appendChild(this._element);
        }

        this._isSuspended = false;
        return true;
    }

    /**
     * 强制设置父元素和兄弟元素（用于特殊情况）
     * @param {HTMLElement} parent - 父元素
     * @param {HTMLElement|null} nextSibling - 下一个兄弟元素
     */
    setPosition(parent, nextSibling = null) {
        this._parent = parent;
        this._nextSibling = nextSibling;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOMProxy;
}

if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = DOMProxy;
}

if (typeof window !== 'undefined') {
    window.DOMProxy = DOMProxy;
}
