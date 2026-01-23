@echo off
git add .
git commit -m "fix: move conditional return in AoiChat to after all hooks to prevent React error"
git push origin main
