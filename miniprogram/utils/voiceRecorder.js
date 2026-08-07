const {
  MIN_RECORDING_MS,
  MAX_RECORDING_MS,
  initialVoiceState,
  reduceVoiceState
} = require('./voiceInput')

const RECORD_OPTIONS = {
  duration: MAX_RECORDING_MS,
  sampleRate: 16000,
  numberOfChannels: 1,
  encodeBitRate: 48000,
  format: 'mp3'
}

function callbackPromise(register) {
  return new Promise((resolve, reject) => {
    register({ success: resolve, fail: reject })
  })
}

function createVoiceRecorder(options) {
  const config = options || {}
  const wxApi = config.wxApi || wx
  const onState = config.onState || (() => {})
  const onTranscript = config.onTranscript || (() => {})
  const onError = config.onError || (() => {})
  const onCancel = config.onCancel || (() => {})
  const now = config.now || (() => Date.now())
  const setTimer = config.setInterval || setInterval
  const clearTimer = config.clearInterval || clearInterval
  const manager = wxApi.getRecorderManager()
  const fileSystem = wxApi.getFileSystemManager()

  let state = initialVoiceState()
  let timer = null
  let startedAt = 0
  let cancelRequested = false
  let startCancelled = false
  let cancelSilently = false
  let destroyed = false

  function dispatch(action) {
    state = reduceVoiceState(state, action)
    if (!destroyed) onState({ ...state })
  }

  function stopTimer() {
    if (timer) clearTimer(timer)
    timer = null
  }

  function startTimer() {
    stopTimer()
    timer = setTimer(() => {
      dispatch({ type: 'TICK', durationMs: Math.min(MAX_RECORDING_MS, now() - startedAt) })
    }, 200)
    if (timer && typeof timer.unref === 'function') timer.unref()
  }

  function emitError(message, code) {
    if (destroyed) return
    dispatch({ type: 'FAIL', message })
    onError(message, code)
  }

  function transcriptionMessage(code) {
    const messages = {
      UNAUTHORIZED: '请重新进入小程序后再试',
      INVALID_AUDIO: '录音文件无效，请重新录制',
      INVALID_FORMAT: '暂不支持该录音格式',
      RECORDING_TOO_SHORT: '录音时间太短，请再说一次',
      RECORDING_TOO_LONG: '单次录音不能超过 45 秒',
      AUDIO_TOO_LARGE: '录音文件过大，请缩短录音时间',
      EMPTY_TRANSCRIPT: '没有识别到清晰语音，请再说一次',
      TRANSCRIPTION_TIMEOUT: '语音转写超时，请稍后重试'
    }
    return messages[code] || '语音转写失败，请稍后重试'
  }

  async function ensurePermission() {
    const setting = await callbackPromise((callbacks) => {
      wxApi.getSetting(callbacks)
    })
    const permission = setting && setting.authSetting && setting.authSetting['scope.record']
    if (permission === true) return true
    if (permission === false) return false

    try {
      await callbackPromise((callbacks) => {
        wxApi.authorize({ scope: 'scope.record', ...callbacks })
      })
      return true
    } catch (error) {
      return false
    }
  }

  function readBase64(filePath) {
    return callbackPromise((callbacks) => {
      fileSystem.readFile({ filePath, encoding: 'base64', ...callbacks })
    }).then((result) => String(result && result.data || ''))
  }

  function transcribe(audioBase64, durationMs) {
    return callbackPromise((callbacks) => {
      wxApi.cloud.callFunction({
        name: 'speechToText',
        data: { audioBase64, voiceFormat: 'mp3', durationMs },
        ...callbacks
      })
    })
  }

  function cleanup(filePath) {
    if (!filePath || !fileSystem || typeof fileSystem.unlink !== 'function') return Promise.resolve()
    return callbackPromise((callbacks) => {
      fileSystem.unlink({ filePath, ...callbacks })
    }).catch(() => {})
  }

  async function processRecording(result) {
    const filePath = String(result && result.tempFilePath || '')
    const durationMs = Number(result && result.duration) || Math.max(0, now() - startedAt)
    stopTimer()

    if (cancelRequested || destroyed) {
      cancelRequested = false
      await cleanup(filePath)
      dispatch({ type: 'CANCEL' })
      if (!destroyed && !cancelSilently) onCancel()
      cancelSilently = false
      return
    }

    if (durationMs < MIN_RECORDING_MS) {
      await cleanup(filePath)
      dispatch({ type: 'TOO_SHORT' })
      onError('录音时间太短，请再说一次', 'RECORDING_TOO_SHORT')
      return
    }

    dispatch({ type: 'TICK', durationMs })
    dispatch({ type: 'TRANSCRIBE' })
    try {
      const audioBase64 = await readBase64(filePath)
      if (destroyed) return
      const res = await transcribe(audioBase64, Math.min(durationMs, MAX_RECORDING_MS))
      if (destroyed) return
      const cloudResult = res && res.result || {}
      if (cloudResult.success === false) {
        const error = cloudResult.error || cloudResult
        const code = String(error.code || 'TRANSCRIPTION_FAILED')
        emitError(transcriptionMessage(code), code)
        return
      }

      const text = String(cloudResult.text || '').trim()
      if (!text) {
        emitError('没有识别到清晰语音，请再说一次', 'EMPTY_TRANSCRIPT')
        return
      }

      onTranscript(text)
      dispatch({ type: 'SUCCESS' })
    } catch (err) {
      emitError('语音转写失败，请稍后重试', 'NETWORK_ERROR')
    } finally {
      await cleanup(filePath)
    }
  }

  manager.onStart(() => {
    if (destroyed || startCancelled) {
      if (!destroyed) {
        cancelRequested = true
        cancelSilently = true
      }
      manager.stop()
      return
    }
    startedAt = now()
    dispatch({ type: 'START' })
    startTimer()
  })
  manager.onStop((result) => {
    if (destroyed) return
    processRecording(result)
  })
  manager.onError(() => {
    if (destroyed) return
    stopTimer()
    emitError('录音失败，请稍后重试', 'RECORDING_FAILED')
  })

  return {
    async start() {
      if (destroyed || state.status === 'recording' || state.status === 'transcribing') return false
      dispatch({ type: 'REQUEST_PERMISSION' })
      startCancelled = false
      try {
        const allowed = await ensurePermission()
        if (destroyed || startCancelled) {
          if (!destroyed) dispatch({ type: 'CANCEL' })
          return false
        }
        if (!allowed) {
          emitError('需要麦克风权限才能使用语音输入', 'PERMISSION_DENIED')
          return false
        }
        cancelRequested = false
        cancelSilently = false
        manager.start(RECORD_OPTIONS)
        return true
      } catch (error) {
        emitError('无法申请麦克风权限，请稍后重试', 'PERMISSION_ERROR')
        return false
      }
    },

    stop() {
      if (state.status === 'requestingPermission') {
        startCancelled = true
        cancelSilently = true
        dispatch({ type: 'CANCEL' })
        return
      }
      if (state.status !== 'recording') return
      manager.stop()
    },

    cancel() {
      if (state.status === 'requestingPermission') {
        startCancelled = true
        cancelSilently = true
        dispatch({ type: 'CANCEL' })
        return
      }
      if (state.status !== 'recording') return
      cancelRequested = true
      manager.stop()
    },

    markCancel(canceling) {
      if (state.status === 'recording') {
        dispatch({ type: 'MARK_CANCEL', canceling })
      }
    },

    openSettings() {
      return callbackPromise((callbacks) => wxApi.openSetting(callbacks))
    },

    reset() {
      dispatch({ type: 'RESET' })
    },

    destroy() {
      destroyed = true
      startCancelled = true
      stopTimer()
      if (state.status === 'recording') {
        cancelRequested = true
        manager.stop()
      }
    },

    getState() {
      return { ...state }
    }
  }
}

module.exports = {
  RECORD_OPTIONS,
  createVoiceRecorder
}
