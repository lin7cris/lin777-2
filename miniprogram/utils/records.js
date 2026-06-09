const STORAGE_KEYS = {
  profile: 'calorieProfile',
  records: 'calorieRecords'
}

const DEFAULT_PROFILE = {
  gender: 'female',
  age: 28,
  height: 165,
  weight: 62,
  targetWeight: 56,
  activityLevel: 'light',
  goal: 'fat_loss',
  targetCalories: 1540,
  macros: {
    protein: '90-110g',
    carbs: '154-193g',
    fat: '38-55g'
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

function friendlyDate(dateKey, todayKey, yesterdayKey) {
  if (dateKey === todayKey) return '今天'
  if (dateKey === yesterdayKey) return '昨天'
  const parts = dateKey.split('-')
  return `${Number(parts[1])} 月 ${Number(parts[2])} 日`
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
  buildSevenDayStats,
  formatDateKey
}
