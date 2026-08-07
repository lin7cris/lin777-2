const assert = require('assert')

const { createDeepSeekProvider } = require('../cloudfunctions/nutritionCoach/provider-deepseek')

async function run() {
  let request
  const provider = createDeepSeekProvider({
    env: {
      DEEPSEEK_API_KEY: 'test-key',
      DEEPSEEK_MODEL: 'deepseek-v4-flash'
    },
    requestJson: async (input) => {
      request = input
      return {
        choices: [{
          message: {
            content: JSON.stringify({
              summary: '整体良好',
              nutritionAnalysis: '蛋白质略低',
              suggestions: ['晚餐补充蛋白质'],
              dinnerRecommendation: '鸡胸肉蔬菜饭，约 390 kcal',
              tomorrowSuggestion: '明天早餐加入一个鸡蛋',
              warning: []
            })
          }
        }]
      }
    }
  })

  const result = await provider.generate({
    context: { profile: { goal: 'fat_loss' }, today: { caloriesIn: 1200 } }
  })

  assert.strictEqual(request.body.model, 'deepseek-v4-flash')
  assert.strictEqual(request.body.response_format.type, 'json_object')
  assert.match(request.body.messages[0].content, /专业私人营养教练/)
  assert.match(request.body.messages[0].content, /不制造焦虑/)
  assert.match(request.body.messages[0].content, /营养缺口分析/)
  assert.match(request.body.messages[0].content, /明日建议/)
  assert.strictEqual(result.summary, '整体良好')
  assert.strictEqual(result.tomorrowSuggestion, '明天早餐加入一个鸡蛋')

  const missingKeyProvider = createDeepSeekProvider({ env: {} })
  await assert.rejects(
    () => missingKeyProvider.generate({ context: {} }),
    (error) => error.code === 'AI_KEY_MISSING'
  )

}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
