# CLAUDE.md - deploy-to-kingslanding

## Project Overview
GitHub Action (composite) that deploys static sites to King's Landing via presigned S3 uploads with parallel transfers. Thin wrapper around `@kingslanding/cli`.

## Structure
- `action.yml` — composite action definition (inputs, outputs, steps)
- `package.json` — declares the package (no runtime dependencies)
- `package-lock.json` — lockfile
- `.pre-commit-config.yaml` — prettier, gitleaks, conventional commits

## How It Works
1. Caller provides `project`, `directory`, and `deploy-key` inputs (optional `api-url`)
2. Action runs `npx @kingslanding/cli@^1 deploy` with the directory and project
3. CLI authenticates via `KL_DEPLOY_KEY` env var, uploads files to S3
4. Outputs `deployment-id` and `project-url` via `$GITHUB_OUTPUT`

## Commands
```bash
npm install          # install dependencies (lockfile only, no src)
```
No test or lint commands — validation is via pre-commit hooks (prettier, gitleaks, conventional-pre-commit).

## Conventions
- Composite action — no JS/TS build step, all logic in shell
- CLI version pinned to `@^1` (major-locked)
- Deploy key passed via environment variable, not CLI arg

## Before Committing
- `pre-commit run --all-files` passes
- Commit messages follow conventional commits (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`)
