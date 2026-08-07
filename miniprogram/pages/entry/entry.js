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
      this.setData({ aiError: '智能识别服务尚未连接，请检查云环境配置。' })
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
        const rawMessage = result.error && result.error.message
          ? result.error.message
          : '智能识别失败，请稍后重试。'
        const message = this.normalizeRecognitionMessage(rawMessage)
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
      this.setData({ aiError: '智能识别失败，请检查网络后重试。' })
      wx.showToast({
        title: '识别失败',
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
  },

  normalizeRecognitionMessage(message) {
    const legacyPrefix = String.fromCharCode(65, 73)
    return String(message || '')
      .replace(new RegExp(`${legacyPrefix}\\s*服务`, 'g'), '智能识别服务')
      .replace(new RegExp(`${legacyPrefix}\\s*解析`, 'g'), '智能识别')
  }
})
