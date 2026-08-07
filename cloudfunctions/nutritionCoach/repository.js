function formatDateKey(date) {
  const value = new Date(date)
  const pad = (number) => String(number).padStart(2, '0')
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`
}

function addDays(date, offset) {
  const value = new Date(`${date}T00:00:00.000Z`)
  value.setUTCDate(value.getUTCDate() + offset)
  return formatDateKey(value)
}

function createNutritionCoachRepository(db) {
  const users = db.collection('users')
  const records = db.collection('daily_records')

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
      const results = await Promise.all(Array.from({ length: days }, async (_, index) => {
        const dateKey = addDays(date, -(index + 1))
        return getDailyRecord(openid, dateKey)
      }))
      return results.filter(Boolean)
    }
  }
}

module.exports = {
  createNutritionCoachRepository
}
