# DevGotchi Git & Development Workflow Rules

## 1. ⚠️ STRICT COMMIT POLICY: NO AUTO-COMMITS
* **NEVER automatically execute `git commit` or `git push` without explicit user instruction!**
* All code changes must remain in the **Working Directory** until the user explicitly says: *"commit cho tôi"*, *"hãy commit code"*, or similar.
* Always verify `npm run build:frontend` and `npm run build:backend` pass with Exit Code 0 before asking or proceeding with commit.

## 2. Commit Message Standards
When the user explicitly authorizes a commit, use Conventional Commits:
* `feat(scope): ...` for new features (e.g. `feat(minigame): add 30s catch-the-bug mini-game`)
* `fix(scope): ...` for bug fixes (e.g. `fix(ai): update model to gemini-3.5-flash-lite`)
* `refactor(scope): ...` for architectural improvements without behavioral change
* `chore(scope): ...` for dependency upgrades, build configs, or documentation

## 3. Deployment Safety
* Pushing to `origin main` automatically triggers live deployment on Render.
* Never commit secrets, `.env` files, or temporary testing scripts.
* All build-critical packages (`@nestjs/cli`, `prisma`, `typescript`) must remain in `dependencies` for Render production builds.
