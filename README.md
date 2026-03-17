# prompt-ci-cd

> CI/CD quality gate for LLM prompts — eval, baseline comparison, regression detection.

## 🔄 How it works

```
PR with prompt change
  → 🤖 GitHub Actions triggers
    → 📋 Loads eval suite (test cases + assertions)
      → 🧠 Runs prompt through LLM (Gemini)
        → ✅ Checks assertions (contains, regex, length, JSON)
          → 📊 Compares metrics with saved baseline
            → ✅ or ❌ on PR + markdown report
```

## 📁 Project structure

```
prompts/          — 📝 prompt files (YAML: template + metadata)
evals/            — 🧪 eval suites (YAML: test cases + assertions)
baselines/        — 📊 saved metric snapshots (JSON)
src/
├── cli.ts        — ⚡ CLI entry point
├── types/        — 🔒 Zod schemas (prompt, eval, baseline)
├── loaders/      — 📦 YAML loading + validation
├── engine/
│   ├── template.ts    — 🔤 {{variable}} substitution
│   ├── assertions.ts  — ✅ response checks
│   ├── runner.ts      — 🏃 eval orchestrator
│   ├── baseline.ts    — 📊 save/load/compare baselines
│   └── report.ts      — 📝 markdown PR report generator
└── providers/
    ├── types.ts       — 🔌 LLM provider interface
    ├── gemini.ts      — ♊ Gemini implementation
    └── index.ts       — 🏭 provider factory
```

## 🚀 Quick start

```bash
npm install
cp .env.example .env  # add your GEMINI_API_KEY

# 🏃 Run eval
npx tsx src/cli.ts run prompts/summarize.yaml

# 👀 Dry run (no LLM calls)
npx tsx src/cli.ts run prompts/summarize.yaml --dry-run

# 💾 Save baseline
npx tsx src/cli.ts baseline:save prompts/summarize.yaml

# 🔍 Compare against baseline
npx tsx src/cli.ts baseline:compare prompts/summarize.yaml

# 🤖 CI mode (markdown report)
npx tsx src/cli.ts ci prompts/summarize.yaml
```

## 📝 Prompt file format

```yaml
name: summarize
version: "1.0.0"
model:
  provider: gemini          # gemini | anthropic | openai
  name: gemini-2.5-flash
eval_suite: "../evals/summarize-eval.yaml"
template: |
  Summarize the following text in 2-3 sentences.
  Text: {{text}}
```

## 🧪 Eval suite format

```yaml
name: summarize-eval
cases:
  - id: short-article
    variables:
      text: "Some text to summarize..."
    assertions:
      - type: contains
        value: "key term"
      - type: max_length
        value: 500
      - type: not_contains
        value: "I cannot"
```

### ✅ Assertion types

| Type | Description |
|------|-------------|
| `contains` | ✅ Response includes substring (case-insensitive) |
| `not_contains` | 🚫 Response does NOT include substring |
| `matches_regex` | 🔤 Response matches regex pattern |
| `max_length` | 📏 Response length ≤ value |
| `is_json` | 📋 Response is valid JSON |

## 🤖 CI/CD

Two GitHub Actions workflows:

- **🔍 lint.yaml** — tsc + eslint + prettier on every push/PR
- **🧪 prompt-eval.yaml** — triggers on PR when `prompts/**` or `evals/**` change, runs eval, posts report as PR comment

### 📊 PR report example

> ## 🐸 Prompt CI Report: `summarize`
>
> | Metric | Baseline | Current | Delta | Status |
> |--------|----------|---------|-------|--------|
> | Accuracy | 100.0% | 100.0% | +0.0% | ➖ |
> | Avg Latency | 2601ms | 3200ms | +599ms | ➖ |
> | Total Tokens | 1489 | 1520 | +31 | ➖ |
>
> **Verdict: ✅ PASS**

## 🔐 Setup secrets

Add `GEMINI_API_KEY` to GitHub repo secrets:

📍 Repo → Settings → Secrets and variables → Actions → New repository secret

## 🛠️ Dev tooling

| Tool | What it does |
|------|-------------|
| 🔍 ESLint | Code linting (flat config + TS rules) |
| 💅 Prettier | Code formatting |
| 🐶 Husky | Git hooks (pre-commit) |
| 📋 lint-staged | Runs eslint + prettier on staged files only |
