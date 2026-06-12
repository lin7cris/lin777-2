function dailyRecordId(openid, date) {
  return `${openid}_${date}`
}

function createDailyRecordsRepository(db) {
  const collection = db.collection('daily_records')

  return {
    async get(openid, date) {
      const result = await collection
        .where({ _openid: openid, date })
        .limit(1)
        .get()
      return result.data && result.data[0] ? result.data[0] : null
    },

    async save(openid, date, record) {
      const data = { ...record, _openid: openid, date }
      delete data._id
      await collection.doc(dailyRecordId(openid, date)).set({ data })
      return { ...data, _id: dailyRecordId(openid, date) }
    }
  }
}

module.exports = {
  dailyRecordId,
  createDailyRecordsRepository
}
