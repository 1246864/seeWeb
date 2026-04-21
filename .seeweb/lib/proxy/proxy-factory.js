/**
 * 代理工厂类
 * 功能：统一管理所有动态DOM元素的代理，提供批量剔除和恢复
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
     * 查找代理对应的键
     * @param {DOMProxy} proxy - 代理实例
     * @returns {string|undefined} 键名
     */
    _findKeyByProxy(proxy) {
        for (const [key, p] of this._proxies) {
            if (p === proxy) {
                return key;
            }
        }
        return undefined;
    }

    /**
     * 通过元素查找代理
     * @param {HTMLElement} element - DOM元素
     * @returns {DOMProxy|undefined} 代理实例
     */
    _findProxyByElement(element) {
        for (const [key, proxy] of this._proxies) {
            if (proxy.getElement() === element) {
                return proxy;
            }
        }
        return undefined;
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
     * 恢复所有动态DOM元素（基础版本）
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
     * 智能恢复所有动态DOM元素（递归依赖解决版本）
     */
    async resumeAllSmart() {
        if (this._isActive) {
            return;
        }

        // 第一步：按 DOM 层次结构排序，确保父元素先恢复
        const proxiesByDepth = this._sortProxiesByDepth();
        
        let successCount = 0;
        let failCount = 0;
        
        // 第二步：按顺序恢复元素（从父到子）
        for (const item of proxiesByDepth) {
            const { proxy } = item;
            
            if (!proxy.isSuspended()) {
                continue;
            }
            
            // 尝试解决依赖
            const dependenciesResolved = await this._resolveDependencies(proxy, new Map(), new Set());
            
            if (dependenciesResolved) {
                // 依赖解决后，尝试恢复
                if (proxy.resume()) {
                    successCount++;
                } else {
                    failCount++;
                }
            } else {
                failCount++;
            }
        }

        // 第三步：总结
        if (failCount > 0) {
            console.warn(`ProxyFactory: 恢复完成，成功: ${successCount}, 失败: ${failCount}`);
        }
        
        this._isActive = true;
        this._triggerCallbacks('resume', { count: this.getProxyCount() });
    }
    
    /**
     * 按 DOM 层次深度排序代理对象（父元素在前，子元素在后）
     * @returns {Array<{key: string, proxy: DOMProxy, depth: number}>}
     */
    _sortProxiesByDepth() {
        const proxyEntries = Array.from(this._proxies.entries());
        
        // 计算每个元素的深度
        const depthMap = new Map();
        
        // 首先建立元素到代理的映射
        const elementToProxy = new Map();
        proxyEntries.forEach(([key, proxy]) => {
            elementToProxy.set(proxy.getElement(), { key, proxy });
        });
        
        // 递归计算深度
        const calculateDepth = (element) => {
            if (depthMap.has(element)) {
                return depthMap.get(element);
            }
            
            const proxyEntry = elementToProxy.get(element);
            if (!proxyEntry) {
                // 不在代理系统中，深度为 0
                return 0;
            }
            
            const parent = proxyEntry.proxy.getParent();
            if (!parent) {
                // 无父元素，深度为 0
                depthMap.set(element, 0);
                return 0;
            }
            
            // 计算父元素深度 + 1
            const parentDepth = calculateDepth(parent);
            const depth = parentDepth + 1;
            depthMap.set(element, depth);
            return depth;
        };
        
        // 计算所有代理元素的深度
        proxyEntries.forEach(([key, proxy]) => {
            calculateDepth(proxy.getElement());
        });
        
        // 排序：按深度从小到大排序
        return proxyEntries
            .map(([key, proxy]) => ({
                key,
                proxy,
                depth: depthMap.get(proxy.getElement()) || 0
            }))
            .sort((a, b) => a.depth - b.depth);
    }

    /**
     * 检查元素是否可以恢复
     * @param {DOMProxy} proxy - 代理实例
     * @returns {boolean} 是否可以恢复
     */
    _canRecover(proxy) {
        const parent = proxy.getParent();
        
        // 如果没有父元素，可以直接恢复
        if (!parent) {
            return true;
        }
        
        // 检查父元素是否仍然有效
        if (!parent.isConnected) {
            // 如果父元素无效，检查是否在我们的代理系统中
            const parentProxy = this._findProxyByElement(parent);
            if (parentProxy) {
                // 如果父元素在代理系统中但无效，需要先恢复父元素
                return !parentProxy.isSuspended();
            }
            // 如果父元素不在代理系统中且无效，尝试重新定位
            return false;
        }

        // 检查父元素是否在代理系统中
        const parentProxy = this._findProxyByElement(parent);
        if (parentProxy) {
            // 如果父元素在代理系统中，检查它是否已恢复
            return !parentProxy.isSuspended();
        }

        // 父元素不在代理系统中，但父元素仍然连接，可以恢复
        return true;
    }

    /**
     * 递归解析依赖关系
     * @param {DOMProxy} proxy - 代理实例
     * @param {Map} recoveryQueue - 恢复队列
     * @param {Set} resolvedDependencies - 已解决的依赖集合
     * @returns {Promise<boolean>} 是否成功解决依赖
     */
    async _resolveDependencies(proxy, recoveryQueue, resolvedDependencies) {
        const parent = proxy.getParent();
        
        // 如果没有父元素，说明是根元素或独立元素
        if (!parent) {
            return false;
        }
        
        // 检查父元素是否在我们的代理系统中
        const parentProxy = this._findProxyByElement(parent);
        if (!parentProxy) {
            // 父元素不在代理范围内，尝试重新定位
            if (proxy._relocateParent()) {
                return true;
            }
            return false;
        }
        
        // 检查父元素是否已恢复
        if (!parentProxy.isSuspended()) {
            return true; // 父元素已恢复，可以继续
        }

        // 检查是否已经在处理中，避免循环依赖
        const parentKey = this._findKeyByProxy(parentProxy);
        if (resolvedDependencies.has(parentKey)) {
            return true; // 已经处理过
        }
        
        // 尝试恢复父元素
        if (parentProxy.resume()) {
            // 更新当前元素的父元素引用，确保它指向恢复后的父元素
            const parentElement = parentProxy.getElement();
            proxy.setPosition(parentElement, proxy._nextSibling);
            
            resolvedDependencies.add(parentKey);
            return true;
        } else {
            // 父元素恢复也失败了，递归处理父元素的依赖
            if (await this._resolveDependencies(parentProxy, recoveryQueue, resolvedDependencies)) {
                resolvedDependencies.add(parentKey);
                
                // 更新当前元素的父元素引用，确保它指向恢复后的父元素
                const parentElement = parentProxy.getElement();
                proxy.setPosition(parentElement, proxy._nextSibling);
                
                return true;
            }
            return false;
        }
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

