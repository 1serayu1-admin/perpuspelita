@echo off
echo Building project...
npm run build

echo.
echo Deployment options:
echo 1. Go to https://app.netlify.com/drop
echo 2. Drag and drop the 'dist' folder
echo 3. Or use Netlify dashboard for manual deploy
echo.
echo Press any key to open Netlify deploy page...
pause > nul
start https://app.netlify.com/drop
