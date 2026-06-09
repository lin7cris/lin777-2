const {
  STORAGE_KEYS,
  DEFAULT_PROFILE,
  formatDateKey,
  summarizeDay
} = require('../../utils/records')

Page({
  data: {
    dateTitle: '',
    goalLabel: '减脂日',
    foodCalories: 0,
    exerciseCalories: 0,
    netCalories: 0,
    remainingCalories: 0,
    macros: [],
    records: []
  },

  onShow() {
    const records = wx.getStorageSync(STORAGE_KEYS.records) || []
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    const todayKey = formatDateKey(new Date())
    const summary = summarizeDay(records, todayKey, {
      targetCalories: profile.targetCalories,
      macroTargets: profile.macros
    })

    this.setData({
      dateTitle: this.formatDateTitle(todayKey),
      goalLabel: this.goalLabel(profile.goal),
      foodCalories: summary.foodCalories,
      exerciseCalories: summary.exerciseCalories,
      netCalories: summary.netCalories,
      remainingCalories: summary.remainingCalories,
      macros: summary.macros,
      records: summary.records
    })
  },

  formatDateTitle(dateKey) {
    const parts = dateKey.split('-')
    return `${Number(parts[1])} 月 ${Number(parts[2])} 日`
  },

  goalLabel(goal) {
    if (goal === 'muscle_gain') return '增肌日'
    if (goal === 'maintain') return '维持日'
    return '减脂日'
  },

  goEntry() {
    wx.navigateTo({
      url: '/pages/entry/entry'
    })
  }
})
