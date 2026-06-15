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
