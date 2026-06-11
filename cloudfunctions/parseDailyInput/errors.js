class AiProviderError extends Error {
  constructor(code, message, details) {
    super(message)
    this.name = 'AiProviderError'
    this.code = code
    this.statusCode = details && details.statusCode
  }
}

function friendlyError(error) {
  const code = error && error.code ? error.code : 'AI_SERVICE_ERROR'
  const messages = {
    INVALID_INPUT: '请先输入今天的饮食或运动',
    AI_KEY_MISSING: 'AI 服务尚未配置，请联系管理员',
    AI_TIMEOUT: 'AI 解析超时，请稍后重试',
    AI_INVALID_RESPONSE: 'AI 返回内容无法识别，请换种方式描述',
    PROVIDER_NOT_IMPLEMENTED: '当前 AI 服务尚未启用',
    UNSUPPORTED_AI_PROVIDER: 'AI 服务配置有误，请联系管理员',
    AI_HTTP_ERROR: 'AI 服务暂时不可用，请稍后重试',
    AI_SERVICE_ERROR: 'AI 服务暂时不可用，请稍后重试'
  }

  return {
    code,
    message: messages[code] || messages.AI_SERVICE_ERROR
  }
}

module.exports = {
  AiProviderError,
  friendlyError
}
