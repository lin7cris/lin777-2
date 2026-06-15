const { STORAGE_KEYS, DEFAULT_PROFILE } = require('../../utils/records')
const { normalizeParsedDailyInput } = require('../../utils/dailyInput')

Page({
  data: {
    loading: false,
    text: '',
    aiError: ''
  },

  onInput(event) {
    this.setData({
      text: event.detail.value
    })
  },

  async parseText() {
    const text = this.data.text.trim()
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    const app = getApp()

    if (!text) {
      this.setData({ aiError: '' })
      wx.showToast({ title: '先写点内容', icon: 'none' })
      return
    }

    if (!app.globalData.cloudReady) {
      this.setData({ aiError: 'AI 服务尚未连接，请检查云环境配置。' })
      wx.showToast({ title: '云开发未初始化', icon: 'none' })
      return
    }

    this.setData({ loading: true, aiError: '' })
    try {
      const response = await wx.cloud.callFunction({
        name: 'parseDailyInput',
        data: { text, profile }
      })

      const result = response.result || {}
      if (result.success === false) {
        const message = result.error && result.error.message
          ? result.error.message
          : 'AI 解析失败，请稍后重试。'
        this.setData({ aiError: message })
        wx.showToast({
          title: message,
          icon: 'none'
        })
        return
      }

      const payload = normalizeParsedDailyInput(result)
      wx.setStorageSync(STORAGE_KEYS.pendingParse, payload)
      wx.navigateTo({
        url: '/pages/confirm/confirm'
      })
    } catch (error) {
      console.error('parse entry input failed', error)
      this.setData({ aiError: 'AI 解析失败，请检查网络后重试。' })
      wx.showToast({
        title: 'AI解析失败',
        icon: 'none'
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
