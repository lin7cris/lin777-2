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
    const request = {
      action: 'range',
      startDate: range.startDate,
      endDate: range.endDate
    }
    let response
    this.setData({ loading: true })
    try {
      response = await wx.cloud.callFunction({
        name: 'dailyRecords',
        data: request
      })
      const result = response.result || {}
      if (result.success !== true || !Array.isArray(result.records)) {
        console.error('dailyRecords range returned failure', {
          request,
          response,
          result
        })
        const failure = new Error(result.error && result.error.message || '云函数返回格式不正确')
        failure.code = result.error && result.error.code
        failure.details = result.error
        throw failure
      }
      const stats = buildTrendStats(result.records, rangeDays, new Date())
      this.setData(stats)
    } catch (error) {
      console.error('load statistics failed', {
        rangeDays,
        request,
        response,
        error,
        message: error && error.message,
        stack: error && error.stack,
        code: error && error.code,
        errCode: error && error.errCode,
        errMsg: error && error.errMsg,
        details: error && error.details
      })
      const emptyStats = buildTrendStats([], rangeDays, new Date())
      this.setData(emptyStats)
      wx.showToast({ title: '读取统计数据失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
