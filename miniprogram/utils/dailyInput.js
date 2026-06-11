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

function normalizeFood(food) {
  return {
    name: toText(food && food.name, '未命名食物'),
    amount: toText(food && food.amount, '适量'),
    meal: toText(food && food.meal, '未知餐次'),
    calories: toNumber(food && food.calories),
    protein: toNumber(food && food.protein),
    carbs: toNumber(food && food.carbs),
    fat: toNumber(food && food.fat),
    estimated: toEstimated(food && food.estimated)
  }
}

function normalizeExercise(exercise) {
  return {
    name: toText(exercise && exercise.name, '未命名运动'),
    duration: toNumber(exercise && exercise.duration),
    intensity: toText(exercise && exercise.intensity, '中等强度'),
    calories: toNumber(exercise && exercise.calories),
    estimated: toEstimated(exercise && exercise.estimated)
  }
}

function normalizeSummary(summary) {
  const data = summary || {}
  return {
    foodCalories: toNumber(data.foodCalories),
    exerciseCalories: toNumber(data.exerciseCalories),
    netCalories: toNumber(data.netCalories),
    protein: toNumber(data.protein),
    fat: toNumber(data.fat),
    carbs: toNumber(data.carbs),
    estimated: data.estimated === true
  }
}

function normalizeParsedDailyInput(payload) {
  const data = payload || {}

  return {
    success: data.success !== false,
    provider: String(data.provider || ''),
    model: String(data.model || ''),
    sourceText: String(data.sourceText || ''),
    confidence: toNumber(data.confidence || 0.86),
    foods: Array.isArray(data.foods) ? data.foods.map(normalizeFood) : [],
    exercises: Array.isArray(data.exercises) ? data.exercises.map(normalizeExercise) : [],
    summary: normalizeSummary(data.summary),
    error: data.error || null
  }
}

module.exports = {
  normalizeParsedDailyInput
}
