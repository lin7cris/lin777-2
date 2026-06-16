const {
  STORAGE_KEYS,
  DEFAULT_PROFILE,
  formatDateKey,
  summarizeDailyRecord
} = require('../../utils/records')
const { normalizeParsedDailyInput } = require('../../utils/dailyInput')

Page({
  data: {
    dateTitle: '',
    deficitStatusLabel: '🟡 接近目标',
    deficitMessage: '已形成热量缺口',
    deficitTone: 'positive',
    targetCalories: 0,
    foodCalories: 0,
    exerciseCalories: 0,
    netCalories: 0,
    calorieDeficit: 0,
    remainingCalories: 0,
    macros: [],
    records: [],
    loadingRecords: false,
    recordError: '',
    deletingId: '',
    dailyInput: '',
    parsing: false,
    aiError: ''
  },

  onShow() {
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    const todayKey = formatDateKey(new Date())

    this.setData({
      dateTitle: this.formatDateTitle(todayKey),
      targetCalories: profile.targetCalories
    })
    this.loadDailyRecord(todayKey, profile)
  },

  async loadDailyRecord(date, profile) {
    const app = getApp()
    if (!app.globalData.cloudReady) {
      this.applyDailyRecord(null, profile)
      this.setData({
        loadingRecords: false,
        recordError: '云开发尚未连接，请检查环境配置后重试。'
      })
      return
    }

    this.setData({ loadingRecords: true, recordError: '' })
    try {
      const response = await wx.cloud.callFunction({
        name: 'dailyRecords',
        data: { action: 'get', date }
      })
      const result = response.result || {}
      if (result.success === false) throw new Error(result.error && result.error.message)
      this.applyDailyRecord(result.record, profile)
    } catch (error) {
      console.error('load daily record failed', error)
      wx.showToast({ title: '读取今日记录失败', icon: 'none' })
      this.applyDailyRecord(null, profile)
      this.setData({
        recordError: '无法读取今日记录，请检查网络后重试。'
      })
    } finally {
      this.setData({ loadingRecords: false })
    }
  },

  retryDailyRecord() {
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    this.loadDailyRecord(formatDateKey(new Date()), profile)
  },

  applyDailyRecord(record, profile) {
    const summary = summarizeDailyRecord(record, {
      targetCalories: profile.targetCalories,
      macroTargets: profile.macros
    })
    this.setData({
      foodCalories: summary.foodCalories,
      exerciseCalories: summary.exerciseCalories,
      netCalories: summary.netCalories,
      calorieDeficit: summary.calorieDeficit,
      remainingCalories: summary.remainingCalories,
      deficitStatusLabel: summary.deficitStatusLabel,
      deficitMessage: summary.deficitMessage,
      deficitTone: summary.deficitTone,
      macros: summary.macros,
      records: summary.records
    })
  },

  deleteDailyItem(event) {
    const { itemType, itemId, title } = event.currentTarget.dataset
    wx.showModal({
      title: '删除记录',
      content: `确定删除“${title}”吗？`,
      confirmColor: '#d64545',
      success: async (modal) => {
        if (!modal.confirm) return
        const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
        const date = formatDateKey(new Date())
        this.setData({ deletingId: itemId })
        try {
          const response = await wx.cloud.callFunction({
            name: 'dailyRecords',
            data: { action: 'delete', date, itemType, itemId }
          })
          const result = response.result || {}
          if (result.success === false) throw new Error(result.error && result.error.message)
          this.applyDailyRecord(result.record, profile)
          wx.showToast({ title: '已删除', icon: 'success' })
        } catch (error) {
          console.error('delete daily item failed', error)
          wx.showToast({ title: '删除失败，请稍后重试', icon: 'none' })
        } finally {
          this.setData({ deletingId: '' })
        }
      }
    })
  },

  formatDateTitle(dateKey) {
    const parts = dateKey.split('-')
    return `${Number(parts[1])} 月 ${Number(parts[2])} 日`
  },

  goEntry() {
    wx.navigateTo({
      url: '/pages/entry/entry'
    })
  },

  onDailyInput(event) {
    this.setData({
      dailyInput: event.detail.value
    })
  },

  parseDailyInput() {
    const text = this.data.dailyInput.trim()
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    const app = getApp()

    if (!text) {
      this.setData({ aiError: '' })
      wx.showToast({
        title: '先写点内容',
        icon: 'none'
      })
      return
    }

    if (!app.globalData.cloudReady) {
      this.setData({
        aiError: 'AI 服务尚未连接，请检查云环境配置。'
      })
      wx.showToast({
        title: '云开发未初始化',
        icon: 'none'
      })
      return
    }

    this.setData({ parsing: true, aiError: '' })

    wx.cloud.callFunction({
      name: 'parseDailyInput',
      data: { text, profile },
      success: (res) => {
        const result = res.result || {}
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

        // 统一清洗云函数返回结构，确认页只处理稳定字段。
        const payload = normalizeParsedDailyInput(result)
        wx.setStorageSync(STORAGE_KEYS.pendingParse, payload)
        this.setData({
          dailyInput: '',
          aiError: ''
        })
        wx.navigateTo({
          url: '/pages/confirm/confirm'
        })
      },
      fail: (error) => {
        console.error('parse daily input failed', error)
        this.setData({
          aiError: 'AI 解析失败，请检查网络后重试。'
        })
        wx.showToast({
          title: 'AI解析失败',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ parsing: false })
      }
    })
  }
})
