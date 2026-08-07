const { SpeechToTextError, friendlyError } = require('./errors')
const { createTencentAsrProvider } = require('./provider-tencent-asr')

const MIN_RECORDING_MS = 800
const MAX_RECORDING_MS = 45000
const MAX_AUDIO_BYTES = 2 * 1024 * 1024

function decodedAudioSize(audioBase64) {
  const text = String(audioBase64 || '').trim()
  if (!text || text.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(text)) return -1
  return Buffer.from(text, 'base64').length
}

function validateEvent(event) {
  const input = event || {}
  const audioBase64 = String(input.audioBase64 || '').trim()
  const voiceFormat = String(input.voiceFormat || '').toLowerCase()
  const durationMs = Number(input.durationMs) || 0
  const audioSize = decodedAudioSize(audioBase64)

  if (audioSize <= 0) throw new SpeechToTextError('INVALID_AUDIO', 'invalid audio payload')
  if (voiceFormat !== 'mp3') throw new SpeechToTextError('INVALID_FORMAT', 'only mp3 is supported')
  if (durationMs < MIN_RECORDING_MS) throw new SpeechToTextError('RECORDING_TOO_SHORT', 'recording is too short')
  if (durationMs > MAX_RECORDING_MS) throw new SpeechToTextError('RECORDING_TOO_LONG', 'recording is too long')
  if (audioSize > MAX_AUDIO_BYTES) throw new SpeechToTextError('AUDIO_TOO_LARGE', 'audio payload is too large')

  return { audioBase64, voiceFormat, durationMs }
}

function createSpeechToTextHandler(options) {
  const config = options || {}
  const getOpenId = config.getOpenId || (() => '')
  const provider = config.provider || createTencentAsrProvider()
  const logger = config.logger || console

  return async function speechToTextHandler(event) {
    try {
      const openid = String(getOpenId() || '')
      if (!openid) throw new SpeechToTextError('UNAUTHORIZED', 'missing openid')

      const input = validateEvent(event)
      const result = await provider.transcribe(input)
      const text = String(result && result.text || '').trim()
      const actualDurationMs = Number(result && result.durationMs) || input.durationMs
      if (actualDurationMs > MAX_RECORDING_MS) {
        throw new SpeechToTextError('RECORDING_TOO_LONG', 'recording is too long')
      }
      if (!text) throw new SpeechToTextError('EMPTY_TRANSCRIPT', 'empty transcript')

      return {
        success: true,
        text,
        durationMs: actualDurationMs
      }
    } catch (error) {
      const details = friendlyError(error)
      const requestId = String(error && (error.requestId || error.RequestId) || '')
      logger.error('speechToText failed', { ...details, requestId })
      return { success: false, ...details, requestId }
    }
  }
}

module.exports = {
  createSpeechToTextHandler,
  validateEvent
}
