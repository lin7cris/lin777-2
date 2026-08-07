function dateKey(date) {
  const value = new Date(date)
  const pad = (number) => String(number).padStart(2, '0')
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`
}

function previousDate(date, offset) {
  const value = new Date(`${date}T00:00:00.000Z`)
  value.setUTCDate(value.getUTCDate() - offset)
  return dateKey(value)
}

function createNutritionChatRepository(db) {
  const users = db.collection('users')
  const records = db.collection('daily_records')
  const chats = db.collection('nutrition_chat_records')

  async function getDailyRecord(openid, date) {
    const result = await records.where({ _openid: openid, date }).limit(1).get()
    return result.data && result.data[0] ? result.data[0] : null
  }

  return {
    async getProfile(openid) {
      const result = await users.where({ _openid: openid }).limit(1).get()
      return result.data && result.data[0] ? result.data[0] : null
    },
    getDailyRecord,
    async getRecentRecords(openid, date, days) {
      const items = await Promise.all(Array.from({ length: days }, (_, index) => getDailyRecord(openid, previousDate(date, index + 1))))
      return items.filter(Boolean)
    },
    async getRecentMessages(userId, limit) {
      const result = await chats.where({ userId }).orderBy('createTime', 'desc').limit(limit || 8).get()
      return (result.data || []).reverse().map((item) => ({
        ...item,
        message: item.content || item.message || ''
      }))
    },
    async saveMessage(message) {
      await chats.add({ data: message })
    }
  }
}

module.exports = { createNutritionChatRepository }
