const {
  buildTrendStats,
  dateRangeForDays
} = require('../../utils/records')

Page({
  data: {
    rangeDays: 7,
    loading: false,
    hasData: false,
    intake: { points: [], hasData: false },
    exercise: { points: [], hasData: false },
    net: { points: [], hasData: false },
    weight: { points: [], hasData: false }
  },

  onShow() {
    this.loadStatistics(this.data.rangeDays)
  },

  selectRange(event) {
    const rangeDays = Number(event.currentTarget.dataset.days) === 30 ? 30 : 7
    if (rangeDays === this.data.rangeDays && this.data.hasData) return
    this.setData({ rangeDays })
    this.loadStatistics(rangeDays)
  },

  async loadStatistics(rangeDays) {
    const app = getApp()
    if (!app.globalData.cloudReady) return

    const range = dateRangeForDays(rangeDays, new Date())
    this.setData({ loading: true })
    try {
      const response = await wx.cloud.callFunction({
        name: 'dailyRecords',
        data: {
          action: 'range',
          startDate: range.startDate,
          endDate: range.endDate
        }
      })
      const result = response.result || {}
      if (result.success === false) throw new Error(result.error && result.error.message)
      const stats = buildTrendStats(result.records || [], rangeDays, new Date())
      this.setData(stats)
    } catch (error) {
      console.error('load statistics failed', error)
      const emptyStats = buildTrendStats([], rangeDays, new Date())
      this.setData(emptyStats)
      wx.showToast({ title: '读取统计数据失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
