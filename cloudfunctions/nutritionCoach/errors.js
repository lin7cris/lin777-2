class NutritionCoachError extends Error {
  constructor(code, message, details) {
    super(message)
    this.name = 'NutritionCoachError'
    this.code = code
    this.statusCode = details && details.statusCode
  }
}

function friendlyError(error) {
  const code = error && error.code ? error.code : 'NUTRITION_COACH_ERROR'
  const messages = {
    UNAUTHORIZED: '登录状态已失效，请重新进入小程序',
    INVALID_INPUT: '请求参数不正确，请稍后重试',
    PROFILE_INCOMPLETE: '请先补全身体信息，再生成营养建议',
    NO_FOOD_RECORD: '请先记录今天的饮食，再生成营养建议',
    AI_KEY_MISSING: '营养建议服务尚未配置，请联系管理员',
    AI_TIMEOUT: '生成营养建议超时，请稍后重试',
    AI_INVALID_RESPONSE: '营养建议结果无法识别，请稍后重试',
    AI_HTTP_ERROR: '营养建议暂时不可用，请稍后重试',
    NUTRITION_COACH_ERROR: '营养建议暂时不可用，请稍后重试'
  }

  return {
    code,
    message: messages[code] || messages.NUTRITION_COACH_ERROR
  }
}

module.exports = {
  NutritionCoachError,
  friendlyError
}
