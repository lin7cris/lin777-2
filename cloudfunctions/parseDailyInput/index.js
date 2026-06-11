const cloud = require('wx-server-sdk')
const { createParseDailyInputHandler } = require('./handler')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数是前端唯一的 AI 入口，Provider 由 AI_PROVIDER 环境变量选择。
exports.main = createParseDailyInputHandler()
