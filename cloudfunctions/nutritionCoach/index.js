const cloud = require('wx-server-sdk')
const { createNutritionCoachHandler } = require('./handler')
const { createNutritionCoachRepository } = require('./repository')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const repository = createNutritionCoachRepository(db)

exports.main = createNutritionCoachHandler({
  repository,
  getOpenId: () => cloud.getWXContext().OPENID
})
