const cloud = require('wx-server-sdk')
const { createRecognizeFoodImageHandler } = require('./handler')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const handler = createRecognizeFoodImageHandler({ cloud })

exports.main = async (event) => handler(event)
