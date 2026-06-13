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
  const requestedQueries = []
  const db = {
    collection(name) {
      assert.strictEqual(name, 'daily_records')
      return {
        where(query) {
          requestedQueries.push(query)
          return {
            limit(count) {
              assert.strictEqual(count, 1)
              return {
                async get() {
                  const document = documents.get(`${query._openid}_${query.date}`)
                  return { data: document ? [document] : [] }
                }
              }
            }
          }
        },
        doc(id) {
          return {
            async get() {
              throw new Error(`range should not read document directly: ${id}`)
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
  assert.strictEqual(requestedQueries.length, 3)
  assert.ok(requestedQueries.every((query) => query._openid === 'openid-1'))
  assert.strictEqual(dailyRecordId('openid-1', '2026-06-12'), 'openid-1_2026-06-12')
  console.log('daily records repository tests passed')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
