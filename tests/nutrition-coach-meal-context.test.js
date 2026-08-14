const assert = require('node:assert/strict')
const test = require('node:test')
const { buildMealContext } = require('../cloudfunctions/nutritionCoach/meal-context')

function foods(meals) {
  return meals.map((meal, index) => ({
    name: `${meal}食物${index + 1}`,
    meal,
    calories: 300
  }))
}

test('08:00 无记录显示今日饮食规划', () => {
  const result = buildMealContext({ foods: [], localTime: '2026-08-14 08:00' })
  assert.equal(result.mode, 'plan')
  assert.equal(result.title, '今日饮食规划')
})

test('09:30 只记录早餐显示午餐推荐和晚餐规划', () => {
  const result = buildMealContext({ foods: foods(['早餐']), localTime: '2026-08-14 09:30' })
  assert.equal(result.mode, 'next-meal')
  assert.equal(result.nextMeal, 'lunch')
  assert.equal(result.title, '午餐推荐')
  assert.equal(result.secondaryTitle, '晚餐规划')
})

test('11:30 早餐和午餐已记录显示晚餐推荐', () => {
  const result = buildMealContext({ foods: foods(['早餐', '午餐']), localTime: '2026-08-14 11:30' })
  assert.equal(result.nextMeal, 'dinner')
  assert.equal(result.title, '晚餐推荐')
  assert.equal(result.secondaryTitle, '')
})

test('13:30 只记录午餐直接显示晚餐推荐', () => {
  const result = buildMealContext({ foods: foods(['午餐']), localTime: '2026-08-14 13:30' })
  assert.equal(result.nextMeal, 'dinner')
  assert.equal(result.title, '晚餐推荐')
})

test('15:00 只记录早餐不机械推荐午餐，转为晚餐规划', () => {
  const result = buildMealContext({ foods: foods(['早餐']), localTime: '2026-08-14 15:00' })
  assert.equal(result.nextMeal, 'dinner')
  assert.equal(result.title, '晚餐规划')
})

test('21:00 已记录晚餐显示今日总结', () => {
  const result = buildMealContext({ foods: foods(['早餐', '午餐', '晚餐']), localTime: '2026-08-14 21:00' })
  assert.equal(result.mode, 'summary')
  assert.equal(result.title, '今日总结')
  assert.equal(result.nextMeal, '')
})

test('重新生成使用相同餐次上下文快照', () => {
  const input = { foods: foods(['早餐']), localTime: '2026-08-14 09:30' }
  const first = buildMealContext(input)
  const retry = buildMealContext(input)
  assert.deepEqual(retry, first)
})
