const STORAGE_KEYS = {
  profile: 'calorieProfile',
  records: 'calorieRecords',
  pendingParse: 'pendingDailyParse'
}

const DEFAULT_PROFILE = {
  gender: 'female',
  age: 28,
  height: 165,
  weight: 62,
  targetWeight: 56,
  activityLevel: 'light',
  goal: 'fat_loss',
  bmr: 1350,
  tdee: 1856,
  targetCalories: 1506,
  macros: {
    protein: '93-112g',
    carbs: '151-188g',
    fat: '37-54g'
  }
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function addDays(date, offset) {
  const next = new Date(date)
  next.setDate(next.getDate() + offset)
  return next
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function sum(items, field) {
  return items.reduce((total, item) => total + toNumber(item[field]), 0)
}

function upperRangeValue(value, fallback) {
  if (typeof value === 'number') return value
  const numbers = String(value || '').match(/\d+/g)
  if (!numbers || !numbers.length) return fallback
  return Number(numbers[numbers.length - 1])
}

function buildRecord(payload, now) {
  const date = now || new Date()
  const foods = Array.isArray(payload.foods) ? payload.foods : []
  const exercises = Array.isArray(payload.exercises) ? payload.exercises : []
  const foodCalories = sum(foods, 'calories')
  const exerciseCalories = sum(exercises, 'calories')

  return {
    id: `${formatDateKey(date)}-${date.getTime()}`,
    date: formatDateKey(date),
    createdAt: date.toISOString(),
    sourceText: payload.sourceText || '',
    confidence: toNumber(payload.confidence || 0.86),
    foods,
    exercises,
    totals: {
      foodCalories,
      exerciseCalories,
      netCalories: foodCalories - exerciseCalories,
      protein: sum(foods, 'protein'),
      carbs: sum(foods, 'carbs'),
      fat: sum(foods, 'fat')
    }
  }
}

function percent(current, target) {
  if (!target) return 0
  return Math.min(100, Math.round(current / target * 100))
}

function summarizeDay(entries, dateKey, options) {
  const dayEntries = entries.filter((entry) => entry.date === dateKey)
  const totals = dayEntries.reduce((memo, entry) => ({
    foodCalories: memo.foodCalories + toNumber(entry.totals && entry.totals.foodCalories),
    exerciseCalories: memo.exerciseCalories + toNumber(entry.totals && entry.totals.exerciseCalories),
    netCalories: memo.netCalories + toNumber(entry.totals && entry.totals.netCalories),
    protein: memo.protein + toNumber(entry.totals && entry.totals.protein),
    carbs: memo.carbs + toNumber(entry.totals && entry.totals.carbs),
    fat: memo.fat + toNumber(entry.totals && entry.totals.fat)
  }), {
    foodCalories: 0,
    exerciseCalories: 0,
    netCalories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  })
  const targetCalories = toNumber(options && options.targetCalories) || DEFAULT_PROFILE.targetCalories
  const macroTargets = (options && options.macroTargets) || {}
  const proteinTarget = upperRangeValue(macroTargets.protein, 100)
  const carbsTarget = upperRangeValue(macroTargets.carbs, 180)
  const fatTarget = upperRangeValue(macroTargets.fat, 50)

  return {
    dateKey,
    foodCalories: totals.foodCalories,
    exerciseCalories: totals.exerciseCalories,
    netCalories: totals.netCalories,
    remainingCalories: targetCalories - totals.netCalories,
    macros: [
      { name: '蛋白质', value: `${Math.round(totals.protein)} / ${proteinTarget}g`, percent: percent(totals.protein, proteinTarget), color: 'green' },
      { name: '碳水', value: `${Math.round(totals.carbs)} / ${carbsTarget}g`, percent: percent(totals.carbs, carbsTarget), color: 'amber' },
      { name: '脂肪', value: `${Math.round(totals.fat)} / ${fatTarget}g`, percent: percent(totals.fat, fatTarget), color: 'red' }
    ],
    records: buildVisibleRecords(dayEntries)
  }
}

function buildVisibleRecords(entries) {
  const visible = []
  entries.forEach((entry) => {
    if (entry.foods && entry.foods.length) {
      visible.push({
        title: '饮食',
        desc: entry.foods.map((food) => food.name).join('、'),
        calories: `${entry.totals.foodCalories} kcal`
      })
    }
    if (entry.exercises && entry.exercises.length) {
      visible.push({
        title: '运动',
        desc: entry.exercises.map((exercise) => `${exercise.name} ${exercise.duration || 0} 分钟`).join('、'),
        calories: `-${entry.totals.exerciseCalories} kcal`,
        type: 'exercise'
      })
    }
  })
  return visible
}

function buildDailyVisibleRecords(record) {
  const foods = Array.isArray(record && record.foods) ? record.foods : []
  const exercises = Array.isArray(record && record.exercises) ? record.exercises : []

  return foods.map((food) => ({
    id: food.id,
    itemType: 'food',
    title: food.name || '未命名食物',
    desc: food.amount || '适量',
    calories: `${toNumber(food.calories)} kcal`
  })).concat(exercises.map((exercise) => ({
    id: exercise.id,
    itemType: 'exercise',
    title: exercise.name || '未命名运动',
    desc: `${toNumber(exercise.duration)} 分钟`,
    calories: `-${toNumber(exercise.calories)} kcal`,
    type: 'exercise'
  })))
}

function summarizeDailyRecord(record, options) {
  const data = record || {}
  const foods = Array.isArray(data.foods) ? data.foods : []
  const exercises = Array.isArray(data.exercises) ? data.exercises : []
  const foodCalories = data.totalCaloriesIn === undefined ? sum(foods, 'calories') : toNumber(data.totalCaloriesIn)
  const exerciseCalories = data.totalCaloriesOut === undefined ? sum(exercises, 'calories') : toNumber(data.totalCaloriesOut)
  const netCalories = data.netCalories === undefined ? foodCalories - exerciseCalories : toNumber(data.netCalories)
  const protein = data.totalProtein === undefined ? sum(foods, 'protein') : toNumber(data.totalProtein)
  const carbs = data.totalCarbs === undefined ? sum(foods, 'carbs') : toNumber(data.totalCarbs)
  const fat = data.totalFat === undefined ? sum(foods, 'fat') : toNumber(data.totalFat)
  const targetCalories = toNumber(options && options.targetCalories) || DEFAULT_PROFILE.targetCalories
  const macroTargets = (options && options.macroTargets) || {}
  const proteinTarget = upperRangeValue(macroTargets.protein, 100)
  const carbsTarget = upperRangeValue(macroTargets.carbs, 180)
  const fatTarget = upperRangeValue(macroTargets.fat, 50)

  return {
    foodCalories,
    exerciseCalories,
    netCalories,
    remainingCalories: targetCalories - netCalories,
    macros: [
      { name: '蛋白质', value: `${Math.round(protein)} / ${proteinTarget}g`, percent: percent(protein, proteinTarget), color: 'green' },
      { name: '碳水', value: `${Math.round(carbs)} / ${carbsTarget}g`, percent: percent(carbs, carbsTarget), color: 'amber' },
      { name: '脂肪', value: `${Math.round(fat)} / ${fatTarget}g`, percent: percent(fat, fatTarget), color: 'red' }
    ],
    records: buildDailyVisibleRecords(data)
  }
}

function friendlyDate(dateKey, todayKey, yesterdayKey) {
  if (dateKey === todayKey) return '今天'
  if (dateKey === yesterdayKey) return '昨天'
  const parts = dateKey.split('-')
  return `${Number(parts[1])} 月 ${Number(parts[2])} 日`
}

function displayDate(dateKey) {
  const parts = String(dateKey || '').split('-')
  if (parts.length !== 3) return dateKey || ''
  return `${Number(parts[1])} 月 ${Number(parts[2])} 日`
}

function buildHistoryRecord(record) {
  const data = record || {}
  const foods = Array.isArray(data.foods) ? data.foods : []
  const exercises = Array.isArray(data.exercises) ? data.exercises : []

  return {
    dateKey: data.date || '',
    date: displayDate(data.date),
    foods: foods.map((food) => ({
      ...food,
      amountText: food.amount || '适量',
      caloriesText: `${toNumber(food.calories)} kcal`
    })),
    exercises: exercises.map((exercise) => ({
      ...exercise,
      durationText: `${toNumber(exercise.duration)} 分钟`,
      caloriesText: `-${toNumber(exercise.calories)} kcal`
    })),
    totalCaloriesIn: toNumber(data.totalCaloriesIn),
    totalCaloriesOut: toNumber(data.totalCaloriesOut),
    netCalories: toNumber(data.netCalories),
    weightText: toNumber(data.weight) > 0 ? `${toNumber(data.weight)} kg` : '--'
  }
}

function dateRangeForDays(days, now) {
  const count = days === 30 ? 30 : 7
  const end = now || new Date()
  return {
    startDate: formatDateKey(addDays(end, -(count - 1))),
    endDate: formatDateKey(end)
  }
}

function chartMetric(recordsByDate, dayKeys, field, options) {
  const config = options || {}
  const values = dayKeys.map((dateKey) => {
    const record = recordsByDate[dateKey]
    const value = record ? toNumber(record[field]) : 0
    return {
      dateKey,
      value,
      hasValue: Boolean(record) && (field !== 'weight' || value > 0)
    }
  })
  const usableValues = values.filter((item) => item.hasValue).map((item) => item.value)
  const maxValue = Math.max(1, ...usableValues.map((value) => Math.abs(value)))
  const labelStep = dayKeys.length === 30 ? 5 : 1

  return {
    hasData: usableValues.length > 0,
    unit: config.unit || 'kcal',
    points: values.map((item, index) => ({
      ...item,
      height: item.hasValue ? Math.max(12, Math.round(Math.abs(item.value) / maxValue * 180)) : 4,
      label: displayDate(item.dateKey).replace(' 月 ', '/').replace(' 日', ''),
      showLabel: index % labelStep === 0 || index === dayKeys.length - 1,
      negative: item.value < 0,
      valueText: item.hasValue ? `${item.value}${config.suffix || ''}` : '--'
    }))
  }
}

function buildTrendStats(records, days, now) {
  const range = dateRangeForDays(days, now)
  const dayKeys = []
  const end = now || new Date()
  const count = days === 30 ? 30 : 7
  const recordsByDate = {}
  ;(Array.isArray(records) ? records : []).forEach((record) => {
    if (record && record.date) recordsByDate[record.date] = record
  })

  for (let offset = -(count - 1); offset <= 0; offset += 1) {
    dayKeys.push(formatDateKey(addDays(end, offset)))
  }

  return {
    ...range,
    days: count,
    hasData: Object.keys(recordsByDate).length > 0,
    intake: chartMetric(recordsByDate, dayKeys, 'totalCaloriesIn'),
    exercise: chartMetric(recordsByDate, dayKeys, 'totalCaloriesOut'),
    net: chartMetric(recordsByDate, dayKeys, 'netCalories'),
    weight: chartMetric(recordsByDate, dayKeys, 'weight', { unit: 'kg', suffix: ' kg' })
  }
}

function buildSevenDayStats(entries, now, targetCalories) {
  const date = now || new Date()
  const todayKey = formatDateKey(date)
  const yesterdayKey = formatDateKey(addDays(date, -1))
  const days = []
  const bars = []
  const dayKeys = []

  for (let offset = -6; offset <= 0; offset += 1) {
    dayKeys.push(formatDateKey(addDays(date, offset)))
  }

  const netByDay = dayKeys.map((dateKey) => summarizeDay(entries, dateKey, { targetCalories }).netCalories)
  const maxNet = Math.max(1, ...netByDay.map((value) => Math.abs(value)))
  const weekLabels = ['日', '一', '二', '三', '四', '五', '六']

  dayKeys.forEach((dateKey, index) => {
    const dayDate = addDays(date, index - 6)
    bars.push({
      day: weekLabels[dayDate.getDay()],
      height: Math.max(32, Math.round(Math.abs(netByDay[index]) / maxNet * 240)),
      active: dateKey === todayKey
    })
  })

  dayKeys.slice().reverse().forEach((dateKey) => {
    const summary = summarizeDay(entries, dateKey, { targetCalories })
    const delta = targetCalories - summary.netCalories
    days.push({
      date: friendlyDate(dateKey, todayKey, yesterdayKey),
      net: `净摄入 ${summary.netCalories} kcal`,
      delta: delta >= 0 ? `低于目标 ${delta}` : `高于目标 ${Math.abs(delta)}`,
      warning: delta < 0
    })
  })

  const average = Math.round(netByDay.reduce((total, value) => total + value, 0) / netByDay.length)

  return {
    bars,
    days,
    averageText: `平均 ${average} kcal`
  }
}

module.exports = {
  STORAGE_KEYS,
  DEFAULT_PROFILE,
  buildRecord,
  summarizeDay,
  summarizeDailyRecord,
  buildHistoryRecord,
  buildTrendStats,
  dateRangeForDays,
  buildSevenDayStats,
  formatDateKey
}
