const assert = require('assert')

const { createDeepSeekProvider } = require('../cloudfunctions/parseDailyInput/provider-deepseek')

async function run() {
  let capturedRequest
  const provider = createDeepSeekProvider({
    env: {
      DEEPSEEK_API_KEY: 'test-key',
      DEEPSEEK_MODEL: 'deepseek-chat'
    },
    requestJson: async (request) => {
      capturedRequest = request
      return {
        choices: [{
          message: {
            content: JSON.stringify({
              confidence: 0.9,
              foods: [{ name: '牛肉面', amount: '1碗', meal: '午餐', calories: 650, protein: 30, fat: 18, carbs: 85, estimated: true }],
              exercises: []
            })
          }
        }]
      }
    }
  })

  const result = await provider.parseDailyInput({
    text: '中午吃了一碗牛肉面',
    profile: { gender: 'male', age: 30, height: 175, weight: 75 }
  })

  assert.strictEqual(capturedRequest.url, 'https://api.deepseek.com/chat/completions')
  assert.strictEqual(capturedRequest.headers.Authorization, 'Bearer test-key')
  assert.strictEqual(capturedRequest.body.model, 'deepseek-chat')
  assert.deepStrictEqual(capturedRequest.body.response_format, { type: 'json_object' })
  assert.match(capturedRequest.body.messages[1].content, /中午吃了一碗牛肉面/)
  assert.match(capturedRequest.body.messages[1].content, /"weight":75/)
  assert.strictEqual(result.foods[0].name, '牛肉面')

  const defaultModelProvider = createDeepSeekProvider({
    env: { DEEPSEEK_API_KEY: 'test-key' },
    requestJson: async () => ({ choices: [{ message: { content: '{"foods":[],"exercises":[]}' } }] })
  })
  assert.strictEqual(defaultModelProvider.model, 'deepseek-chat')

  const customModelProvider = createDeepSeekProvider({
    env: {
      DEEPSEEK_API_KEY: 'test-key',
      DEEPSEEK_MODEL: 'custom-model'
    },
    requestJson: async (request) => {
      assert.strictEqual(request.body.model, 'custom-model')
      return { choices: [{ message: { content: '{"foods":[],"exercises":[]}' } }] }
    }
  })
  assert.strictEqual(customModelProvider.model, 'custom-model')
  await customModelProvider.parseDailyInput({ text: '测试', profile: {} })

  const missingKey = createDeepSeekProvider({ env: {}, requestJson: async () => ({}) })
  await assert.rejects(
    () => missingKey.parseDailyInput({ text: '吃了苹果', profile: {} }),
    (error) => error.code === 'AI_KEY_MISSING' && !error.message.includes('test-key')
  )

  const invalidJson = createDeepSeekProvider({
    env: { DEEPSEEK_API_KEY: 'secret' },
    requestJson: async () => ({ choices: [{ message: { content: 'not json' } }] })
  })
  await assert.rejects(
    () => invalidJson.parseDailyInput({ text: '吃了苹果', profile: {} }),
    (error) => error.code === 'AI_INVALID_RESPONSE'
  )

  const upstreamFailure = createDeepSeekProvider({
    env: { DEEPSEEK_API_KEY: 'secret' },
    requestJson: async () => {
      const error = new Error('401 secret')
      error.code = 'AI_HTTP_ERROR'
      throw error
    }
  })
  await assert.rejects(
    () => upstreamFailure.parseDailyInput({ text: '吃了苹果', profile: {} }),
    (error) => error.code === 'AI_HTTP_ERROR'
  )

  console.log('deepseek provider tests passed')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
