const { SpeechToTextError } = require('./errors')

function defaultCreateClient(config) {
  const tencentcloud = require('tencentcloud-sdk-nodejs-asr')
  const AsrClient = tencentcloud.asr.v20190614.Client
  return new AsrClient({
    credential: {
      secretId: config.secretId,
      secretKey: config.secretKey,
      token: config.token || undefined
    },
    region: config.region,
    profile: {
      httpProfile: {
        endpoint: 'asr.tencentcloudapi.com',
        reqTimeout: 15
      }
    }
  })
}

function createTencentAsrProvider(options) {
  const config = options || {}
  const env = config.env || process.env
  const createClient = config.createClient || defaultCreateClient

  return {
    name: 'tencent-asr',

    async transcribe(input) {
      const secretId = String(env.TENCENTCLOUD_SECRETID || '').trim()
      const secretKey = String(env.TENCENTCLOUD_SECRETKEY || '').trim()
      const token = String(env.TENCENTCLOUD_SESSIONTOKEN || '').trim()
      const region = String(env.TENCENTCLOUD_REGION || 'ap-shanghai').trim() || 'ap-shanghai'
      if (!secretId || !secretKey) {
        throw new SpeechToTextError('ASR_KEY_MISSING', 'Tencent Cloud ASR credentials are not configured')
      }

      const credentialConfig = { secretId, secretKey, token, region }
      const client = createClient(credentialConfig)
      const request = {
        ProjectId: 0,
        SubServiceType: 2,
        EngSerViceType: '16k_zh',
        SourceType: 1,
        VoiceFormat: input.voiceFormat,
        Data: input.audioBase64,
        DataLen: Buffer.from(input.audioBase64, 'base64').length,
        FilterDirty: 0,
        FilterModal: 1,
        FilterPunc: 0,
        ConvertNumMode: 1,
        WordInfo: 0
      }

      try {
        const response = await client.SentenceRecognition(request)
        const text = String(response && response.Result || '').trim()
        if (!text) throw new SpeechToTextError('EMPTY_TRANSCRIPT', 'Tencent ASR returned empty text')
        return {
          text,
          durationMs: Number(response && response.AudioDuration) || 0,
          requestId: String(response && response.RequestId || '')
        }
      } catch (error) {
        if (error && (error.code === 'EMPTY_TRANSCRIPT' || error.code === 'ASR_KEY_MISSING')) throw error
        if (error && (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT' || error.code === 'ECONNABORTED')) {
          throw new SpeechToTextError('TRANSCRIPTION_TIMEOUT', 'Tencent ASR request timed out')
        }
        if (error && (error.code || error.message)) {
          throw error
        }
        throw new SpeechToTextError('TRANSCRIPTION_FAILED', 'Tencent ASR request failed')
      }
    }
  }
}

module.exports = {
  createTencentAsrProvider
}
