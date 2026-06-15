const assert = require('assert')
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const projectConfig = require(path.join(projectRoot, 'project.config.json'))
const privateConfigPath = path.join(projectRoot, 'project.private.config.json')
const privateConfig = fs.existsSync(privateConfigPath) ? require(privateConfigPath) : {}
const miniprogramRoot = path.resolve(projectRoot, projectConfig.miniprogramRoot || '')
const appConfig = require(path.join(miniprogramRoot, 'app.json'))
const requiredPageFiles = ['.js', '.json', '.wxml', '.wxss']

assert.strictEqual(projectConfig.compileType, 'miniprogram')
assert.strictEqual(projectConfig.miniprogramRoot, 'miniprogram/')
assert.strictEqual(appConfig.pages[0], 'pages/onboarding/onboarding')

const launchConditions = privateConfig.condition?.miniprogram?.list || []
for (const condition of launchConditions) {
  assert.ok(appConfig.pages.includes(condition.pathName), `unknown launch page: ${condition.pathName}`)
}

for (const pagePath of appConfig.pages) {
  for (const extension of requiredPageFiles) {
    const filePath = path.join(miniprogramRoot, `${pagePath}${extension}`)
    assert.ok(fs.existsSync(filePath), `missing page file: ${filePath}`)
  }
}

for (const item of appConfig.tabBar.list) {
  assert.ok(appConfig.pages.includes(item.pagePath), `unknown tabBar page: ${item.pagePath}`)

  for (const iconKey of ['iconPath', 'selectedIconPath']) {
    if (!item[iconKey]) continue
    const iconPath = path.join(miniprogramRoot, item[iconKey])
    assert.ok(fs.existsSync(iconPath), `missing tabBar icon: ${iconPath}`)
  }
}

const readme = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8')
assert.match(readme, /parseDailyInput/)
assert.match(readme, /dailyRecords/)
assert.match(readme, /userProfile/)
assert.match(readme, /daily_records/)
assert.match(readme, /所有用户不可读写/)
assert.doesNotMatch(readme, /上传并部署 `cloudfunctions\/parseRecord`/)

console.log('project entry tests passed')
