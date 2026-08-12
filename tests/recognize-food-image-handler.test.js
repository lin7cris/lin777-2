const assert = require('assert')

const { createRecognizeFoodImageHandler } = require('../cloudfunctions/recognizeFoodImage/handler')

async function run() {
  const handler = createRecognizeFoodImageHandler({
    recognize: async () => ({
      foods: [{
        name: '番茄炒蛋', amount: 200, unit: 'g', calories: 260,
        protein: 12, carbs: 14, fat: 16, confidence: 0.81
      }],
      summary: '识别到1种食物',
      warning: ''
    }),
    logger: { error() {} }
  })

  const result = await handler({ imageBase64: 'QUJD', mimeType: 'image/jpeg' })
  assert.strictEqual(result.success, true)
  assert.strictEqual(result.foods[0].name, '番茄炒蛋')
  assert.strictEqual(result.foods[0].estimated, true)
  assert.strictEqual(result.warning, '')
}

async function verifyFailure() {
  const logs = []
  const handler = createRecognizeFoodImageHandler({
    recognize: async () => {
      const error = new Error('VITA upstream unavailable')
      error.code = 'VITA_REQUEST_FAILED'
      error.requestId = 'req-test-1'
      throw error
    },
    logger: { error(...args) { logs.push(args) } }
  })

  const result = await handler({ imageBase64: 'QUJD', mimeType: 'image/jpeg' })
  assert.strictEqual(result.success, false)
  assert.strictEqual(result.error.code, 'VITA_REQUEST_FAILED')
  assert.strictEqual(result.error.message, '图片识别暂时不可用，请稍后重试。')
  assert.strictEqual(result.error.requestId, 'req-test-1')
  assert.strictEqual(logs.length, 1)
  assert.deepStrictEqual(logs[0][1], {
    code: 'VITA_REQUEST_FAILED',
    message: 'VITA upstream unavailable',
    requestId: 'req-test-1'
  })
}

async function verifyNonFood() {
  const handler = createRecognizeFoodImageHandler({
    recognize: async () => ({
      foods: [],
      summary: '无法确认食物',
      warning: '图片中没有清晰可见的食物'
    }),
    logger: { error() {} }
  })

  const result = await handler({ imageBase64: 'QUJD', mimeType: 'image/png' })
  assert.strictEqual(result.success, false)
  assert.strictEqual(result.error.code, 'NO_FOOD_RECOGNIZED')
  assert.match(result.error.message, /没有识别到明确食物/)
}

run().then(verifyFailure).then(verifyNonFood).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
