@echo off
echo Setting up Git...
set PATH=%PATH%;C:\Program Files\Git\bin;C:\Program Files\Git\cmd

cd /d c:\Users\ALI\OneDrive\Documents\Kiro\pokevault

git init
git config user.email "ismailyazddan@gmail.com"
git config user.name "IS_DOSK"
git add .
git commit -m "PokéVault - Full deployment"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/affanyazddan456-ux/pokevault.git
git push -u origin main --force

echo.
echo Done! Check https://github.com/affanyazddan456-ux/pokevault
pause
