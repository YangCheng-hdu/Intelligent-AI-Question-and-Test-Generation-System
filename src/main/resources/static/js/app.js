if (typeof NotoSansSC !== 'undefined') window.NotoSansSC = NotoSansSC;

// 全局变量
let generatedQuestions = [];
let bankQuestions = [];
let examQuestions = [];

// 会话管理
const SESSION_KEY = 'exam_session_id';
const EXAM_QUESTIONS_KEY = 'exam_questions_storage';
const GENERATED_QUESTIONS_KEY = 'generated_questions_storage';

// 生成会话ID
function generateSessionId() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 检查是否是新会话
function isNewSession() {
    const currentSessionId = sessionStorage.getItem(SESSION_KEY);
    return !currentSessionId;
}

// 初始化会话
function initializeSession() {
    if (isNewSession()) {
        // 新会话，生成新的会话ID并清空localStorage中的题目数据
        const newSessionId = generateSessionId();
        sessionStorage.setItem(SESSION_KEY, newSessionId);
        localStorage.removeItem(EXAM_QUESTIONS_KEY);
        localStorage.removeItem(GENERATED_QUESTIONS_KEY);
        console.log('新会话开始，清空待生成试卷和已生成题目');
    } else {
        console.log('会话继续，保持待生成试卷和已生成题目');
    }
}

// 保存试卷题目到localStorage
function saveExamQuestionsToStorage() {
    try {
        localStorage.setItem(EXAM_QUESTIONS_KEY, JSON.stringify(examQuestions));
    } catch (error) {
        console.error('保存试卷题目失败:', error);
    }
}

// 从localStorage加载试卷题目
function loadExamQuestionsFromStorage() {
    try {
        const stored = localStorage.getItem(EXAM_QUESTIONS_KEY);
        if (stored) {
            examQuestions = JSON.parse(stored);
            console.log('从localStorage加载了', examQuestions.length, '道试卷题目');
        }
    } catch (error) {
        console.error('加载试卷题目失败:', error);
        examQuestions = [];
    }
}

// 保存已生成题目到localStorage
function saveGeneratedQuestionsToStorage() {
    try {
        localStorage.setItem(GENERATED_QUESTIONS_KEY, JSON.stringify(generatedQuestions));
        console.log('已保存', generatedQuestions.length, '道已生成题目到localStorage');
    } catch (error) {
        console.error('保存已生成题目失败:', error);
    }
}

// 从localStorage加载已生成题目
function loadGeneratedQuestionsFromStorage() {
    try {
        const stored = localStorage.getItem(GENERATED_QUESTIONS_KEY);
        if (stored) {
            generatedQuestions = JSON.parse(stored);
            console.log('从localStorage加载了', generatedQuestions.length, '道已生成题目');
        }
    } catch (error) {
        console.error('加载已生成题目失败:', error);
        generatedQuestions = [];
    }
}

// 题库搜索和分组显示相关
let bankSubjects = [];
let bankTypes = [];

// API基础URL
const API_BASE = '/api';

// PDF库初始化
window._pdfReady = (async function() {
    try {
        // 检查jsPDF是否已加载
        if (!window.jspdf) {
            console.log('等待jsPDF库加载...');
            // 等待一段时间让库加载完成
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (window.jspdf && window.jspdf.jsPDF) {
            console.log('jsPDF库加载成功');

            // 检查html2canvas是否可用
            if (window.html2canvas) {
                console.log('html2canvas库可用，将使用Canvas PDF生成方案');
                window.pdfMethod = 'canvas';
            } else {
                console.log('html2canvas库不可用，将使用文本PDF生成方案');
                window.pdfMethod = 'text';
            }

            return true;
        } else {
            console.warn('jsPDF库加载失败');
            return false;
        }
    } catch (e) {
        console.error('PDF初始化失败:', e);
        return false;
    }
})();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 加载科目和题型
    loadSubjects();
    loadQuestionTypes();
    
    // 绑定题目生成表单提交事件
    document.getElementById('questionGenerationForm').addEventListener('submit', handleQuestionGeneration);
    
    // 初始化会话管理
    initializeSession();

    // 初始化试卷设置表单
    loadSubjectsForExam();
    document.getElementById('examPaperGenerationForm').addEventListener('submit', handleExamPaperGeneration);

    // 从localStorage加载数据（如果是继续会话）
    const isNewSession = !sessionStorage.getItem(SESSION_KEY);
    if (isNewSession) {
        // 新会话，从服务器加载试卷题目
        loadExamQuestions();
    } else {
        // 继续会话，从localStorage加载
        loadExamQuestionsFromStorage();
        displayExamQuestions();
        loadGeneratedQuestionsFromStorage();
        displayGeneratedQuestions();
    }

    // 加载初始数据
    loadBankQuestions();
    
    // 渲染数学公式
    waitForMathJax().then(() => {
        console.log('MathJax加载完成，开始初始渲染');
        debugMathJax(); // 添加调试信息
        renderMathContent(document.body);

        // 设置DOM观察者，自动重新渲染新添加的数学内容
        setupMathObserver();
    });

    // 加载题库筛选项
    if (document.getElementById('bankSubjectFilter')) {
        loadBankFilters();
    }
});

// 调试MathJax状态
function debugMathJax() {
    console.log('=== MathJax调试信息 ===');
    console.log('MathJax对象:', window.MathJax);
    console.log('MathJax是否就绪:', window.MathJax && window.MathJax.startup && window.MathJax.startup.document);
    console.log('MathJax配置:', window.MathJax ? window.MathJax.config : '未加载');

    // 检查页面中的数学内容
    const mathElements = document.querySelectorAll('.math-content');
    console.log('找到的数学内容元素数量:', mathElements.length);
    mathElements.forEach((el, index) => {
        console.log(`数学内容 ${index + 1}:`, el.textContent.substring(0, 50) + '...');
    });
}

// 专门调试解析内容的数学公式
function debugAnalysisContent(questionId) {
    console.log('=== 解析内容调试 ===');
    const analysisDiv = document.getElementById(`answer-analysis-${questionId}`);
    if (analysisDiv) {
        console.log('解析容器找到:', analysisDiv);
        console.log('解析容器可见性:', analysisDiv.style.display);
        console.log('解析容器HTML:', analysisDiv.innerHTML);

        const mathElements = analysisDiv.querySelectorAll('.math-content');
        console.log('解析中的数学元素数量:', mathElements.length);
        mathElements.forEach((el, index) => {
            console.log(`解析数学内容 ${index + 1}:`, el.textContent);
            console.log(`解析数学HTML ${index + 1}:`, el.innerHTML);
            console.log(`解析数学元素类名:`, el.className);

            // 检查是否包含LaTeX标记
            const content = el.textContent;
            const hasInlineMath = content.includes('\\(') && content.includes('\\)');
            const hasDisplayMath = content.includes('\\[') && content.includes('\\]');
            console.log(`包含行内数学公式: ${hasInlineMath}, 包含显示数学公式: ${hasDisplayMath}`);
        });
    } else {
        console.log('未找到解析容器:', `answer-analysis-${questionId}`);
    }
}

// 强力数学内容处理函数
function processMathContentAdvanced(content) {
    if (!content) return content;

    console.log('=== 高级数学内容处理 ===');
    console.log('原始内容:', content);

    // 第一步：清理和标准化内容
    let processedContent = content.trim();

    // 第二步：检查是否已经有LaTeX标记
    if (processedContent.includes('\\(') || processedContent.includes('\\[')) {
        console.log('内容已包含LaTeX标记，直接返回');
        return processedContent;
    }

    // 第三步：强制转换常见的数学表达式
    processedContent = convertToLatex(processedContent);

    // 第四步：如果转换后仍无LaTeX标记，检查是否需要整体包装
    if (!processedContent.includes('\\(') && !processedContent.includes('\\[')) {
        if (needsMathWrapper(processedContent)) {
            console.log('内容需要数学包装');
            processedContent = `\\( ${processedContent} \\)`;
        }
    }

    console.log('处理后内容:', processedContent);
    return processedContent;
}

// 将常见数学表达式转换为LaTeX格式
function convertToLatex(content) {
    let result = content;

    // 转换函数表达式 f(x) = ...
    result = result.replace(/([a-zA-Z])\(([^)]*)\)\s*=\s*([^，。；！？\n]+)/g, '\\( $1($2) = $3 \\)');

    // 转换简单等式 x = ...
    result = result.replace(/\b([a-zA-Z])\s*=\s*([a-zA-Z0-9\+\-\*\/\^\(\)\s]+)(?=[，。；！？\s]|$)/g, '\\( $1 = $2 \\)');

    // 转换分数 1/2 -> \frac{1}{2}
    result = result.replace(/\b(\d+)\/(\d+)\b/g, '\\( \\frac{$1}{$2} \\)');

    // 转换上标 x^2 -> x^{2}
    result = result.replace(/([a-zA-Z])(\^)(\d+)/g, '\\( $1^{$3} \\)');

    // 转换下标 x_1 -> x_{1}
    result = result.replace(/([a-zA-Z])(_)(\d+)/g, '\\( $1_{$3} \\)');

    // 转换根号表达式
    result = result.replace(/sqrt\(([^)]+)\)/g, '\\( \\sqrt{$1} \\)');

    // 转换已有的LaTeX命令（如果没有包装）
    result = result.replace(/(\\frac\{[^}]+\}\{[^}]+\})/g, '\\( $1 \\)');
    result = result.replace(/(\\sqrt\{[^}]+\})/g, '\\( $1 \\)');

    return result;
}

// 判断内容是否需要数学包装
function needsMathWrapper(content) {
    // 包含数学符号
    const mathSymbols = /[=<>≤≥≠±∞∑∏∫αβγδεζηθικλμνξοπρστυφχψω]/;
    if (mathSymbols.test(content)) return true;

    // 包含变量和运算符
    const mathExpression = /[a-zA-Z]\s*[\+\-\*\/\^]\s*[a-zA-Z0-9]/;
    if (mathExpression.test(content)) return true;

    // 包含函数形式
    const functionPattern = /[a-zA-Z]+\([^)]*\)/;
    if (functionPattern.test(content)) return true;

    // 包含数学关键词和变量
    const mathKeywords = ['函数', '方程', '解', '最值', '导数', '积分', '极限', '微分', '最小值', '最大值'];
    const hasMathKeywords = mathKeywords.some(keyword => content.includes(keyword));
    const hasVariables = /[a-zA-Z]/.test(content);

    return hasMathKeywords && hasVariables;
}

// 兼容性函数（保持向后兼容）
function ensureLatexMarkers(content) {
    return processMathContentAdvanced(content);
}



// 手动触发MathJax渲染（用于调试）
function forceMathJaxRender() {
    console.log('手动触发MathJax渲染...');
    if (window.MathJax && window.MathJax.typesetPromise) {
        // 清除所有渲染状态
        renderingElements.clear();
        renderQueue = Promise.resolve();

        // 重新渲染整个页面
        window.MathJax.typesetPromise().then(() => {
            console.log('手动MathJax渲染完成');
        }).catch(error => {
            console.error('手动MathJax渲染失败:', error);
        });
    } else {
        console.warn('MathJax不可用');
    }
}

// 完全重新初始化MathJax（终极修复方案）
window.reinitializeMathJax = function() {
    console.log('=== 完全重新初始化MathJax ===');

    if (!window.MathJax) {
        console.error('MathJax未加载');
        return;
    }

    try {
        // 清除所有状态
        renderingElements.clear();
        renderQueue = Promise.resolve();

        // 清除所有已渲染的MathJax元素
        document.querySelectorAll('mjx-container').forEach(el => el.remove());

        // 重新配置MathJax
        window.MathJax.startup.document.state(0);

        // 强制重新扫描和渲染
        window.MathJax.typesetPromise().then(() => {
            console.log('MathJax重新初始化完成');

            // 额外处理解析内容
            setTimeout(() => {
                fixAllAnalysisContent();
            }, 500);
        }).catch(error => {
            console.error('MathJax重新初始化失败:', error);
        });

    } catch (error) {
        console.error('重新初始化过程中发生错误:', error);
    }
};

// 重新渲染所有数学内容
function rerenderAllMath() {
    console.log('重新渲染所有数学内容...');
    const mathElements = document.querySelectorAll('.math-content');
    console.log('找到数学内容元素:', mathElements.length);

    mathElements.forEach((element, index) => {
        setTimeout(() => {
            renderMathContent(element.parentElement || element);
        }, index * 100); // 错开渲染时间
    });
}

// 调试所有解析内容（全局函数，可在控制台调用）
window.debugAllAnalysis = function() {
    console.log('=== 调试所有解析内容 ===');
    const analysisElements = document.querySelectorAll('[id^="answer-analysis-"]');
    console.log('找到解析容器数量:', analysisElements.length);

    analysisElements.forEach((element, index) => {
        const questionId = element.id.replace('answer-analysis-', '');
        console.log(`\n--- 解析 ${index + 1} (题目ID: ${questionId}) ---`);
        debugAnalysisContent(questionId);
    });

    console.log('\n=== 调试完成 ===');
    console.log('如需重新渲染所有数学内容，请运行: rerenderAllMath()');
    console.log('如需强制修复所有解析内容，请运行: fixAllAnalysisContent()');
};

// 强制修复所有解析内容的数学公式
window.fixAllAnalysisContent = function() {
    console.log('=== 强制修复所有解析内容 ===');
    const analysisElements = document.querySelectorAll('[id^="answer-analysis-"]');
    console.log('找到解析容器数量:', analysisElements.length);

    analysisElements.forEach((element, index) => {
        const questionId = element.id.replace('answer-analysis-', '');
        console.log(`\n--- 修复解析 ${index + 1} (题目ID: ${questionId}) ---`);

        // 找到解析内容元素
        const mathElements = element.querySelectorAll('.math-content');
        mathElements.forEach((mathEl, mathIndex) => {
            const originalContent = mathEl.textContent;
            console.log(`原始内容 ${mathIndex + 1}:`, originalContent);

            // 重新处理内容
            const processedContent = processMathContentAdvanced(originalContent);
            console.log(`处理后内容 ${mathIndex + 1}:`, processedContent);

            // 更新内容
            mathEl.innerHTML = processedContent;
        });

        // 延迟重新渲染
        setTimeout(() => {
            renderMathContent(element);
        }, index * 200);
    });

    console.log('\n=== 修复完成 ===');
};

// 设置DOM观察者，自动处理新添加的数学内容
function setupMathObserver() {
    if (!window.MutationObserver) {
        console.warn('浏览器不支持MutationObserver');
        return;
    }

    const observer = new MutationObserver((mutations) => {
        let hasNewMathContent = false;

        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 检查新添加的节点是否包含数学内容
                        const mathElements = node.querySelectorAll ?
                            node.querySelectorAll('.math-content') : [];
                        if (mathElements.length > 0 || node.classList?.contains('math-content')) {
                            hasNewMathContent = true;
                        }
                    }
                });
            }
        });

        if (hasNewMathContent) {
            console.log('检测到新的数学内容，延迟渲染...');
            setTimeout(() => {
                rerenderAllMath();
            }, 200);
        }
    });

    // 开始观察
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('DOM观察者已设置，将自动处理新的数学内容');
}

// 处理数学公式显示
function processMathContent(content) {
    if (!content) return '';

    // 检查内容是否已经包含LaTeX标记
    const hasLatexMarkers = /\\\(|\\\[|\\\)|\\]|\$/.test(content);

    let processedContent = content;

    if (hasLatexMarkers) {
        // 如果已经包含LaTeX标记，直接返回，不做任何处理
        console.log('内容已包含LaTeX标记，直接使用:', content.substring(0, 50) + '...');
        processedContent = content;
    } else {
        // 如果没有LaTeX标记，尝试识别数学表达式并添加标记
        console.log('内容不包含LaTeX标记，尝试自动识别:', content.substring(0, 50) + '...');

        // 检查是否包含数学表达式特征
        const hasMathFeatures = /\\frac|\\sqrt|\\int|\\sum|\\prod|\^|\w_\w|\w\/\w/.test(content);

        if (hasMathFeatures) {
            processedContent = content
                // 处理分数表达式 (如 1/2, a/b)
                .replace(/\b(\w+)\/(\w+)\b/g, '\\frac{$1}{$2}')
                // 处理上标 (如 x^2, a^n)
                .replace(/(\w)\^(\w+|\d+)/g, '$1^{$2}')
                // 处理下标 (如 x_1, a_n)
                .replace(/(\w)_(\w+|\d+)/g, '$1_{$2}')
                // 处理根号表达式
                .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
                // 包装在数学模式中
                .replace(/(\\frac\{[^}]+\}\{[^}]+\}|\\sqrt\{[^}]+\}|\w\^?\{[^}]+\}|\w_\{[^}]+\})/g, '$$$$1$$');
        }
    }

    // 将内容包装在带有数学公式处理类的div中
    return `<div class="math-content">${processedContent}</div>`;
}

// 渲染队列，避免并发渲染冲突
let renderQueue = Promise.resolve();
let renderingElements = new Set();

// 重新渲染数学公式
function renderMathContent(element) {
    return new Promise((resolve) => {
        if (!element) {
            console.warn('renderMathContent: 元素为空');
            resolve();
            return;
        }

        // 避免重复渲染同一个元素
        const elementId = element.id || element.className || 'unknown';
        if (renderingElements.has(element)) {
            console.log('元素正在渲染中，跳过:', elementId);
            resolve();
            return;
        }

        // 检查MathJax是否可用
        if (!window.MathJax || !window.MathJax.typesetPromise) {
            console.warn('MathJax未加载，跳过数学公式渲染');
            resolve();
            return;
        }

        // 将渲染任务加入队列
        renderQueue = renderQueue.then(() => {
            return new Promise((queueResolve) => {
                renderingElements.add(element);

                console.log('开始MathJax渲染，元素:', elementId);
                console.log('元素内容预览:', element.textContent.substring(0, 100) + '...');

                // 确保元素可见且已加载
                if (element.offsetParent === null && element.style.display !== 'none') {
                    console.log('元素不可见，延迟渲染');
                    setTimeout(() => {
                        performMathJaxRender(element, elementId).finally(() => {
                            renderingElements.delete(element);
                            queueResolve();
                            resolve();
                        });
                    }, 100);
                } else {
                    performMathJaxRender(element, elementId).finally(() => {
                        renderingElements.delete(element);
                        queueResolve();
                        resolve();
                    });
                }
            });
        });
    });
}

// 执行实际的MathJax渲染
function performMathJaxRender(element, elementId) {
    return new Promise((resolve) => {
        try {
            // 清除之前的MathJax渲染结果
            clearMathJaxElements(element);

            // 使用更稳定的渲染方式
            window.MathJax.typesetPromise([element]).then(() => {
                console.log('MathJax渲染成功:', elementId);
                resolve();
            }).catch(error => {
                console.warn('MathJax渲染失败:', elementId, error);
                // 重试一次
                setTimeout(() => {
                    window.MathJax.typesetPromise([element]).then(() => {
                        console.log('MathJax重试渲染成功:', elementId);
                        resolve();
                    }).catch(() => {
                        console.error('MathJax重试渲染也失败了:', elementId);
                        resolve();
                    });
                }, 200);
            });
        } catch (error) {
            console.error('MathJax渲染过程中发生异常:', elementId, error);
            resolve();
        }
    });
}

// 等待MathJax加载完成
function waitForMathJax() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 最多等待5秒

        function checkMathJax() {
            attempts++;
            if (window.MathJax && (window.MathJax.typesetPromise || window.MathJax.startup)) {
                console.log('MathJax已加载');
                resolve();
            } else if (attempts < maxAttempts) {
                setTimeout(checkMathJax, 100);
            } else {
                console.warn('MathJax加载超时，继续执行');
                resolve();
            }
        }

        checkMathJax();
    });
}

// 清除MathJax渲染元素，避免重影
function clearMathJaxElements(element) {
    if (!element) return;

    // 清除所有MathJax相关的元素
    const mathElements = element.querySelectorAll('.MathJax, .MathJax_Display, .MathJax_Preview, mjx-container, mjx-math, mjx-assistive-mml');
    mathElements.forEach(el => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    });

    // 清除MathJax的data属性和样式
    const elementsWithMathJax = element.querySelectorAll('[data-mathml], [data-tex], [data-mjx-texclass]');
    elementsWithMathJax.forEach(el => {
        el.removeAttribute('data-mathml');
        el.removeAttribute('data-tex');
        el.removeAttribute('data-mjx-texclass');
        // 移除MathJax添加的样式
        if (el.style.cssText) {
            el.style.cssText = '';
        }
    });

    // 重置元素的innerHTML，保留原始内容
    const mathContentDivs = element.querySelectorAll('.math-content');
    mathContentDivs.forEach(div => {
        // 如果div包含MathJax处理过的内容，重置为原始状态
        if (div.querySelector('mjx-container') || div.querySelector('.MathJax')) {
            // 这里需要保留原始的数学公式文本
            const originalText = div.textContent || div.innerText;
            if (originalText) {
                div.innerHTML = originalText;
            }
        }
    });
}

// 加载科目列表
async function loadSubjects() {
    try {
        const response = await fetch(`${API_BASE}/subjects`);
        const subjects = await response.json();
        const subjectSelect = document.getElementById('subject');
        
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.name;
            option.textContent = subject.name;
            subjectSelect.appendChild(option);
        });
    } catch (error) {
        console.error('加载科目失败:', error);
    }
}

// 加载题型列表
async function loadQuestionTypes() {
    try {
        const response = await fetch(`${API_BASE}/question-types`);
        const questionTypes = await response.json();
        const questionTypeSelect = document.getElementById('questionType');
        
        questionTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.name;
            option.textContent = type.name;
            questionTypeSelect.appendChild(option);
        });
    } catch (error) {
        console.error('加载题型失败:', error);
    }
}

// 处理题目生成
async function handleQuestionGeneration(event) {
    event.preventDefault();
    
    const formData = {
        subject: document.getElementById('subject').value,
        questionType: document.getElementById('questionType').value,
        questionCount: parseInt(document.getElementById('questionCount').value),
        domainLimit: document.getElementById('domainLimit').value.trim()
    };
    
    try {
        const response = await fetch(`${API_BASE}/questions/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const questions = await response.json();
            generatedQuestions = questions;
            displayGeneratedQuestions();
            // 保存到localStorage
            saveGeneratedQuestionsToStorage();
            showAlert('题目生成成功！', 'success');
        } else {
            showAlert('题目生成失败！', 'danger');
        }
    } catch (error) {
        console.error('生成题目失败:', error);
        showAlert('生成题目时发生错误！', 'danger');
    }
}

// 显示已生成的题目
function displayGeneratedQuestions() {
    const container = document.getElementById('generatedQuestions');
    container.innerHTML = '';

    // 更新计数器
    const countElement = document.getElementById('generatedCount');
    if (countElement) {
        countElement.textContent = generatedQuestions.length;
    }

    if (generatedQuestions.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-5"><i class="fas fa-inbox fa-3x mb-3 d-block" style="opacity: 0.3;"></i><h5>暂无已生成的题目</h5><p>点击上方"生成题目"按钮开始生成</p></div>';
        return;
    }

    generatedQuestions.forEach(question => {
        const questionCard = createQuestionCard(question, 'generated');
        container.appendChild(questionCard);
    });
}

// 创建题目卡片
function createQuestionCard(question, source) {
    const card = document.createElement('div');
    card.className = 'question-card';
    
    // 根据来源决定是否显示答案和解析
    let answerAndAnalysis = '';
    let viewAnswerButton = '';
    
    if (source === 'generated' && (question.answer || question.analysis)) {
        // 为生成的题目添加查看答案按钮
        viewAnswerButton = `
            <button class="btn btn-outline-info btn-sm" onclick="toggleAnswerAnalysis(${question.id})">
                <i class="fas fa-eye"></i> 查看答案和解析
            </button>
        `;
        
        // 答案和解析区域（默认隐藏）
        answerAndAnalysis = `
            <div id="answer-analysis-${question.id}" class="mt-2 p-2 bg-light border rounded" style="display: none;">
                ${question.answer ? `<p class="mb-1"><strong>答案：</strong><span class="math-content">${question.answer}</span></p>` : ''}
                ${question.analysis ? `<p class="mb-0"><strong>解析：</strong><span class="math-content">${ensureLatexMarkers(question.analysis)}</span></p>` : ''}
            </div>
        `;
    } else if (source === 'bank' && (question.answer || question.analysis)) {
        // 题库中的题目直接显示答案和解析
        answerAndAnalysis = `
            <div class="mt-2 p-2 bg-light border rounded">
                ${question.answer ? `<p class="mb-1"><strong>答案：</strong><span class="math-content">${question.answer}</span></p>` : ''}
                ${question.analysis ? `<p class="mb-0"><strong>解析：</strong><span class="math-content">${ensureLatexMarkers(question.analysis)}</span></p>` : ''}
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <h6>${question.subject.name} - ${question.questionType.name}</h6>
                <p class="mb-2"><span class="math-content">${question.content}</span></p>
                <small class="text-muted">难度: ${question.difficulty}/5</small>
                ${answerAndAnalysis}
            </div>
            <div class="col-md-4">
                <div class="question-actions">
                    ${source === 'generated' ? `
                        <div class="mb-2">
                            ${viewAnswerButton}
                        </div>
                        <button class="btn btn-success btn-sm" onclick="saveToBank(${question.id})">
                            <i class="fas fa-save"></i> 保存到题库
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="addToExam(${question.id})">
                            <i class="fas fa-plus"></i> 加入试卷
                        </button>
                    ` : ''}
                    ${source === 'bank' ? `
                        <button class="btn btn-warning btn-sm" onclick="removeFromBank(${question.id})">
                            <i class="fas fa-trash"></i> 从题库移除
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="addToExam(${question.id})">
                            <i class="fas fa-plus"></i> 加入试卷
                        </button>
                    ` : ''}
                    ${source === 'exam' ? `
                        <button class="btn btn-warning btn-sm" onclick="removeFromExam(${question.id})">
                            <i class="fas fa-minus"></i> 从试卷移除
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal(${question.id})">
                        <i class="fas fa-pen"></i> 编辑
                    </button>
                    <button class="btn btn-info btn-sm" onclick="openModifyModal(${question.id})">
                        <i class="fas fa-edit"></i> 修改
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteQuestion(${question.id})">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 延迟渲染数学公式，确保DOM完全更新
    setTimeout(() => {
        waitForMathJax().then(() => {
            renderMathContent(card);
        });
    }, 50);
    
    return card;
}

// 保存到题库
async function saveToBank(questionId) {
    try {
        const response = await fetch(`${API_BASE}/questions/${questionId}/save-to-bank`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showAlert('已保存到题库！', 'success');
            loadBankQuestions();
            // 从已生成题目列表中移除已保存的题目
            generatedQuestions = generatedQuestions.filter(q => q.id !== questionId);
            displayGeneratedQuestions();
            // 更新localStorage
            saveGeneratedQuestionsToStorage();
        } else {
            showAlert('保存到题库失败！', 'danger');
        }
    } catch (error) {
        console.error('保存到题库失败:', error);
        showAlert('保存到题库时发生错误！', 'danger');
    }
}

// 从题库移除
async function removeFromBank(questionId) {
    try {
        const response = await fetch(`${API_BASE}/questions/${questionId}/remove-from-bank`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showAlert('已从题库移除！', 'success');
            loadBankQuestions();
        } else {
            showAlert('从题库移除失败！', 'danger');
        }
    } catch (error) {
        console.error('从题库移除失败:', error);
        showAlert('从题库移除时发生错误！', 'danger');
    }
}

// 加入试卷
async function addToExam(questionId) {
    try {
        const response = await fetch(`${API_BASE}/questions/${questionId}/add-to-exam`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showAlert('已加入试卷！', 'success');
            await loadExamQuestions();
            // 保存试卷题目到localStorage
            saveExamQuestionsToStorage();
            // 从已生成题目列表中移除已加入试卷的题目
            generatedQuestions = generatedQuestions.filter(q => q.id !== questionId);
            displayGeneratedQuestions();
            // 更新已生成题目的localStorage
            saveGeneratedQuestionsToStorage();
        } else {
            showAlert('加入试卷失败！', 'danger');
        }
    } catch (error) {
        console.error('加入试卷失败:', error);
        showAlert('加入试卷时发生错误！', 'danger');
    }
}

// 从试卷移除
async function removeFromExam(questionId) {
    try {
        console.log('准备从试卷移除题目ID:', questionId);

        // 确认操作
        if (!confirm('确定要从试卷中移除这道题目吗？')) {
            return;
        }

        const response = await fetch(`${API_BASE}/questions/${questionId}/remove-from-exam`, {
            method: 'POST'
        });

        if (response.ok) {
            showAlert('已从试卷移除！', 'success');

            // 立即从本地数组中移除该题目，避免重新加载
            examQuestions = examQuestions.filter(q => q.id !== questionId);
            displayExamQuestions();
            // 保存到localStorage
            saveExamQuestionsToStorage();

            console.log('题目已从试卷移除，剩余题目数量:', examQuestions.length);
        } else {
            const errorData = await response.json();
            showAlert('从试卷移除失败：' + (errorData.error || '未知错误'), 'danger');
        }
    } catch (error) {
        console.error('从试卷移除失败:', error);
        showAlert('从试卷移除时发生错误！', 'danger');
    }
}

// 删除题目
async function deleteQuestion(questionId) {
    if (!confirm('确定要删除这道题目吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/questions/${questionId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('题目已删除！', 'success');
            // 刷新所有题目列表
            loadBankQuestions();
            loadExamQuestions();
            // 从已生成题目列表中移除被删除的题目
            generatedQuestions = generatedQuestions.filter(q => q.id !== questionId);
            displayGeneratedQuestions();
            // 更新localStorage
            saveGeneratedQuestionsToStorage();
        } else {
            showAlert('删除题目失败！', 'danger');
        }
    } catch (error) {
        console.error('删除题目失败:', error);
        showAlert('删除题目时发生错误！', 'danger');
    }
}

// 打开编辑模态框
function openEditModal(questionId) {
    console.log('openEditModal 被调用，questionId:', questionId);

    // 查找题目数据
    let question = null;

    // 在已生成题目中查找
    question = generatedQuestions.find(q => q.id === questionId);
    console.log('在 generatedQuestions 中查找:', question ? '找到' : '未找到');

    // 在题库题目中查找
    if (!question && bankQuestions) {
        question = bankQuestions.find(q => q.id === questionId);
        console.log('在 bankQuestions 中查找:', question ? '找到' : '未找到');
    }

    // 在试卷题目中查找
    if (!question && examQuestions) {
        question = examQuestions.find(q => q.id === questionId);
        console.log('在 examQuestions 中查找:', question ? '找到' : '未找到');
    }

    if (!question) {
        console.error('未找到题目信息！questionId:', questionId);
        console.log('当前数据状态:');
        console.log('generatedQuestions:', generatedQuestions);
        console.log('bankQuestions:', bankQuestions);
        console.log('examQuestions:', examQuestions);
        showAlert('未找到题目信息！', 'danger');
        return;
    }

    console.log('找到题目:', question);

    // 填充编辑表单
    document.getElementById('editQuestionId').value = questionId;
    document.getElementById('editQuestionContent').value = question.content || '';
    document.getElementById('editQuestionAnswer').value = question.answer || '';
    document.getElementById('editQuestionAnalysis').value = question.analysis || '';
    document.getElementById('editQuestionDifficulty').value = question.difficulty || 1;

    // 设置科目和题型
    if (question.subject) {
        document.getElementById('editQuestionSubject').value = question.subject.id || '';
    }
    if (question.questionType) {
        document.getElementById('editQuestionType').value = question.questionType.id || '';
    }

    console.log('准备显示编辑模态框');
    try {
        const modalElement = document.getElementById('editModal');
        if (!modalElement) {
            console.error('编辑模态框元素不存在！');
            showAlert('编辑模态框不存在！', 'danger');
            return;
        }
        console.log('编辑模态框元素存在，准备显示');
        new bootstrap.Modal(modalElement).show();
        console.log('编辑模态框显示成功');
    } catch (error) {
        console.error('显示编辑模态框时出错:', error);
        showAlert('显示编辑模态框时出错：' + error.message, 'danger');
    }
}

// 打开修改模态框
function openModifyModal(questionId) {
    document.getElementById('modifyQuestionId').value = questionId;
    document.getElementById('modificationRequest').value = '';
    new bootstrap.Modal(document.getElementById('modifyModal')).show();
}

// 提交编辑
async function submitEdit() {
    const questionId = document.getElementById('editQuestionId').value;
    const content = document.getElementById('editQuestionContent').value;
    const answer = document.getElementById('editQuestionAnswer').value;
    const analysis = document.getElementById('editQuestionAnalysis').value;
    const difficulty = document.getElementById('editQuestionDifficulty').value;
    const subjectId = document.getElementById('editQuestionSubject').value;
    const questionTypeId = document.getElementById('editQuestionType').value;

    if (!content.trim()) {
        showAlert('题目内容不能为空！', 'warning');
        return;
    }

    if (!subjectId || !questionTypeId) {
        showAlert('请选择科目和题型！', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/questions/edit`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: parseInt(questionId),
                content: content,
                answer: answer,
                analysis: analysis,
                difficulty: parseInt(difficulty),
                subjectId: parseInt(subjectId),
                questionTypeId: parseInt(questionTypeId)
            })
        });

        if (response.ok) {
            const editedQuestion = await response.json();
            showAlert('题目编辑成功！', 'success');

            // 关闭模态框
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();

            // 刷新题目列表
            loadBankQuestions();
            await loadExamQuestions();
            // 保存试卷题目到localStorage
            saveExamQuestionsToStorage();

            // 更新已生成题目列表中的题目
            const index = generatedQuestions.findIndex(q => q.id === editedQuestion.id);
            if (index !== -1) {
                generatedQuestions[index] = editedQuestion;
                displayGeneratedQuestions();
                // 更新localStorage
                saveGeneratedQuestionsToStorage();
            }
        } else {
            const errorData = await response.json();
            showAlert('编辑题目失败：' + (errorData.error || '未知错误'), 'danger');
        }
    } catch (error) {
        console.error('编辑题目失败:', error);
        showAlert('编辑题目时发生错误！', 'danger');
    }
}

// 提交修改
async function submitModification() {
    const questionId = document.getElementById('modifyQuestionId').value;
    const modificationRequest = document.getElementById('modificationRequest').value;
    
    if (!modificationRequest.trim()) {
        showAlert('请输入修改要求！', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/questions/modify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                questionId: parseInt(questionId),
                modificationRequest: modificationRequest
            })
        });
        
        if (response.ok) {
            const modifiedQuestion = await response.json();
            showAlert('题目修改成功！', 'success');
            bootstrap.Modal.getInstance(document.getElementById('modifyModal')).hide();
            
            // 刷新所有题目列表
            loadBankQuestions();
            await loadExamQuestions();
            // 保存试卷题目到localStorage
            saveExamQuestionsToStorage();

            // 更新已生成题目列表中的对应题目
            const index = generatedQuestions.findIndex(q => q.id === parseInt(questionId));
            if (index !== -1) {
                generatedQuestions[index] = modifiedQuestion;
                displayGeneratedQuestions();
                // 更新localStorage
                saveGeneratedQuestionsToStorage();
            }
        } else {
            showAlert('题目修改失败！', 'danger');
        }
    } catch (error) {
        console.error('修改题目失败:', error);
        showAlert('修改题目时发生错误！', 'danger');
    }
}

// 加载题库题目
async function loadBankQuestions() {
    // 默认加载分组显示
    await loadBankQuestionsGrouped();
}

// 显示题库题目
function displayBankQuestions(questions) {
    // 搜索时显示搜索结果，不分组
    const container = document.getElementById('bankQuestions');
    document.getElementById('bankQuestionsGrouped').innerHTML = '';
    container.innerHTML = '';

    // 更新计数器
    const countElement = document.getElementById('bankCount');
    if (countElement) {
        countElement.textContent = questions ? questions.length : 0;
    }

    if (!questions || questions.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-5"><i class="fas fa-search fa-3x mb-3 d-block" style="opacity: 0.3;"></i><h5>未找到相关题目</h5><p>请尝试调整搜索条件</p></div>';
        return;
    }
    questions.forEach(question => {
        const questionCard = createQuestionCard(question, 'bank');
        container.appendChild(questionCard);
    });
}

// 加载试卷题目
async function loadExamQuestions() {
    try {
        const response = await fetch(`${API_BASE}/questions/exam`);
        examQuestions = await response.json();
        displayExamQuestions();
        // 保存到localStorage
        saveExamQuestionsToStorage();
    } catch (error) {
        console.error('加载试卷失败:', error);
    }
}

// 显示试卷题目
function displayExamQuestions() {
    const container = document.getElementById('examQuestions');
    container.innerHTML = '';

    // 更新计数器
    const countElement = document.getElementById('examCount');
    if (countElement) {
        countElement.textContent = examQuestions.length;
    }

    if (examQuestions.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-5"><i class="fas fa-file-alt fa-3x mb-3 d-block" style="opacity: 0.3;"></i><h5>暂无待生成试卷的题目</h5><p>从"已生成题目"或"题库"中添加题目到试卷</p></div>';
        return;
    }

    examQuestions.forEach(question => {
        const questionCard = createExamQuestionCard(question);
        container.appendChild(questionCard);
    });
}

// 创建待生成试卷中的题目卡片
function createExamQuestionCard(question) {
    const card = document.createElement('div');
    card.className = 'question-card';
    
    // 答案和解析区域（默认隐藏）
    let answerAndAnalysis = '';
    if (question.answer || question.analysis) {
        answerAndAnalysis = `
            <div id="exam-question-answer-${question.id}" class="mt-2 p-2 bg-light border rounded" style="display: none;">
                ${question.answer ? `<p class="mb-1"><strong>答案：</strong><span class="math-content">${question.answer}</span></p>` : ''}
                ${question.analysis ? `<p class="mb-0"><strong>解析：</strong><span class="math-content">${ensureLatexMarkers(question.analysis)}</span></p>` : ''}
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <h6>${question.subject.name} - ${question.questionType.name}</h6>
                <p class="mb-2"><span class="math-content">${question.content}</span></p>
                <small class="text-muted">难度: ${question.difficulty}/5</small>
                ${answerAndAnalysis}
            </div>
            <div class="col-md-4">
                <div class="question-actions">
                    <div class="mb-2">
                        ${question.answer || question.analysis ? `
                            <button class="btn btn-outline-info btn-sm" onclick="toggleExamQuestionAnswer(${question.id})">
                                <i class="fas fa-eye"></i> 查看答案和解析
                            </button>
                        ` : ''}
                    </div>
                    <button class="btn btn-warning btn-sm" onclick="removeFromExam(${question.id})">
                        <i class="fas fa-minus"></i> 从试卷移除
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="openEditModal(${question.id})">
                        <i class="fas fa-pen"></i> 编辑
                    </button>
                    <button class="btn btn-info btn-sm" onclick="openModifyModal(${question.id})">
                        <i class="fas fa-edit"></i> 修改
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteQuestion(${question.id})">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 延迟渲染数学公式，确保DOM完全更新
    setTimeout(() => {
        waitForMathJax().then(() => {
            renderMathContent(card);
        });
    }, 50);
    
    return card;
}

// 切换待生成试卷中题目答案的显示/隐藏
function toggleExamQuestionAnswer(questionId) {
    const answerAnalysisDiv = document.getElementById(`exam-question-answer-${questionId}`);
    const button = event.target.closest('button');

    if (answerAnalysisDiv.style.display === 'none') {
        answerAnalysisDiv.style.display = 'block';
        button.innerHTML = '<i class="fas fa-eye-slash"></i> 隐藏答案和解析';
        button.classList.remove('btn-outline-info');
        button.classList.add('btn-info');

        // 延迟渲染，确保元素已经显示
        setTimeout(() => {
            // 清除之前的MathJax渲染，然后重新渲染
            clearMathJaxElements(answerAnalysisDiv);
            waitForMathJax().then(() => {
                renderMathContent(answerAnalysisDiv).then(() => {
                    console.log(`试卷题目 ${questionId} 的答案和解析数学公式渲染完成`);
                });
            });
        }, 50);
    } else {
        answerAnalysisDiv.style.display = 'none';
        button.innerHTML = '<i class="fas fa-eye"></i> 查看答案和解析';
        button.classList.remove('btn-info');
        button.classList.add('btn-outline-info');
    }
}

// 从题库生成Word文档
async function generateWordFromBank() {
    if (bankQuestions.length === 0) {
        showAlert('题库为空，无法生成文档！', 'warning');
        return;
    }
    
    // 由于用户要求删除Word文档功能，这里改为提示
    showAlert('Word文档功能已移除，请使用PDF下载功能！', 'info');
}

// 分析题型分布
async function analyzeQuestionTypes() {
    try {
        const response = await fetch(`${API_BASE}/exam-paper/analyze-question-types`);
        if (response.ok) {
            const typeScores = await response.json();

            if (typeScores.length === 0) {
                showAlert('待生成试卷中没有题目，请先添加题目！', 'warning');
                return;
            }

            displayQuestionTypeScores(typeScores);
            showAlert('题型分析完成！', 'success');
        } else {
            showAlert('题型分析失败！', 'danger');
        }
    } catch (error) {
        console.error('题型分析失败:', error);
        showAlert('题型分析时发生错误！', 'danger');
    }
}

// 显示题型分数设置
function displayQuestionTypeScores(typeScores) {
    const container = document.getElementById('questionTypeScoreInputs');
    const scoreSection = document.getElementById('questionTypeScores');

    container.innerHTML = '';

    let totalQuestions = 0;
    let totalScore = 0;

    typeScores.forEach((typeScore, index) => {
        totalQuestions += typeScore.questionCount;
        totalScore += typeScore.totalScore;

        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3';
        col.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">${typeScore.questionType}</h6>
                    <p class="card-text text-muted">题目数量：${typeScore.questionCount} 道</p>
                    <div class="mb-2">
                        <label class="form-label">每题分数</label>
                        <input type="number" class="form-control score-input"
                               data-question-type="${typeScore.questionType}"
                               data-question-count="${typeScore.questionCount}"
                               value="${typeScore.scorePerQuestion}"
                               min="1" max="100"
                               onchange="updateTotalScore()">
                    </div>
                    <div class="alert alert-info mb-0">
                        <small>小计：<span class="subtotal">${typeScore.totalScore}</span> 分</small>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });

    // 更新总计信息
    document.getElementById('calculatedTotalScore').textContent = totalScore;
    document.getElementById('totalQuestionCount').textContent = totalQuestions;
    document.getElementById('totalScore').value = totalScore;

    // 显示题型分数设置区域
    scoreSection.style.display = 'block';

    // 启用生成按钮
    document.getElementById('generateExamBtn').disabled = false;
}

// 更新总分计算
function updateTotalScore() {
    const scoreInputs = document.querySelectorAll('.score-input');
    let totalScore = 0;

    scoreInputs.forEach(input => {
        const scorePerQuestion = parseInt(input.value) || 0;
        const questionCount = parseInt(input.dataset.questionCount) || 0;
        const subtotal = scorePerQuestion * questionCount;

        // 更新小计显示
        const subtotalSpan = input.closest('.card-body').querySelector('.subtotal');
        subtotalSpan.textContent = subtotal;

        totalScore += subtotal;
    });

    // 更新总分显示
    document.getElementById('calculatedTotalScore').textContent = totalScore;
    document.getElementById('totalScore').value = totalScore;
}

// 收集题型分数设置
function collectQuestionTypeScores() {
    const scoreInputs = document.querySelectorAll('.score-input');
    const questionTypeScores = [];

    scoreInputs.forEach(input => {
        const questionType = input.dataset.questionType;
        const questionCount = parseInt(input.dataset.questionCount);
        const scorePerQuestion = parseInt(input.value) || 1;
        const totalScore = scorePerQuestion * questionCount;

        questionTypeScores.push({
            questionType: questionType,
            questionCount: questionCount,
            scorePerQuestion: scorePerQuestion,
            totalScore: totalScore
        });
    });

    return questionTypeScores;
}

// 重置试卷表单
function resetExamForm() {
    document.getElementById('examPaperGenerationForm').reset();
    document.getElementById('questionTypeScores').style.display = 'none';
    document.getElementById('generateExamBtn').disabled = true;
    showAlert('表单已重置！', 'info');
}

// 显示提示信息
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 3000);
}

// 显示试卷生成表单（保留原有函数名以兼容）
function showExamPaperForm() {
    // 由于现在表单直接显示，这个函数可以保留但不做任何操作
    console.log('试卷设置表单已直接显示');
}

// 为试卷生成表单加载科目
async function loadSubjectsForExam() {
    try {
        const response = await fetch(`${API_BASE}/subjects`);
        const subjects = await response.json();
        const subjectSelect = document.getElementById('examSubject');
        
        // 清空现有选项
        subjectSelect.innerHTML = '<option value="">请选择科目</option>';
        
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.name;
            option.textContent = subject.name;
            subjectSelect.appendChild(option);
        });
    } catch (error) {
        console.error('加载科目失败:', error);
    }
}

// 处理试卷生成
async function handleExamPaperGeneration(event) {
    event.preventDefault();

    const formData = {
        title: document.getElementById('examTitle').value,
        subject: document.getElementById('examSubject').value,
        totalScore: parseInt(document.getElementById('totalScore').value),
        duration: parseInt(document.getElementById('duration').value)
    };

    // 如果有题型分数设置，添加到请求中
    const questionTypeScores = collectQuestionTypeScores();
    if (questionTypeScores.length > 0) {
        formData.questionTypeScores = questionTypeScores;
    }

    try {
        const response = await fetch(`${API_BASE}/exam-paper/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const examPaper = await response.json();

            // 保存试卷数据供下载使用
            window.currentExamPaper = examPaper;

            // 显示下载选项
            showDownloadOptions(examPaper);
            showAlert('试卷生成成功！请选择下载选项。', 'success');
        } else {
            showAlert('试卷生成失败！', 'danger');
        }
    } catch (error) {
        console.error('生成试卷失败:', error);
        showAlert('生成试卷时发生错误！', 'danger');
    }
}

// 显示下载选项
function showDownloadOptions(examPaper) {
    // 创建下载选项模态框
    const modalHtml = `
        <div class="modal fade" id="downloadModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">试卷生成成功</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p><strong>试卷标题：</strong>${examPaper.title}</p>
                        <p><strong>科目：</strong>${examPaper.subject}</p>
                        <p><strong>总分：</strong>${examPaper.totalScore}分</p>
                        <p><strong>考试时长：</strong>${examPaper.duration}分钟</p>
                        <p><strong>题目数量：</strong>${examPaper.questions.length}题</p>
                        <hr>
                        <p>请选择要下载的内容：</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" onclick="downloadExamPaperPDF()">
                            <i class="fas fa-download"></i> 下载试卷
                        </button>
                        <button type="button" class="btn btn-info" onclick="downloadAnswerKeyPDF()">
                            <i class="fas fa-key"></i> 下载答案和解析
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="showExamPreview()">
                            <i class="fas fa-eye"></i> 预览试卷
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 移除已存在的模态框
    const existingModal = document.getElementById('downloadModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 添加新的模态框
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('downloadModal'));
    modal.show();
}

// 显示试卷预览
function showExamPreview() {
    if (window.currentExamPaper) {
        displayExamPaper(window.currentExamPaper);
        
        // 关闭下载模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('downloadModal'));
        if (modal) {
            modal.hide();
        }
        
        // 滚动到预览区域
        const preview = document.getElementById('examPaperPreview');
        preview.scrollIntoView({ behavior: 'smooth' });
    }
}

// 显示生成的试卷
function displayExamPaper(examPaper) {
    const preview = document.getElementById('examPaperPreview');
    const content = document.getElementById('examPaperContent');
    const answerKey = document.getElementById('answerKeyContent');
    
    // 显示试卷内容
    let examContent = `
        <h4>${examPaper.title}</h4>
        <p><strong>科目：</strong>${examPaper.subject}</p>
        <p><strong>总分：</strong>${examPaper.totalScore}分</p>
        <p><strong>考试时长：</strong>${examPaper.duration}分钟</p>
        <hr>
        <h5>试题</h5>
    `;
    
    examPaper.questions.forEach((question, index) => {
        examContent += `
            <div class="mb-3 p-3 border rounded">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <p><strong>${index + 1}. [${question.questionType}] (${question.score}分)</strong></p>
                        <p><span class="math-content">${question.content}</span></p>
                    </div>
                    <button class="btn btn-outline-info btn-sm ms-2" onclick="toggleExamAnswer(${question.id}, ${index})">
                        <i class="fas fa-eye"></i> 查看答案
                    </button>
                </div>
                <div id="exam-answer-${question.id}" class="mt-2 p-2 bg-light border rounded" style="display: none;">
                    <p class="mb-1"><strong>答案：</strong><span id="exam-answer-content-${question.id}">加载中...</span></p>
                    <p class="mb-0"><strong>解析：</strong><span id="exam-analysis-content-${question.id}">加载中...</span></p>
                </div>
            </div>
        `;
    });
    
    content.innerHTML = examContent;
    
    // 显示答案和解析
    answerKey.innerHTML = `<pre style="white-space: pre-wrap;">${examPaper.answerKey}</pre>`;
    
    // 显示预览区域
    preview.style.display = 'block';
    
    // 滚动到预览区域
    preview.scrollIntoView({ behavior: 'smooth' });
    
    // 渲染数学公式
    waitForMathJax().then(() => {
        renderMathContent(content);
    });
    
    // 加载试卷中每道题目的答案和解析
    loadExamQuestionAnswers(examPaper.questions);
}

// 加载试卷中题目的答案和解析
async function loadExamQuestionAnswers(questions) {
    for (let question of questions) {
        try {
            const response = await fetch(`${API_BASE}/questions/${question.id}`);
            if (response.ok) {
                const questionData = await response.json();
                
                const answerContent = document.getElementById(`exam-answer-content-${question.id}`);
                const analysisContent = document.getElementById(`exam-analysis-content-${question.id}`);
                
                if (answerContent) {
                    // 清除之前的MathJax渲染
                    clearMathJaxElements(answerContent);
                    answerContent.innerHTML = `<span class="math-content">${questionData.answer || '暂无答案'}</span>`;
                }
                if (analysisContent) {
                    // 清除之前的MathJax渲染
                    clearMathJaxElements(analysisContent);
                    const analysisText = questionData.analysis || '暂无解析';
                    analysisContent.innerHTML = `<span class="math-content">${ensureLatexMarkers(analysisText)}</span>`;
                }

                // 延迟渲染数学公式，确保DOM更新完成
                setTimeout(() => {
                    waitForMathJax().then(() => {
                        const promises = [];
                        if (answerContent) promises.push(renderMathContent(answerContent));
                        if (analysisContent) promises.push(renderMathContent(analysisContent));

                        Promise.all(promises).then(() => {
                            console.log(`试卷题目 ${question.id} 的答案和解析数学公式加载完成`);
                        });
                    });
                }, 100);
            }
        } catch (error) {
            console.error(`加载题目 ${question.id} 的答案失败:`, error);
        }
    }
}

// 切换试卷中题目答案的显示/隐藏
function toggleExamAnswer(questionId, index) {
    const answerDiv = document.getElementById(`exam-answer-${questionId}`);
    const button = event.target.closest('button');

    if (answerDiv.style.display === 'none') {
        answerDiv.style.display = 'block';
        button.innerHTML = '<i class="fas fa-eye-slash"></i> 隐藏答案';
        button.classList.remove('btn-outline-info');
        button.classList.add('btn-info');

        // 延迟渲染，确保元素已经显示
        setTimeout(() => {
            clearMathJaxElements(answerDiv);
            waitForMathJax().then(() => {
                renderMathContent(answerDiv);
            });
        }, 150);
    } else {
        answerDiv.style.display = 'none';
        button.innerHTML = '<i class="fas fa-eye"></i> 查看答案';
        button.classList.remove('btn-info');
        button.classList.add('btn-outline-info');
    }
}

// 生成答案和解析文档
async function generateAnswerKey() {
    try {
        const response = await fetch(`${API_BASE}/exam-paper/answer-key`);
        
        if (response.ok) {
            const answerKey = await response.text();
            const answerKeyContent = document.getElementById('answerKeyContent');
            answerKeyContent.innerHTML = `<pre style="white-space: pre-wrap;">${answerKey}</pre>`;
            
            // 显示答案和解析区域
            const preview = document.getElementById('examPaperPreview');
            preview.style.display = 'block';
            preview.scrollIntoView({ behavior: 'smooth' });
            
            showAlert('答案和解析生成成功！', 'success');
        } else {
            showAlert('生成答案和解析失败！', 'danger');
        }
    } catch (error) {
        console.error('生成答案和解析失败:', error);
        showAlert('生成答案和解析时发生错误！', 'danger');
    }
}

// 切换答案和解析的显示/隐藏
function toggleAnswerAnalysis(questionId) {
    const answerAnalysisDiv = document.getElementById(`answer-analysis-${questionId}`);
    const button = event.target.closest('button');

    if (answerAnalysisDiv.style.display === 'none') {
        answerAnalysisDiv.style.display = 'block';
        button.innerHTML = '<i class="fas fa-eye-slash"></i> 隐藏答案和解析';
        button.classList.remove('btn-outline-info');
        button.classList.add('btn-info');

        // 延迟渲染，确保元素已经显示
        setTimeout(() => {
            // 添加调试信息
            debugAnalysisContent(questionId);

            // 清除之前的MathJax渲染，然后重新渲染
            clearMathJaxElements(answerAnalysisDiv);
            waitForMathJax().then(() => {
                renderMathContent(answerAnalysisDiv).then(() => {
                    console.log(`题目 ${questionId} 的答案和解析数学公式渲染完成`);
                    // 渲染后再次调试
                    setTimeout(() => debugAnalysisContent(questionId), 100);
                });
            });
        }, 150); // 增加延迟时间
    } else {
        answerAnalysisDiv.style.display = 'none';
        button.innerHTML = '<i class="fas fa-eye"></i> 查看答案和解析';
        button.classList.remove('btn-info');
        button.classList.add('btn-outline-info');
    }
}

// 下载试卷PDF
async function downloadExamPaperPDF() {
    try {
        let examPaper = window.currentExamPaper;
        
        if (!examPaper) {
            showAlert('没有可下载的试卷！请先生成试卷。', 'warning');
            return;
        }
        
        console.log('下载试卷PDF，试卷数据:', examPaper);
        
        // 生成试卷HTML内容
        const htmlContent = generateExamPaperHtml(examPaper);
        console.log('生成的HTML内容长度:', htmlContent.length);
        
        // 使用jsPDF库生成PDF
        await generateSimplePDF(htmlContent, `${examPaper.title || '试卷'}.pdf`);
        
        showAlert('试卷PDF下载成功！', 'success');
    } catch (error) {
        console.error('下载试卷PDF失败:', error);
        showAlert('下载试卷PDF时发生错误！', 'danger');
    }
}

// 下载答案和解析PDF
async function downloadAnswerKeyPDF() {
    try {
        let examPaper = window.currentExamPaper;
        
        if (!examPaper) {
            showAlert('没有可下载的答案和解析！请先生成试卷。', 'warning');
            return;
        }
        
        console.log('下载答案和解析PDF，试卷数据:', examPaper);
        
        // 生成答案和解析HTML内容
        const htmlContent = generateAnswerKeyHtml(examPaper);
        console.log('生成的答案HTML内容长度:', htmlContent.length);
        
        // 使用jsPDF库生成PDF
        await generateSimplePDF(htmlContent, `${examPaper.title || '试卷'}_答案和解析.pdf`);
        
        showAlert('答案和解析PDF下载成功！', 'success');
    } catch (error) {
        console.error('下载答案和解析PDF失败:', error);
        showAlert('下载答案和解析PDF时发生错误！', 'danger');
    }
}

// 全新的PDF生成函数 - 支持中文和数学公式
async function generateSimplePDF(htmlContent, filename) {
    try {
        console.log('开始生成PDF:', filename);

        // 优先尝试使用html2canvas + jsPDF的方案
        if (window.html2canvas) {
            return await generatePDFWithCanvas(htmlContent, filename);
        }

        // 回退到基于文本的PDF生成
        return await generateTextBasedPDF(htmlContent, filename);

    } catch (error) {
        console.error('PDF生成失败:', error);
        showAlert('PDF生成失败，将下载HTML格式文件', 'warning');
        await fallbackToHtmlDownload(htmlContent, filename);
    }
}

// 使用Canvas渲染的PDF生成（支持中文和数学公式）
async function generatePDFWithCanvas(htmlContent, filename) {
    try {
        console.log('使用Canvas方案生成PDF');

        // 创建临时容器
        const container = document.createElement('div');
        container.innerHTML = htmlContent;
        container.style.cssText = `
            position: absolute;
            left: -9999px;
            top: 0;
            width: 800px;
            padding: 20px;
            background: white;
            font-family: 'Microsoft YaHei', 'SimSun', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
        `;

        document.body.appendChild(container);

        // 等待MathJax渲染完成
        if (window.MathJax && window.MathJax.typesetPromise) {
            await window.MathJax.typesetPromise([container]);
        }

        // 等待一下确保渲染完成
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 使用html2canvas截图
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 800,
            height: container.scrollHeight
        });

        // 清理临时容器
        document.body.removeChild(container);

        // 创建PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190; // A4宽度减去边距
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 10;

        // 添加第一页
        doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= 280; // A4页面高度减去边距

        // 如果内容超过一页，添加更多页面
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight + 10;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= 280;
        }

        doc.save(filename);
        console.log('Canvas PDF生成完成:', filename);

    } catch (error) {
        console.error('Canvas PDF生成失败:', error);
        throw error;
    }
}

// 基于文本的PDF生成（改进版）
async function generateTextBasedPDF(htmlContent, filename) {
    try {
        console.log('使用文本方案生成PDF');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // 尝试加载中文字体
        await loadChineseFont(doc);

        // 创建临时容器解析HTML
        const container = document.createElement('div');
        container.innerHTML = htmlContent;

        // 提取纯文本内容
        const textContent = extractCleanText(container);

        // 生成PDF内容
        let y = 20;
        const lineHeight = 8;
        const pageHeight = 280;
        const pageWidth = 170;

        const lines = textContent.split('\n').filter(line => line.trim());

        for (let line of lines) {
            if (y > pageHeight - 10) {
                doc.addPage();
                y = 20;
            }

            // 处理数学公式
            line = processMathFormulas(line);

            // 处理长行
            const wrappedLines = doc.splitTextToSize(line, pageWidth);

            for (let wrappedLine of wrappedLines) {
                if (y > pageHeight - 10) {
                    doc.addPage();
                    y = 20;
                }

                doc.text(wrappedLine, 15, y);
                y += lineHeight;
            }
        }

        doc.save(filename);
        console.log('文本PDF生成完成:', filename);

    } catch (error) {
        console.error('文本PDF生成失败:', error);
        throw error;
    }
}

// 提取结构化内容用于PDF生成
function extractStructuredContent(element) {
    const content = [];

    function processElement(el) {
        const tagName = el.tagName ? el.tagName.toLowerCase() : '';
        const text = el.textContent ? el.textContent.trim() : '';

        if (!text) return;

        switch(tagName) {
            case 'h1':
            case 'h2':
                content.push({ type: 'title', text: text });
                break;
            case 'h3':
            case 'h4':
                content.push({ type: 'subtitle', text: text });
                break;
            case 'p':
                // 检查是否是题目（包含数字开头或特定格式）
                if (text.match(/^\d+\.|第\d+题|题目：/)) {
                    content.push({ type: 'question', text: text });
                } else if (text.includes('答案：') || text.includes('解析：')) {
                    content.push({ type: 'answer', text: text });
                } else {
                    content.push({ type: 'text', text: text });
                }
                break;
            case 'div':
                // 递归处理div中的内容
                for (let child of el.children) {
                    processElement(child);
                }
                break;
            default:
                if (text.length > 0) {
                    content.push({ type: 'text', text: text });
                }
        }
    }

    // 处理所有子元素
    for (let child of element.children) {
        processElement(child);
    }

    return content;
}

// 加载中文字体支持
async function loadChineseFont(doc) {
    try {
        // 尝试使用系统字体
        doc.setFont("helvetica");
        console.log('使用默认字体');
    } catch (error) {
        console.warn('字体加载失败:', error);
    }
}

// 提取干净的文本内容
function extractCleanText(element) {
    let text = '';

    function traverse(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const content = node.textContent.trim();
            if (content) {
                text += content + ' ';
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();

            // 在块级元素前后添加换行
            if (['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr'].includes(tagName)) {
                text += '\n';
            }

            // 递归处理子节点
            for (let child of node.childNodes) {
                traverse(child);
            }

            // 在块级元素后添加换行
            if (['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr'].includes(tagName)) {
                text += '\n';
            }
        }
    }

    traverse(element);

    // 清理多余的空行和空格
    return text
        .replace(/\n\s*\n/g, '\n')  // 合并多个空行
        .replace(/[ \t]+/g, ' ')    // 合并多个空格
        .trim();
}

// 处理数学公式
function processMathFormulas(text) {
    return text
        // 处理常见的数学符号
        .replace(/∫/g, '∫')
        .replace(/∑/g, '∑')
        .replace(/∏/g, '∏')
        .replace(/√/g, '√')
        .replace(/±/g, '±')
        .replace(/≤/g, '≤')
        .replace(/≥/g, '≥')
        .replace(/≠/g, '≠')
        .replace(/≈/g, '≈')
        .replace(/∞/g, '∞')
        .replace(/π/g, 'π')
        .replace(/α/g, 'α')
        .replace(/β/g, 'β')
        .replace(/γ/g, 'γ')
        .replace(/δ/g, 'δ')
        .replace(/θ/g, 'θ')
        .replace(/λ/g, 'λ')
        .replace(/μ/g, 'μ')
        .replace(/σ/g, 'σ')
        .replace(/φ/g, 'φ')
        .replace(/ω/g, 'ω')
        // 处理上下标
        .replace(/\^(\d+)/g, '^$1')
        .replace(/_(\d+)/g, '_$1')
        // 处理分数（简化表示）
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
        // 处理根号
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
        // 处理积分
        .replace(/\\int/g, '∫')
        // 移除LaTeX命令
        .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
        .replace(/\\[a-zA-Z]+/g, '');
}

// 简化文本，处理特殊字符
function simplifyText(text) {
    return text
        .replace(/[""]/g, '"')  // 替换中文引号
        .replace(/['']/g, "'")  // 替换中文单引号
        .replace(/[—]/g, '-')   // 替换中文破折号
        .replace(/[…]/g, '...')  // 替换省略号
        .replace(/[·]/g, '·')   // 保留中点
        .replace(/[\u2000-\u206F]/g, ' '); // 替换特殊空格
}

// 辅助函数：文本换行
function wrapText(doc, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const textWidth = doc.getTextWidth(testLine);

        if (textWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
}

// 备用的文本提取函数（保持兼容性）
function extractTextFromHtml(element) {
    return element.textContent || element.innerText || '';
}

// HTML下载备用方案
async function fallbackToHtmlDownload(htmlContent, filename) {
    try {
        // 创建完整的HTML文档
        const fullHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename.replace('.pdf', '')}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .question {
            margin-bottom: 20px;
            padding: 10px;
            border-left: 3px solid #007bff;
            background-color: #f8f9fa;
        }
        .answer {
            margin-top: 10px;
            padding: 8px;
            background-color: #e9ecef;
            border-radius: 4px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="background: #d4edda; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
        <strong>提示：</strong>PDF生成失败，已自动下载HTML格式。您可以在浏览器中打开此文件并使用"打印"功能保存为PDF。
    </div>
    ${htmlContent}
</body>
</html>`;

        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename.replace('.pdf', '.html');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log('HTML文件下载完成:', filename.replace('.pdf', '.html'));

    } catch (error) {
        console.error('HTML下载失败:', error);
        showAlert('文件下载失败，请检查浏览器设置', 'danger');
    }
}

// 动态加载脚本
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 生成试卷HTML内容
function generateExamPaperHtml(examPaper) {
    console.log('生成试卷HTML，题目数量:', examPaper.questions ? examPaper.questions.length : 0);
    
    let examContent = `
        <h2>${examPaper.title || '试卷'}</h2>
        <p><strong>科目：</strong>${examPaper.subject || '未指定'}</p>
        <p><strong>总分：</strong>${examPaper.totalScore || 0}分</p>
        <p><strong>考试时长：</strong>${examPaper.duration || 0}分钟</p>
        <hr>
        <h3>试题</h3>
    `;
    
    if (examPaper.questions && examPaper.questions.length > 0) {
        examPaper.questions.forEach((question, index) => {
            examContent += `
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
                    <p><strong>${index + 1}. [${question.questionType || '未知题型'}] (${question.score || 0}分)</strong></p>
                    <p style="white-space: pre-wrap;">${question.content || '题目内容为空'}</p>
                </div>
            `;
        });
    } else {
        examContent += '<p>暂无题目</p>';
    }
    
    const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${examPaper.title || '试卷'}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    line-height: 1.6; 
                    font-size: 14px;
                }
                h2 { color: #333; margin-bottom: 20px; }
                h3 { color: #555; margin-bottom: 15px; }
                p { margin-bottom: 10px; }
                hr { 
                    border: none; 
                    border-top: 2px solid #ddd; 
                    margin: 20px 0; 
                }
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            ${examContent}
        </body>
        </html>
    `;
    
    console.log('生成的完整HTML长度:', fullHtml.length);
    return fullHtml;
}

// 生成答案和解析HTML内容
function generateAnswerKeyHtml(examPaper) {
    console.log('生成答案和解析HTML，答案内容长度:', examPaper.answerKey ? examPaper.answerKey.length : 0);
    
    const answerContent = examPaper.answerKey || '暂无答案和解析';
    
    const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${examPaper.title || '试卷'} - 答案和解析</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    line-height: 1.6; 
                    font-size: 14px;
                }
                h1 { 
                    color: #333; 
                    border-bottom: 2px solid #333; 
                    padding-bottom: 10px; 
                    margin-bottom: 30px;
                }
                .answer-content { 
                    white-space: pre-wrap; 
                    font-family: 'Courier New', monospace;
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 5px;
                    border: 1px solid #dee2e6;
                    line-height: 1.8;
                }
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <h1>${examPaper.title || '试卷'} - 答案和解析</h1>
            <div class="answer-content">${answerContent}</div>
        </body>
        </html>
    `;
    
    console.log('生成的答案完整HTML长度:', fullHtml.length);
    return fullHtml;
}

// 保留原有的下载函数以兼容其他功能
async function downloadExamPaper() {
    await downloadExamPaperPDF();
}

// 保留原有的下载函数以兼容其他功能
async function downloadAnswerKey() {
    await downloadAnswerKeyPDF();
}

// 加载题库科目和题型到搜索下拉框
async function loadBankFilters() {
    try {
        const [subjectsRes, typesRes] = await Promise.all([
            fetch(`${API_BASE}/subjects`),
            fetch(`${API_BASE}/question-types`)
        ]);
        bankSubjects = await subjectsRes.json();
        bankTypes = await typesRes.json();
        const subjectSelect = document.getElementById('bankSubjectFilter');
        const typeSelect = document.getElementById('bankTypeFilter');
        subjectSelect.innerHTML = '<option value="">全部科目</option>';
        typeSelect.innerHTML = '<option value="">全部题型</option>';
        bankSubjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            subjectSelect.appendChild(option);
        });
        bankTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            typeSelect.appendChild(option);
        });
    } catch (e) {
        console.error('加载题库筛选项失败', e);
    }
}

// 题库搜索表单事件
if (document.getElementById('bankSearchForm')) {
    document.getElementById('bankSearchForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await searchBankQuestions();
    });
}

// 搜索题库题目
async function searchBankQuestions() {
    const subjectId = document.getElementById('bankSubjectFilter').value;
    const questionTypeId = document.getElementById('bankTypeFilter').value;
    const keyword = document.getElementById('bankKeyword').value.trim();
    let url = `${API_BASE}/questions/bank/search?`;
    if (subjectId) url += `subjectId=${subjectId}&`;
    if (questionTypeId) url += `questionTypeId=${questionTypeId}&`;
    if (keyword) url += `keyword=${encodeURIComponent(keyword)}&`;
    try {
        const response = await fetch(url);
        const result = await response.json();
        displayBankQuestions(result);
    } catch (e) {
        showAlert('题库搜索失败', 'danger');
    }
}

// 加载并分组显示题库题目
async function loadBankQuestionsGrouped() {
    try {
        const response = await fetch(`${API_BASE}/questions/bank/grouped`);
        const questions = await response.json();
        displayBankQuestionsGrouped(questions);
    } catch (e) {
        showAlert('加载分组题库失败', 'danger');
    }
}

// 分组显示题库题目
function displayBankQuestionsGrouped(questions) {
    const container = document.getElementById('bankQuestionsGrouped');
    container.innerHTML = '';

    // 更新计数器
    const countElement = document.getElementById('bankCount');
    if (countElement) {
        countElement.textContent = questions ? questions.length : 0;
    }

    if (!questions || questions.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-5"><i class="fas fa-database fa-3x mb-3 d-block" style="opacity: 0.3;"></i><h5>题库为空</h5><p>暂无题目数据</p></div>';
        return;
    }
    // 按科目分组
    const groupMap = {};
    questions.forEach(q => {
        const subjectName = q.subject.name;
        if (!groupMap[subjectName]) groupMap[subjectName] = [];
        groupMap[subjectName].push(q);
    });
    Object.keys(groupMap).forEach(subject => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'mb-4';
        groupDiv.innerHTML = `<h6 class="mb-3"><i class="fas fa-book"></i> ${subject}</h6>`;
        groupMap[subject].forEach(q => {
            const card = createQuestionCard(q, 'bank');
            groupDiv.appendChild(card);
        });
        container.appendChild(groupDiv);
    });
}

// 修改原有loadBankQuestions和displayBankQuestions，支持可传入参数
async function loadBankQuestions() {
    // 默认加载分组显示
    await loadBankQuestionsGrouped();
}

function displayBankQuestions(questions) {
    // 搜索时显示搜索结果，不分组
    const container = document.getElementById('bankQuestions');
    document.getElementById('bankQuestionsGrouped').innerHTML = '';
    container.innerHTML = '';
    if (!questions || questions.length === 0) {
        container.innerHTML = '<p class="text-muted">未找到相关题目</p>';
        return;
    }
    questions.forEach(question => {
        const questionCard = createQuestionCard(question, 'bank');
        container.appendChild(questionCard);
    });
}

// 页面初始化时加载题库筛选项
if (document.getElementById('bankSubjectFilter')) {
    loadBankFilters();
}

// 加载编辑模态框的选项
async function loadEditModalOptions() {
    try {
        // 加载科目选项
        const subjectsResponse = await fetch(`${API_BASE}/subjects`);
        const subjects = await subjectsResponse.json();
        const subjectSelect = document.getElementById('editQuestionSubject');
        subjectSelect.innerHTML = '<option value="">请选择科目</option>';
        subjects.forEach(subject => {
            subjectSelect.innerHTML += `<option value="${subject.id}">${subject.name}</option>`;
        });

        // 加载题型选项
        const typesResponse = await fetch(`${API_BASE}/question-types`);
        const types = await typesResponse.json();
        const typeSelect = document.getElementById('editQuestionType');
        typeSelect.innerHTML = '<option value="">请选择题型</option>';
        types.forEach(type => {
            typeSelect.innerHTML += `<option value="${type.id}">${type.name}</option>`;
        });
    } catch (error) {
        console.error('加载编辑选项失败:', error);
    }
}

// 页面初始化时加载编辑模态框的选项
if (document.getElementById('editQuestionSubject')) {
    loadEditModalOptions();
}

// UI增强功能函数
function clearGeneratedQuestions() {
    if (confirm('确定要清空所有已生成的题目吗？')) {
        generatedQuestions = [];
        displayGeneratedQuestions();
        // 清空localStorage
        localStorage.removeItem(GENERATED_QUESTIONS_KEY);
        showAlert('已清空所有已生成的题目', 'success');
    }
}

function refreshBankQuestions() {
    showAlert('正在刷新题库...', 'info');
    loadBankQuestions();
}

function clearExamQuestions() {
    if (confirm('确定要清空待生成试卷中的所有题目吗？')) {
        examQuestions = [];
        displayExamQuestions();
        saveExamQuestionsToStorage();
        showAlert('已清空待生成试卷', 'success');
    }
}

function previewExamPaper() {
    if (examQuestions.length === 0) {
        showAlert('试卷中没有题目，无法预览', 'warning');
        return;
    }

    // 创建预览窗口
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    const previewContent = generatePreviewContent();

    previewWindow.document.write(previewContent);
    previewWindow.document.close();
}

function generatePreviewContent() {
    let content = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <title>试卷预览</title>
            <style>
                body { font-family: 'Microsoft YaHei', sans-serif; margin: 20px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .question { margin-bottom: 25px; padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; }
                .question-number { font-weight: bold; color: #007bff; }
                .question-content { margin: 10px 0; }
                .question-info { font-size: 0.9em; color: #666; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>试卷预览</h1>
                <p>题目数量：${examQuestions.length} 道</p>
            </div>
    `;

    examQuestions.forEach((question, index) => {
        content += `
            <div class="question">
                <div class="question-number">第 ${index + 1} 题</div>
                <div class="question-content">${question.content}</div>
                <div class="question-info">
                    科目：${question.subject.name} |
                    题型：${question.questionType.name} |
                    难度：${question.difficulty}/5
                </div>
            </div>
        `;
    });

    content += `
        </body>
        </html>
    `;

    return content;
}