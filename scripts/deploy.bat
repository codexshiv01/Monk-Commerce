@echo off
REM 🚀 Render Deployment Script for Coupon API (Windows)
REM This script helps prepare your application for deployment

echo 🚀 Preparing Coupon API for Render Deployment...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Make sure you're in the project root directory.
    pause
    exit /b 1
)

REM Check if Node.js and npm are installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: npm is not installed. Please install npm first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js version: %NODE_VERSION%
echo ✅ npm version: %NPM_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Error: Failed to install dependencies.
    pause
    exit /b 1
)

REM Run tests to ensure everything works
echo.
echo 🧪 Running tests...
call npm test

if %errorlevel% neq 0 (
    echo ⚠️  Warning: Some tests failed. You may want to fix them before deploying.
    set /p continue="Do you want to continue with deployment? (y/n): "
    if /i not "%continue%"=="y" (
        echo ❌ Deployment cancelled.
        pause
        exit /b 1
    )
)

REM Check if .env file exists
if exist ".env" (
    echo.
    echo ⚠️  Found .env file. Make sure to set these environment variables in Render:
    echo 📝 Environment variables from .env:
    for /f "usebackq tokens=*" %%i in (".env") do (
        echo %%i | findstr /v "^#" | findstr /v "^$" >nul && echo    %%i
    )
    echo.
)

REM Check if Git is initialized
if not exist ".git" (
    echo 📁 Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit - Coupon API ready for deployment"
    echo ✅ Git repository initialized.
    echo 🔗 Don't forget to add your remote origin:
    echo    git remote add origin https://github.com/yourusername/coupon-api.git
    echo    git push -u origin main
) else (
    echo ✅ Git repository already exists.
    
    REM Check for uncommitted changes
    git status --porcelain 2>nul | findstr /r ".*" >nul
    if %errorlevel% equ 0 (
        echo 📝 You have uncommitted changes. Committing them...
        git add .
        git commit -m "Prepare for deployment - %date% %time%"
        echo ✅ Changes committed.
    )
    
    REM Push to remote if it exists
    git remote | findstr "origin" >nul
    if %errorlevel% equ 0 (
        echo 🚀 Pushing to remote repository...
        git push
        echo ✅ Code pushed to repository.
    ) else (
        echo 🔗 No remote origin found. Add your GitHub repository:
        echo    git remote add origin https://github.com/yourusername/coupon-api.git
        echo    git push -u origin main
    )
)

echo.
echo 🎉 Deployment preparation complete!
echo.
echo 📋 Next steps:
echo 1. 🌐 Go to https://render.com and sign up/login
echo 2. 🔗 Connect your GitHub repository
echo 3. ⚙️  Set environment variables in Render dashboard:
echo    - NODE_ENV=production
echo    - DATABASE_URL=your_database_url
echo 4. 🚀 Deploy your service
echo.
echo 📖 Check DEPLOYMENT_GUIDE.md for detailed instructions!
echo.
echo 🎯 Your API will be available at: https://your-app-name.onrender.com
echo.
pause

