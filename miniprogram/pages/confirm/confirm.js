const { STORAGE_KEYS, formatDateKey } = require('../../utils/records')
const { normalizeParsedDailyInput } = require('../../utils/dailyInput')

Page({
  data: {
    confidenceText: '86%',
    saving: false,
    saveError: '',
    hasParsedItems: false,
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
      hasParsedItems: payload.foods.length + payload.exercises.length > 0,
      payload
    })
  },

  async confirmRecord() {
    if (this.data.saving) return

    if (!this.data.hasParsedItems) {
      this.setData({ saveError: '没有可保存的饮食或运动条目，请返回重新解析。' })
      wx.showToast({ title: '没有可保存的条目', icon: 'none' })
      return
    }

    const app = getApp()
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || {}
    if (!app.globalData.cloudReady) {
      this.setData({ saveError: '云开发尚未连接，请检查环境配置。' })
      wx.showToast({ title: '云开发未初始化', icon: 'none' })
      return
    }

    this.setData({ saving: true, saveError: '' })
    try {
      const response = await wx.cloud.callFunction({
        name: 'dailyRecords',
        data: {
          action: 'save',
          date: formatDateKey(new Date()),
          sourceText: this.data.sourceText,
          foods: this.data.foods,
          exercises: this.data.exercises,
          weight: profile.weight,
          targetCalories: profile.targetCalories
        }
      })
      const result = response.result || {}
      if (result.success === false) {
        const message = result.error && result.error.message ? result.error.message : '保存失败，请稍后重试'
        this.setData({ saveError: message })
        wx.showToast({
          title: message,
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
      this.setData({ saveError: '保存失败，请检查网络后重试。' })
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

  onRemoveItem(event) {
    const { list, index } = event.currentTarget.dataset
    this.removeParsedItem(list, Number(index))
  },

  updateParsedItem(listName, event) {
    const { index, field } = event.currentTarget.dataset
    const numericFields = ['calories', 'protein', 'carbs', 'fat', 'duration']
    const rawValue = event.detail.value
    const value = numericFields.indexOf(field) >= 0 ? Number(rawValue) || 0 : rawValue

    this.setData({
      [`${listName}[${index}].${field}`]: value
    })
  },

  removeParsedItem(listName, index) {
    const item = this.data[listName][index]
    if (!item) return
    wx.showModal({
      title: '删除此条记录？',
      content: `将移除${item.name || '这条记录'}，确认后才会保存剩余内容。`,
      confirmText: '删除',
      confirmColor: '#FF453A',
      success: (result) => {
        if (!result.confirm) return
        const items = this.data[listName].slice()
        items.splice(index, 1)
        this.setData({
          [listName]: items,
          hasParsedItems: items.length + this.data[listName === 'foods' ? 'exercises' : 'foods'].length > 0
        })
      }
    })
  }
})
