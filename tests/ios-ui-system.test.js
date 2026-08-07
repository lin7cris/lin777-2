const assert = require('assert')
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const appConfig = require(path.join(projectRoot, 'miniprogram/app.json'))
const appStyles = fs.readFileSync(path.join(projectRoot, 'miniprogram/app.wxss'), 'utf8')

assert.match(appStyles, /#f2f2f7/i)
assert.match(appStyles, /rgba\(255,\s*255,\s*255,\s*0\.9\d*\)/i)
assert.match(appStyles, /backdrop-filter:\s*blur\(/i)
assert.match(appStyles, /\.state-view\b/)
assert.match(appStyles, /\.skeleton\b/)
assert.match(appStyles, /button\[disabled\]/)

assert.strictEqual(appConfig.window.backgroundColor, '#F2F2F7')
assert.strictEqual(appConfig.tabBar.selectedColor, '#34C759')
