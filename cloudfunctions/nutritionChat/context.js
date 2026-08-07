function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function targetValue(value, fallback) {
  const values = String(value || '').match(/\d+(?:\.\d+)?/g)
  return values && values.length ? Number(values[values.length - 1]) : fallback
}

function buildChatContext({ profile, todayRecord, historyRecords, chatHistory, message }) {
  const sourceProfile = profile || {}
  const record = todayRecord || {}
  const targetCalories = toNumber(record.targetCalories) || toNumber(sourceProfile.targetCalories)
  const foods = Array.isArray(record.foods) ? record.foods : []
  const macros = sourceProfile.macros || {}
  const recentRecords = Array.isArray(historyRecords) ? historyRecords : []

  return {
    profile: {
      gender: sourceProfile.gender || '',
      age: toNumber(sourceProfile.age),
      height: toNumber(sourceProfile.height),
      weight: toNumber(sourceProfile.weight),
      activityLevel: sourceProfile.activityLevel || '',
      goal: sourceProfile.goal || '',
      targetCalories
    },
    today: {
      caloriesIn: toNumber(record.totalCaloriesIn),
      caloriesOut: toNumber(record.totalCaloriesOut),
      remainingCalories: Math.round(targetCalories + toNumber(record.totalCaloriesOut) - toNumber(record.totalCaloriesIn)),
      protein: { value: toNumber(record.totalProtein), target: targetValue(macros.protein, 100) },
      carbs: { value: toNumber(record.totalCarbs), target: targetValue(macros.carbs, 180) },
      fat: { value: toNumber(record.totalFat), target: targetValue(macros.fat, 50) },
      foods: foods.slice(0, 20).map((food) => ({ name: String(food.name || ''), calories: toNumber(food.calories) }))
    },
    history: recentRecords.slice(0, 7).map((item) => ({
      date: item.date || '',
      caloriesIn: toNumber(item.totalCaloriesIn),
      caloriesOut: toNumber(item.totalCaloriesOut)
    })),
    chatHistory: (Array.isArray(chatHistory) ? chatHistory : []).slice(-8).map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      message: String(item.content || item.message || '').slice(0, 500)
    })),
    question: String(message || '').slice(0, 500)
  }
}

module.exports = { buildChatContext }
