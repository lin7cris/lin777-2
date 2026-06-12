# History And Statistics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build cloud-backed daily history and 7/30-day statistics with native trend charts and weight snapshots.

**Architecture:** Extend the existing `dailyRecords` function with an openid-scoped range action. Keep page rendering data transformations in `miniprogram/utils/records.js`, use `pages/record/record` for date history, and add `pages/statistics/statistics` for trends.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JavaScript, WeChat Cloud Development, Node.js assertion tests.

---

### Task 1: Range Query And Weight Snapshot

**Files:**
- Modify: `cloudfunctions/dailyRecords/handler.js`
- Modify: `cloudfunctions/dailyRecords/logic.js`
- Modify: `cloudfunctions/dailyRecords/repository.js`
- Modify: `tests/daily-records-handler.test.js`
- Modify: `tests/daily-records-logic.test.js`

- [ ] Add failing tests for `range`, openid scoping, invalid ranges and weight snapshots.
- [ ] Run the focused tests and verify the new assertions fail.
- [ ] Implement `repository.range`, handler validation and weight snapshot persistence.
- [ ] Run the focused tests and verify they pass.

### Task 2: History Data And Page

**Files:**
- Modify: `miniprogram/utils/records.js`
- Modify: `miniprogram/pages/record/record.js`
- Modify: `miniprogram/pages/record/record.wxml`
- Modify: `miniprogram/pages/record/record.wxss`
- Modify: `miniprogram/pages/record/record.json`
- Modify: `tests/records.test.js`
- Create: `tests/history-statistics-pages.test.js`

- [ ] Add failing tests for history presentation and cloud-only page wiring.
- [ ] Run tests and verify failures are caused by missing history behavior.
- [ ] Implement date selection, range query, summaries, item rows, empty state and confirmed deletion.
- [ ] Run focused tests and verify they pass.

### Task 3: Statistics Page

**Files:**
- Create: `miniprogram/pages/statistics/statistics.js`
- Create: `miniprogram/pages/statistics/statistics.json`
- Create: `miniprogram/pages/statistics/statistics.wxml`
- Create: `miniprogram/pages/statistics/statistics.wxss`
- Modify: `miniprogram/app.json`
- Modify: `miniprogram/utils/records.js`
- Modify: `tests/records.test.js`
- Modify: `tests/history-statistics-pages.test.js`

- [ ] Add failing tests for 7/30-day trend series, four metrics and route configuration.
- [ ] Run tests and verify the missing behavior fails.
- [ ] Implement range switching, cloud loading, native charts and empty states.
- [ ] Run focused tests and verify they pass.

### Task 4: Confirm Page Weight Snapshot

**Files:**
- Modify: `miniprogram/pages/confirm/confirm.js`
- Modify: `tests/daily-records-pages.test.js`

- [ ] Add a failing assertion that save sends the current profile weight.
- [ ] Implement the payload field and verify the test passes.

### Task 5: Verification, Deployment And Publish

**Files:**
- Verify all changed files.

- [ ] Run every `tests/*.test.js` file, syntax checks, JSON parsing and `git diff --check`.
- [ ] Compile the mini program and deploy `dailyRecords` through WeChat Developer Tools.
- [ ] Commit the implementation and push `main` to GitHub.
