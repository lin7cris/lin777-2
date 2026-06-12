const assert = require('assert')

const {
  mergeDailyRecord,
  deleteDailyItem,
  emptyDailyRecord
} = require('../cloudfunctions/dailyRecords/logic')

const context = {
  openid: 'user-openid',
  date: '2026-06-12',
  now: '2026-06-12T01:00:00.000Z',
  idGenerator(type, index) {
    return `${type}-${index + 1}`
  }
}

const first = mergeDailyRecord(null, {
  sourceText: '早餐一个鸡蛋，跑步30分钟',
  weight: 62.5,
  foods: [
    { name: '鸡蛋', amount: '1个', calories: 70, protein: 6, carbs: 1, fat: 5 }
  ],
  exercises: [
    { name: '跑步', duration: 30, calories: 300 }
  ]
}, context)

assert.strictEqual(first._openid, 'user-openid')
assert.strictEqual(first.date, '2026-06-12')
assert.strictEqual(first.foods[0].id, 'food-1')
assert.strictEqual(first.exercises[0].id, 'exercise-1')
assert.strictEqual(first.totalCaloriesIn, 70)
assert.strictEqual(first.totalCaloriesOut, 300)
assert.strictEqual(first.netCalories, -230)
assert.strictEqual(first.weight, 62.5)

const second = mergeDailyRecord(first, {
  sourceText: '午餐一个苹果',
  weight: 61.8,
  foods: [
    { name: '苹果', amount: '1个', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 }
  ],
  exercises: []
}, {
  ...context,
  now: '2026-06-12T05:00:00.000Z',
  idGenerator(type, index) {
    return `${type}-next-${index + 1}`
  }
})

assert.deepStrictEqual(second.foods.map((item) => item.name), ['鸡蛋', '苹果'])
assert.strictEqual(second.foods[0].id, 'food-1')
assert.strictEqual(second.foods[1].id, 'food-next-1')
assert.strictEqual(second.totalCaloriesIn, 165)
assert.strictEqual(second.totalCaloriesOut, 300)
assert.strictEqual(second.netCalories, -135)
assert.strictEqual(second.totalProtein, 6.5)
assert.deepStrictEqual(second.sourceTexts, ['早餐一个鸡蛋，跑步30分钟', '午餐一个苹果'])
assert.strictEqual(second.weight, 61.8)

const afterFoodDelete = deleteDailyItem(second, 'food', 'food-1', {
  now: '2026-06-12T06:00:00.000Z'
})
assert.deepStrictEqual(afterFoodDelete.foods.map((item) => item.name), ['苹果'])
assert.strictEqual(afterFoodDelete.totalCaloriesIn, 95)
assert.strictEqual(afterFoodDelete.totalCaloriesOut, 300)
assert.strictEqual(afterFoodDelete.netCalories, -205)

const afterExerciseDelete = deleteDailyItem(afterFoodDelete, 'exercise', 'exercise-1', {
  now: '2026-06-12T07:00:00.000Z'
})
assert.deepStrictEqual(afterExerciseDelete.exercises, [])
assert.strictEqual(afterExerciseDelete.totalCaloriesOut, 0)
assert.strictEqual(afterExerciseDelete.netCalories, 95)

assert.throws(
  () => deleteDailyItem(second, 'food', 'missing', context),
  /record item not found/
)

assert.deepStrictEqual(emptyDailyRecord('2026-06-13'), {
  date: '2026-06-13',
  foods: [],
  exercises: [],
  sourceTexts: [],
  totalCaloriesIn: 0,
  totalCaloriesOut: 0,
  netCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0
})

console.log('daily records logic tests passed')
