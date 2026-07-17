const assert = require('assert')

const { createTencentAsrProvider } = require('../cloudfunctions/speechToText/provider-tencent-asr')

async function run() {
  let clientConfig
  let request
  const provider = createTencentAsrProvider({
    env: {
      TENCENTCLOUD_SECRETID: 'temporary-secret-id',
      TENCENTCLOUD_SECRETKEY: 'temporary-secret-key',
      TENCENTCLOUD_SESSIONTOKEN: 'temporary-token',
      TENCENTCLOUD_REGION: 'ap-shanghai'
    },
    createClient(config) {
      clientConfig = config
      return {
        async SentenceRecognition(params) {
          request = params
          return { Result: '今天跑步三十分钟。', AudioDuration: 3200, RequestId: 'request-1' }
        }
      }
    }
  })

  const audioBase64 = Buffer.from('voice-data').toString('base64')
  const result = await provider.transcribe({ audioBase64, voiceFormat: 'mp3', durationMs: 3200 })

  assert.deepStrictEqual(clientConfig, {
    secretId: 'temporary-secret-id',
    secretKey: 'temporary-secret-key',
    token: 'temporary-token',
    region: 'ap-shanghai'
  })
  assert.strictEqual(request.EngSerViceType, '16k_zh')
  assert.strictEqual(request.SourceType, 1)
  assert.strictEqual(request.VoiceFormat, 'mp3')
  assert.strictEqual(request.Data, audioBase64)
  assert.strictEqual(request.DataLen, Buffer.from(audioBase64, 'base64').length)
  assert.deepStrictEqual(result, {
    text: '今天跑步三十分钟。',
    durationMs: 3200,
    requestId: 'request-1'
  })

  const missingKey = createTencentAsrProvider({
    env: {},
    createClient() { throw new Error('must not create client') }
  })
  await assert.rejects(
    () => missingKey.transcribe({ audioBase64, voiceFormat: 'mp3' }),
    (error) => error.code === 'ASR_KEY_MISSING'
  )

  const emptyProvider = createTencentAsrProvider({
    env: { ASR_SECRET_ID: 'id', ASR_SECRET_KEY: 'key' },
    createClient() {
      return { async SentenceRecognition() { return { Result: '', RequestId: 'request-2' } } }
    }
  })
  await assert.rejects(
    () => emptyProvider.transcribe({ audioBase64, voiceFormat: 'mp3' }),
    (error) => error.code === 'EMPTY_TRANSCRIPT'
  )

  const timeoutProvider = createTencentAsrProvider({
    env: { ASR_SECRET_ID: 'id', ASR_SECRET_KEY: 'key' },
    createClient() {
      return {
        async SentenceRecognition() {
          const error = new Error('socket timeout')
          error.code = 'ETIMEDOUT'
          throw error
        }
      }
    }
  })
  await assert.rejects(
    () => timeoutProvider.transcribe({ audioBase64, voiceFormat: 'mp3' }),
    (error) => error.code === 'TRANSCRIPTION_TIMEOUT'
  )

  console.log('tencent asr provider tests passed')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
