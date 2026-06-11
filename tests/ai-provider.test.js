const assert = require('assert')

const { normalizeAiResult } = require('../cloudfunctions/parseDailyInput/schema')
const { getProvider } = require('../cloudfunctions/parseDailyInput/providers')

const normalized = normalizeAiResult('早餐吃了鸡蛋，晚上跑步30分钟', {
  confidence: '0.82',
  foods: [{
    name: '鸡蛋',
    amount: '1个',
    meal: '早餐',
    calories: '70',
    protein: '6',
    fat: '5',
    carbs: '1',
    estimated: false
  }],
  exercises: [{
    name: '跑步',
    duration: '30',
    calories: '300'
  }]
})

assert.strictEqual(normalized.sourceText, '早餐吃了鸡蛋，晚上跑步30分钟')
assert.strictEqual(normalized.confidence, 0.82)
assert.deepStrictEqual(normalized.foods[0], {
  name: '鸡蛋',
  amount: '1个',
  meal: '早餐',
  calories: 70,
  protein: 6,
  fat: 5,
  carbs: 1,
  estimated: false
})
assert.deepStrictEqual(normalized.exercises[0], {
  name: '跑步',
  duration: 30,
  calories: 300,
  estimated: true
})
assert.deepStrictEqual(normalized.summary, {
  foodCalories: 70,
  exerciseCalories: 300,
  netCalories: -230,
  protein: 6,
  fat: 5,
  carbs: 1,
  estimated: true
})

assert.strictEqual(getProvider(undefined, { deepseek: { id: 'deepseek' } }).id, 'deepseek')
assert.strictEqual(getProvider('DEEPSEEK', { deepseek: { id: 'deepseek' } }).id, 'deepseek')
assert.throws(() => getProvider('unknown', {}), (error) => error.code === 'UNSUPPORTED_AI_PROVIDER')

async function verifyReservedProviders() {
  for (const name of ['openai', 'gemini', 'claude']) {
    const provider = getProvider(name)
    assert.strictEqual(typeof provider.parseDailyInput, 'function')
    await assert.rejects(
      () => provider.parseDailyInput({ text: '测试', profile: {} }),
      (error) => error.code === 'PROVIDER_NOT_IMPLEMENTED'
    )
  }

  console.log('ai provider tests passed')
}

verifyReservedProviders().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
