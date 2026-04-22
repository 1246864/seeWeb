/**
 * 初始化文件 - Pro 版本
 * 功能：使用新的布局架构
 */

class SeeWebInit {
    static init() {
        try {
            console.log('🎨 SeeWeb Pro 开始初始化...');

            const proxyFactory = new window.ProxyFactory();

            const layoutManager = new window.LayoutManager({
                proxyFactory: proxyFactory
            });

            const choseList = new window.ChoseList();

            const choseManager = new window.ChoseManager({
                choseList: choseList,
                proxyFactory: proxyFactory
            });
            
            layoutManager.setChoseManager(choseManager);
            choseManager.setLayoutManager(layoutManager);

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

            const chosePanel = new window.ChosePanel({
                choseList: choseList,
                choseManager: choseManager,
                proxyFactory: proxyFactory,
                choseDiv: choseDiv,
                choseRect: choseRect,
                layoutManager: layoutManager
            });

            const viewportController = new window.ViewportController({
                proxyFactory: proxyFactory,
                layoutManager: layoutManager
            });

            layoutManager.setViewportController(viewportController);

            layoutManager.init();
            layoutManager.addToPanel(chosePanel.getElement(), '⚙️ 选择控制');

            const instances = {
                layoutManager,
                choseList,
                choseManager,
                choseDiv,
                choseRect,
                chosePanel,
                viewportController,
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
                window.viewportController = viewportController;
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

if (typeof window !== 'undefined') {
    window.SeeWebInit = SeeWebInit;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeeWebInit;
}

if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = SeeWebInit;
}
