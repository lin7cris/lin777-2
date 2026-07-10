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
    goalTag: '减脂日',
    calorieDeficitText: '+0',
    calorieDeficitSizeClass: 'deficit-size-large',
    calorieDeficitAbs: 0,
    deficitHeadline: '距离今日目标还差 0 kcal',
    goalProgress: 0,
    goalProgressStyle: '',
    coachSummary: '',
    coachTips: [],
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
    aiError: '',
    inputDockStyle: ''
  },

  onShow() {
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    const todayKey = formatDateKey(new Date())

    this.setData({
      dateTitle: this.formatDateTitle(todayKey),
      goalTag: this.formatGoalTag(profile.goal),
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
    const display = this.buildTodayDisplay(summary)
    this.setData({
      foodCalories: summary.foodCalories,
      exerciseCalories: summary.exerciseCalories,
      netCalories: summary.netCalories,
      calorieDeficit: summary.calorieDeficit,
      remainingCalories: summary.remainingCalories,
      deficitStatusLabel: summary.deficitStatusLabel,
      deficitMessage: summary.deficitMessage,
      deficitTone: summary.deficitTone,
      ...display,
      macros: summary.macros,
      records: summary.records
    })
  },

  buildTodayDisplay(summary) {
    const calorieDeficit = Number(summary.calorieDeficit) || 0
    const calorieDeficitAbs = Math.abs(calorieDeficit)
    const targetBudget = (Number(summary.targetCalories) || 0) + (Number(summary.exerciseCalories) || 0)
    const progress = targetBudget > 0
      ? Math.min(100, Math.max(0, Math.round((Number(summary.foodCalories) || 0) / targetBudget * 100)))
      : 0
    const isOver = calorieDeficit < 0
    const progressColor = isOver ? '#FF453A' : '#34C759'

    return {
      calorieDeficitAbs,
      calorieDeficitText: `${calorieDeficit >= 0 ? '+' : '-'}${calorieDeficitAbs}`,
      calorieDeficitSizeClass: this.getDeficitSizeClass(calorieDeficitAbs),
      deficitHeadline: calorieDeficit >= 0
        ? `距离今日目标还差 ${calorieDeficitAbs} kcal`
        : `今日已超过目标 ${calorieDeficitAbs} kcal`,
      goalProgress: progress,
      goalProgressStyle: `background: conic-gradient(${progressColor} 0 ${progress}%, rgba(118, 118, 128, 0.14) ${progress}% 100%);`,
      coachSummary: this.buildCoachSummary(summary, isOver),
      coachTips: this.buildCoachTips(summary, isOver)
    }
  },

  getDeficitSizeClass(value) {
    const digitCount = String(Math.abs(Number(value) || 0)).length
    if (digitCount >= 5) return 'deficit-size-compact'
    if (digitCount >= 4) return 'deficit-size-medium'
    return 'deficit-size-large'
  },

  buildCoachSummary(summary, isOver) {
    const calorieDeficit = Math.abs(Number(summary.calorieDeficit) || 0)
    if (isOver) {
      return `今天已经超过目标 ${calorieDeficit} kcal。接下来先不要追求补偿式节食，重点是把晚间摄入控制在低热量、高蛋白、低油脂的组合里。`
    }
    return `你今天还留有 ${calorieDeficit} kcal 的空间。可以把它当作晚餐预算，优先安排蛋白质和蔬菜，把饱腹感留住。`
  },

  buildCoachTips(summary, isOver) {
    if (isOver) {
      return [
        '晚餐避免油炸、奶茶和高糖零食，选择鸡蛋、鸡胸、鱼虾或豆制品。',
        '如果体力允许，增加 20 分钟轻松步行，帮助今天的热量曲线回到可控范围。',
        '明天早餐保持清淡但不要跳过，避免因为饥饿导致下一餐失控。'
      ]
    }

    const tips = [
      '晚餐可以选择一份优质蛋白，加一份蔬菜，再搭配少量主食。',
      '如果今天蛋白质进度偏低，优先补蛋白，不要把剩余热量全部给甜食。',
      '饭后轻松步行 20 分钟，可以让今日目标更稳地完成。'
    ]
    return tips
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

  formatGoalTag(goal) {
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

  onInputKeyboardHeightChange(event) {
    const keyboardHeight = Number(event.detail && event.detail.height) || 0
    this.setData({
      inputDockStyle: keyboardHeight > 0 ? `bottom: ${keyboardHeight + 8}px;` : ''
    })
  },

  onInputBlur() {
    this.setData({ inputDockStyle: '' })
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
