const assert = require('assert')

const { createVoiceRecorder, RECORD_OPTIONS } = require('../miniprogram/utils/voiceRecorder')

function flush() {
  return new Promise((resolve) => setImmediate(resolve))
}

function createHarness(options) {
  const config = options || {}
  const handlers = {}
  const calls = {
    starts: [],
    stopCount: 0,
    cloud: [],
    unlinked: [],
    states: [],
    transcripts: [],
    errors: [],
    cancelled: 0
  }
  const manager = {
    onStart(callback) { handlers.start = callback },
    onStop(callback) { handlers.stop = callback },
    onError(callback) { handlers.error = callback },
    start(recordOptions) {
      calls.starts.push(recordOptions)
      handlers.start()
    },
    stop() {
      calls.stopCount += 1
      handlers.stop({
        duration: config.duration === undefined ? 3200 : config.duration,
        tempFilePath: 'wxfile://voice.mp3'
      })
    }
  }
  const fileSystem = {
    readFile({ success }) {
      if (config.deferRead) {
        calls.resolveRead = () => success({ data: Buffer.from('voice-data').toString('base64') })
        return
      }
      success({ data: Buffer.from('voice-data').toString('base64') })
    },
    unlink({ filePath, success }) {
      calls.unlinked.push(filePath)
      success()
    }
  }
  const wxApi = {
    getRecorderManager() { return manager },
    getFileSystemManager() { return fileSystem },
    getSetting({ success }) {
      success({ authSetting: { 'scope.record': config.permission } })
    },
    authorize({ success, fail }) {
      if (config.authorizeDenied) fail({ errMsg: 'authorize:fail auth deny' })
      else if (config.deferAuthorize) calls.resolveAuthorize = success
      else success()
    },
    openSetting({ success }) { success({}) },
    cloud: {
      callFunction({ name, data, success, fail }) {
        calls.cloud.push({ name, data })
        if (config.deferCloud) {
          calls.resolveCloud = () => success({
            result: config.cloudResult || { success: true, text: '今天早餐吃了两个鸡蛋' }
          })
          return
        }
        if (config.cloudFailure) fail({ errMsg: 'network fail' })
        else success({ result: config.cloudResult || { success: true, text: '今天早餐吃了两个鸡蛋' } })
      }
    }
  }

  const recorder = createVoiceRecorder({
    wxApi,
    onState(state) { calls.states.push(state) },
    onTranscript(text) { calls.transcripts.push(text) },
    onError(message, code) { calls.errors.push({ message, code }) },
    onCancel() { calls.cancelled += 1 }
  })

  return { recorder, calls, handlers }
}

async function run() {
  const success = createHarness({ permission: true })
  await success.recorder.start()
  assert.deepStrictEqual(success.calls.starts[0], RECORD_OPTIONS)
  assert.strictEqual(success.calls.states.at(-1).status, 'recording')

  success.recorder.stop()
  await flush()
  await flush()
  assert.strictEqual(success.calls.cloud.length, 1)
  assert.strictEqual(success.calls.cloud[0].name, 'speechToText')
  assert.deepStrictEqual(success.calls.cloud[0].data, {
    audioBase64: Buffer.from('voice-data').toString('base64'),
    voiceFormat: 'mp3',
    durationMs: 3200
  })
  assert.deepStrictEqual(success.calls.transcripts, ['今天早餐吃了两个鸡蛋'])
  assert.deepStrictEqual(success.calls.unlinked, ['wxfile://voice.mp3'])
  assert.strictEqual(success.calls.states.at(-1).status, 'idle')

  const asksPermission = createHarness({ permission: undefined })
  await asksPermission.recorder.start()
  assert.strictEqual(asksPermission.calls.starts.length, 1)
  asksPermission.recorder.destroy()

  const cancelledWhileAuthorizing = createHarness({ permission: undefined, deferAuthorize: true })
  const pendingStart = cancelledWhileAuthorizing.recorder.start()
  await flush()
  assert.strictEqual(cancelledWhileAuthorizing.calls.states.at(-1).status, 'requestingPermission')
  cancelledWhileAuthorizing.recorder.stop()
  cancelledWhileAuthorizing.calls.resolveAuthorize()
  assert.strictEqual(await pendingStart, false)
  assert.strictEqual(cancelledWhileAuthorizing.calls.starts.length, 0)
  assert.strictEqual(cancelledWhileAuthorizing.calls.states.at(-1).status, 'idle')

  const denied = createHarness({ permission: false, authorizeDenied: true })
  await denied.recorder.start()
  assert.strictEqual(denied.calls.starts.length, 0)
  assert.deepStrictEqual(denied.calls.errors.at(-1), {
    message: '需要麦克风权限才能使用语音输入',
    code: 'PERMISSION_DENIED'
  })

  const tooShort = createHarness({ permission: true, duration: 300 })
  await tooShort.recorder.start()
  tooShort.recorder.stop()
  await flush()
  assert.strictEqual(tooShort.calls.cloud.length, 0)
  assert.deepStrictEqual(tooShort.calls.errors.at(-1), {
    message: '录音时间太短，请再说一次',
    code: 'RECORDING_TOO_SHORT'
  })
  assert.deepStrictEqual(tooShort.calls.unlinked, ['wxfile://voice.mp3'])

  const cancelled = createHarness({ permission: true })
  await cancelled.recorder.start()
  cancelled.recorder.cancel()
  await flush()
  assert.strictEqual(cancelled.calls.cloud.length, 0)
  assert.strictEqual(cancelled.calls.cancelled, 1)
  assert.deepStrictEqual(cancelled.calls.unlinked, ['wxfile://voice.mp3'])

  const cloudFailed = createHarness({ permission: true, cloudFailure: true })
  await cloudFailed.recorder.start()
  cloudFailed.recorder.stop()
  await flush()
  await flush()
  assert.strictEqual(cloudFailed.calls.transcripts.length, 0)
  assert.deepStrictEqual(cloudFailed.calls.errors.at(-1), {
    message: '语音转写失败，请稍后重试',
    code: 'NETWORK_ERROR'
  })

  const functionFailed = createHarness({
    permission: true,
    cloudResult: {
      success: false,
      code: 'EMPTY_TRANSCRIPT',
      message: '没有识别到清晰语音，请再说一次'
    }
  })
  await functionFailed.recorder.start()
  functionFailed.recorder.stop()
  await flush()
  await flush()
  assert.deepStrictEqual(functionFailed.calls.errors.at(-1), {
    message: '没有识别到清晰语音，请再说一次',
    code: 'EMPTY_TRANSCRIPT'
  })

  const destroyed = createHarness({ permission: true })
  await destroyed.recorder.start()
  destroyed.recorder.destroy()
  assert.strictEqual(destroyed.calls.stopCount, 1)

  const destroyedWhileTranscribing = createHarness({ permission: true, deferCloud: true })
  await destroyedWhileTranscribing.recorder.start()
  destroyedWhileTranscribing.recorder.stop()
  await flush()
  assert.strictEqual(destroyedWhileTranscribing.calls.states.at(-1).status, 'transcribing')
  destroyedWhileTranscribing.recorder.destroy()
  destroyedWhileTranscribing.calls.resolveCloud()
  await flush()
  await flush()
  assert.strictEqual(destroyedWhileTranscribing.calls.transcripts.length, 0)
  assert.strictEqual(destroyedWhileTranscribing.calls.errors.length, 0)

  const destroyedWhileReading = createHarness({ permission: true, deferRead: true })
  await destroyedWhileReading.recorder.start()
  destroyedWhileReading.recorder.stop()
  await flush()
  destroyedWhileReading.recorder.destroy()
  destroyedWhileReading.calls.resolveRead()
  await flush()
  await flush()
  assert.strictEqual(destroyedWhileReading.calls.cloud.length, 0)
  assert.deepStrictEqual(destroyedWhileReading.calls.unlinked, ['wxfile://voice.mp3'])

  const callbacksAfterDestroy = createHarness({ permission: true })
  callbacksAfterDestroy.recorder.destroy()
  const stateCount = callbacksAfterDestroy.calls.states.length
  callbacksAfterDestroy.handlers.start()
  callbacksAfterDestroy.handlers.stop({ duration: 3200, tempFilePath: 'wxfile://other.mp3' })
  callbacksAfterDestroy.handlers.error({ errMsg: 'late error' })
  await flush()
  assert.strictEqual(callbacksAfterDestroy.calls.states.length, stateCount)
  assert.deepStrictEqual(callbacksAfterDestroy.calls.unlinked, [])
  assert.deepStrictEqual(callbacksAfterDestroy.calls.errors, [])

}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
