const assert = require('assert')

const { createNutritionChatHandler } = require('../cloudfunctions/nutritionChat/handler')

const profile = {
  gender: 'female', age: 28, height: 165, weight: 62,
  activityLevel: 'light', goal: 'fat_loss', targetCalories: 1506,
  macros: { protein: '93-112g', carbs: '151-188g', fat: '37-54g' }
}

const record = {
  date: '2026-08-06',
  foods: [{ name: '鸡蛋', calories: 140, protein: 12, carbs: 1, fat: 10 }],
  totalCaloriesIn: 1240,
  totalCaloriesOut: 180,
  totalProtein: 68,
  totalCarbs: 140,
  totalFat: 42,
  targetCalories: 1506
}

async function run() {
  const saved = []
  let providerInput
  const handler = createNutritionChatHandler({
    getOpenId: () => 'openid-current-user',
    repository: {
      getProfile: async () => profile,
      getDailyRecord: async () => record,
      getRecentRecords: async () => [{ date: '2026-08-05', totalCaloriesIn: 1320 }],
      getRecentMessages: async () => [{ role: 'assistant', message: '上次建议多吃蔬菜。' }],
      saveMessage: async (message) => { saved.push(message) }
    },
    getProvider: () => ({
      generate: async (input) => {
        providerInput = input
        return { answer: '火锅后不需要补偿式节食，下一餐选择清淡蛋白质和蔬菜即可。' }
      }
    }),
    logger: { error() {} },
    now: () => new Date('2026-08-06T12:00:00.000Z')
  })

  const result = await handler({ action: 'ask', message: '今天吃了一顿火锅怎么办？', date: '2026-08-06' })
  assert.deepStrictEqual(result, {
    success: true,
    answer: '火锅后不需要补偿式节食，下一餐选择清淡蛋白质和蔬菜即可。'
  })
  assert.strictEqual(providerInput.context.profile.weight, 62)
  assert.strictEqual(providerInput.context.today.caloriesIn, 1240)
  assert.strictEqual(providerInput.context.chatHistory.length, 1)
  assert.deepStrictEqual(saved.map((item) => item.role), ['user', 'assistant'])
  assert.deepStrictEqual(saved.map((item) => item.content), ['今天吃了一顿火锅怎么办？', '火锅后不需要补偿式节食，下一餐选择清淡蛋白质和蔬菜即可。'])
  assert.ok(saved.every((item) => item.createTime instanceof Date))
  assert.ok(saved.every((item) => item.userId === 'openid-current-user'))
  assert.ok(saved[1].createTime.getTime() > saved[0].createTime.getTime())

  const historyHandler = createNutritionChatHandler({
    getOpenId: () => 'openid-current-user',
    repository: { getRecentMessages: async () => [{ role: 'user', message: '减脂怎么吃？' }] },
    logger: { error() {} }
  })
  assert.deepStrictEqual(await historyHandler({ action: 'history' }), {
    success: true,
    messages: [{ role: 'user', message: '减脂怎么吃？' }]
  })

  const invalid = await handler({ action: 'ask', message: '' })
  assert.deepStrictEqual(invalid, {
    success: false,
    error: { code: 'INVALID_INPUT', message: '请输入想咨询的饮食问题' }
  })

}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
