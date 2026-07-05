# CI/CD Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive CI/CD pipeline with Dev/Staging/Production stages, Vitest testing, and DevSecOps security scanning.

**Architecture:** Monolithic GitHub Actions workflow (`ci-cd.yml`) with conditional jobs per environment. Lint → Typecheck → Test → Build → Security(PR/main) → Deploy(main only).

**Tech Stack:** GitHub Actions, Vitest, CodeQL, TruffleHog, self-hosted Windows runner

## Global Constraints

- All workflow jobs use `ubuntu-latest` except deploy which uses `[self-hosted, windows]`
- Node.js version 20 across all jobs
- `node_modules` cached via actions/cache keyed on package-lock.json hash
- Concurrency: cancel in-progress for same branch (except main)
- Dist artifact passed from build to deploy job

---

### Task 1: Add Vitest + test infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Add vitest and test dependencies to package.json**

Add to devDependencies: `"vitest": "^3.1.1"`, `"@vitest/coverage-v8": "^3.1.1"`, `"jsdom": "^26.0.0"`
Add to scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:coverage": "vitest run --coverage"`

- [ ] **Step 2: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
})
```

- [ ] **Step 3: Add `coverage/` to .gitignore**

- [ ] **Step 4: Verify vitest runs**

Run: `npm run test`
Expected: No tests found but vitest exits cleanly (0 tests, 0 failures).

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.config.ts .gitignore
git commit -m "feat: add Vitest test infrastructure"
```

---

### Task 2: Create the main CI/CD workflow

**Files:**
- Create: `.github/workflows/ci-cd.yml`
- Delete: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/ci-cd.yml`**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, '**']
  pull_request:
    branches: [main]

concurrency:
  group: ci-cd-${{ github.ref }}
  cancel-in-progress: ${{ github.ref_name != 'main' }}

env:
  NODE_VERSION: '20'

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - name: Cache npm
        id: cache
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      - run: npm ci
      - run: npx oxlint@latest .

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - name: Cache npm
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      - run: npm ci
      - run: npx tsc -b

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: [typecheck]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - name: Cache npm
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      - run: npm ci
      - run: npx vitest run --reporter=verbose

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - name: Cache npm
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: [build]
    if: github.event_name == 'pull_request' || github.ref_name == 'main'
    permissions:
      security-events: write
      actions: read
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - name: Cache npm
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      - run: npm ci
      - name: Dependency audit
        run: npm audit --audit-level=high
        continue-on-error: true
      - name: Secret scanning
        uses: trufflesecurity/trufflehog@main
        with:
          extra_args: --results=verified,unknown
        continue-on-error: true
      - name: CodeQL Init
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript
      - name: CodeQL Analyze
        uses: github/codeql-action/analyze@v3

  deploy-production:
    name: Deploy Production
    runs-on: [self-hosted, windows]
    needs: [security]
    if: github.ref_name == 'main' && github.event_name == 'push'
    environment:
      name: production
      url: https://records.barangay.gov.ph
    steps:
      - name: Download dist artifact
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - name: Deploy to server
        shell: powershell
        run: |
          $ProjectRoot = "D:\BARANGAYCC\barangay-system"
          $ErrorActionPreference = "Stop"
          Write-Host "Pulling latest code..."
          Set-Location -LiteralPath $ProjectRoot
          git pull origin main
          Write-Host "Installing dependencies..."
          npm ci
          Write-Host "Copying built artifacts to pb_public..."
          Copy-Item -Path "$(Get-Location)\dist\*" -Destination "$ProjectRoot\pb_public\" -Recurse -Force
          Write-Host "Restarting PocketBase..."
          Restart-Service -Name PocketBase -Force
      - name: Health check
        shell: powershell
        run: |
          Start-Sleep -Seconds 5
          $response = Invoke-RestMethod -Uri "http://localhost:8090/api/health" -ErrorAction SilentlyContinue
          if ($response.code -ne 200) {
            Write-Error "Health check failed: $($response | ConvertTo-Json)"
            exit 1
          }
          Write-Host "PocketBase is healthy."
```

- [ ] **Step 2: Delete old deploy.yml**

Remove `.github/workflows/deploy.yml`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci-cd.yml
git rm .github/workflows/deploy.yml
git commit -m "feat: implement comprehensive CI/CD pipeline"
```

---

### Task 3: Verify final state

- [ ] **Step 1: Check git status**

Run: `git status`
Expected: Clean working tree, no untracked files.

- [ ] **Step 2: Verify workflows directory**

Run: `Get-ChildItem -Path .github/workflows/ -Name`
Expected: Only `ci-cd.yml`

- [ ] **Step 3: Run lint and build locally**

```bash
npm run lint
npm run build
```

- [ ] **Step 4: Final commit if fixes needed**

```bash
git add -A
git commit -m "chore: final verification before deploy"
```
