const assert = require('assert')

const {
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  buildVitaRequest,
  parseVitaResponse
} = require('../cloudfunctions/recognizeFoodImage/provider-vita')

assert.strictEqual(DEFAULT_BASE_URL, 'https://tokenhub.tencentmaas.com/v1/chat/completions')
assert.strictEqual(DEFAULT_MODEL, 'youtu-vita')

const request = buildVitaRequest({
  imageBase64: 'QUJD',
  mimeType: 'image/jpeg',
  apiKey: 'test-only-key',
  model: 'vita-video-3.0'
})

assert.strictEqual(request.headers.Authorization, 'Bearer test-only-key')
assert.strictEqual(request.body.model, 'vita-video-3.0')
assert.strictEqual(request.body.messages.length, 1)
assert.strictEqual(request.body.messages[0].role, 'user')
assert.strictEqual(request.body.messages[0].content[1].type, 'image_url')
assert.strictEqual(
  request.body.messages[0].content[1].image_url.url,
  'data:image/jpeg;base64,QUJD'
)
assert.match(request.body.messages[0].content[0].text, /只返回 JSON/)

assert.deepStrictEqual(parseVitaResponse({
  choices: [{ message: { content: '{"foods":[],"summary":"无法确认食物","warning":"请重试"}' } }]
}), {
  foods: [],
  summary: '无法确认食物',
  warning: '请重试'
})

assert.deepStrictEqual(parseVitaResponse({
  choices: [{ message: { content: '```json\n{"foods":[],"summary":"无法确认食物","warning":""}\n```' } }]
}), {
  foods: [],
  summary: '无法确认食物',
  warning: ''
})

assert.throws(
  () => parseVitaResponse({ choices: [] }),
  (error) => error.code === 'INVALID_VITA_RESPONSE'
)
