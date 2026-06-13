function dailyRecordId(openid, date) {
  return `${openid}_${date}`
}

function dateKeysDescending(startDate, endDate) {
  const keys = []
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const cursor = new Date(`${endDate}T00:00:00.000Z`)
  while (cursor >= start) {
    keys.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return keys
}

function createDailyRecordsRepository(db) {
  const collection = db.collection('daily_records')
  async function findByDate(openid, date) {
    const result = await collection
      .where({ _openid: openid, date })
      .limit(1)
      .get()
    return result.data && result.data[0] ? result.data[0] : null
  }

  return {
    async get(openid, date) {
      return findByDate(openid, date)
    },

    async save(openid, date, record) {
      const data = { ...record, _openid: openid, date }
      delete data._id
      await collection.doc(dailyRecordId(openid, date)).set({ data })
      return { ...data, _id: dailyRecordId(openid, date) }
    },

    async range(openid, startDate, endDate) {
      const records = await Promise.all(
        dateKeysDescending(startDate, endDate).map((date) => findByDate(openid, date))
      )
      return records.filter(Boolean)
    }
  }
}

module.exports = {
  dailyRecordId,
  createDailyRecordsRepository
}
