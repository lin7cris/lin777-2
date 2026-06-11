# AI Provider Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `parseDailyInput` the only AI entry point, with a provider layer selected by `AI_PROVIDER` and a complete DeepSeek implementation.

**Architecture:** The cloud function validates `text` and `profile`, asks a provider selected by a small factory to parse the entry, then normalizes the untrusted model response into one stable JSON contract. DeepSeek owns its HTTP request and prompt; OpenAI, Gemini, and Claude expose the same interface but return a clear not-implemented error.

**Tech Stack:** WeChat Cloud Functions, Node.js built-in `https`, DeepSeek Chat Completions JSON Output, native mini-program JavaScript.

---

### Task 1: Standard response contract

**Files:**
- Create: `cloudfunctions/parseDailyInput/schema.js`
- Test: `tests/ai-provider.test.js`

- [ ] Write a failing test asserting food fields `name`, `amount`, `meal`, `calories`, `protein`, `fat`, `carbs`, `estimated`; exercise fields `name`, `duration`, `calories`, `estimated`; and calculated `summary` totals.
- [ ] Run `node tests/ai-provider.test.js` and confirm it fails because `schema.js` is missing.
- [ ] Implement `normalizeAiResult(sourceText, raw)` with numeric coercion, boolean defaults, array defaults, and summary calculation from normalized items.
- [ ] Run `node tests/ai-provider.test.js` and confirm the schema assertions pass.

### Task 2: Provider factory and stubs

**Files:**
- Create: `cloudfunctions/parseDailyInput/providers/index.js`
- Create: `cloudfunctions/parseDailyInput/providers/openai.js`
- Create: `cloudfunctions/parseDailyInput/providers/gemini.js`
- Create: `cloudfunctions/parseDailyInput/providers/claude.js`
- Test: `tests/ai-provider.test.js`

- [ ] Add failing assertions that the factory defaults to `deepseek`, rejects unknown names, and each reserved provider exports `parseDailyInput`.
- [ ] Implement `getProvider(name)` using `AI_PROVIDER || 'deepseek'`; reserved providers throw `PROVIDER_NOT_IMPLEMENTED` when called.
- [ ] Run `node tests/ai-provider.test.js` and confirm provider selection passes.

### Task 3: DeepSeek provider

**Files:**
- Create: `cloudfunctions/parseDailyInput/providers/deepseek.js`
- Create: `cloudfunctions/parseDailyInput/prompt.js`
- Test: `tests/deepseek-provider.test.js`

- [ ] Write failing tests with an injected request function that verify the endpoint, `Authorization: Bearer ...`, model `deepseek-v4-flash`, `response_format: { type: 'json_object' }`, inclusion of `text` and `profile`, JSON parsing, timeout errors, missing-key errors, HTTP errors, and invalid JSON errors.
- [ ] Implement the prompt and provider using `DEEPSEEK_API_KEY`, optional `DEEPSEEK_BASE_URL`, built-in `https`, and a 20-second timeout.
- [ ] Run `node tests/deepseek-provider.test.js` and confirm all request and error cases pass.

### Task 4: Cloud-function orchestration

**Files:**
- Modify: `cloudfunctions/parseDailyInput/index.js`
- Modify: `cloudfunctions/parseDailyInput/package.json`
- Test: `tests/parse-daily-function.test.js`

- [ ] Write failing tests asserting the handler accepts only `{ text, profile }`, calls the selected provider, returns top-level `foods`, `exercises`, and `summary`, and converts exceptions into `{ success: false, error: { code, message } }` without leaking secrets.
- [ ] Replace the dictionary parser orchestration with provider selection and schema normalization; retain no API keys or front-end provider logic.
- [ ] Update package metadata to describe the provider-backed parser.
- [ ] Run `node tests/parse-daily-function.test.js` and confirm success and failure contracts pass.

### Task 5: Front-end request and friendly failure

**Files:**
- Modify: `miniprogram/pages/today/today.js`
- Modify: `miniprogram/utils/dailyInput.js`
- Test: `tests/daily-input.test.js`

- [ ] Add failing assertions that normalized data preserves `meal`, `estimated`, and `summary`.
- [ ] Pass the locally stored profile with `text` to `parseDailyInput`; when `success === false`, display the cloud function's friendly message and do not navigate.
- [ ] Run all Node tests, JavaScript syntax checks, and `git diff --check`.

### Task 6: Deploy and commit

**Files:**
- Modify: cloud function deployment state only; no secrets committed.

- [ ] Deploy `parseDailyInput` after `AI_PROVIDER=deepseek` and `DEEPSEEK_API_KEY` are configured in the cloud environment.
- [ ] Stage only the AI parsing, editable onboarding/profile, and related test files already built in this worktree.
- [ ] Commit with a concise message describing the provider-backed daily parser.
