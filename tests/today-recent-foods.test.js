const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const script = fs.readFileSync(path.join(root, 'miniprogram/pages/today/today.js'), 'utf8')
const template = fs.readFileSync(path.join(root, 'miniprogram/pages/today/today.wxml'), 'utf8')
const styles = fs.readFileSync(path.join(root, 'miniprogram/pages/today/today.wxss'), 'utf8')

assert.match(script, /buildRecentFoods/)
assert.match(script, /dateRangeForDays\(7/)
assert.match(script, /action:\s*['"]range['"]/)
assert.match(script, /recentFoods/)
assert.match(script, /selectRecentFood/)
assert.match(script, /STORAGE_KEYS\.pendingParse/)
assert.match(script, /pages\/confirm\/confirm/)

const selectionMethod = script.match(/selectRecentFood\(event\)\s*\{([\s\S]*?)\n\s*\},/)
assert.ok(selectionMethod, '首页应实现最近食物点击处理')
assert.doesNotMatch(selectionMethod[1], /action:\s*['"]save['"]|dailyRecords/)

assert.match(template, /最近吃过/)
assert.match(template, /wx:for="{{recentFoods}}"/)
assert.match(template, /bindtap="selectRecentFood"/)
assert.doesNotMatch(template, />更多</)
assert.match(styles, /recent-foods/)

