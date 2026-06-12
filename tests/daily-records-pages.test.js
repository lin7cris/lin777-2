const assert = require('assert')
const fs = require('fs')
const path = require('path')

function read(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8')
}

const confirmScript = read('miniprogram/pages/confirm/confirm.js')
const confirmWxml = read('miniprogram/pages/confirm/confirm.wxml')
const todayScript = read('miniprogram/pages/today/today.js')
const todayWxml = read('miniprogram/pages/today/today.wxml')

assert.match(confirmScript, /name:\s*'dailyRecords'/)
assert.match(confirmScript, /weight:\s*profile\.weight/)
assert.match(confirmScript, /action:\s*'save'/)
assert.match(confirmScript, /formatDateKey\(new Date\(\)\)/)
assert.match(confirmScript, /foods:\s*this\.data\.foods/)
assert.match(confirmScript, /exercises:\s*this\.data\.exercises/)
assert.match(confirmWxml, /loading="{{saving}}"/)
assert.doesNotMatch(confirmScript, /STORAGE_KEYS\.records/)

assert.match(todayScript, /name:\s*'dailyRecords'/)
assert.match(todayScript, /action:\s*'get'/)
assert.match(todayScript, /action:\s*'delete'/)
assert.match(todayScript, /wx\.showModal/)
assert.match(todayScript, /itemType/)
assert.match(todayScript, /itemId/)
assert.match(todayWxml, /bindtap="deleteDailyItem"/)
assert.match(todayWxml, /data-item-type="{{item\.itemType}}"/)
assert.match(todayWxml, /data-item-id="{{item\.id}}"/)

console.log('daily records page tests passed')
