const cloud = require('wx-server-sdk')
const { createSpeechToTextHandler } = require('./handler')
const { createTencentAsrProvider } = require('./provider-tencent-asr')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = createSpeechToTextHandler({
  getOpenId() {
    return cloud.getWXContext().OPENID
  },
  provider: createTencentAsrProvider()
})

