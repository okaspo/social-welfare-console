---
description: Deploy the application to production (Vercel)
---

# Deployment Workflow

This project is configured for **Continuous Deployment** via Vercel.
To deploy changes to the production environment, you simply need to push the code to the `main` branch on GitHub.

**DO NOT** ask the user to manually deploy unless the git push fails.
**DO NOT** try to run `vercel` CLI commands directly as they are likely not configured.

## Steps

1. Stage all changes:
   ```bash
   git add .
   ```

2. Commit changes with a descriptive message:
   ```bash
   git commit -m "feat: [Description of changes]"
   ```

3. Push to `main` branch:
   ```bash
   // turbo
   git push origin main
   ```

4. Notify the user that the deployment has been triggered via Git.
