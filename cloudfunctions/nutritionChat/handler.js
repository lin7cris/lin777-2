const { NutritionChatError, friendlyError } = require('./errors')
const { buildChatContext } = require('./context')
const { createDeepSeekProvider } = require('./provider-deepseek')

function validDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

function dateKey(now) {
  const date = now || new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function cleanAnswer(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 500)
}

function createNutritionChatHandler(options) {
  const config = options || {}
  const repository = config.repository
  const getOpenId = config.getOpenId || (() => '')
  const getProvider = config.getProvider || (() => createDeepSeekProvider())
  const now = config.now || (() => new Date())
  const logger = config.logger || console

  return async function nutritionChatHandler(event) {
    const input = event || {}
    const action = String(input.action || 'ask')
    const openid = String(getOpenId() || '')

    try {
      if (!openid) throw new NutritionChatError('UNAUTHORIZED', 'missing openid')
      if (action === 'history') {
        return { success: true, messages: await repository.getRecentMessages(openid, 8) }
      }
      if (action !== 'ask') throw new NutritionChatError('INVALID_INPUT', 'unsupported action')

      const message = String(input.message || '').trim().slice(0, 500)
      if (!message) throw new NutritionChatError('INVALID_INPUT', 'message is required')
      const date = String(input.date || dateKey(now()))
      if (!validDate(date)) throw new NutritionChatError('INVALID_INPUT', 'invalid date')

      const [profile, todayRecord, historyRecords, chatHistory] = await Promise.all([
        repository.getProfile(openid),
        repository.getDailyRecord(openid, date),
        repository.getRecentRecords(openid, date, 7),
        repository.getRecentMessages(openid, 8)
      ])
      const context = buildChatContext({ profile, todayRecord, historyRecords, chatHistory, message })
      const answer = cleanAnswer((await getProvider().generate({ context })).answer)
      if (!answer) throw new NutritionChatError('AI_INVALID_RESPONSE', 'answer is missing')

      const userCreateTime = now()
      const assistantCreateTime = new Date(userCreateTime.getTime() + 1)
      await repository.saveMessage({ userId: openid, content: message, role: 'user', createTime: userCreateTime })
      await repository.saveMessage({ userId: openid, content: answer, role: 'assistant', createTime: assistantCreateTime })
      return { success: true, answer }
    } catch (error) {
      const safeError = friendlyError(error)
      logger.error('nutritionChat failed', {
        code: safeError.code,
        message: safeError.message,
        requestId: String(error && (error.requestId || error.RequestId) || '')
      })
      return { success: false, error: safeError }
    }
  }
}

module.exports = { createNutritionChatHandler }
