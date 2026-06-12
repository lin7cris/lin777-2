function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function sum(items, field) {
  return items.reduce((total, item) => total + toNumber(item[field]), 0)
}

function emptyDailyRecord(date) {
  return {
    date,
    foods: [],
    exercises: [],
    sourceTexts: [],
    totalCaloriesIn: 0,
    totalCaloriesOut: 0,
    netCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0
  }
}

function recalculateTotals(record) {
  const foods = Array.isArray(record.foods) ? record.foods : []
  const exercises = Array.isArray(record.exercises) ? record.exercises : []
  const totalCaloriesIn = sum(foods, 'calories')
  const totalCaloriesOut = sum(exercises, 'calories')

  return {
    ...record,
    foods,
    exercises,
    totalCaloriesIn,
    totalCaloriesOut,
    netCalories: totalCaloriesIn - totalCaloriesOut,
    totalProtein: sum(foods, 'protein'),
    totalCarbs: sum(foods, 'carbs'),
    totalFat: sum(foods, 'fat')
  }
}

function normalizeItems(items, type, context) {
  const list = Array.isArray(items) ? items : []
  return list.map((item, index) => ({
    ...item,
    id: item.id || context.idGenerator(type, index),
    createdAt: item.createdAt || context.now
  }))
}

function mergeDailyRecord(existing, input, context) {
  const current = existing || emptyDailyRecord(context.date)
  const sourceText = String(input && input.sourceText || '').trim()
  const latestWeight = toNumber(input && input.weight) || toNumber(current.weight)
  const sourceTexts = Array.isArray(current.sourceTexts) ? current.sourceTexts.slice() : []
  if (sourceText) sourceTexts.push(sourceText)

  const merged = {
    ...current,
    _openid: context.openid,
    date: context.date,
    foods: (current.foods || []).concat(normalizeItems(input && input.foods, 'food', context)),
    exercises: (current.exercises || []).concat(normalizeItems(input && input.exercises, 'exercise', context)),
    sourceTexts,
    createdAt: current.createdAt || context.now,
    updatedAt: context.now
  }

  if (latestWeight > 0) merged.weight = latestWeight

  return recalculateTotals(merged)
}

function deleteDailyItem(existing, itemType, itemId, context) {
  const field = itemType === 'food' ? 'foods' : itemType === 'exercise' ? 'exercises' : ''
  if (!field) throw new Error('invalid item type')

  const items = Array.isArray(existing && existing[field]) ? existing[field] : []
  const filtered = items.filter((item) => item.id !== itemId)
  if (filtered.length === items.length) throw new Error('record item not found')

  return recalculateTotals({
    ...existing,
    [field]: filtered,
    updatedAt: context.now
  })
}

module.exports = {
  emptyDailyRecord,
  recalculateTotals,
  mergeDailyRecord,
  deleteDailyItem
}
