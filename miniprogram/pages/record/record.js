const {
  formatDateKey,
  buildHistoryRecord
} = require('../../utils/records')

let recordRequestSequence = 0

Page({
  data: {
    selectedDate: '',
    loading: false,
    recordError: '',
    deletingId: '',
    hasData: false,
    record: null
  },

  onLoad() {
    this.setData({ selectedDate: formatDateKey(new Date()) })
  },

  onShow() {
    const selectedDate = this.data.selectedDate || formatDateKey(new Date())
    this.loadRecord(selectedDate)
  },

  onDateChange(event) {
    const selectedDate = event.detail.value
    this.setData({ selectedDate })
    this.loadRecord(selectedDate)
  },

  async loadRecord(date) {
    const requestId = ++recordRequestSequence
    const app = getApp()
    if (!app.globalData.cloudReady) {
      this.applyRecord(null)
      this.setData({
        loading: false,
        recordError: '云开发尚未连接，请检查环境配置后重试。'
      })
      return
    }

    this.setData({ loading: true, recordError: '' })
    try {
      const response = await wx.cloud.callFunction({
        name: 'dailyRecords',
        data: {
          action: 'range',
          startDate: date,
          endDate: date
        }
      })
      const result = response.result || {}
      if (result.success === false) throw new Error(result.error && result.error.message)
      if (requestId !== recordRequestSequence) return
      this.applyRecord(result.records && result.records[0])
    } catch (error) {
      if (requestId !== recordRequestSequence) return
      this.applyRecord(null)
      this.setData({ recordError: '无法读取这一天的记录，请检查网络后重试。' })
      wx.showToast({ title: '读取历史记录失败', icon: 'none' })
    } finally {
      if (requestId === recordRequestSequence) this.setData({ loading: false })
    }
  },

  retryRecord() {
    this.loadRecord(this.data.selectedDate || formatDateKey(new Date()))
  },

  onUnload() {
    recordRequestSequence += 1
  },

  applyRecord(record) {
    const history = record ? buildHistoryRecord(record) : null
    const hasData = Boolean(history && (history.foods.length || history.exercises.length))
    this.setData({ record: history, hasData })
  },

  deleteItem(event) {
    const { itemType, itemId, title } = event.currentTarget.dataset
    wx.showModal({
      title: '删除记录',
      content: `确定删除“${title}”吗？删除后会重新计算当天汇总。`,
      confirmColor: '#d64545',
      success: async (modal) => {
        if (!modal.confirm) return
        this.setData({ deletingId: itemId })
        try {
          const response = await wx.cloud.callFunction({
            name: 'dailyRecords',
            data: {
              action: 'delete',
              date: this.data.selectedDate,
              itemType,
              itemId
            }
          })
          const result = response.result || {}
          if (result.success === false) throw new Error(result.error && result.error.message)
          this.applyRecord(result.record)
          wx.showToast({ title: '已删除', icon: 'success' })
        } catch (error) {
          wx.showToast({ title: '删除失败，请稍后重试', icon: 'none' })
        } finally {
          this.setData({ deletingId: '' })
        }
      }
    })
  }
})
