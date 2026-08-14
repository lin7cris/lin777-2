const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram/app.json'), 'utf8'))
const todayScript = fs.readFileSync(path.join(root, 'miniprogram/pages/today/today.js'), 'utf8')
const todayMarkup = fs.readFileSync(path.join(root, 'miniprogram/pages/today/today.wxml'), 'utf8')

assert.ok(appConfig.pages.includes('pages/nutritionCoach/nutritionCoach'))
assert.match(todayScript, /goNutritionCoach\s*\(\)\s*\{[\s\S]*pages\/nutritionCoach\/nutritionCoach/)
assert.match(todayMarkup, /今天还能吃什么/)
assert.match(todayMarkup, /{{foodAdviceText}}/)
assert.match(todayMarkup, /bindtap="goNutritionCoach"/)
assert.match(todayScript, /buildTodayFoodAdvice/)
assert.match(todayScript, /foodAdviceText/)
assert.doesNotMatch(todayScript, /name:\s*['"]nutritionCoach['"]/)

;['js', 'json', 'wxml', 'wxss'].forEach((extension) => {
  assert.ok(fs.existsSync(path.join(root, `miniprogram/pages/nutritionCoach/nutritionCoach.${extension}`)))
})

let todayPage
let navigation
const todayModulePath = path.join(root, 'miniprogram/pages/today/today.js')
const originalPage = global.Page
const originalWx = global.wx

global.Page = (definition) => { todayPage = definition }
global.wx = {
  navigateTo(options) {
    navigation = options
  }
}
delete require.cache[require.resolve(todayModulePath)]
require(todayModulePath)
todayPage.goNutritionCoach()

assert.deepStrictEqual(navigation, { url: '/pages/nutritionCoach/nutritionCoach' })

global.Page = originalPage
global.wx = originalWx
