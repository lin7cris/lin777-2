class FoodImageError extends Error {
  constructor(code, message, options) {
    super(message)
    this.name = 'FoodImageError'
    this.code = code
    const details = options || {}
    this.requestId = details.requestId || ''
    this.cause = details.cause
  }
}

function friendlyError(error) {
  const source = error || {}
  const code = source.code || 'FOOD_IMAGE_FAILED'
  const messages = {
    INVALID_IMAGE: '图片格式或内容无效，请重新选择食物图片。',
    CLOUD_FILE_FAILED: '图片处理失败，请重新选择一张照片。',
    VITA_API_KEY_MISSING: '图片识别服务尚未配置，请稍后重试。',
    VITA_REQUEST_FAILED: '图片识别暂时不可用，请稍后重试。',
    INVALID_VITA_RESPONSE: '图片识别结果异常，请重新拍摄后重试。',
    NO_FOOD_RECOGNIZED: '暂时没有识别到明确食物，请拍摄清晰的食物图片。'
  }

  return {
    code,
    message: messages[code] || '图片识别暂时不可用，请稍后重试。',
    requestId: String(source.requestId || source.RequestId || '')
  }
}

module.exports = { FoodImageError, friendlyError }
