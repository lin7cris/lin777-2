const assert = require('assert')

const { createSpeechToTextHandler } = require('../cloudfunctions/speechToText/handler')

const validEvent = {
  audioBase64: Buffer.from('voice-data').toString('base64'),
  voiceFormat: 'mp3',
  durationMs: 3200
}

async function run() {
  let providerInput
  const logs = []
  const handler = createSpeechToTextHandler({
    getOpenId: () => 'openid-1',
    logger: { error(message, details) { logs.push({ message, details }) } },
    provider: {
      async transcribe(input) {
        providerInput = input
        return { text: '今天早餐吃了两个鸡蛋', durationMs: 3200 }
      }
    }
  })

  const success = await handler(validEvent)
  assert.deepStrictEqual(success, {
    success: true,
    text: '今天早餐吃了两个鸡蛋',
    durationMs: 3200
  })
  assert.deepStrictEqual(providerInput, validEvent)
  assert.deepStrictEqual(logs, [])

  const cases = [
    [{ ...validEvent, audioBase64: '' }, 'INVALID_AUDIO'],
    [{ ...validEvent, audioBase64: 'not-base64!' }, 'INVALID_AUDIO'],
    [{ ...validEvent, voiceFormat: 'wav' }, 'INVALID_FORMAT'],
    [{ ...validEvent, durationMs: 200 }, 'RECORDING_TOO_SHORT'],
    [{ ...validEvent, durationMs: 50000 }, 'RECORDING_TOO_LONG'],
    [{ ...validEvent, audioBase64: Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64') }, 'AUDIO_TOO_LARGE']
  ]

  for (const [event, code] of cases) {
    const result = await handler(event)
    assert.strictEqual(result.success, false)
    assert.strictEqual(result.error.code, code)
  }

  const unauthorized = createSpeechToTextHandler({
    getOpenId: () => '',
    logger: { error() {} },
    provider: { async transcribe() { throw new Error('must not run') } }
  })
  const unauthorizedResult = await unauthorized(validEvent)
  assert.strictEqual(unauthorizedResult.error.code, 'UNAUTHORIZED')

  const emptyResultHandler = createSpeechToTextHandler({
    getOpenId: () => 'openid-1',
    logger: { error() {} },
    provider: { async transcribe() { return { text: '  ' } } }
  })
  const emptyResult = await emptyResultHandler(validEvent)
  assert.strictEqual(emptyResult.error.code, 'EMPTY_TRANSCRIPT')
  assert.strictEqual(emptyResult.error.message, '没有识别到清晰语音，请再说一次')

  const realDurationTooLongHandler = createSpeechToTextHandler({
    getOpenId: () => 'openid-1',
    logger: { error() {} },
    provider: { async transcribe() { return { text: '很长的录音', durationMs: 46000 } } }
  })
  const realDurationTooLong = await realDurationTooLongHandler(validEvent)
  assert.strictEqual(realDurationTooLong.error.code, 'RECORDING_TOO_LONG')

  let failureLog
  const failedHandler = createSpeechToTextHandler({
    getOpenId: () => 'openid-1',
    logger: { error(message, details) { failureLog = { message, details } } },
    provider: {
      async transcribe() {
        const error = new Error('SecretKey private-value audio-data')
        error.code = 'TRANSCRIPTION_TIMEOUT'
        throw error
      }
    }
  })
  const failed = await failedHandler(validEvent)
  assert.deepStrictEqual(failed, {
    success: false,
    error: {
      code: 'TRANSCRIPTION_TIMEOUT',
      message: '语音转写超时，请稍后重试'
    }
  })
  assert.deepStrictEqual(failureLog, {
    message: 'speechToText failed',
    details: { code: 'TRANSCRIPTION_TIMEOUT' }
  })
  assert.ok(!JSON.stringify(failed).includes('private-value'))
  assert.ok(!JSON.stringify(failureLog).includes('audio-data'))

  console.log('speech to text handler tests passed')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
