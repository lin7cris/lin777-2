function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function nonNegativeNumber(value) {
  const number = finiteNumber(value)
  return number === null ? null : Math.max(0, number)
}

function sumFoods(record, field) {
  const foods = Array.isArray(record && record.foods) ? record.foods : []
  return foods.reduce((total, food) => total + (nonNegativeNumber(food && food[field]) || 0), 0)
}

function resolveIntake(record) {
  const total = nonNegativeNumber(record && record.totalCaloriesIn)
  return total === null ? sumFoods(record, 'calories') : total
}

function resolveProtein(record) {
  const total = nonNegativeNumber(record && record.totalProtein)
  return total === null ? sumFoods(record, 'protein') : total
}

function hasFoodRecord(record) {
  const foods = Array.isArray(record && record.foods) ? record.foods : []
  return foods.length > 0 || resolveIntake(record) > 0
}

function parseProteinTarget(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null
  const matches = String(value || '').match(/\d+(?:\.\d+)?/g)
  if (!matches || !matches.length) return null
  const target = Number(matches[0])
  return Number.isFinite(target) && target > 0 ? target : null
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function recentDateKeys(days, now) {
  const date = now || new Date()
  return Array.from({ length: days }, (_, index) => {
    const current = new Date(date)
    current.setDate(current.getDate() - index)
    return formatDateKey(current)
  })
}

function indexRecords(records) {
  return (Array.isArray(records) ? records : []).reduce((result, record) => {
    if (record && /^\d{4}-\d{2}-\d{2}$/.test(String(record.date || ''))) {
      result[record.date] = record
    }
    return result
  }, {})
}

function resolveCalorieDeficit(record, profile) {
  const stored = finiteNumber(record && record.calorieDeficit)
  if (stored !== null) return stored

  const recordTarget = nonNegativeNumber(record && record.targetCalories)
  const profileTarget = nonNegativeNumber(profile && profile.targetCalories)
  const targetCalories = recordTarget > 0 ? recordTarget : profileTarget
  if (!targetCalories) return null

  const caloriesOut = nonNegativeNumber(record && record.totalCaloriesOut) || 0
  return Math.round(targetCalories + caloriesOut - resolveIntake(record))
}

function buildStatisticsOverview(records, profile, now) {
  const recordsByDate = indexRecords(records)
  const days30 = recentDateKeys(30, now)
  const days7 = days30.slice(0, 7)
  const effectiveDates = days30.filter((dateKey) => hasFoodRecord(recordsByDate[dateKey]))
  const hasData = effectiveDates.length > 0

  if (!hasData) {
    return {
      hasData: false,
      averageIntake7Value: null,
      averageIntake7Text: '--',
      averageIntake30Value: null,
      averageIntake30Text: '--',
      calorieBalanceTitle: '平均热量缺口',
      averageCalorieBalanceValue: null,
      averageCalorieBalanceText: '--',
      proteinAchievementValue: null,
      proteinAchievementText: '--',
      streakDays: 0,
      streakText: '0天'
    }
  }

  const averageIntake7Value = Math.round(days7.reduce((total, dateKey) => {
    const record = recordsByDate[dateKey]
    return total + (hasFoodRecord(record) ? resolveIntake(record) : 0)
  }, 0) / 7)
  const averageIntake30Value = Math.round(days30.reduce((total, dateKey) => {
    const record = recordsByDate[dateKey]
    return total + (hasFoodRecord(record) ? resolveIntake(record) : 0)
  }, 0) / 30)

  let calorieBalanceAvailable = true
  const signedCalorieBalance = days7.reduce((total, dateKey) => {
    const record = recordsByDate[dateKey]
    if (!hasFoodRecord(record)) return total
    const deficit = resolveCalorieDeficit(record, profile)
    if (deficit === null) calorieBalanceAvailable = false
    return total + (deficit || 0)
  }, 0)
  const averageSignedBalance = calorieBalanceAvailable ? Math.round(signedCalorieBalance / 7) : null
  const isSurplus = averageSignedBalance !== null && averageSignedBalance < 0
  const averageCalorieBalanceValue = averageSignedBalance === null ? null : Math.abs(averageSignedBalance)

  const proteinTarget = parseProteinTarget(profile && profile.macros && profile.macros.protein)
  const achievedProteinDays = proteinTarget === null ? 0 : days7.filter((dateKey) => {
    const record = recordsByDate[dateKey]
    return hasFoodRecord(record) && resolveProtein(record) >= proteinTarget
  }).length
  const proteinAchievementValue = proteinTarget === null ? null : Math.round(achievedProteinDays / 7 * 100)

  let streakDays = 0
  for (const dateKey of days30) {
    if (!hasFoodRecord(recordsByDate[dateKey])) break
    streakDays += 1
  }

  return {
    hasData: true,
    averageIntake7Value,
    averageIntake7Text: String(averageIntake7Value),
    averageIntake30Value,
    averageIntake30Text: String(averageIntake30Value),
    calorieBalanceTitle: isSurplus ? '平均热量盈余' : '平均热量缺口',
    averageCalorieBalanceValue,
    averageCalorieBalanceText: averageCalorieBalanceValue === null ? '--' : String(averageCalorieBalanceValue),
    proteinAchievementValue,
    proteinAchievementText: proteinAchievementValue === null ? '--' : `${proteinAchievementValue}%`,
    streakDays,
    streakText: streakDays === 30 ? '30+天' : `${streakDays}天`
  }
}

module.exports = {
  buildStatisticsOverview,
  parseProteinTarget
}
