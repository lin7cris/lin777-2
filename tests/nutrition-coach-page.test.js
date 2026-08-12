const assert = require('assert')
const fs = require('fs')
const path = require('path')

const { buildCoachMacros, buildCoachSummary } = require('../miniprogram/utils/nutritionCoachView')

const profile = {
  targetCalories: 1506,
  macros: {
    protein: '93-112g',
    carbs: '151-188g',
    fat: '37-54g'
  }
}

const record = {
  totalCaloriesIn: 1280,
  totalCaloriesOut: 200,
  targetCalories: 1506,
  totalProtein: 73,
  totalCarbs: 165,
  totalFat: 28
}

const summary = buildCoachSummary(record, profile)
assert.strictEqual(summary.completion, 85)
assert.strictEqual(summary.caloriesOut, 200)
assert.strictEqual(summary.remainingCalories, 426)

const macros = buildCoachMacros(record, profile)
assert.deepStrictEqual(macros.map((item) => item.status), ['不足', '正常', '偏低'])
assert.deepStrictEqual(macros.map((item) => item.percent), [65, 88, 52])

const markup = fs.readFileSync(path.resolve(__dirname, '../miniprogram/pages/nutritionCoach/nutritionCoach.wxml'), 'utf8')
assert.match(markup, /今日总结/)
assert.match(markup, /营养分析/)
assert.match(markup, /AI建议/)
assert.match(markup, /今晚推荐/)
assert.match(markup, /今日推荐/)
assert.match(markup, /bindtap="addRecommendation"/)
assert.match(markup, /class="coach-chat-entry button-press" bindtap="goNutritionChat"/)
assert.match(markup, /coach-chat-entry-icon/)
assert.match(markup, /根据今天的饮食记录，获得个性化建议/)
assert.match(markup, /coach-chat-entry-action/)
assert.match(markup, /wx:for="{{macros}}"/)
assert.match(markup, /摄入/)
assert.match(markup, /消耗/)
assert.match(markup, /剩余/)

const style = fs.readFileSync(path.resolve(__dirname, '../miniprogram/pages/nutritionCoach/nutritionCoach.wxss'), 'utf8')
const styleBraceBalance = [...style].reduce((balance, character) => (
  character === '{' ? balance + 1 : character === '}' ? balance - 1 : balance
), 0)
assert.strictEqual(styleBraceBalance, 0)
assert.match(style, /\.coach-chat-entry\s*\{[\s\S]*?height:\s*176rpx;/)
assert.match(style, /\.coach-chat-entry-action\s*\{[\s\S]*?border-radius:\s*50%;/)

const script = fs.readFileSync(path.resolve(__dirname, '../miniprogram/pages/nutritionCoach/nutritionCoach.js'), 'utf8')
assert.match(script, /name:\s*'nutritionCoach'/)
assert.match(script, /name:\s*'dailyRecords'/)
assert.match(script, /name:\s*'userProfile'/)
assert.match(script, /todayRecords/)
assert.match(script, /nutritionData/)
assert.match(script, /remainingCalories/)
assert.match(script, /recommendations/)
assert.match(script, /name:\s*'dailyRecords'/)
assert.match(script, /addRecommendation/)
assert.match(script, /AI营养教练暂时无法回复，请稍后重试/)
assert.doesNotMatch(script, /console\.(?:log|warn|error|info|debug)/)
assert.doesNotMatch(script, /error\s*&&\s*error\.message/)
