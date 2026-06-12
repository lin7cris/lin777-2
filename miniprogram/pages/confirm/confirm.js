const { STORAGE_KEYS, formatDateKey } = require('../../utils/records')
const { normalizeParsedDailyInput } = require('../../utils/dailyInput')

Page({
  data: {
    confidenceText: '86%',
    saving: false,
    sourceText: '',
    foods: [],
    exercises: [],
    payload: normalizeParsedDailyInput(null)
  },

  onLoad(options) {
    let payload = wx.getStorageSync(STORAGE_KEYS.pendingParse) || null
    if (options.payload) {
      try {
        payload = JSON.parse(decodeURIComponent(options.payload))
      } catch (error) {
        payload = null
      }
    }

    payload = normalizeParsedDailyInput(payload)

    this.setData({
      confidenceText: `${Math.round((payload.confidence || 0.86) * 100)}%`,
      sourceText: payload.sourceText,
      foods: payload.foods,
      exercises: payload.exercises,
      payload
    })
  },

  async confirmRecord() {
    if (this.data.saving) return

    const app = getApp()
    if (!app.globalData.cloudReady) {
      wx.showToast({ title: '云开发未初始化', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    try {
      const response = await wx.cloud.callFunction({
        name: 'dailyRecords',
        data: {
          action: 'save',
          date: formatDateKey(new Date()),
          sourceText: this.data.sourceText,
          foods: this.data.foods,
          exercises: this.data.exercises
        }
      })
      const result = response.result || {}
      if (result.success === false) {
        wx.showToast({
          title: result.error && result.error.message ? result.error.message : '保存失败',
          icon: 'none'
        })
        return
      }

      wx.removeStorageSync(STORAGE_KEYS.pendingParse)
      wx.showToast({ title: '已写入今日记录', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/today/today' })
      }, 500)
    } catch (error) {
      console.error('save daily record failed', error)
      wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  adjustRecord() {
    wx.navigateBack()
  },

  onFoodInput(event) {
    this.updateParsedItem('foods', event)
  },

  onExerciseInput(event) {
    this.updateParsedItem('exercises', event)
  },

  updateParsedItem(listName, event) {
    const { index, field } = event.currentTarget.dataset
    const numericFields = ['calories', 'protein', 'carbs', 'fat', 'duration']
    const rawValue = event.detail.value
    const value = numericFields.indexOf(field) >= 0 ? Number(rawValue) || 0 : rawValue

    this.setData({
      [`${listName}[${index}].${field}`]: value
    })
  }
})
