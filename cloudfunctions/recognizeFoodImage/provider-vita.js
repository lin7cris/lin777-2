const { FOOD_IMAGE_PROMPT } = require('./prompt')
const { FoodImageError } = require('./errors')
const { requestJson } = require('./http')

const DEFAULT_BASE_URL = 'https://tokenhub.tencentmaas.com/v1/chat/completions'
const DEFAULT_MODEL = 'youtu-vita'

function buildVitaRequest(options) {
  const config = options || {}
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
    },
    body: {
      model: config.model || DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `${FOOD_IMAGE_PROMPT}\n\n请识别这张图片中的明显可见食物，并按要求返回 JSON。` },
            { type: 'image_url', image_url: { url: `data:${config.mimeType};base64,${config.imageBase64}` } }
          ]
        }
      ],
      temperature: 0.1,
      stream: false
    }
  }
}

function parseJsonContent(content) {
  const text = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(text)
  } catch (error) {
    const responseError = new FoodImageError('INVALID_VITA_RESPONSE', 'VITA content was not JSON', { cause: error })
    throw responseError
  }
}

function parseVitaResponse(response) {
  const content = response && response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content
  if (!content) throw new FoodImageError('INVALID_VITA_RESPONSE', 'VITA response content is missing')
  return parseJsonContent(content)
}

function createVitaProvider(options) {
  const config = options || {}
  const apiKey = config.apiKey || process.env.VITA_API_KEY
  const baseUrl = config.baseUrl || process.env.VITA_BASE_URL || DEFAULT_BASE_URL
  const model = config.model || process.env.VITA_MODEL || DEFAULT_MODEL
  const http = config.requestJson || requestJson

  return {
    async recognize({ imageBase64, mimeType }) {
      if (!apiKey) throw new FoodImageError('VITA_API_KEY_MISSING', 'VITA_API_KEY is missing')
      const request = buildVitaRequest({ imageBase64, mimeType, apiKey, model })
      const response = await http(baseUrl, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(request.body),
        timeout: 30000
      })
      return parseVitaResponse(response)
    }
  }
}

module.exports = {
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  buildVitaRequest,
  parseVitaResponse,
  createVitaProvider
}
