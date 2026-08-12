const { FoodImageError } = require('./errors')

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

function finiteNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function nonNegative(value, fallback) {
  return Math.max(0, finiteNumber(value, fallback))
}

function normalizeImageInput(input) {
  const source = input || {}
  const mimeType = String(source.mimeType || '').toLowerCase().trim()
  let imageBase64 = String(source.imageBase64 || '').trim()
  const prefix = imageBase64.match(/^data:([^;]+);base64,/i)
  if (prefix) {
    imageBase64 = imageBase64.slice(prefix[0].length)
  }

  if (!MIME_TYPES.has(mimeType) || !imageBase64 || !/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
    throw new FoodImageError('INVALID_IMAGE', 'invalid image input')
  }

  const decodedBytes = Math.floor((imageBase64.length * 3) / 4) - (imageBase64.endsWith('==') ? 2 : imageBase64.endsWith('=') ? 1 : 0)
  if (!decodedBytes || decodedBytes > MAX_IMAGE_BYTES) {
    throw new FoodImageError('INVALID_IMAGE', 'image is empty or too large')
  }

  return { imageBase64, mimeType }
}

function normalizeFoodResult(result) {
  const source = result || {}
  const foods = Array.isArray(source.foods) ? source.foods.reduce((items, item) => {
    const food = item || {}
    const name = String(food.name || '').trim()
    if (!name) return items
    items.push({
      name,
      amount: nonNegative(food.amount, 0),
      unit: String(food.unit || 'g').trim() || 'g',
      calories: nonNegative(food.calories, 0),
      protein: nonNegative(food.protein, 0),
      carbs: nonNegative(food.carbs, 0),
      fat: nonNegative(food.fat, 0),
      confidence: Math.min(1, Math.max(0, finiteNumber(food.confidence, 0.5))),
      estimated: true
    })
    return items
  }, []) : []

  return {
    foods,
    summary: String(source.summary || `识别到${foods.length}种食物`),
    warning: String(source.warning || '')
  }
}

module.exports = { MAX_IMAGE_BYTES, normalizeImageInput, normalizeFoodResult }
