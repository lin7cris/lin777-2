function cleanText(value, limit) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, limit)
}

function cleanList(value, limit) {
  if (!Array.isArray(value)) return []
  return value.map((item) => cleanText(item, 100)).filter(Boolean).slice(0, limit)
}

function normalizeDinnerRecommendation(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return cleanText(item, 180)
        const name = cleanText(item && item.name, 80)
        const calorie = Number(item && item.calorie)
        const description = cleanText(item && item.description, 90)
        const parts = [name, Number.isFinite(calorie) && calorie > 0 ? `约 ${Math.round(calorie)} kcal` : '', description].filter(Boolean)
        return parts.join('，')
      })
      .filter(Boolean)
      .slice(0, 2)
      .join('；')
  }
  return cleanText(value, 360)
}

function normalizeCoachResult(result, options) {
  const data = result || {}
  const context = options && options.context
  return {
    summary: cleanText(data.summary, 180),
    nutritionAnalysis: cleanText(data.nutritionAnalysis, 300),
    suggestions: cleanList(data.suggestions, 4),
    dinnerRecommendation: normalizeDinnerRecommendation(data.dinnerRecommendation),
    recommendations: normalizeRecommendations(data.recommendations, buildFallbackRecommendations(context)),
    tomorrowSuggestion: cleanText(data.tomorrowSuggestion, 180),
    warning: cleanList(data.warning, 3)
  }
}

module.exports = {
  normalizeCoachResult
}
const { buildFallbackRecommendations, normalizeRecommendations } = require('./recommendations')
