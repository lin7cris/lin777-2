# iOS 高级简约 UI 改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变云函数名称、请求参数、数据库结构和核心业务逻辑的前提下，把全部小程序页面及 Open Design 原型升级为 Apple Health × Apple Fitness 混合的 iOS 高级简约风格，并补齐可恢复的加载、空数据和失败交互。

**Architecture:** 由 `app.wxss` 提供全局颜色、表面、圆角、按钮、表单及状态样式，各页面 WXSS 只负责页面特有布局。页面 JS 只新增展示状态和重试入口，继续调用现有 `parseDailyInput`、`dailyRecords`、`userProfile` 云函数及原参数。静态 Node 测试锁定 UI 契约，现有业务测试负责防止功能回归。

**Tech Stack:** 微信小程序原生 WXML/WXSS/JavaScript、微信云开发、Node.js `node:test`、Open Design Clean。

---

## 文件结构

- `miniprogram/app.json`：系统背景、导航栏和 tabBar 的 iOS 浅色主题。
- `miniprogram/app.wxss`：全局视觉令牌、玻璃表面、按钮、表单、状态视图和响应式基础。
- `miniprogram/pages/*/*.wxml`：调整信息层级、状态视图和可访问的重试入口。
- `miniprogram/pages/*/*.wxss`：页面特有的圆环、趋势图、编辑网格和窄屏适配。
- `miniprogram/pages/*/*.js`：仅增加 `errorMessage`、重试和请求期间禁用等交互状态。
- `tests/ios-ui-system.test.js`：检查全局 iOS 视觉令牌和禁用态。
- `tests/page-state-ui.test.js`：检查首页、历史、统计、AI 页面具备加载、空数据、失败和重试入口。
- `README.md`：更新页面使用、云函数部署、数据库权限和最终测试说明。
- Open Design 项目 `calorie-supervisor-prototype.html`：同步七个页面的视觉原型，不作为运行时依赖。

### Task 1: 建立全局 iOS 视觉系统

**Files:**
- Create: `tests/ios-ui-system.test.js`
- Modify: `miniprogram/app.json`
- Modify: `miniprogram/app.wxss`

- [ ] **Step 1: 写入失败的视觉契约测试**

```js
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const styles = fs.readFileSync(path.join(root, 'miniprogram/app.wxss'), 'utf8')
const config = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram/app.json'), 'utf8'))

assert.match(styles, /#f2f2f7/i)
assert.match(styles, /rgba\(255, 255, 255, 0\.9/)
assert.match(styles, /backdrop-filter:\s*blur/)
assert.match(styles, /\.state-view/)
assert.match(styles, /\.skeleton/)
assert.match(styles, /button\[disabled\]/)
assert.strictEqual(config.window.backgroundColor.toLowerCase(), '#f2f2f7')
assert.strictEqual(config.tabBar.selectedColor.toLowerCase(), '#34c759')

console.log('iOS UI system tests passed')
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/ios-ui-system.test.js`

Expected: FAIL，因为当前全局样式仍使用绿色背景且没有统一状态样式。

- [ ] **Step 3: 更新系统配置与全局样式**

在 `app.json` 中使用 `#F2F2F7` 背景、黑色导航文字、白色 tabBar 和 `#34C759` 选中色。将 `app.wxss` 重构为以下基础：

```css
page {
  background: #f2f2f7;
  color: #1c1c1e;
}

.page {
  min-height: 100vh;
  padding: 28rpx 28rpx calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.glass-card,
.card {
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12rpx 36rpx rgba(28, 28, 30, 0.06);
  backdrop-filter: blur(24rpx);
}

.state-view {
  min-height: 240rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.skeleton {
  border-radius: 16rpx;
  background: #e9e9ee;
}

button[disabled] {
  opacity: 0.52;
}
```

- [ ] **Step 4: 运行视觉契约与全部测试**

Run: `node --test tests/ios-ui-system.test.js && node --test`

Expected: PASS，现有 16 项业务测试继续通过。

- [ ] **Step 5: 提交全局视觉基础**

```bash
git add miniprogram/app.json miniprogram/app.wxss tests/ios-ui-system.test.js
git commit -m "style: add ios visual foundation"
```

### Task 2: 改造今日首页与 AI 悬浮输入栏

**Files:**
- Create: `tests/page-state-ui.test.js`
- Modify: `miniprogram/pages/today/today.js`
- Modify: `miniprogram/pages/today/today.wxml`
- Modify: `miniprogram/pages/today/today.wxss`

- [ ] **Step 1: 为首页状态和重试入口写失败测试**

```js
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const read = (file) => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8')

const todayJs = read('miniprogram/pages/today/today.js')
const todayWxml = read('miniprogram/pages/today/today.wxml')

assert.match(todayJs, /recordError/)
assert.match(todayJs, /retryDailyRecord/)
assert.match(todayJs, /aiError/)
assert.match(todayWxml, /state-view/)
assert.match(todayWxml, /bindtap="retryDailyRecord"/)
assert.match(todayWxml, /AI 解析失败/)
assert.match(todayWxml, /calorie-ring/)

console.log('page state UI tests passed')
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/page-state-ui.test.js`

Expected: FAIL，当前页面仅用 Toast 和普通文字表达错误与空状态。

- [ ] **Step 3: 增加首页展示状态**

在 `today.js` 的 data 中增加：

```js
recordError: '',
aiError: ''
```

读取前清空 `recordError`；读取失败时保留空记录并设置 `recordError: '无法读取今日记录，请检查网络后重试。'`。新增：

```js
retryDailyRecord() {
  this.loadDailyRecord(formatDateKey(new Date()))
}
```

AI 请求开始时清空 `aiError`，云函数失败和网络异常时写入友好消息；保留现有 Toast 作为即时反馈，但页面内错误状态持续可见。

- [ ] **Step 4: 重构首页 WXML/WXSS**

将核心数据改为 `calorie-ring` 圆环、四项摘要、紧凑营养进度和 Health 风格记录列表。今日记录区域按以下优先级渲染：加载骨架、错误及重试、空状态、记录列表。输入栏使用半透明背景和安全区：

```css
.input-dock {
  bottom: calc(env(safe-area-inset-bottom) + 18rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.76);
  border-radius: 28rpx;
  background: rgba(248, 248, 250, 0.88);
  backdrop-filter: blur(30rpx);
}

@media (max-width: 340px) {
  .summary { grid-template-columns: 1fr; }
  .calorie-ring { margin: 0 auto; }
}
```

- [ ] **Step 5: 运行首页与全量测试**

Run: `node --test tests/page-state-ui.test.js tests/today-ai-call.test.js tests/daily-records-pages.test.js && node --test`

Expected: PASS。

- [ ] **Step 6: 提交首页改造**

```bash
git add miniprogram/pages/today tests/page-state-ui.test.js
git commit -m "style: redesign today dashboard"
```

### Task 3: 改造首次建档与我的页面

**Files:**
- Modify: `tests/page-state-ui.test.js`
- Modify: `miniprogram/pages/onboarding/onboarding.wxml`
- Modify: `miniprogram/pages/onboarding/onboarding.wxss`
- Modify: `miniprogram/pages/profile/profile.js`
- Modify: `miniprogram/pages/profile/profile.wxml`
- Modify: `miniprogram/pages/profile/profile.wxss`

- [ ] **Step 1: 扩展失败测试**

增加断言：

```js
const onboarding = read('miniprogram/pages/onboarding/onboarding.wxml')
const profileJs = read('miniprogram/pages/profile/profile.js')
const profileWxml = read('miniprogram/pages/profile/profile.wxml')

assert.match(onboarding, /settings-group/)
assert.match(onboarding, /recommendation-panel/)
assert.match(profileJs, /profileError/)
assert.match(profileJs, /retryCloudProfile/)
assert.match(profileWxml, /settings-group/)
assert.doesNotMatch(profileWxml, /wx:for="{{options}}"/)
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/page-state-ui.test.js`

Expected: FAIL。

- [ ] **Step 3: 将两个表单改为 iOS 设置式分组**

保持所有 `picker`、`input`、`data-field` 与绑定方法不变，仅调整包装结构和 class。使用 `.settings-group`、`.settings-row`、`.field-value`，推荐目标使用 `.recommendation-panel` 三列数据布局。窄屏下三列保持等分且数字字号收紧。

- [ ] **Step 4: 增加云资料读取失败的可恢复反馈**

在 `profile.js` 增加 `loadingProfile`、`profileError`，读取失败时保留本地资料但显示“云端资料暂时无法同步”。新增：

```js
retryCloudProfile() {
  this.loadCloudProfile()
}
```

保存按钮继续使用原逻辑，只增加 `disabled="{{saving}}"`。移除当前没有事件处理的四个伪设置入口，避免制造可点击错觉。

- [ ] **Step 5: 运行表单和页面测试**

Run: `node --test tests/page-state-ui.test.js tests/onboarding-editable.test.js tests/profile-form.test.js && node --test`

Expected: PASS。

- [ ] **Step 6: 提交表单页改造**

```bash
git add miniprogram/pages/onboarding miniprogram/pages/profile tests/page-state-ui.test.js
git commit -m "style: redesign profile forms"
```

### Task 4: 改造 AI 输入页与解析确认页

**Files:**
- Modify: `tests/page-state-ui.test.js`
- Modify: `miniprogram/pages/entry/entry.js`
- Modify: `miniprogram/pages/entry/entry.wxml`
- Modify: `miniprogram/pages/entry/entry.wxss`
- Modify: `miniprogram/pages/confirm/confirm.js`
- Modify: `miniprogram/pages/confirm/confirm.wxml`
- Modify: `miniprogram/pages/confirm/confirm.wxss`

- [ ] **Step 1: 扩展 AI 页面失败测试**

```js
const entryJs = read('miniprogram/pages/entry/entry.js')
const entryWxml = read('miniprogram/pages/entry/entry.wxml')
const confirmJs = read('miniprogram/pages/confirm/confirm.js')
const confirmWxml = read('miniprogram/pages/confirm/confirm.wxml')

assert.match(entryJs, /aiError/)
assert.match(entryWxml, /bindtap="parseText"/)
assert.match(entryWxml, /error-banner/)
assert.match(confirmJs, /saveError/)
assert.match(confirmJs, /foods\.length.*exercises\.length|hasParsedItems/)
assert.match(confirmWxml, /disabled="{{saving \|\| !hasParsedItems}}"/)
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/page-state-ui.test.js`

Expected: FAIL。

- [ ] **Step 3: 增加持久错误提示和空解析保护**

`entry.js` 增加 `aiError`，请求开始清空，失败时展示云函数友好消息。`confirm.js` 增加 `saveError` 和 `hasParsedItems`；onLoad 后根据 `foods.length + exercises.length` 计算，保存前无条目则直接提示，不调用云函数。编辑字段不改变条目数量，因此不改变现有编辑逻辑。

- [ ] **Step 4: 重构输入与确认视觉**

输入页使用一块主要输入表面、三个轻量模板按钮和底部主操作；确认页使用顶部解析摘要、原文引用、饮食与运动设置式编辑分组。四项营养输入在窄屏使用两列：

```css
.edit-grid.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }

@media (max-width: 340px) {
  .edit-grid.four { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
```

- [ ] **Step 5: 运行 AI 页面与全部测试**

Run: `node --test tests/page-state-ui.test.js tests/entry-ai-call.test.js tests/today-ai-call.test.js tests/daily-input.test.js && node --test`

Expected: PASS。

- [ ] **Step 6: 提交 AI 页面改造**

```bash
git add miniprogram/pages/entry miniprogram/pages/confirm tests/page-state-ui.test.js
git commit -m "style: redesign ai entry flow"
```

### Task 5: 改造历史与统计页面

**Files:**
- Modify: `tests/page-state-ui.test.js`
- Modify: `miniprogram/pages/record/record.js`
- Modify: `miniprogram/pages/record/record.wxml`
- Modify: `miniprogram/pages/record/record.wxss`
- Modify: `miniprogram/pages/statistics/statistics.js`
- Modify: `miniprogram/pages/statistics/statistics.wxml`
- Modify: `miniprogram/pages/statistics/statistics.wxss`

- [ ] **Step 1: 扩展历史与统计失败测试**

```js
const recordJs = read('miniprogram/pages/record/record.js')
const recordWxml = read('miniprogram/pages/record/record.wxml')
const statisticsJs = read('miniprogram/pages/statistics/statistics.js')
const statisticsWxml = read('miniprogram/pages/statistics/statistics.wxml')

assert.match(recordJs, /recordError/)
assert.match(recordJs, /retryRecord/)
assert.match(recordWxml, /bindtap="retryRecord"/)
assert.match(statisticsJs, /statisticsError/)
assert.match(statisticsJs, /requestSequence/)
assert.match(statisticsJs, /retryStatistics/)
assert.match(statisticsWxml, /bindtap="retryStatistics"/)
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/page-state-ui.test.js`

Expected: FAIL。

- [ ] **Step 3: 区分失败与空数据，并防止范围切换竞态**

`record.js` 增加 `recordError` 和 `retryRecord()`，失败时不再只显示空状态。`statistics.js` 增加模块级 `let requestSequence = 0`；每次请求保存序号，只允许最新请求写入统计与 loading 状态。新增 `statisticsError` 与 `retryStatistics()`，不改变 `action: 'range'`、`startDate`、`endDate`。

- [ ] **Step 4: 更新历史与图表视觉**

历史页使用日期胶囊、四列摘要表面、分组列表；统计页使用系统分段控件和白色趋势表面。30 天图表保持 `flex: 1`、`min-width: 0`，标签每五天显示一次；错误、空数据和部分指标无数据使用不同文案。

- [ ] **Step 5: 运行历史统计测试与全量测试**

Run: `node --test tests/page-state-ui.test.js tests/history-statistics-pages.test.js tests/records.test.js && node --test`

Expected: PASS。

- [ ] **Step 6: 提交历史统计改造**

```bash
git add miniprogram/pages/record miniprogram/pages/statistics tests/page-state-ui.test.js
git commit -m "style: redesign history and statistics"
```

### Task 6: 同步 Open Design Clean 原型

**Files:**
- Modify through Open Design Clean: `.open-design/.od/projects/14fc8bd4-8ae3-4a39-a63f-468b0cb75f57/calorie-supervisor-prototype.html`

- [ ] **Step 1: 打开现有原型并确认页面清单**

使用 Computer Use 打开 Open Design Clean，确认原型包含建档、今日、AI 输入、解析确认、历史、统计、我的七个页面或画板。

- [ ] **Step 2: 应用统一视觉令牌**

把背景改为 `#F2F2F7`，主文字改为 `#1C1C1E`，功能绿色改为 `#34C759`；卡片使用 14-16px 圆角、半透明白色、细描边和轻阴影。

- [ ] **Step 3: 按页面同步核心结构**

首页同步热量圆环和悬浮 AI 输入栏；建档与我的同步设置式表单；确认页同步编辑分组；历史同步摘要和列表；统计同步分段控件与四组趋势图。

- [ ] **Step 4: 增加状态画面**

至少为首页、历史、统计和 AI 输入展示加载、空数据或失败状态的原型变体，状态文案与小程序一致。

- [ ] **Step 5: 检查原型的 390px 主画板**

确认无绿色大面积背景、无文字截断、无卡片套卡片、无底部悬浮区遮挡内容，并保存项目。

### Task 7: 更新使用说明并完成多屏验证

**Files:**
- Modify: `README.md`
- Modify: `tests/project-entry.test.js`

- [ ] **Step 1: 写入 README 部署契约测试**

在 `tests/project-entry.test.js` 增加：

```js
const readme = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8')
assert.match(readme, /parseDailyInput/)
assert.match(readme, /dailyRecords/)
assert.match(readme, /userProfile/)
assert.match(readme, /daily_records/)
assert.match(readme, /所有用户不可读写/)
assert.doesNotMatch(readme, /上传并部署 `cloudfunctions\/parseRecord`/)
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/project-entry.test.js`

Expected: FAIL，因为 README 仍指导部署旧的 `parseRecord`。

- [ ] **Step 3: 重写最终使用说明**

README 明确：导入项目、云环境 ID、上传 `userProfile`/`parseDailyInput`/`dailyRecords`、DeepSeek 环境变量、创建 `users` 和 `daily_records`、两个集合均设置为“所有用户不可读写”、由云函数按 openid 访问、编译和端到端测试步骤。

- [ ] **Step 4: 运行自动化验证**

Run: `node --test && git diff --check`

Expected: 所有测试 PASS，`git diff --check` 无输出。

- [ ] **Step 5: 在常见屏幕宽度检查页面**

在微信开发者工具依次选择约 320px、390px、430px 宽度，检查七个页面；重点确认首页圆环、确认页四列输入、历史摘要、30 天图表、底部输入栏和安全区均无溢出或遮挡。

- [ ] **Step 6: 手工走通业务链路**

依次验证：编辑并保存资料、AI 解析成功、AI 解析失败、确认保存、今日读取、二次确认删除、历史按日期查询、统计 7/30 天切换、断网后的错误与重试。

- [ ] **Step 7: 提交文档与最终验证改动**

```bash
git add README.md tests/project-entry.test.js
git commit -m "docs: finalize mini program setup guide"
```

- [ ] **Step 8: 审查最终提交范围**

Run: `git status --short && git log --oneline -8`

Expected: 工作区干净，最近提交仅包含本计划所列 UI、交互状态、原型和说明更新。
