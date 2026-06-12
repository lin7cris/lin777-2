const assert = require('assert')
const fs = require('fs')
const path = require('path')

const entryScript = fs.readFileSync(
  path.resolve(__dirname, '../miniprogram/pages/entry/entry.js'),
  'utf8'
)
const confirmScript = fs.readFileSync(
  path.resolve(__dirname, '../miniprogram/pages/confirm/confirm.js'),
  'utf8'
)

// 快速记录页必须和首页共用唯一 AI 入口，不能再调用旧 mock 云函数。
assert.match(entryScript, /name:\s*'parseDailyInput'/)
assert.match(entryScript, /data:\s*{\s*text,\s*profile\s*}/)
assert.match(entryScript, /result\.success === false/)
assert.match(entryScript, /STORAGE_KEYS\.pendingParse/)
assert.doesNotMatch(entryScript, /name:\s*'parseRecord'/)
assert.doesNotMatch(entryScript, /已使用示例/)
assert.doesNotMatch(entryScript, /text:\s*'今天早上吃了一个鸡蛋/)

// 确认页没有解析结果时应保持空列表，不能显示固定食物冒充 AI 结果。
assert.doesNotMatch(confirmScript, /const fallback/)
assert.doesNotMatch(confirmScript, /name:\s*'鸡蛋'/)
assert.match(confirmScript, /normalizeParsedDailyInput\(null\)/)

console.log('entry AI call tests passed')
