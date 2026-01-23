@echo off
git add .
git commit -m "fix: restore missing exports in model-router.ts to fix build loop"
git push origin main
