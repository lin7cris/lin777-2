function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function upperRangeValue(value, fallback) {
  if (typeof value === 'number') return value
  const values = String(value || '').match(/\d+(?:\.\d+)?/g)
  return values && values.length ? Number(values[values.length - 1]) : fallback
}

function percent(value, target) {
  if (!target) return 0
  return Math.min(100, Math.max(0, Math.round(toNumber(value) / target * 100)))
}

function buildMacro(value, targetRange, fallback) {
  const target = upperRangeValue(targetRange, fallback)
  return {
    value: Math.round(toNumber(value)),
    target,
    percent: percent(value, target)
  }
}

function buildHistory(records) {
  const list = Array.isArray(records) ? records : []
  const totals = list.reduce((memo, record) => ({
    caloriesIn: memo.caloriesIn + toNumber(record.totalCaloriesIn),
    caloriesOut: memo.caloriesOut + toNumber(record.totalCaloriesOut)
  }), { caloriesIn: 0, caloriesOut: 0 })
  const daysWithRecords = list.filter((record) => Array.isArray(record.foods) && record.foods.length).length

  return {
    daysWithRecords,
    averageCaloriesIn: list.length ? Math.round(totals.caloriesIn / list.length) : 0,
    averageCaloriesOut: list.length ? Math.round(totals.caloriesOut / list.length) : 0
  }
}

function buildNutritionContext({ profile, todayRecord, historyRecords, localTime }) {
  const sourceProfile = profile || {}
  const record = todayRecord || {}
  const targetCalories = toNumber(record.targetCalories) || toNumber(sourceProfile.targetCalories)
  const caloriesIn = toNumber(record.totalCaloriesIn)
  const caloriesOut = toNumber(record.totalCaloriesOut)
  const macros = sourceProfile.macros || {}
  const foods = (Array.isArray(record.foods) ? record.foods : []).map((food) => ({
    name: String(food.name || ''),
    meal: String(food.meal || ''),
    calories: Math.round(toNumber(food.calories)),
    protein: Math.round(toNumber(food.protein)),
    carbs: Math.round(toNumber(food.carbs)),
    fat: Math.round(toNumber(food.fat))
  }))

  const mealContext = require('./meal-context').buildMealContext({ foods, localTime })

  return {
    profile: {
      gender: sourceProfile.gender || '',
      age: toNumber(sourceProfile.age),
      height: toNumber(sourceProfile.height),
      weight: toNumber(sourceProfile.weight),
      goal: sourceProfile.goal || '',
      targetCalories
    },
    today: {
      caloriesIn,
      caloriesOut,
      targetCalories,
      remainingCalories: Math.round(targetCalories + caloriesOut - caloriesIn),
      protein: buildMacro(record.totalProtein, macros.protein, 100),
      carbs: buildMacro(record.totalCarbs, macros.carbs, 180),
      fat: buildMacro(record.totalFat, macros.fat, 50),
      foods
    },
    mealContext,
    history: buildHistory(historyRecords)
  }
}

function hasCompleteProfile(profile) {
  const source = profile || {}
  return Boolean(source.gender && source.goal && toNumber(source.age) > 0 && toNumber(source.height) > 0 && toNumber(source.weight) > 0 && toNumber(source.targetCalories) > 0)
}

module.exports = {
  buildNutritionContext,
  hasCompleteProfile
}
