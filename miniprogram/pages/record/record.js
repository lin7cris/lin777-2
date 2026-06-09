const {
  STORAGE_KEYS,
  DEFAULT_PROFILE,
  buildSevenDayStats
} = require('../../utils/records')

Page({
  data: {
    averageText: '平均 0 kcal',
    bars: [],
    days: []
  },

  onShow() {
    const records = wx.getStorageSync(STORAGE_KEYS.records) || []
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    const stats = buildSevenDayStats(records, new Date(), profile.targetCalories)

    this.setData(stats)
  }
})
