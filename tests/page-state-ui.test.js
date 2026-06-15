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

const onboarding = read('miniprogram/pages/onboarding/onboarding.wxml')
const profileJs = read('miniprogram/pages/profile/profile.js')
const profileWxml = read('miniprogram/pages/profile/profile.wxml')

assert.match(onboarding, /settings-group/)
assert.match(onboarding, /recommendation-panel/)
assert.match(profileJs, /profileError/)
assert.match(profileJs, /retryCloudProfile/)
assert.match(profileWxml, /settings-group/)
assert.doesNotMatch(profileWxml, /wx:for="{{options}}"/)

const entryJs = read('miniprogram/pages/entry/entry.js')
const entryWxml = read('miniprogram/pages/entry/entry.wxml')
const confirmJs = read('miniprogram/pages/confirm/confirm.js')
const confirmWxml = read('miniprogram/pages/confirm/confirm.wxml')

assert.match(entryJs, /aiError/)
assert.match(entryWxml, /bindtap="parseText"/)
assert.match(entryWxml, /error-banner/)
assert.match(confirmJs, /saveError/)
assert.match(confirmJs, /hasParsedItems/)
assert.match(confirmWxml, /disabled="{{saving \|\| !hasParsedItems}}"/)

console.log('page state UI tests passed')
