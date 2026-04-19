/**
 * 工具库导出文件
 * 功能：统一导出所有工具类
 * 职责：提供工具库的统一入口
 */

// 导入代理模块
if (typeof window !== 'undefined' && window.DOMProxy && window.ProxyFactory) {
    // 代理模块已在全局定义
}

// 导出 SourceExtractor 类
if (typeof window !== 'undefined') {
    window.SourceExtractor = SourceExtractor;
}

// CommonJS/ES Module 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SourceExtractor: SourceExtractor
    };
}

if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = {
        SourceExtractor: SourceExtractor
    };
}

if (typeof exports !== 'undefined') {
    exports.SourceExtractor = SourceExtractor;
}
