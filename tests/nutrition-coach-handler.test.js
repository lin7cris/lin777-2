const assert = require('assert')

const { createNutritionCoachHandler } = require('../cloudfunctions/nutritionCoach/handler')

const profile = {
  gender: 'female',
  age: 28,
  height: 165,
  weight: 62,
  goal: 'fat_loss',
  targetCalories: 1506,
  macros: {
    protein: '93-112g',
    carbs: '151-188g',
    fat: '37-54g'
  }
}

const todayRecord = {
  date: '2026-08-06',
  foods: [{ name: '鸡蛋', calories: 140, protein: 12, carbs: 1, fat: 10 }],
  totalCaloriesIn: 1560,
  totalCaloriesOut: 320,
  totalProtein: 74,
  totalCarbs: 160,
  totalFat: 48,
  targetCalories: 1506
}

async function run() {
  let requestedOpenid = ''
  let providerInput
  const handler = createNutritionCoachHandler({
    getOpenId: () => 'openid-current-user',
    repository: {
      async getProfile(openid) {
        requestedOpenid = openid
        return profile
      },
      async getDailyRecord(openid, date) {
        assert.strictEqual(openid, 'openid-current-user')
        assert.strictEqual(date, '2026-08-06')
        return todayRecord
      },
      async getRecentRecords(openid, date, days) {
        assert.strictEqual(openid, 'openid-current-user')
        assert.strictEqual(date, '2026-08-06')
        assert.strictEqual(days, 7)
        return [{ date: '2026-08-05', totalCaloriesIn: 1400, totalCaloriesOut: 200 }]
      }
    },
    getProvider: () => ({
      async generate(input) {
        providerInput = input
        return {
          summary: '今天整体控制良好。',
          nutritionAnalysis: '蛋白质仍有提升空间。',
          suggestions: ['晚餐补充优质蛋白质'],
          dinnerRecommendation: '鸡胸肉、蔬菜和少量米饭，约 390 kcal。',
          recommendations: [
            { name: '鸡胸肉沙拉', amount: '1 份', calories: 350, protein: 35, carbs: 20, fat: 12 }
          ],
          tomorrowSuggestion: '明天早餐加入鸡蛋或无糖酸奶，帮助更早补足蛋白质。',
          warning: ['建议仅供日常饮食参考，不代替医疗建议。']
        }
      }
    }),
    logger: { error() {} }
  })

  const result = await handler({
    date: '2026-08-06',
    userInfo: { weight: 99 },
    todayRecords: { totalCaloriesIn: 9999 },
    nutritionData: { protein: 1 },
    targetCalories: 9999
  })

  assert.strictEqual(result.success, true)
  assert.strictEqual(result.recommendationTitle, result.mealContext.title)
  assert.strictEqual(requestedOpenid, 'openid-current-user')
  assert.strictEqual(providerInput.context.today.caloriesIn, 1560)
  assert.strictEqual(providerInput.context.today.remainingCalories, 266)
  assert.strictEqual(providerInput.context.profile.weight, 62)
  assert.deepStrictEqual(result.suggestions, ['晚餐补充优质蛋白质'])
  assert.strictEqual(result.dinnerRecommendation, '鸡胸肉、蔬菜和少量米饭，约 390 kcal。')
  assert.strictEqual(result.recommendations.length, 2)
  assert.strictEqual(result.recommendations[0].name, '鸡胸肉沙拉')
  assert.strictEqual(result.recommendations[0].estimated, true)
  assert.strictEqual(result.tomorrowSuggestion, '明天早餐加入鸡蛋或无糖酸奶，帮助更早补足蛋白质。')
  assert.strictEqual(result.warning.length, 1)

  const noFoodHandler = createNutritionCoachHandler({
    getOpenId: () => 'openid-current-user',
    repository: {
      getProfile: async () => profile,
      getDailyRecord: async () => ({ ...todayRecord, foods: [] }),
      getRecentRecords: async () => []
    },
    getProvider: () => ({ generate: async ({ context }) => ({
      summary: '今天可以从三餐规划开始。',
      nutritionAnalysis: '暂无今日摄入数据。',
      dinnerRecommendation: '先安排均衡的早餐、午餐和晚餐。',
      recommendations: [],
      mealContext: context.mealContext
    }) }),
    logger: { error() {} }
  })
  const noFood = await noFoodHandler({ date: '2026-08-06' })
  assert.equal(noFood.success, true)
  assert.equal(noFood.mealContext.title, '今日饮食规划')

  const failedHandler = createNutritionCoachHandler({
    getOpenId: () => 'openid-current-user',
    repository: {
      getProfile: async () => profile,
      getDailyRecord: async () => todayRecord,
      getRecentRecords: async () => []
    },
    getProvider: () => ({
      generate: async () => {
        const error = new Error('Authorization Bearer private-key')
        error.code = 'AI_HTTP_ERROR'
        throw error
      }
    }),
    logger: { error() {} }
  })
  const failed = await failedHandler({ date: '2026-08-06' })
  assert.deepStrictEqual(failed, {
    success: false,
    error: { code: 'AI_HTTP_ERROR', message: '营养建议暂时不可用，请稍后重试' }
  })
  assert.ok(!JSON.stringify(failed).includes('private-key'))

  const unauthorizedHandler = createNutritionCoachHandler({
    getOpenId: () => '',
    repository: {},
    logger: { error() {} }
  })
  const unauthorized = await unauthorizedHandler({ date: '2026-08-06' })
  assert.deepStrictEqual(unauthorized, {
    success: false,
    error: { code: 'UNAUTHORIZED', message: '登录状态已失效，请重新进入小程序' }
  })

}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
