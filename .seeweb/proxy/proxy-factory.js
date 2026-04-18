/**
 * 代理工厂类
 * 功能：统一管理所有动态DOM元素的代理，提供批量剔除和恢复功能
 * 职责：管理DOM代理的创建、注册、剔除和恢复
 */

class ProxyFactory {
    /**
     * 构造函数
     */
    constructor() {
        this._proxies = new Map();
        this._isActive = true;
        this._callbacks = [];
        this._keyCounter = 0;
    }

    /**
     * 创建DOM元素并自动注册到代理工厂
     * @param {string} tagName - 元素标签名
     * @param {string} key - 可选的标识键
     * @returns {HTMLElement} 创建的DOM元素
     */
    createElement(tagName, key = null) {
        if (!tagName || typeof tagName !== 'string') {
            throw new Error('ProxyFactory: tagName必须是非空字符串');
        }

        const element = document.createElement(tagName);
        const proxyKey = key || `proxy_${++this._keyCounter}`;

        const proxy = new window.DOMProxy(element);
        this._proxies.set(proxyKey, proxy);

        return element;
    }

    /**
     * 为已存在的元素创建代理
     * @param {HTMLElement} element - 要代理的元素
     * @param {string} key - 可选的标识键
     * @returns {DOMProxy} 创建的代理
     */
    createProxy(element, key = null) {
        if (!element) {
            throw new Error('ProxyFactory: element参数不能为空');
        }

        const proxyKey = key || `proxy_${++this._keyCounter}`;

        if (this._proxies.has(proxyKey)) {
            return this._proxies.get(proxyKey);
        }

        const proxy = new window.DOMProxy(element);
        this._proxies.set(proxyKey, proxy);

        return proxy;
    }

    /**
     * 注册代理
     * @param {string} key - 标识键
     * @param {DOMProxy} proxy - 代理实例
     */
    registerProxy(key, proxy) {
        if (!key || !proxy) {
            throw new Error('ProxyFactory: key和proxy参数都不能为空');
        }
        this._proxies.set(key, proxy);
    }

    /**
     * 注销代理
     * @param {string} key - 标识键
     * @returns {boolean} 是否成功注销
     */
    unregisterProxy(key) {
        if (!this._proxies.has(key)) {
            return false;
        }

        const proxy = this._proxies.get(key);
        if (proxy.isSuspended()) {
            proxy.resume();
        }

        this._proxies.delete(key);
        return true;
    }

    /**
     * 获取代理
     * @param {string} key - 标识键
     * @returns {DOMProxy|undefined}
     */
    getProxy(key) {
        return this._proxies.get(key);
    }

    /**
     * 检查代理是否存在
     * @param {string} key - 标识键
     * @returns {boolean}
     */
    hasProxy(key) {
        return this._proxies.has(key);
    }

    /**
     * 获取所有代理数量
     * @returns {number}
     */
    getProxyCount() {
        return this._proxies.size;
    }

    /**
     * 获取所有代理的键
     * @returns {string[]}
     */
    getProxyKeys() {
        return Array.from(this._proxies.keys());
    }

    /**
     * 剔除所有动态DOM元素
     */
    suspendAll() {
        if (!this._isActive) {
            return;
        }

        this._proxies.forEach((proxy) => {
            if (!proxy.isSuspended() && proxy.getElement().parentNode) {
                proxy.suspend();
            }
        });

        this._isActive = false;
        this._triggerCallbacks('suspend', { count: this.getProxyCount() });
    }

    /**
     * 恢复所有动态DOM元素
     */
    resumeAll() {
        if (this._isActive) {
            return;
        }

        this._proxies.forEach((proxy) => {
            if (proxy.isSuspended()) {
                proxy.resume();
            }
        });

        this._isActive = true;
        this._triggerCallbacks('resume', { count: this.getProxyCount() });
    }

    /**
     * 切换激活/禁用状态
     */
    toggle() {
        if (this._isActive) {
            this.suspendAll();
        } else {
            this.resumeAll();
        }
    }

    /**
     * 获取当前激活状态
     * @returns {boolean}
     */
    isActive() {
        return this._isActive;
    }

    /**
     * 注册状态变化回调
     * @param {Function} callback - 回调函数
     */
    on(callback) {
        if (typeof callback === 'function') {
            this._callbacks.push(callback);
        }
    }

    /**
     * 注销回调
     * @param {Function} callback - 回调函数
     */
    off(callback) {
        const index = this._callbacks.indexOf(callback);
        if (index > -1) {
            this._callbacks.splice(index, 1);
        }
    }

    /**
     * 触发所有回调
     * @private
     */
    _triggerCallbacks(action, data) {
        this._callbacks.forEach(callback => {
            try {
                callback(action, data);
            } catch (error) {
                console.error('ProxyFactory: 回调执行失败', error);
            }
        });
    }

    /**
     * 清空所有代理
     */
    clearAll() {
        if (!this._isActive) {
            try {
                this.resumeAll();
            } catch (e) {
                console.error('ProxyFactory: 恢复元素时出错', e);
            }
        }
        this._proxies.clear();
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProxyFactory;
}

if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = ProxyFactory;
}

if (typeof window !== 'undefined') {
    window.ProxyFactory = ProxyFactory;
}
