@echo off
echo 正在启动试卷生成系统（集成AI服务）...
echo.

REM 检查Java是否安装
java -version >nul 2>&1
if errorlevel 1 (
    echo 错误：未找到Java，请先安装Java 17
    pause
    exit /b 1
)

echo 环境检查通过，开始启动项目...
echo.

REM 清理并编译项目
echo 正在编译项目...
call .\mvnw.cmd clean compile -q
if errorlevel 1 (
    echo 编译失败，请检查项目配置
    pause
    exit /b 1
)

echo 编译成功，正在启动应用（集成AI服务）...
echo.
echo 应用启动后，您可以访问：
echo - 主页面: http://localhost:8080
echo - H2控制台: http://localhost:8080/h2-console
echo.
echo AI服务配置：
echo - API密钥: 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
echo - 模型: deepseek-r1-distill-llama-70b
echo.

REM 启动项目
call .\mvnw.cmd spring-boot:run

echo.
echo 应用已停止
pause 