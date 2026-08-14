function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function normalizeFoodKey(name) {
  return String(name || '')
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, '')
}

function inferUnit(amount) {
  const match = String(amount || '').trim().match(/(?:\d+(?:\.\d+)?)\s*(kg|千克|克|g|ml|毫升|l|升|个|只|枚|片|块|碗|杯|份|盘|盒|根|勺)$/i)
  return match ? match[1] : ''
}

function occurrenceTime(record, food, index) {
  const createdAt = Date.parse(String(food && food.createdAt || ''))
  if (Number.isFinite(createdAt)) return createdAt
  const recordTime = Date.parse(`${String(record && record.date || '')}T00:00:00.000Z`)
  return (Number.isFinite(recordTime) ? recordTime : 0) + index
}

function copyFood(food, frequency) {
  const amount = String(food && food.amount === undefined ? '' : food.amount).trim() || '适量'
  return {
    name: String(food && food.name || '').trim().replace(/\s+/g, ' '),
    amount,
    unit: String(food && food.unit || '').trim() || inferUnit(amount),
    meal: String(food && food.meal || '').trim() || '未知餐次',
    calories: toNumber(food && food.calories),
    protein: toNumber(food && food.protein),
    carbs: toNumber(food && food.carbs),
    fat: toNumber(food && food.fat),
    estimated: typeof (food && food.estimated) === 'boolean' ? food.estimated : true,
    frequency
  }
}

function buildRecentFoods(records, options) {
  const config = options || {}
  const limit = Math.max(1, Math.min(6, Number(config.limit) || 6))
  const reserveValue = Number(config.recentReserve)
  const recentReserve = Math.max(0, Math.min(limit, Number.isFinite(reserveValue) ? reserveValue : 2))
  const groups = new Map()

  ;(Array.isArray(records) ? records : []).forEach((record) => {
    ;(Array.isArray(record && record.foods) ? record.foods : []).forEach((food, index) => {
      const key = normalizeFoodKey(food && food.name)
      if (!key) return
      const timestamp = occurrenceTime(record, food, index)
      const current = groups.get(key)
      if (!current) {
        groups.set(key, { key, count: 1, latestAt: timestamp, latestFood: food })
        return
      }
      current.count += 1
      if (timestamp > current.latestAt) {
        current.latestAt = timestamp
        current.latestFood = food
      }
    })
  })

  const byRecent = Array.from(groups.values()).sort((left, right) => (
    right.latestAt - left.latestAt || left.key.localeCompare(right.key, 'zh-CN')
  ))
  const byFrequency = Array.from(groups.values()).sort((left, right) => (
    right.count - left.count || right.latestAt - left.latestAt || left.key.localeCompare(right.key, 'zh-CN')
  ))
  const selected = []
  const selectedKeys = new Set()

  function append(group) {
    if (!group || selectedKeys.has(group.key) || selected.length >= limit) return
    selectedKeys.add(group.key)
    selected.push(copyFood(group.latestFood, group.count))
  }

  byRecent.slice(0, recentReserve).forEach(append)
  byFrequency.forEach(append)
  return selected
}

module.exports = {
  buildRecentFoods,
  normalizeFoodKey
}
