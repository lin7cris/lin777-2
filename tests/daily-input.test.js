const assert = require('assert')

const {
  normalizeParsedDailyInput
} = require('../miniprogram/utils/dailyInput')

const parsed = normalizeParsedDailyInput({
  sourceText: '早餐鸡蛋牛奶，晚上跑步30分钟',
  confidence: '0.91',
  foods: [
    { name: '鸡蛋', amount: '1 个', meal: '早餐', calories: '70', protein: '6', carbs: '1', fat: '5', estimated: false },
    { amount: '1 杯', calories: '150' }
  ],
  exercises: [
    { name: '跑步', duration: '30', intensity: '中等强度', calories: '310', estimated: true },
    { name: '', duration: '20' }
  ]
})

assert.strictEqual(parsed.sourceText, '早餐鸡蛋牛奶，晚上跑步30分钟')
assert.strictEqual(parsed.confidence, 0.91)
assert.deepStrictEqual(parsed.foods[0], {
  name: '鸡蛋',
  amount: '1 个',
  meal: '早餐',
  calories: 70,
  protein: 6,
  carbs: 1,
  fat: 5,
  estimated: false
})
assert.strictEqual(parsed.foods[1].name, '未命名食物')
assert.strictEqual(parsed.foods[1].protein, 0)
assert.deepStrictEqual(parsed.exercises[0], {
  name: '跑步',
  duration: 30,
  intensity: '中等强度',
  calories: 310,
  estimated: true
})
assert.strictEqual(parsed.exercises[1].name, '未命名运动')
assert.strictEqual(parsed.exercises[1].calories, 0)

const empty = normalizeParsedDailyInput(null)
assert.deepStrictEqual(empty.foods, [])
assert.deepStrictEqual(empty.exercises, [])
assert.strictEqual(empty.confidence, 0.86)

const withSummary = normalizeParsedDailyInput({
  success: true,
  provider: 'deepseek',
  model: 'deepseek-v4-flash',
  summary: {
    foodCalories: '70',
    exerciseCalories: '20',
    netCalories: '50',
    protein: '6',
    fat: '5',
    carbs: '1',
    estimated: true
  }
})
assert.strictEqual(withSummary.success, true)
assert.strictEqual(withSummary.provider, 'deepseek')
assert.strictEqual(withSummary.model, 'deepseek-v4-flash')
assert.deepStrictEqual(withSummary.summary, {
  foodCalories: 70,
  exerciseCalories: 20,
  netCalories: 50,
  protein: 6,
  fat: 5,
  carbs: 1,
  estimated: true
})

console.log('daily input utils tests passed')
