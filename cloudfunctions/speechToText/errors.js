class SpeechToTextError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'SpeechToTextError'
    this.code = code
  }
}

const FRIENDLY_MESSAGES = {
  UNAUTHORIZED: '无法确认当前用户，请重新进入小程序',
  INVALID_AUDIO: '录音文件无效，请重新录制',
  INVALID_FORMAT: '暂不支持该录音格式',
  RECORDING_TOO_SHORT: '录音时间太短，请再说一次',
  RECORDING_TOO_LONG: '单次录音不能超过 45 秒',
  AUDIO_TOO_LARGE: '录音文件过大，请缩短录音时间',
  ASR_KEY_MISSING: '语音转写服务尚未配置',
  EMPTY_TRANSCRIPT: '没有识别到清晰语音，请再说一次',
  TRANSCRIPTION_TIMEOUT: '语音转写超时，请稍后重试',
  TRANSCRIPTION_FAILED: '语音转写失败，请稍后重试'
}

function friendlyError(error) {
  const code = error && FRIENDLY_MESSAGES[error.code]
    ? error.code
    : 'TRANSCRIPTION_FAILED'
  return {
    code,
    message: FRIENDLY_MESSAGES[code]
  }
}

module.exports = {
  SpeechToTextError,
  friendlyError
}

