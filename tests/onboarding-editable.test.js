const assert = require('assert')
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const wxml = fs.readFileSync(
  path.join(projectRoot, 'miniprogram/pages/onboarding/onboarding.wxml'),
  'utf8'
)
const script = fs.readFileSync(
  path.join(projectRoot, 'miniprogram/pages/onboarding/onboarding.js'),
  'utf8'
)

// 首次建档页必须是真正的表单，而不是只能查看的静态原型。
for (const field of ['age', 'height', 'weight', 'targetWeight']) {
  assert.match(wxml, new RegExp(`data-field="${field}"`))
}

assert.match(wxml, /bindinput="onNumberInput"/)
assert.match(wxml, /bindchange="onPickerChange"/)
assert.match(script, /buildProfileForSave\(this\.data\.form\)/)
assert.match(script, /name: 'userProfile'/)

console.log('onboarding editable tests passed')
