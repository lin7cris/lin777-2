const assert = require('assert')

const { createParseDailyInputHandler } = require('../cloudfunctions/parseDailyInput/handler')

async function run() {
  let providerInput
  const handler = createParseDailyInputHandler({
    providerName: 'deepseek',
    logger: { error() {} },
    getProvider: () => ({
      name: 'deepseek',
      model: 'deepseek-v4-flash',
      parseDailyInput: async (input) => {
        providerInput = input
        return {
          foods: [{ name: '苹果', amount: '1个', meal: '加餐', calories: 95, protein: 0.5, fat: 0.3, carbs: 25, estimated: false }],
          exercises: []
        }
      }
    })
  })

  const profile = { weight: 62, goal: 'fat_loss' }
  const result = await handler({ text: '吃了一个苹果', profile, ignored: 'value' })

  assert.deepStrictEqual(providerInput, { text: '吃了一个苹果', profile })
  assert.strictEqual(result.success, true)
  assert.strictEqual(result.provider, 'deepseek')
  assert.strictEqual(result.model, 'deepseek-v4-flash')
  assert.strictEqual(result.foods[0].meal, '加餐')
  assert.strictEqual(result.summary.foodCalories, 95)

  const failedHandler = createParseDailyInputHandler({
    logger: { error() {} },
    getProvider: () => ({
      parseDailyInput: async () => {
        const error = new Error('Authorization Bearer private-key')
        error.code = 'AI_HTTP_ERROR'
        throw error
      }
    })
  })
  const failed = await failedHandler({ text: '吃了一个苹果', profile })
  assert.strictEqual(failed.success, false)
  assert.strictEqual(failed.error.code, 'AI_HTTP_ERROR')
  assert.strictEqual(failed.error.message, 'AI 服务暂时不可用，请稍后重试')
  assert.ok(!JSON.stringify(failed).includes('private-key'))

  const empty = await handler({ text: '  ', profile })
  assert.strictEqual(empty.success, false)
  assert.strictEqual(empty.error.code, 'INVALID_INPUT')

  console.log('parse daily function tests passed')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
