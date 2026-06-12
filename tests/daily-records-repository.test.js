const assert = require('assert')

const {
  dailyRecordId,
  createDailyRecordsRepository
} = require('../cloudfunctions/dailyRecords/repository')

async function run() {
  const documents = new Map([
    ['openid-1_2026-06-10', { _id: 'one', _openid: 'openid-1', date: '2026-06-10' }],
    ['openid-1_2026-06-12', { _id: 'two', _openid: 'openid-1', date: '2026-06-12' }],
    ['openid-2_2026-06-11', { _id: 'other', _openid: 'openid-2', date: '2026-06-11' }]
  ])
  const requestedIds = []
  const db = {
    collection(name) {
      assert.strictEqual(name, 'daily_records')
      return {
        doc(id) {
          return {
            async get() {
              requestedIds.push(id)
              if (!documents.has(id)) {
                const error = new Error('document not found')
                error.code = 'DATABASE_DOCUMENT_NOT_EXIST'
                throw error
              }
              return { data: documents.get(id) }
            },
            async set() {}
          }
        }
      }
    }
  }

  const repository = createDailyRecordsRepository(db)
  const records = await repository.range('openid-1', '2026-06-10', '2026-06-12')

  assert.deepStrictEqual(records.map((record) => record.date), ['2026-06-12', '2026-06-10'])
  assert.ok(requestedIds.every((id) => id.startsWith('openid-1_')))
  assert.strictEqual(dailyRecordId('openid-1', '2026-06-12'), 'openid-1_2026-06-12')
  console.log('daily records repository tests passed')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
