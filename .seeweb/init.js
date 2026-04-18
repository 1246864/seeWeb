/**
 * 初始化文件
 * 功能：初始化所有模块，处理依赖注入，确保模块间正确连接
 * 职责：负责创建所有实例并管理它们之间的依赖关系
 */

class SeeWebInit {
    /**
     * 初始化所有模块
     * @returns {Object} 包含所有实例的对象
     */
    static init() {
        try {
            // 0. 创建代理工厂实例（最先创建，用于管理所有动态DOM）
            const proxyFactory = new window.ProxyFactory();

            // 1. 创建选择列表实例（核心数据存储）
            const choseList = new window.ChoseList();

            // 2. 创建选择管理器实例（需要在choseUI之前创建，以便注入）
            const choseManager = new window.ChoseManager({
                choseList: choseList,
                proxyFactory: proxyFactory
            });

            // 3. 创建选择模式UI实例
            const choseUI = new window.ChoseUI({
                choseList: choseList,
                choseManager: choseManager,
                proxyFactory: proxyFactory
            });

            // 4. 创建单选模式选择器实例
            const choseDiv = new window.ChoseDiv({
                choseList: choseList,
                choseUI: choseUI,
                proxyFactory: proxyFactory
            });

            // 5. 创建扩选模式选择器实例
            const choseRect = new window.ChoseRect({
                choseList: choseList,
                choseUI: choseUI,
                proxyFactory: proxyFactory
            });

            // 6. 注入依赖到 choseUI
            choseUI.choseDiv = choseDiv;
            choseUI.choseRect = choseRect;

            // 7. 导出所有实例
            const instances = {
                choseList,
                choseDiv,
                choseRect,
                choseUI,
                choseManager,
                proxyFactory
            };

            // 8. 全局导出
            if (typeof window !== 'undefined') {
                window.seeWeb = instances;
                window.choseList = choseList;
                window.choseDiv = choseDiv;
                window.choseRect = choseRect;
                window.choseUI = choseUI;
                window.choseManager = choseManager;
                window.proxyFactory = proxyFactory;
            }

            console.log('SeeWeb 初始化完成');
            console.log('代理工厂已注册', proxyFactory.getProxyCount(), '个动态DOM元素');
            return instances;
        } catch (error) {
            console.error('SeeWeb 初始化失败:', error);
            return null;
        }
    }
}

// 全局导出
if (typeof window !== 'undefined') {
    window.SeeWebInit = SeeWebInit;
}

// 导出初始化方法（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeeWebInit;
}

// 如果你需要使用ES模块导出
if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = SeeWebInit;
}
