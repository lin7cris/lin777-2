const assert = require('assert')

const {
  normalizeFoodResult,
  normalizeImageInput
} = require('../cloudfunctions/recognizeFoodImage/schema')

const singleFood = normalizeFoodResult({
  foods: [{
    name: '米饭',
    amount: '150',
    unit: 'g',
    calories: '174',
    protein: '4',
    carbs: '38',
    fat: '0.5',
    confidence: '0.86'
  }],
  summary: '识别到1种食物',
  warning: ''
})

assert.deepStrictEqual(singleFood, {
  foods: [{
    name: '米饭',
    amount: 150,
    unit: 'g',
    calories: 174,
    protein: 4,
    carbs: 38,
    fat: 0.5,
    confidence: 0.86,
    estimated: true
  }],
  summary: '识别到1种食物',
  warning: ''
})

const multipleFoods = normalizeFoodResult({
  foods: [
    { name: '米饭', amount: 150, unit: 'g', calories: 174, protein: 4, carbs: 38, fat: 0.5, confidence: 0.9 },
    { name: '青菜', amount: 100, unit: 'g', calories: 45, protein: 2, carbs: 6, fat: 1, confidence: 0.62 }
  ]
})
assert.strictEqual(multipleFoods.foods.length, 2)
assert.strictEqual(multipleFoods.foods[1].estimated, true)
assert.strictEqual(multipleFoods.foods[1].confidence, 0.62)
assert.match(multipleFoods.summary, /2/)

assert.deepStrictEqual(normalizeFoodResult({
  foods: [],
  summary: '无法确认食物',
  warning: '请拍摄清晰的食物图片'
}), {
  foods: [],
  summary: '无法确认食物',
  warning: '请拍摄清晰的食物图片'
})

assert.deepStrictEqual(normalizeImageInput({
  imageBase64: 'data:image/jpeg;base64,QUJD',
  mimeType: 'image/jpeg'
}), {
  imageBase64: 'QUJD',
  mimeType: 'image/jpeg'
})

assert.throws(
  () => normalizeImageInput({ imageBase64: '', mimeType: 'image/jpeg' }),
  (error) => error.code === 'INVALID_IMAGE'
)
assert.throws(
  () => normalizeImageInput({ imageBase64: 'QUJD', mimeType: 'text/plain' }),
  (error) => error.code === 'INVALID_IMAGE'
)
