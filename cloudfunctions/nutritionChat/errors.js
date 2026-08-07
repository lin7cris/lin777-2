class NutritionChatError extends Error {
  constructor(code, message, details) {
    super(message)
    this.name = 'NutritionChatError'
    this.code = code
    this.statusCode = details && details.statusCode
  }
}

function friendlyError(error) {
  const code = error && error.code ? error.code : 'NUTRITION_CHAT_ERROR'
  const messages = {
    UNAUTHORIZED: '登录状态已失效，请重新进入小程序',
    INVALID_INPUT: '请输入想咨询的饮食问题',
    AI_KEY_MISSING: '营养咨询服务尚未配置，请联系管理员',
    AI_TIMEOUT: '营养师回复超时，请稍后重试',
    AI_INVALID_RESPONSE: '营养师回复无法识别，请稍后重试',
    AI_HTTP_ERROR: '营养师暂时不可用，请稍后重试',
    NUTRITION_CHAT_ERROR: '营养师暂时不可用，请稍后重试'
  }

  return { code, message: messages[code] || messages.NUTRITION_CHAT_ERROR }
}

module.exports = { NutritionChatError, friendlyError }
