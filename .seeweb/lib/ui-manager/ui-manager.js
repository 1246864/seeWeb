/**
 * UI 管理器 - 重构版
 * 功能：统一管理所有 UI 组件的显示/隐藏
 */

class UIManager {
    constructor() {
        this.uiClass = 'seeWeb_ui-element';
        this.components = new Map(); // { key: { element, originalDisplay }
    }

    /**
     * 注册 UI 组件
     * @param {string} key - 组件唯一标识
     * @param {Object} component - 组件实例
     */
    register(key, component) {
        if (!component) {
            throw new Error(`UIManager.register: component参数不能为空 [${key}]`);
        }
        
        let element;

        if (component && component.container) {
            element = component.container;
        } else if (component && component._dialog) {
            element = component._dialog;
        } else if (component && component instanceof HTMLElement) {
            element = component;
        }

        if (!element) {
            console.warn(`UIManager.register: 无法获取组件元素 [${key}]`);
            return;
        }

        if (element && element.classList) {
            element.classList.add(this.uiClass);
            
            const originalDisplay = element.style.display || '';
            
            this.components.set(key, { 
                element,
                originalDisplay,
                component: component
            });
            
            console.log(`UIManager: 已注册组件 [${key}]`);
        }
    }

    /**
     * 注销
     */
    unregister(key) {
        const data = this.components.get(key);
        if (data && data.element) {
            data.element.classList.remove(this.uiClass);
            this.components.delete(key);
            console.log(`UIManager: 已注销组件 [${key}]`);
        }
    }

    /**
     * 隐藏单个组件
     */
    hide(key) {
        if (!this.components.has(key)) {
            console.warn(`UIManager.hide: 组件未注册 [${key}]`);
            return;
        }
        
        const data = this.components.get(key);
        if (data && data.element) {
            data.element.style.display = 'none';
        }
    }

    /**
     * 显示单个组件
     */
    show(key) {
        if (!this.components.has(key)) {
            console.warn(`UIManager.show: 组件未注册 [${key}]`);
            return;
        }
        
        const data = this.components.get(key);
        if (data && data.element) {
            // 如果原 display 是 none，则使用 block 作为默认显示值
            const display = data.originalDisplay === 'none' || data.originalDisplay === '' ? 'block' : data.originalDisplay;
            data.element.style.display = display;
        }
    }

    /**
     * 一键隐藏所有 UI
     */
    hideAll() {
        this.components.forEach((data, key) => {
            if (data.element) {
                data.element.style.display = 'none';
            }
        });
        console.log('UIManager: 已隐藏所有 UI');
    }

    /**
     * 一键显示所有 UI
     */
    showAll() {
        this.components.forEach((data, key) => {
            if (data.element) {
                // 如果原 display 是 none，则使用 block 作为默认显示值
                const display = data.originalDisplay === 'none' || data.originalDisplay === '' ? 'block' : data.originalDisplay;
                data.element.style.display = display;
            }
        });
        console.log('UIManager: 已显示所有 UI');
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}

if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = UIManager;
}
