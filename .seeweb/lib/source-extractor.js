/**
 * 源代码提取工具
 * 功能：禁用所有动态DOM，提取网页源代码，然后重新激活UI
 * 职责：提供提取网页原始源代码的能力
 */

class SourceExtractor {
    /**
     * 提取网页源代码
     * @param {Object} options - 配置选项
     * @param {boolean} options.disableDynamicDOM - 是否禁用动态DOM
     * @param {boolean} options.prettyPrint - 是否美化输出
     * @returns {string} 提取的源代码
     */
    static extract(options = {}) {
        const {
            disableDynamicDOM = true,
            prettyPrint = true
        } = options;

        try {
            // 1. 禁用所有动态DOM（如果启用）
            let proxyFactory = null;
            if (disableDynamicDOM && window.proxyFactory) {
                proxyFactory = window.proxyFactory;
                if (proxyFactory.isActive()) {
                    proxyFactory.suspendAll();
                }
            }

            // 2. 禁用body样式
            const originalBodyStyle = document.body.style.cssText;//获取原始body样式，用于恢复后使用
            document.body.style.cssText = `
            `;

            // 3. 提取网页源代码
            let sourceCode = document.documentElement.outerHTML;

            // 4. 重新激活UI（如果之前禁用了）
            if (proxyFactory && !proxyFactory.isActive()) {
                proxyFactory.resumeAllSmart();
            }

            // 5. 美化输出（如果启用）  
            if (prettyPrint) {
                sourceCode = this._prettyPrint(sourceCode);
            }
            // 6. 恢复原始body样式
            document.body.style.cssText = originalBodyStyle;

            return sourceCode;
        } catch (error) {
            console.error('SourceExtractor: 提取源代码失败', error);
            return document.documentElement.outerHTML;
        }
    }

    /**
     * 美化HTML代码
     * @param {string} html - 原始HTML代码
     * @returns {string} 美化后的HTML代码
     * @private
     */
    static _prettyPrint(html) {
        let formatted = '';
        let indent = '';
        const indentSize = 2;
        let inTag = false;
        let inComment = false;

        for (let i = 0; i < html.length; i++) {
            const char = html[i];
            const nextChar = html[i + 1];

            if (char === '<' && nextChar === '!') {
                inComment = true;
            } else if (char === '>' && inComment) {
                inComment = false;
            }

            if (!inComment) {
                if (char === '<' && nextChar !== '/') {
                    formatted += '\n' + indent + char;
                    indent += ' '.repeat(indentSize);
                    inTag = true;
                } else if (char === '<' && nextChar === '/') {
                    indent = indent.slice(0, -indentSize);
                    formatted += '\n' + indent + char;
                    inTag = true;
                } else if (char === '>' && inTag) {
                    formatted += char;
                    inTag = false;
                } else {
                    formatted += char;
                }
            } else {
                formatted += char;
            }
        }

        return formatted.trim();
    }

    /**
     * 提取源代码并复制到剪贴板
     * @param {Object} options - 配置选项
     * @returns {boolean} 是否成功复制
     */
    static extractAndCopy(options = {}) {
        try {
            const sourceCode = this.extract(options);
            navigator.clipboard.writeText(sourceCode);
            console.log('SourceExtractor: 源代码已复制到剪贴板');
            return true;
        } catch (error) {
            console.error('SourceExtractor: 复制到剪贴板失败', error);
            return false;
        }
    }

    /**
     * 提取源代码并下载为文件
     * @param {Object} options - 配置选项
     * @param {string} options.filename - 文件名
     */
    static extractAndDownload(options = {}) {
        const {
            filename = `source-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.html`
        } = options;

        try {
            const sourceCode = this.extract(options);
            const blob = new Blob([sourceCode], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('SourceExtractor: 源代码已下载为文件', filename);
        } catch (error) {
            console.error('SourceExtractor: 下载文件失败', error);
        }
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SourceExtractor;
}

if (typeof exports !== 'undefined' && !exports.default) {
    exports.default = SourceExtractor;
}

if (typeof window !== 'undefined') {
    window.SourceExtractor = SourceExtractor;
}
