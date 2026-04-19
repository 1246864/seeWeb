/**
 * UI 管理器导出
 */

import './ui-manager.js';

// 兼容 CommonJS/ES Module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    UIManager: window.UIManager
  };
}

if (typeof exports !== 'undefined' && !exports.default) {
  exports.default = window.UIManager;
}
