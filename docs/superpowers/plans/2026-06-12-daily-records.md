# Daily Records Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist, merge, display, and delete daily food and exercise records through WeChat Cloud Development.

**Architecture:** A `dailyRecords` cloud function exposes `save`, `get`, and `delete`. Pure logic owns IDs, merging, and totals; a repository owns `daily_records` access; pages only call the cloud API and render its normalized document.

**Tech Stack:** WeChat Mini Program JavaScript, WXML/WXSS, `wx-server-sdk`, Node.js assertion tests.

---

### Task 1: Daily record domain logic

**Files:**
- Create: `cloudfunctions/dailyRecords/logic.js`
- Test: `tests/daily-records-logic.test.js`

- [ ] Write failing tests for append, totals, and item deletion.
- [ ] Run `node tests/daily-records-logic.test.js` and confirm missing-module failure.
- [ ] Implement normalized item IDs, merge, and total recalculation.
- [ ] Run the test and confirm it passes.

### Task 2: Cloud function actions

**Files:**
- Create: `cloudfunctions/dailyRecords/handler.js`
- Create: `cloudfunctions/dailyRecords/repository.js`
- Create: `cloudfunctions/dailyRecords/index.js`
- Create: `cloudfunctions/dailyRecords/package.json`
- Test: `tests/daily-records-handler.test.js`

- [ ] Write failing handler tests for `save`, `get`, `delete`, and missing openid.
- [ ] Run the handler test and confirm failure.
- [ ] Implement openid-scoped actions and deterministic document persistence.
- [ ] Run handler and logic tests and confirm they pass.

### Task 3: Confirmation page cloud save

**Files:**
- Modify: `miniprogram/pages/confirm/confirm.js`
- Modify: `miniprogram/pages/confirm/confirm.wxml`
- Test: `tests/daily-records-pages.test.js`

- [ ] Write a failing static test requiring `dailyRecords/save` and save loading state.
- [ ] Replace local-only save with the cloud function call.
- [ ] Verify the page test passes.

### Task 4: Home cloud read and item deletion

**Files:**
- Modify: `miniprogram/pages/today/today.js`
- Modify: `miniprogram/pages/today/today.wxml`
- Modify: `miniprogram/pages/today/today.wxss`
- Modify: `miniprogram/utils/records.js`
- Test: `tests/daily-records-pages.test.js`
- Test: `tests/records.test.js`

- [ ] Extend failing tests for cloud `get`, delete confirmation, cloud `delete`, and daily document summaries.
- [ ] Implement asynchronous home loading and individual rows.
- [ ] Implement confirmation modal and refresh after deletion.
- [ ] Run all tests and syntax checks.

### Task 5: End-to-end verification and delivery

**Files:**
- Verify all modified and new files.

- [ ] Compile in WeChat Developer Tools.
- [ ] Verify save, second append, totals, home display, cancel delete, and confirmed delete.
- [ ] Run all Node.js tests and `git diff --check`.
- [ ] Commit and push `main` to GitHub.
