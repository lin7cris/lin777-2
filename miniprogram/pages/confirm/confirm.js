const { STORAGE_KEYS, buildRecord } = require('../../utils/records')
const { normalizeParsedDailyInput } = require('../../utils/dailyInput')

Page({
  data: {
    confidenceText: '86%',
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

  confirmRecord() {
    const records = wx.getStorageSync(STORAGE_KEYS.records) || []
    const record = buildRecord({
      ...this.data.payload,
      foods: this.data.foods,
      exercises: this.data.exercises
    })

    wx.setStorageSync(STORAGE_KEYS.records, [record, ...records])

    wx.showToast({
      title: '已写入今日记录',
      icon: 'success'
    })
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/today/today'
      })
    }, 500)
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
