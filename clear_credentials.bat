@echo off
echo Clearing Git credentials for GitHub...
echo.

echo 1. Clearing Git credential helper...
git config --global --unset credential.helper 2>nul

echo 2. Opening Windows Credential Manager...
echo Find and delete any GitHub credentials
rundll32.exe keymgr.dll,KRShowKeyMgr

echo.
echo 3. After deleting GitHub credentials, press any key to continue with push...
pause > nul

echo 4. Attempting to push to GitHub...
git push

echo.
echo If still fails, try manual deploy to Netlify:
echo - npm run build
echo - Upload 'dist' folder to https://app.netlify.com/drop
pause
