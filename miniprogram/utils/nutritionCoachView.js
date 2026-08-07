function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function parseMacroRange(value, fallback) {
  const values = String(value || '').match(/\d+(?:\.\d+)?/g)
  if (!values || !values.length) return { lower: fallback, upper: fallback }
  return {
    lower: Number(values[0]),
    upper: Number(values[values.length - 1])
  }
}

function buildMacroStatus(key, value, range) {
  if (value < range.lower) return key === 'fat' ? '偏低' : '不足'
  if (value > range.upper) return '偏高'
  return '正常'
}

function buildCoachMacros(record, profile) {
  const data = record || {}
  const macroConfig = (profile && profile.macros) || {}
  const definitions = [
    { key: 'protein', name: '蛋白质', value: toNumber(data.totalProtein), range: parseMacroRange(macroConfig.protein, 100), tone: 'protein' },
    { key: 'carbs', name: '碳水', value: toNumber(data.totalCarbs), range: parseMacroRange(macroConfig.carbs, 180), tone: 'carbs' },
    { key: 'fat', name: '脂肪', value: toNumber(data.totalFat), range: parseMacroRange(macroConfig.fat, 50), tone: 'fat' }
  ]

  return definitions.map((item) => ({
    ...item,
    valueText: `${Math.round(item.value)} / ${item.range.upper}g`,
    percent: Math.min(100, Math.round(item.value / item.range.upper * 100)),
    status: buildMacroStatus(item.key, item.value, item.range)
  }))
}

function buildCoachSummary(record, profile) {
  const caloriesIn = toNumber(record && record.totalCaloriesIn)
  const caloriesOut = toNumber(record && record.totalCaloriesOut)
  const targetCalories = toNumber(record && record.targetCalories) || toNumber(profile && profile.targetCalories)
  const remainingCalories = Math.round(targetCalories + caloriesOut - caloriesIn)

  return {
    caloriesIn,
    caloriesOut,
    targetCalories,
    remainingCalories,
    completion: targetCalories > 0 ? Math.min(100, Math.round(caloriesIn / targetCalories * 100)) : 0
  }
}

module.exports = {
  buildCoachMacros,
  buildCoachSummary
}
