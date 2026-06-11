const {
  STORAGE_KEYS,
  DEFAULT_PROFILE,
  formatDateKey,
  summarizeDay
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
    dailyInput: '',
    parsing: false
  },

  onShow() {
    // 每次回到首页都读取最新本地资料，确保“我的”页保存后能立即反映。
    const records = wx.getStorageSync(STORAGE_KEYS.records) || []
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    const todayKey = formatDateKey(new Date())
    const summary = summarizeDay(records, todayKey, {
      targetCalories: profile.targetCalories,
      macroTargets: profile.macros
    })

    this.setData({
      dateTitle: this.formatDateTitle(todayKey),
      goalLabel: this.goalLabel(profile.goal),
      targetCalories: profile.targetCalories,
      foodCalories: summary.foodCalories,
      exerciseCalories: summary.exerciseCalories,
      netCalories: summary.netCalories,
      remainingCalories: summary.remainingCalories,
      macros: summary.macros,
      records: summary.records
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
