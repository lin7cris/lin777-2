const { friendlyError, AiProviderError } = require('./errors')
const { getProvider: defaultGetProvider } = require('./provider-factory')
const { normalizeAiResult } = require('./schema')

function emptySummary() {
  return {
    foodCalories: 0,
    exerciseCalories: 0,
    netCalories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    estimated: false
  }
}

function createParseDailyInputHandler(options) {
  const config = options || {}
  const getProvider = config.getProvider || defaultGetProvider
  const providerName = config.providerName || process.env.AI_PROVIDER || 'deepseek'
  const logger = config.logger || console

  return async function parseDailyInputHandler(event) {
    const text = String(event && event.text || '').trim()
    const profile = event && event.profile && typeof event.profile === 'object'
      ? event.profile
      : {}

    try {
      if (!text) {
        throw new AiProviderError('INVALID_INPUT', 'text is required')
      }

      const provider = getProvider(providerName)
      const rawResult = await provider.parseDailyInput({ text, profile })
      const normalized = normalizeAiResult(text, rawResult)

      return {
        success: true,
        provider: provider.name || String(providerName).toLowerCase(),
        model: provider.model || '',
        ...normalized
      }
    } catch (error) {
      logger.error('parseDailyInput failed', {
        code: error && error.code,
        statusCode: error && error.statusCode
      })

      return {
        success: false,
        sourceText: text,
        foods: [],
        exercises: [],
        summary: emptySummary(),
        error: friendlyError(error)
      }
    }
  }
}

module.exports = {
  createParseDailyInputHandler
}
