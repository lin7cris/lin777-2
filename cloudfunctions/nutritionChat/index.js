const cloud = require('wx-server-sdk')
const { createNutritionChatHandler } = require('./handler')
const { createNutritionChatRepository } = require('./repository')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = createNutritionChatHandler({
  repository: createNutritionChatRepository(cloud.database()),
  getOpenId: () => cloud.getWXContext().OPENID
})
