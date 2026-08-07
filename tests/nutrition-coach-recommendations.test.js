const assert = require('assert')

const {
  buildFallbackRecommendations,
  normalizeRecommendations
} = require('../cloudfunctions/nutritionCoach/recommendations')

const proteinLowContext = {
  profile: { goal: 'fat_loss' },
  today: {
    remainingCalories: 420,
    protein: { value: 58, target: 100 }
  }
}

const proteinRecommendations = buildFallbackRecommendations(proteinLowContext)
assert.strictEqual(proteinRecommendations.length, 2)
assert.ok(proteinRecommendations.every((item) => item.protein >= 30))
assert.ok(proteinRecommendations.every((item) => item.estimated))

const overContext = {
  profile: { goal: 'fat_loss' },
  today: {
    remainingCalories: -120,
    protein: { value: 96, target: 100 }
  }
}

const overRecommendations = buildFallbackRecommendations(overContext)
assert.ok(overRecommendations.every((item) => item.calories <= 260))

const normalized = normalizeRecommendations([
  {
    name: '鸡胸肉沙拉',
    amount: '1 份',
    calories: 350,
    protein: 35,
    carbs: 20,
    fat: 12,
    description: '搭配少量主食'
  }
], proteinRecommendations)
assert.strictEqual(normalized.length, 2)
assert.strictEqual(normalized[0].name, '鸡胸肉沙拉')
assert.strictEqual(normalized[0].estimated, true)
