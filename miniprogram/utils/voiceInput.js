const MIN_RECORDING_MS = 800
const MAX_RECORDING_MS = 45000

function formatDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.floor((Number(durationMs) || 0) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function appendTranscript(currentText, transcript) {
  const current = String(currentText || '').trim()
  const next = String(transcript || '').trim()
  if (!next) return current
  if (!current) return next

  const separator = /[，。！？；,.!?]$/.test(current) ? '' : '，'
  return `${current}${separator}${next}`
}

function initialVoiceState() {
  return {
    status: 'idle',
    durationMs: 0,
    durationText: '0:00',
    canceling: false,
    error: ''
  }
}

function reduceVoiceState(state, action) {
  const current = state || initialVoiceState()
  const input = action || {}

  if (input.type === 'REQUEST_PERMISSION') {
    return { ...current, status: 'requestingPermission', error: '' }
  }
  if (input.type === 'START') {
    return { ...initialVoiceState(), status: 'recording' }
  }
  if (input.type === 'TICK') {
    const durationMs = Math.max(0, Number(input.durationMs) || 0)
    return { ...current, durationMs, durationText: formatDuration(durationMs) }
  }
  if (input.type === 'MARK_CANCEL') {
    return { ...current, canceling: input.canceling === true }
  }
  if (input.type === 'TRANSCRIBE') {
    return { ...current, status: 'transcribing', canceling: false, error: '' }
  }
  if (input.type === 'TOO_SHORT') {
    return { ...current, status: 'error', canceling: false, error: '录音时间太短，请再说一次' }
  }
  if (input.type === 'FAIL') {
    return {
      ...current,
      status: 'error',
      canceling: false,
      error: String(input.message || '语音转写失败，请稍后重试')
    }
  }
  if (input.type === 'SUCCESS' || input.type === 'CANCEL' || input.type === 'RESET') {
    return initialVoiceState()
  }

  return current
}

module.exports = {
  MIN_RECORDING_MS,
  MAX_RECORDING_MS,
  formatDuration,
  appendTranscript,
  initialVoiceState,
  reduceVoiceState
}
