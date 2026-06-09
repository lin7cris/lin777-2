const assert = require('assert')

const {
  buildNutritionPlan
} = require('../miniprogram/utils/calorie')

const profile = {
  gender: 'female',
  age: 28,
  height: 165,
  weight: 62,
  activityLevel: 'light',
  goal: 'fat_loss'
}

const plan = buildNutritionPlan(profile)

assert.deepStrictEqual(plan, {
  bmr: 1350,
  tdee: 1856,
  targetCalories: 1506,
  macros: {
    protein: '93-112g',
    carbs: '151-188g',
    fat: '37-54g'
  }
})

console.log('calorie utils tests passed')
