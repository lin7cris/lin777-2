const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const profileScript = fs.readFileSync(path.join(root, 'miniprogram/pages/profile/profile.js'), 'utf8')
const profileMarkup = fs.readFileSync(path.join(root, 'miniprogram/pages/profile/profile.wxml'), 'utf8')
const config = fs.readFileSync(path.join(root, 'miniprogram/utils/config.js'), 'utf8')

assert.ok(!fs.existsSync(path.join(root, 'cloudfunctions/nutritionReminder')))
assert.doesNotMatch(profileScript, /nutritionReminder|requestSubscribeMessage/)
assert.doesNotMatch(profileMarkup, /晚间营养提醒/)
assert.doesNotMatch(config, /nutritionReminderTemplateId/)
