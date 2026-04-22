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

        // 检查当前父元素是否有效，如果无效尝试重新定位
        if (!this._parent || !this._parent.isConnected || 
            this._parent.nodeType !== Node.ELEMENT_NODE) {
            
            // 尝试重新定位到 document.body 或其他可用的容器
            if (!this._relocateParent()) {
                console.warn('DOMProxy: 无法找到有效的父元素，无法恢复元素', this._element);
                return false;
            }
        }

        // 检查 nextSibling 是否仍然有效（在 DOM 树中且属于同一父元素）
        let insertBeforeNode = null;
        if (this._nextSibling) {
            // 检查 nextSibling 是否仍然存在于 DOM 中且属于预期的父元素
            if (this._nextSibling.parentNode === this._parent) {
                insertBeforeNode = this._nextSibling;
            } else {
                // 如果原来的 nextSibling 不再有效，尝试找到最近的有效兄弟元素
                let sibling = this._nextSibling;
                while (sibling && sibling.parentNode !== this._parent) {
                    sibling = sibling.nextSibling;
                }
                if (sibling && sibling.parentNode === this._parent) {
                    insertBeforeNode = sibling;
                }
            }
        }

        try {
            // 重新插入到DOM树
            if (insertBeforeNode) {
                this._parent.insertBefore(this._element, insertBeforeNode);
            } else {
                this._parent.appendChild(this._element);
            }
            
            // 验证元素是否真的被插入到DOM中了
            if (!this._element.isConnected) {
                // 如果没有连接，尝试再次追加
                this._parent.appendChild(this._element);
            }
            
            // 再次验证
            if (!this._element.isConnected) {
                console.error('DOMProxy: 元素恢复失败，仍然没有连接到DOM', this._element);
                return false;
            }
            
            this._isSuspended = false;
            return true;
        } catch (error) {
            console.error('DOMProxy: 恢复元素失败', error, this._element);
            return false;
        }
    }

    /**
     * 尝试重新定位父元素
     * @returns {boolean} 是否成功重新定位
     */
    _relocateParent() {
        // 尝试找到一个合适的父元素
        const candidates = [
            document.body,
            document.head,
            document.documentElement
        ];

        for (const candidate of candidates) {
            if (candidate && candidate.isConnected && candidate.nodeType === Node.ELEMENT_NODE) {
                this._parent = candidate;
                this._nextSibling = null; // 重置兄弟节点
                return true;
            }
        }

        return false;
    }

    /**
     * 检查是否可以恢复元素（依赖检查）
     * @returns {boolean} 是否可以恢复
     */
    canResume() {
        // 如果没有父元素，可以直接恢复
        if (!this._parent) {
            return true;
        }

        // 检查父元素是否仍然有效
        return this._parent.isConnected && this._parent.nodeType === Node.ELEMENT_NODE;
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

