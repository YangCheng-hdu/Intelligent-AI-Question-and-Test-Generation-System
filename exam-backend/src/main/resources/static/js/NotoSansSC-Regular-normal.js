/* NotoSansSC-Regular-normal.js
 * 简化的中文字体支持方案
 * 由于完整的中文字体文件过大，这里提供一个轻量级解决方案
 */

// 使用浏览器内置字体支持中文
(function() {
    // 检测浏览器是否支持中文字体
    function detectChineseSupport() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 测试中文字符渲染
        ctx.font = '12px Arial';
        const width1 = ctx.measureText('测试').width;

        ctx.font = '12px serif';
        const width2 = ctx.measureText('测试').width;

        return width1 !== width2; // 如果宽度不同，说明支持中文
    }

    // 创建一个简单的字体映射
    const chineseFontSupport = detectChineseSupport();

    // 导出字体信息
    window.NotoSansSC = null; // 不使用base64字体
    window.fontLoaded = chineseFontSupport;
    window.chineseFontSupport = chineseFontSupport;

    console.log('中文字体支持检测:', chineseFontSupport ? '支持' : '不支持');

    // 提供字体回退方案
    window.getFontName = function() {
        if (chineseFontSupport) {
            // 优先使用系统中文字体
            return 'SimSun, "Microsoft YaHei", Arial, sans-serif';
        } else {
            return 'Arial, sans-serif';
        }
    };
})();