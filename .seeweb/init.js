/**
 * 初始化文件 - Pro 版本
 * 功能：使用新的布局架构
 */

class SeeWebInit {
    /**
     * 初始化所有模块 - Pro 版本
     * @returns {Object} 包含所有实例的对象
     */
    static init() {
        try {
            console.log('🎨 SeeWeb Pro 开始初始化...');

            // 1. 代理工厂
            const proxyFactory = new window.ProxyFactory();

            // 2. 布局管理器
            const layoutManager = new window.LayoutManager({
                proxyFactory: proxyFactory
            });

            // 3. 选择列表
            const choseList = new window.ChoseList();

            // 4. 选择管理器
            const choseManager = new window.ChoseManager({
                choseList: choseList,
                proxyFactory: proxyFactory
            });
            
            // 互相注入
            layoutManager.setChoseManager(choseManager);
            choseManager.setLayoutManager(layoutManager);

            // 5. 单选和扩选
            const choseDiv = new window.ChoseDiv({
                choseList: choseList,
                proxyFactory: proxyFactory,
                layoutManager: layoutManager
            });

            const choseRect = new window.ChoseRect({
                choseList: choseList,
                proxyFactory: proxyFactory,
                layoutManager: layoutManager
            });

            // 6. 新的选择面板
            const chosePanel = new window.ChosePanel({
                choseList: choseList,
                choseManager: choseManager,
                proxyFactory: proxyFactory,
                choseDiv: choseDiv,
                choseRect: choseRect,
                layoutManager: layoutManager
            });

            // 7. 初始化布局
            layoutManager.init();

            // 8. 把面板加到右侧面板中
            layoutManager.addToPanel(chosePanel.getElement(), '⚙️ 选择控制');

            // 9. 全局导出
            const instances = {
                layoutManager,
                choseList,
                choseManager,
                choseDiv,
                choseRect,
                chosePanel,
                proxyFactory
            };

            if (typeof window !== 'undefined') {
                window.seeWeb = instances;
                window.layoutManager = layoutManager;
                window.choseList = choseList;
                window.choseManager = choseManager;
                window.choseDiv = choseDiv;
                window.choseRect = choseRect;
                window.chosePanel = chosePanel;
                window.proxyFactory = proxyFactory;
            }

            console.log('🎉 SeeWeb Pro 初始化完成！');
            console.log('📐 布局已创建');

            return instances;
        } catch (error) {
            console.error('💥 SeeWeb Pro 初始化失败:', error);
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
