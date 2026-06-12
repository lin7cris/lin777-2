const assert = require('assert')

const { createDailyRecordsHandler } = require('../cloudfunctions/dailyRecords/handler')

async function run() {
  const documents = new Map()
  const calls = []
  const repository = {
    async get(openid, date) {
      calls.push(['get', openid, date])
      return documents.get(`${openid}:${date}`) || null
    },
    async save(openid, date, record) {
      calls.push(['save', openid, date])
      documents.set(`${openid}:${date}`, record)
      return record
    }
  }

  const handler = createDailyRecordsHandler({
    repository,
    getOpenId: () => 'trusted-openid',
    now: () => new Date('2026-06-12T02:00:00.000Z'),
    idGenerator: (type, index) => `${type}-${index + 1}`,
    logger: { error() {} }
  })

  const saved = await handler({
    action: 'save',
    date: '2026-06-12',
    openid: 'forged-openid',
    sourceText: '吃了一个苹果',
    foods: [{ name: '苹果', calories: 95 }],
    exercises: []
  })
  assert.strictEqual(saved.success, true)
  assert.strictEqual(saved.record._openid, 'trusted-openid')
  assert.strictEqual(saved.record.totalCaloriesIn, 95)

  const appended = await handler({
    action: 'save',
    date: '2026-06-12',
    foods: [],
    exercises: [{ name: '跑步', duration: 20, calories: 180 }]
  })
  assert.strictEqual(appended.record.foods.length, 1)
  assert.strictEqual(appended.record.exercises.length, 1)
  assert.strictEqual(appended.record.netCalories, -85)

  const fetched = await handler({ action: 'get', date: '2026-06-12' })
  assert.strictEqual(fetched.success, true)
  assert.strictEqual(fetched.record.foods[0].name, '苹果')

  const removed = await handler({
    action: 'delete',
    date: '2026-06-12',
    itemType: 'food',
    itemId: 'food-1'
  })
  assert.strictEqual(removed.success, true)
  assert.strictEqual(removed.record.foods.length, 0)
  assert.strictEqual(removed.record.totalCaloriesIn, 0)
  assert.strictEqual(removed.record.netCalories, -180)

  const empty = await handler({ action: 'get', date: '2026-06-13' })
  assert.strictEqual(empty.success, true)
  assert.strictEqual(empty.record.date, '2026-06-13')
  assert.deepStrictEqual(empty.record.foods, [])

  const invalidDate = await handler({ action: 'get', date: 'June 12' })
  assert.strictEqual(invalidDate.success, false)
  assert.strictEqual(invalidDate.error.code, 'INVALID_INPUT')

  const missingOpenIdHandler = createDailyRecordsHandler({
    repository,
    getOpenId: () => '',
    logger: { error() {} }
  })
  const missingOpenId = await missingOpenIdHandler({ action: 'get', date: '2026-06-12' })
  assert.strictEqual(missingOpenId.success, false)
  assert.strictEqual(missingOpenId.error.code, 'UNAUTHORIZED')

  assert.ok(calls.every((call) => call[1] === 'trusted-openid'))
  console.log('daily records handler tests passed')
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
