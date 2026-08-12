const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const todayWxml = fs.readFileSync(path.join(root, 'miniprogram/pages/today/today.wxml'), 'utf8')
const todayJs = fs.readFileSync(path.join(root, 'miniprogram/pages/today/today.js'), 'utf8')
const todayJson = require(path.join(root, 'miniprogram/pages/today/today.json'))
const appJson = require(path.join(root, 'miniprogram/app.json'))

assert.strictEqual(todayJson.usingComponents['daily-composer'], '/components/daily-composer/daily-composer')
assert.strictEqual(
  appJson.permission['scope.record'].desc,
  '用于将您说出的饮食和运动记录转换为可编辑文字'
)

const scrollClose = todayWxml.indexOf('</scroll-view>')
const dock = todayWxml.indexOf('class="input-dock"')
assert.ok(scrollClose >= 0 && dock > scrollClose, 'fixed composer must be outside scroll-view')
assert.match(todayWxml, /<daily-composer/)
assert.match(todayWxml, /bindvoicestart="startVoiceInput"/)
assert.match(todayWxml, /bindvoicestop="stopVoiceInput"/)
assert.match(todayWxml, /bindvoicecancel="cancelVoiceInput"/)
assert.match(todayWxml, /bindvoicecancelchange="onVoiceCancelChange"/)
assert.match(todayWxml, /bindcameratap="onCameraTap"/)

assert.match(todayJs, /require\('\.\.\/\.\.\/utils\/voiceRecorder'\)/)
assert.match(todayJs, /require\('\.\.\/\.\.\/utils\/voiceInput'\)/)
assert.match(todayJs, /createVoiceRecorder\(/)
assert.match(todayJs, /onVoiceTranscript\(text\)/)
assert.match(todayJs, /dailyInput:\s*appendTranscript\(this\.data\.dailyInput, text\)/)
assert.match(todayJs, /startVoiceInput\(\)/)
assert.match(todayJs, /stopVoiceInput\(\)/)
assert.match(todayJs, /cancelVoiceInput\(\)/)
assert.match(todayJs, /onHide\(\)/)
assert.match(todayJs, /onUnload\(\)/)
assert.match(todayJs, /recognizeFoodImage/)

const transcriptMethod = todayJs.slice(
  todayJs.indexOf('onVoiceTranscript(text)'),
  todayJs.indexOf('startVoiceInput()', todayJs.indexOf('onVoiceTranscript(text)'))
)
assert.doesNotMatch(transcriptMethod, /parseDailyInput/)
assert.doesNotMatch(transcriptMethod, /dailyRecords/)
