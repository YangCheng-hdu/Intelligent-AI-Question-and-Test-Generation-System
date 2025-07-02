@echo off
echo 正在启动试卷生成系统...
echo.

REM 检查Java是否安装
java -version >nul 2>&1
if errorlevel 1 (
    echo 错误：未找到Java，请先安装Java 17
    pause
    exit /b 1
)

REM 检查Maven是否安装
mvn -version >nul 2>&1
if errorlevel 1 (
    echo 错误：未找到Maven，请先安装Maven
    pause
    exit /b 1
)

echo 环境检查通过，开始启动项目...
echo.

REM 清理并编译项目
echo 正在编译项目...
mvn clean compile -q
if errorlevel 1 (
    echo 编译失败，请检查项目配置
    pause
    exit /b 1
)

echo 编译成功，正在启动应用...
echo.

REM 启动项目
mvn spring-boot:run

echo.
echo 应用已停止
pause 