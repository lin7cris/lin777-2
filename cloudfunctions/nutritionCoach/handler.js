const { NutritionCoachError, friendlyError } = require('./errors')
const { buildNutritionContext, hasCompleteProfile } = require('./context')
const { normalizeCoachResult } = require('./schema')
const { createDeepSeekProvider } = require('./provider-deepseek')

function validDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

function dateKeyFromNow(now) {
  const date = now || new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function hasFoodRecord(record) {
  return Boolean(record && Array.isArray(record.foods) && record.foods.length)
}

function createNutritionCoachHandler(options) {
  const config = options || {}
  const repository = config.repository
  const getOpenId = config.getOpenId || (() => '')
  const getProvider = config.getProvider || (() => createDeepSeekProvider())
  const logger = config.logger || console
  const now = config.now || (() => new Date())

  return async function nutritionCoachHandler(event) {
    const input = event || {}
    const date = String(input.date || dateKeyFromNow(now())).trim()

    try {
      const openid = String(getOpenId() || '')
      if (!openid) throw new NutritionCoachError('UNAUTHORIZED', 'missing openid')
      if (!validDate(date)) throw new NutritionCoachError('INVALID_INPUT', 'date must use YYYY-MM-DD')

      const [savedProfile, todayRecord, historyRecords] = await Promise.all([
        repository.getProfile(openid),
        repository.getDailyRecord(openid, date),
        repository.getRecentRecords(openid, date, 7)
      ])
      const profile = savedProfile || input.userInfo || {}

      if (!hasCompleteProfile(profile)) {
        throw new NutritionCoachError('PROFILE_INCOMPLETE', 'profile is incomplete')
      }
      if (!hasFoodRecord(todayRecord)) {
        throw new NutritionCoachError('NO_FOOD_RECORD', 'food record is missing')
      }

      const context = buildNutritionContext({ profile, todayRecord, historyRecords })
      const provider = getProvider()
      const rawResult = await provider.generate({ context })

      return {
        success: true,
        ...normalizeCoachResult(rawResult, { context })
      }
    } catch (error) {
      const safeError = friendlyError(error)
      logger.error('nutritionCoach failed', {
        code: safeError.code,
        message: safeError.message,
        requestId: String(error && (error.requestId || error.RequestId) || '')
      })
      return {
        success: false,
        error: safeError
      }
    }
  }
}

module.exports = {
  createNutritionCoachHandler
}
