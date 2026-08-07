const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function listJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) return listJavaScriptFiles(file)
    return entry.name.endsWith('.js') ? [file] : []
  })
}

const frontendFiles = listJavaScriptFiles(path.join(root, 'miniprogram'))
for (const file of frontendFiles) {
  const source = fs.readFileSync(file, 'utf8')
  assert.doesNotMatch(source, /console\.(?:log|warn|error|info|debug)/)
  assert.doesNotMatch(source, /\.stack\b/)
}

const speechHandler = read('cloudfunctions/speechToText/handler.js')
const speechProvider = read('cloudfunctions/speechToText/provider-tencent-asr.js')
assert.doesNotMatch(speechHandler, /stack:/)
assert.doesNotMatch(speechHandler, /callerIdentity/)
assert.doesNotMatch(speechProvider, /callerIdentity|maskSecretId|secretKey: '\[set\]'/)

for (const file of [
  'cloudfunctions/dailyRecords/handler.js',
  'cloudfunctions/parseDailyInput/handler.js',
  'cloudfunctions/nutritionCoach/handler.js',
  'cloudfunctions/nutritionChat/handler.js'
]) {
  const source = read(file)
  assert.doesNotMatch(source, /stack:/)
  assert.match(source, /requestId/)
}

const chatRepository = read('cloudfunctions/nutritionChat/repository.js')
assert.match(chatRepository, /collection\('nutrition_chat_records'\)/)
assert.doesNotMatch(read('miniprogram/pages/nutritionChat/nutritionChat.js'), /collection\('nutrition_chat_records'\)/)
