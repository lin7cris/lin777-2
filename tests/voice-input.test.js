const assert = require('assert')

const {
  MIN_RECORDING_MS,
  MAX_RECORDING_MS,
  formatDuration,
  appendTranscript,
  initialVoiceState,
  reduceVoiceState
} = require('../miniprogram/utils/voiceInput')

assert.strictEqual(MIN_RECORDING_MS, 800)
assert.strictEqual(MAX_RECORDING_MS, 45000)
assert.strictEqual(formatDuration(0), '0:00')
assert.strictEqual(formatDuration(12340), '0:12')
assert.strictEqual(formatDuration(45000), '0:45')

assert.strictEqual(appendTranscript('', '早餐吃了鸡蛋'), '早餐吃了鸡蛋')
assert.strictEqual(appendTranscript('早餐吃了鸡蛋', '中午吃了米饭'), '早餐吃了鸡蛋，中午吃了米饭')
assert.strictEqual(appendTranscript('早餐吃了鸡蛋。', '中午吃了米饭'), '早餐吃了鸡蛋。中午吃了米饭')
assert.strictEqual(appendTranscript('已有内容', '  '), '已有内容')

const idle = initialVoiceState()
assert.deepStrictEqual(idle, {
  status: 'idle',
  durationMs: 0,
  durationText: '0:00',
  canceling: false,
  error: ''
})

const requesting = reduceVoiceState(idle, { type: 'REQUEST_PERMISSION' })
assert.strictEqual(requesting.status, 'requestingPermission')

const recording = reduceVoiceState(requesting, { type: 'START' })
assert.strictEqual(recording.status, 'recording')

const ticking = reduceVoiceState(recording, { type: 'TICK', durationMs: 12340 })
assert.strictEqual(ticking.durationMs, 12340)
assert.strictEqual(ticking.durationText, '0:12')

const canceling = reduceVoiceState(ticking, { type: 'MARK_CANCEL', canceling: true })
assert.strictEqual(canceling.canceling, true)

const transcribing = reduceVoiceState(ticking, { type: 'TRANSCRIBE' })
assert.strictEqual(transcribing.status, 'transcribing')
assert.strictEqual(transcribing.durationMs, 12340)

const succeeded = reduceVoiceState(transcribing, { type: 'SUCCESS' })
assert.deepStrictEqual(succeeded, initialVoiceState())

const tooShort = reduceVoiceState(recording, { type: 'TOO_SHORT' })
assert.strictEqual(tooShort.status, 'error')
assert.strictEqual(tooShort.error, '录音时间太短，请再说一次')

const failed = reduceVoiceState(transcribing, { type: 'FAIL', message: '语音转写超时，请稍后重试' })
assert.strictEqual(failed.status, 'error')
assert.strictEqual(failed.error, '语音转写超时，请稍后重试')

const cancelled = reduceVoiceState(canceling, { type: 'CANCEL' })
assert.deepStrictEqual(cancelled, initialVoiceState())

console.log('voice input tests passed')
