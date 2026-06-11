const assert = require('assert')
const fs = require('fs')
const path = require('path')

const todayScript = fs.readFileSync(
  path.resolve(__dirname, '../miniprogram/pages/today/today.js'),
  'utf8'
)

assert.match(todayScript, /data:\s*{\s*text,\s*profile\s*}/)
assert.match(todayScript, /result\.success === false/)
assert.match(todayScript, /result\.error\.message/)

console.log('today AI call tests passed')
