@echo off
echo ========================================
echo 51Talk数据中台 - 开发环境启动脚本
echo ========================================
echo.

echo 检查Node.js版本...
node --version
if %errorlevel% neq 0 (
    echo 错误: 请先安装Node.js (版本 >= 18.0.0)
    pause
    exit /b 1
)

echo.
echo 检查npm版本...
npm --version
if %errorlevel% neq 0 (
    echo 错误: npm未正确安装
    pause
    exit /b 1
)

echo.
echo 安装项目依赖...
cd /d "%~dp0.."
npm run install:all
if %errorlevel% neq 0 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 检查数据库连接...
echo 请确保MySQL服务已启动，数据库配置正确
echo 数据库名: talk51_data_platform
echo 如需创建数据库，请运行: npm run db:migrate
echo.

echo 启动开发服务器...
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:3001
echo API文档: http://localhost:3001/api
echo 健康检查: http://localhost:3001/health
echo.
echo 按 Ctrl+C 停止服务
echo.

npm run dev

echo.
echo 开发服务器已停止
pause