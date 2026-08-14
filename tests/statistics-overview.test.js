const assert = require('node:assert/strict')
const test = require('node:test')

const {
  buildStatisticsOverview,
  parseProteinTarget
} = require('../miniprogram/utils/statisticsOverview')

const now = new Date('2026-08-12T12:00:00+08:00')
const profile = {
  targetCalories: 1800,
  macros: { protein: '120-150g' }
}

function record(date, values) {
  const data = values || {}
  return {
    date,
    foods: data.foods === undefined ? [{ name: '测试餐' }] : data.foods,
    totalCaloriesIn: data.totalCaloriesIn,
    totalCaloriesOut: data.totalCaloriesOut === undefined ? 0 : data.totalCaloriesOut,
    calorieDeficit: data.calorieDeficit,
    totalProtein: data.totalProtein,
    targetCalories: data.targetCalories === undefined ? 1800 : data.targetCalories
  }
}

function recentDates(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now)
    date.setDate(date.getDate() - index)
    return date.toISOString().slice(0, 10)
  })
}

test('完整 7 天数据固定除以 7', () => {
  const records = recentDates(7).map((date) => record(date, {
    totalCaloriesIn: 1400,
    calorieDeficit: 400,
    totalProtein: 120
  }))
  const result = buildStatisticsOverview(records, profile, now)
  assert.equal(result.averageIntake7Value, 1400)
  assert.equal(result.averageIntake7Text, '1400')
})

test('7 天部分缺失时缺失日期按 0 且仍固定除以 7', () => {
  const records = recentDates(3).map((date) => record(date, { totalCaloriesIn: 1400 }))
  assert.equal(buildStatisticsOverview(records, profile, now).averageIntake7Value, 600)
})

test('完整 30 天数据固定除以 30', () => {
  const records = recentDates(30).map((date) => record(date, { totalCaloriesIn: 1800 }))
  assert.equal(buildStatisticsOverview(records, profile, now).averageIntake30Value, 1800)
})

test('30 天部分缺失时缺失日期按 0 且仍固定除以 30', () => {
  const records = recentDates(10).map((date) => record(date, { totalCaloriesIn: 1500 }))
  assert.equal(buildStatisticsOverview(records, profile, now).averageIntake30Value, 500)
})

test('完全无记录时均值显示占位且连续记录明确为 0 天', () => {
  const result = buildStatisticsOverview([], profile, now)
  assert.equal(result.hasData, false)
  assert.equal(result.averageIntake7Text, '--')
  assert.equal(result.averageIntake30Text, '--')
  assert.equal(result.averageCalorieBalanceText, '--')
  assert.equal(result.proteinAchievementText, '--')
  assert.equal(result.streakText, '0天')
})

test('蛋白质全部达标时按范围下限计算为 100%', () => {
  const records = recentDates(7).map((date) => record(date, {
    totalCaloriesIn: 1500,
    totalProtein: 120
  }))
  assert.equal(buildStatisticsOverview(records, profile, now).proteinAchievementText, '100%')
})

test('蛋白质部分达标时无记录日期也进入固定 7 天分母', () => {
  const records = recentDates(5).map((date, index) => record(date, {
    totalCaloriesIn: 1500,
    totalProtein: index < 3 ? 130 : 80
  }))
  assert.equal(buildStatisticsOverview(records, profile, now).proteinAchievementText, '43%')
})

test('有饮食记录但蛋白质全部未达标时显示 0%', () => {
  const records = recentDates(7).map((date) => record(date, {
    totalCaloriesIn: 1500,
    totalProtein: 30
  }))
  assert.equal(buildStatisticsOverview(records, profile, now).proteinAchievementText, '0%')
})

test('连续 7 天存在有效饮食记录时连续记录为 7 天', () => {
  const records = recentDates(7).map((date) => record(date, { totalCaloriesIn: 1200 }))
  assert.equal(buildStatisticsOverview(records, profile, now).streakText, '7天')
})

test('连续记录中间断一天时在断点停止', () => {
  const dates = recentDates(5)
  const records = [dates[0], dates[1], dates[3], dates[4]].map((date) => record(date, { totalCaloriesIn: 1200 }))
  assert.equal(buildStatisticsOverview(records, profile, now).streakText, '2天')
})

test('今天没有饮食记录时连续记录为 0 天', () => {
  const records = recentDates(4).slice(1).map((date) => record(date, { totalCaloriesIn: 1200 }))
  const result = buildStatisticsOverview(records, profile, now)
  assert.equal(result.streakDays, 0)
  assert.equal(result.streakText, '0天')
})

test('正值沿用现有定义显示平均热量缺口', () => {
  const records = recentDates(7).map((date) => record(date, {
    totalCaloriesIn: 1400,
    calorieDeficit: 420
  }))
  const result = buildStatisticsOverview(records, profile, now)
  assert.equal(result.calorieBalanceTitle, '平均热量缺口')
  assert.equal(result.averageCalorieBalanceValue, 420)
})

test('负值沿用现有定义并以绝对值显示平均热量盈余', () => {
  const records = recentDates(7).map((date) => record(date, {
    totalCaloriesIn: 2000,
    calorieDeficit: -180
  }))
  const result = buildStatisticsOverview(records, profile, now)
  assert.equal(result.calorieBalanceTitle, '平均热量盈余')
  assert.equal(result.averageCalorieBalanceValue, 180)
  assert.equal(result.averageCalorieBalanceText, '180')
})

test('缺少汇总字段和异常字段时从 foods 安全回退且不产生非有限值', () => {
  const records = [record('2026-08-12', {
    foods: [
      { name: '鸡蛋', calories: '140', protein: '12' },
      { name: '异常食物', calories: 'bad', protein: Infinity }
    ],
    totalCaloriesIn: 'not-a-number',
    totalCaloriesOut: 'bad',
    calorieDeficit: undefined,
    totalProtein: null,
    targetCalories: 1800
  })]
  const result = buildStatisticsOverview(records, profile, now)
  assert.equal(result.averageIntake7Value, 20)
  assert.equal(result.averageCalorieBalanceValue, 237)
  Object.values(result).forEach((value) => {
    if (typeof value === 'number') assert.equal(Number.isFinite(value), true)
    if (typeof value === 'string') assert.doesNotMatch(value, /NaN|Infinity|undefined|null/)
  })
})

test('缺少 profile 或有效蛋白质目标时达标率显示占位', () => {
  const records = [record('2026-08-12', { totalCaloriesIn: 1200, totalProtein: 130 })]
  assert.equal(buildStatisticsOverview(records, null, now).proteinAchievementText, '--')
  assert.equal(buildStatisticsOverview(records, { macros: { protein: '未知' } }, now).proteinAchievementText, '--')
})

test('蛋白质范围解析使用下限并兼容数字目标', () => {
  assert.equal(parseProteinTarget('120-150'), 120)
  assert.equal(parseProteinTarget('93-112g'), 93)
  assert.equal(parseProteinTarget(100), 100)
  assert.equal(parseProteinTarget('未知'), null)
})
