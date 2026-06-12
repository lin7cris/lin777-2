const cloud = require('wx-server-sdk')
const { createDailyRecordsHandler } = require('./handler')
const { createDailyRecordsRepository } = require('./repository')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const repository = createDailyRecordsRepository(db)

exports.main = createDailyRecordsHandler({
  repository,
  getOpenId() {
    return cloud.getWXContext().OPENID
  }
})
