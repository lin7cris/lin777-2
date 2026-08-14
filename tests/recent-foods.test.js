const assert = require('assert')

const { buildRecentFoods } = require('../miniprogram/utils/recentFoods')

const records = [
  {
    date: '2026-08-12',
    foods: [
      { id: 'food-oats', name: '燕麦', amount: '40', unit: 'g', calories: 152, protein: 5, carbs: 27, fat: 3, createdAt: '2026-08-12T08:00:00.000Z' },
      { id: 'food-milk-latest', name: ' 牛奶 ', amount: '250ml', calories: 150, protein: 8, carbs: 12, fat: 8, createdAt: '2026-08-12T07:30:00.000Z' }
    ]
  },
  {
    date: '2026-08-11',
    foods: [
      { id: 'food-egg-1', name: '鸡蛋', amount: '2个', calories: 140, protein: 12, carbs: 2, fat: 10 },
      { id: 'food-milk-old', name: '牛 奶', amount: '200', unit: 'ml', calories: 120, protein: 6, carbs: 10, fat: 6 }
    ]
  },
  {
    date: '2026-08-10',
    foods: [
      { id: 'food-rice-1', name: '米饭', amount: '150', unit: 'g', calories: 174, protein: 4, carbs: 38, fat: 0.5 },
      { id: 'food-egg-2', name: '鸡蛋', amount: '1个', calories: 70, protein: 6, carbs: 1, fat: 5 }
    ]
  },
  {
    date: '2026-08-09',
    foods: [
      { id: 'food-rice-2', name: '米饭', amount: '200', unit: 'g', calories: 232, protein: 5, carbs: 51, fat: 0.7 },
      { id: 'food-egg-3', name: '鸡蛋', amount: '1个', calories: 70, protein: 6, carbs: 1, fat: 5 },
      { id: 'food-apple', name: '苹果', amount: '1个', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 }
    ]
  },
  {
    date: '2026-08-08',
    foods: [
      { id: 'food-yogurt', name: '酸奶', amount: '1杯', calories: 120, protein: 6, carbs: 15, fat: 4 },
      { id: 'food-invalid', name: '  ', amount: '1份', calories: 100 }
    ]
  }
]

const recentFoods = buildRecentFoods(records, { limit: 6, recentReserve: 2 })

assert.deepStrictEqual(
  recentFoods.map((food) => food.name),
  ['燕麦', '牛奶', '鸡蛋', '米饭', '苹果', '酸奶']
)
assert.strictEqual(recentFoods.length, 6)
assert.strictEqual(recentFoods[1].amount, '250ml')
assert.strictEqual(recentFoods[1].unit, 'ml')
assert.strictEqual(recentFoods[2].amount, '2个')
assert.strictEqual(recentFoods[2].unit, '个')
assert.strictEqual(recentFoods[2].id, undefined)
assert.strictEqual(recentFoods[2].createdAt, undefined)
assert.strictEqual(recentFoods[2].frequency, 3)

assert.deepStrictEqual(buildRecentFoods([], { limit: 6 }), [])
assert.deepStrictEqual(buildRecentFoods([{ date: '2026-08-12', foods: [] }]), [])

