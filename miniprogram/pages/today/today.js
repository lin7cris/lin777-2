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
    goalLabel: '减脂日',
    targetCalories: 0,
    foodCalories: 0,
    exerciseCalories: 0,
    netCalories: 0,
    remainingCalories: 0,
    macros: [],
    records: [],
    loadingRecords: false,
    deletingId: '',
    dailyInput: '',
    parsing: false
  },

  onShow() {
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    const todayKey = formatDateKey(new Date())

    this.setData({
      dateTitle: this.formatDateTitle(todayKey),
      goalLabel: this.goalLabel(profile.goal),
      targetCalories: profile.targetCalories
    })
    this.loadDailyRecord(todayKey, profile)
  },

  async loadDailyRecord(date, profile) {
    const app = getApp()
    if (!app.globalData.cloudReady) return

    this.setData({ loadingRecords: true })
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
    } finally {
      this.setData({ loadingRecords: false })
    }
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
      remainingCalories: summary.remainingCalories,
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

  goalLabel(goal) {
    if (goal === 'muscle_gain') return '增肌日'
    if (goal === 'maintain') return '维持日'
    return '减脂日'
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
      wx.showToast({
        title: '先写点内容',
        icon: 'none'
      })
      return
    }

    if (!app.globalData.cloudReady) {
      wx.showToast({
        title: '云开发未初始化',
        icon: 'none'
      })
      return
    }

    this.setData({ parsing: true })

    wx.cloud.callFunction({
      name: 'parseDailyInput',
      data: { text, profile },
      success: (res) => {
        const result = res.result || {}
        if (result.success === false) {
          wx.showToast({
            title: result.error && result.error.message
              ? result.error.message
              : 'AI解析失败',
            icon: 'none'
          })
          return
        }

        // 统一清洗云函数返回结构，确认页只处理稳定字段。
        const payload = normalizeParsedDailyInput(result)
        wx.setStorageSync(STORAGE_KEYS.pendingParse, payload)
        this.setData({
          dailyInput: ''
        })
        wx.navigateTo({
          url: '/pages/confirm/confirm'
        })
      },
      fail: (error) => {
        console.error('parse daily input failed', error)
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
