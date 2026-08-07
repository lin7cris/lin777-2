const assert = require('assert')

const { createNutritionCoachRepository } = require('../cloudfunctions/nutritionCoach/repository')

async function run() {
  const queries = []
  const db = {
    collection(name) {
      return {
        where(criteria) {
          queries.push({ name, criteria })
          return {
            limit() {
              return { get: async () => ({ data: [] }) }
            }
          }
        }
      }
    }
  }

  const repository = createNutritionCoachRepository(db)
  await repository.getRecentRecords('openid-current-user', '2026-08-06', 7)

  const dates = queries
    .filter((query) => query.name === 'daily_records')
    .map((query) => query.criteria.date)
    .sort()

  assert.deepStrictEqual(dates, [
    '2026-07-30',
    '2026-07-31',
    '2026-08-01',
    '2026-08-02',
    '2026-08-03',
    '2026-08-04',
    '2026-08-05'
  ])
  queries.forEach((query) => {
    assert.strictEqual(query.criteria._openid, 'openid-current-user')
  })

}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
