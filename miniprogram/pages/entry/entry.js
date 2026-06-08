Page({
  data: {
    loading: false,
    text: '今天早上吃了一个鸡蛋、一杯牛奶和两个包子，中午吃了一碗米饭、宫保鸡丁和青菜，晚上跑步30分钟。'
  },

  onInput(event) {
    this.setData({
      text: event.detail.value
    })
  },

  async parseText() {
    this.setData({ loading: true })
    try {
      const result = await wx.cloud.callFunction({
        name: 'parseRecord',
        data: { text: this.data.text }
      })
      wx.navigateTo({
        url: `/pages/confirm/confirm?payload=${encodeURIComponent(JSON.stringify(result.result))}`
      })
    } catch (error) {
      wx.showToast({
        title: '解析失败，已使用示例',
        icon: 'none'
      })
      wx.navigateTo({
        url: '/pages/confirm/confirm'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  backToday() {
    wx.switchTab({
      url: '/pages/today/today'
    })
  }
})
