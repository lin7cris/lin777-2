const assert = require('assert')
const {
  FOOD_ADVICE_MESSAGES,
  buildTodayFoodAdvice
} = require('../miniprogram/utils/todayFoodAdvice')

const profile = {
  goal: 'fat_loss',
  targetCalories: 1500,
  macros: {
    protein: '90-110g',
    carbs: '140-180g',
    fat: '40-50g'
  }
}

function createRecord(overrides) {
  return {
    foods: [{ name: '鸡蛋', amount: 2, unit: '个' }],
    totalCaloriesIn: 850,
    totalCaloriesOut: 0,
    totalProtein: 80,
    totalCarbs: 110,
    totalFat: 35,
    ...overrides
  }
}

assert.strictEqual(buildTodayFoodAdvice(null, profile), FOOD_ADVICE_MESSAGES.empty)
assert.strictEqual(buildTodayFoodAdvice({ foods: [] }, profile), FOOD_ADVICE_MESSAGES.empty)

const normalAdvice = buildTodayFoodAdvice(createRecord(), profile)
assert.match(normalAdvice, /650 kcal/)
assert.match(normalAdvice, /蛋白质|蔬菜/)

const proteinAdvice = buildTodayFoodAdvice(createRecord({ totalProtein: 20 }), profile)
assert.match(proteinAdvice, /650 kcal/)
assert.match(proteinAdvice, /蛋白质偏低/)

assert.strictEqual(
  buildTodayFoodAdvice(createRecord({ totalCaloriesIn: 1400, totalProtein: 20 }), profile),
  FOOD_ADVICE_MESSAGES.nearGoal
)

assert.strictEqual(
  buildTodayFoodAdvice(createRecord({ totalCaloriesIn: 1600 }), profile),
  FOOD_ADVICE_MESSAGES.overTarget
)

const brokenRecord = {}
Object.defineProperty(brokenRecord, 'foods', {
  get() {
    throw new Error('broken record')
  }
})
assert.strictEqual(buildTodayFoodAdvice(brokenRecord, profile), FOOD_ADVICE_MESSAGES.unavailable)
