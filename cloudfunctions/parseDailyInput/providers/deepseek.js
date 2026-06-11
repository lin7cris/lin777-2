const { AiProviderError } = require('../errors')
const { requestJson: defaultRequestJson } = require('../http')
const { buildMessages } = require('../prompt')

const PROVIDER_NAME = 'deepseek'
const MODEL = 'deepseek-v4-flash'

function parseModelContent(response) {
  const content = response &&
    response.choices &&
    response.choices[0] &&
    response.choices[0].message &&
    response.choices[0].message.content

  if (!content) {
    throw new AiProviderError('AI_INVALID_RESPONSE', 'DeepSeek response content is empty')
  }

  const jsonText = String(content)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')

  try {
    return JSON.parse(jsonText)
  } catch (error) {
    throw new AiProviderError('AI_INVALID_RESPONSE', 'DeepSeek response content is not JSON')
  }
}

function createDeepSeekProvider(options) {
  const config = options || {}
  const env = config.env || process.env
  const requestJson = config.requestJson || defaultRequestJson

  return {
    name: PROVIDER_NAME,
    model: MODEL,

    async parseDailyInput(input) {
      const apiKey = String(env.DEEPSEEK_API_KEY || '').trim()
      if (!apiKey) {
        throw new AiProviderError('AI_KEY_MISSING', 'DEEPSEEK_API_KEY is not configured')
      }

      const baseUrl = String(env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '')
      const response = await requestJson({
        url: `${baseUrl}/chat/completions`,
        timeoutMs: 20000,
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        body: {
          model: MODEL,
          messages: buildMessages(input.text, input.profile),
          response_format: { type: 'json_object' },
          temperature: 0.1,
          stream: false
        }
      })

      return parseModelContent(response)
    }
  }
}

module.exports = {
  createDeepSeekProvider,
  parseModelContent
}
