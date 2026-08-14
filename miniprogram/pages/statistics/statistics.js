const {
  buildTrendStats,
  dateRangeForDays
} = require('../../utils/records')
const { buildStatisticsOverview } = require('../../utils/statisticsOverview')

let requestSequence = 0

Page({
  data: {
    rangeDays: 7,
    loading: false,
    statisticsError: '',
    hasData: false,
    overview: buildStatisticsOverview([], null, new Date()),
    selectedTrend: null,
    intake: { points: [], hasData: false },
    exercise: { points: [], hasData: false },
    deficit: { points: [], hasData: false },
    net: { points: [], hasData: false },
    weight: { points: [], hasData: false }
  },

  onShow() {
    this.loadStatistics()
  },

  selectRange(event) {
    const rangeDays = Number(event.currentTarget.dataset.days) === 30 ? 30 : 7
    if (rangeDays === this.data.rangeDays && this.data.hasData) return
    this.setData({ rangeDays, selectedTrend: null })
    this.applyStatistics(rangeDays, new Date())
  },

  async loadStatistics() {
    const requestId = ++requestSequence
    const rangeDays = this.data.rangeDays
    const app = getApp()
    if (!app.globalData.cloudReady) {
      const emptyStats = buildTrendStats([], rangeDays, new Date())
      this.setData({
        ...emptyStats,
        overview: buildStatisticsOverview([], null, new Date()),
        selectedTrend: null,
        loading: false,
        statisticsError: '云开发尚未连接，请检查环境配置后重试。'
      })
      return
    }

    const range = dateRangeForDays(30, new Date())
    const request = {
      action: 'range',
      startDate: range.startDate,
      endDate: range.endDate
    }
    this.setData({ loading: true, statisticsError: '', selectedTrend: null })
    try {
      const [response, profileResponse] = await Promise.all([
        wx.cloud.callFunction({
          name: 'dailyRecords',
          data: request
        }),
        wx.cloud.callFunction({
          name: 'userProfile',
          data: { action: 'get' }
        }).catch(() => ({ result: { profile: null } }))
      ])
      const result = response.result || {}
      if (result.success !== true || !Array.isArray(result.records)) {
        const failure = new Error(result.error && result.error.message || '云函数返回格式不正确')
        failure.code = result.error && result.error.code
        failure.details = result.error
        throw failure
      }
      if (requestId !== requestSequence) return
      this.records30 = result.records
      this.profile = profileResponse.result && profileResponse.result.profile || null
      this.applyStatistics(this.data.rangeDays, new Date())
    } catch (error) {
      if (requestId !== requestSequence) return
      const emptyStats = buildTrendStats([], rangeDays, new Date())
      this.setData({
        ...emptyStats,
        overview: buildStatisticsOverview([], null, new Date()),
        selectedTrend: null,
        statisticsError: '无法读取统计数据，请检查网络后重试。'
      })
      wx.showToast({ title: '读取统计数据失败', icon: 'none' })
    } finally {
      if (requestId === requestSequence) this.setData({ loading: false })
    }
  },

  applyStatistics(rangeDays, now) {
    const records = Array.isArray(this.records30) ? this.records30 : []
    const stats = buildTrendStats(records, rangeDays, now)
    const overview = buildStatisticsOverview(records, this.profile, now)
    this.setData({
      ...stats,
      hasData: stats.hasData || overview.hasData,
      overview,
      selectedTrend: null
    })
  },

  retryStatistics() {
    this.loadStatistics()
  },

  selectTrendPoint(event) {
    const { chart, title, unit, index } = event.currentTarget.dataset
    const points = this.data[chart] && this.data[chart].points
    const point = Array.isArray(points) ? points[Number(index)] : null
    if (!point || !point.hasValue) return

    this.setData({
      selectedTrend: {
        chart,
        index: Number(index),
        title,
        dateLabel: point.label,
        valueText: point.valueText,
        unit
      }
    })
  },

  clearSelectedTrend() {
    this.setData({ selectedTrend: null })
  },

  onUnload() {
    requestSequence += 1
    this.records30 = null
    this.profile = null
  }
})
