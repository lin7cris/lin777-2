const assert = require('assert')

const {
  buildRecord,
  summarizeDay,
  buildSevenDayStats,
  summarizeDailyRecord
} = require('../miniprogram/utils/records')

const payload = {
  sourceText: '早上吃鸡蛋和牛奶，晚上跑步30分钟',
  confidence: 0.9,
  foods: [
    { name: '鸡蛋', amount: '1 个', calories: 70, protein: 6, carbs: 1, fat: 5 },
    { name: '牛奶', amount: '250ml', calories: 150, protein: 8, carbs: 12, fat: 8 }
  ],
  exercises: [
    { name: '跑步', duration: 30, intensity: '中等强度', calories: 310 }
  ]
}

const now = new Date('2026-06-09T08:30:00+08:00')

const record = buildRecord(payload, now)
assert.strictEqual(record.date, '2026-06-09')
assert.strictEqual(record.totals.foodCalories, 220)
assert.strictEqual(record.totals.exerciseCalories, 310)
assert.strictEqual(record.totals.netCalories, -90)
assert.strictEqual(record.totals.protein, 14)
assert.strictEqual(record.totals.carbs, 13)
assert.strictEqual(record.totals.fat, 13)

const summary = summarizeDay([record], '2026-06-09', {
  targetCalories: 1540,
  macroTargets: { protein: 100, carbs: 180, fat: 50 }
})
assert.strictEqual(summary.foodCalories, 220)
assert.strictEqual(summary.exerciseCalories, 310)
assert.strictEqual(summary.remainingCalories, 1630)
assert.strictEqual(summary.macros[0].value, '14 / 100g')
assert.strictEqual(summary.records.length, 2)
assert.strictEqual(summary.records[0].title, '饮食')
assert.strictEqual(summary.records[1].title, '运动')

const oldRecord = buildRecord({
  foods: [{ name: '米饭', calories: 260, protein: 5, carbs: 58, fat: 1 }],
  exercises: []
}, new Date('2026-06-08T08:30:00+08:00'))
const stats = buildSevenDayStats([record, oldRecord], now, 1540)
assert.strictEqual(stats.days[0].date, '今天')
assert.strictEqual(stats.days[0].net, '净摄入 -90 kcal')
assert.strictEqual(stats.days[1].date, '昨天')
assert.strictEqual(stats.bars.length, 7)
assert.ok(stats.averageText.includes('平均'))

const cloudSummary = summarizeDailyRecord({
  date: '2026-06-09',
  foods: [
    { id: 'food-1', name: '鸡蛋', amount: '1个', calories: 70, protein: 6, carbs: 1, fat: 5 },
    { id: 'food-2', name: '牛奶', amount: '250ml', calories: 150, protein: 8, carbs: 12, fat: 8 }
  ],
  exercises: [
    { id: 'exercise-1', name: '跑步', duration: 30, calories: 310 }
  ],
  totalCaloriesIn: 220,
  totalCaloriesOut: 310,
  netCalories: -90,
  totalProtein: 14,
  totalCarbs: 13,
  totalFat: 13
}, {
  targetCalories: 1540,
  macroTargets: { protein: 100, carbs: 180, fat: 50 }
})

assert.strictEqual(cloudSummary.foodCalories, 220)
assert.strictEqual(cloudSummary.exerciseCalories, 310)
assert.strictEqual(cloudSummary.netCalories, -90)
assert.strictEqual(cloudSummary.records.length, 3)
assert.deepStrictEqual(cloudSummary.records[0], {
  id: 'food-1',
  itemType: 'food',
  title: '鸡蛋',
  desc: '1个',
  calories: '70 kcal'
})
assert.strictEqual(cloudSummary.records[2].itemType, 'exercise')
assert.strictEqual(cloudSummary.records[2].calories, '-310 kcal')

console.log('records utils tests passed')
