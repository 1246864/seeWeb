/**
 * 代理模块导出文件
 */

if (typeof window !== 'undefined') {
    window.DOMProxy = DOMProxy;
    window.ProxyFactory = ProxyFactory;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DOMProxy, ProxyFactory };
}

if (typeof exports !== 'undefined') {
    exports.DOMProxy = DOMProxy;
    exports.ProxyFactory = ProxyFactory;
}
