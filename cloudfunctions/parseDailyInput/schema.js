function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function toText(value, fallback) {
  const text = String(value || '').trim()
  return text || fallback
}

function toEstimated(value) {
  return typeof value === 'boolean' ? value : true
}

function sum(items, field) {
  return items.reduce((total, item) => total + toNumber(item[field]), 0)
}

function normalizeFood(food) {
  return {
    name: toText(food && food.name, '未命名食物'),
    amount: toText(food && food.amount, '适量'),
    meal: toText(food && food.meal, '未知餐次'),
    calories: toNumber(food && food.calories),
    protein: toNumber(food && food.protein),
    fat: toNumber(food && food.fat),
    carbs: toNumber(food && food.carbs),
    estimated: toEstimated(food && food.estimated)
  }
}

function normalizeExercise(exercise) {
  return {
    name: toText(exercise && exercise.name, '未命名运动'),
    duration: toNumber(exercise && exercise.duration),
    calories: toNumber(exercise && exercise.calories),
    estimated: toEstimated(exercise && exercise.estimated)
  }
}

function normalizeAiResult(sourceText, rawResult) {
  const raw = rawResult || {}
  const foods = Array.isArray(raw.foods) ? raw.foods.map(normalizeFood) : []
  const exercises = Array.isArray(raw.exercises) ? raw.exercises.map(normalizeExercise) : []
  const foodCalories = sum(foods, 'calories')
  const exerciseCalories = sum(exercises, 'calories')

  return {
    sourceText: String(sourceText || '').trim(),
    confidence: Math.max(0, Math.min(1, toNumber(raw.confidence || 0.5))),
    foods,
    exercises,
    summary: {
      foodCalories,
      exerciseCalories,
      netCalories: foodCalories - exerciseCalories,
      protein: sum(foods, 'protein'),
      fat: sum(foods, 'fat'),
      carbs: sum(foods, 'carbs'),
      estimated: foods.concat(exercises).some((item) => item.estimated)
    }
  }
}

module.exports = {
  normalizeAiResult
}
