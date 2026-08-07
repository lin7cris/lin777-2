const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram/app.json'), 'utf8'))
const coachScript = fs.readFileSync(path.join(root, 'miniprogram/pages/nutritionCoach/nutritionCoach.js'), 'utf8')
const coachMarkup = fs.readFileSync(path.join(root, 'miniprogram/pages/nutritionCoach/nutritionCoach.wxml'), 'utf8')

assert.ok(appConfig.pages.includes('pages/nutritionChat/nutritionChat'))
assert.match(coachMarkup, /问问营养师/)
assert.match(coachMarkup, /bindtap="goNutritionChat"/)
assert.match(coachScript, /goNutritionChat/)
assert.match(coachScript, /pages\/nutritionChat\/nutritionChat/)

for (const extension of ['js', 'json', 'wxml', 'wxss']) {
  assert.ok(fs.existsSync(path.join(root, `miniprogram/pages/nutritionChat/nutritionChat.${extension}`)))
}

const chatScript = fs.readFileSync(path.join(root, 'miniprogram/pages/nutritionChat/nutritionChat.js'), 'utf8')
const chatMarkup = fs.readFileSync(path.join(root, 'miniprogram/pages/nutritionChat/nutritionChat.wxml'), 'utf8')
assert.match(chatScript, /name:\s*'nutritionChat'/)
assert.match(chatScript, /action:\s*'ask'/)
assert.match(chatMarkup, /textarea/)
assert.match(chatMarkup, /发送/)
assert.match(chatMarkup, /id="{{item\.id}}"/)
assert.match(chatScript, /scrollIntoView:\s*lastMessage \? lastMessage\.id : ''/)
