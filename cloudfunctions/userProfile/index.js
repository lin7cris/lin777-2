const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const action = event.action || 'get'
  const users = db.collection('users')

  if (!openid) {
    throw new Error('missing openid')
  }

  if (action === 'save') {
    const profile = event.profile || {}
    const existed = await users.where({ _openid: openid }).limit(1).get()
    const data = {
      ...profile,
      _openid: openid,
      updatedAt: db.serverDate()
    }

    if (existed.data && existed.data.length) {
      await users.doc(existed.data[0]._id).update({ data })
      return { saved: true, updated: true }
    }

    await users.add({
      data: {
        ...data,
        createdAt: db.serverDate()
      }
    })
    return { saved: true, created: true }
  }

  const result = await users.where({ _openid: openid }).limit(1).get()
  return {
    profile: result.data && result.data[0] ? result.data[0] : null
  }
}
