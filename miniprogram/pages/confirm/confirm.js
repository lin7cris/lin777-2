const fallback = {
  confidence: 0.86,
  foods: [
    { name: '鸡蛋', amount: '1 个', calories: 70, protein: 6, carbs: 1, fat: 5 },
    { name: '牛奶', amount: '250ml', calories: 150, protein: 8, carbs: 12, fat: 8 },
    { name: '包子', amount: '2 个', calories: 420, protein: 14, carbs: 68, fat: 12 },
    { name: '米饭', amount: '1 碗', calories: 260, protein: 5, carbs: 58, fat: 1 },
    { name: '宫保鸡丁', amount: '1 份', calories: 520, protein: 32, carbs: 22, fat: 32 },
    { name: '青菜', amount: '1 份', calories: 90, protein: 4, carbs: 12, fat: 3 }
  ],
  exercises: [
    { name: '跑步', duration: 30, intensity: '中等强度', calories: 310 }
  ]
}
const { STORAGE_KEYS, buildRecord } = require('../../utils/records')

Page({
  data: {
    confidenceText: '86%',
    foods: [],
    exercises: [],
    payload: fallback
  },

  onLoad(options) {
    let payload = fallback
    if (options.payload) {
      try {
        payload = JSON.parse(decodeURIComponent(options.payload))
      } catch (error) {
        payload = fallback
      }
    }

    this.setData({
      confidenceText: `${Math.round((payload.confidence || 0.86) * 100)}%`,
      foods: payload.foods || fallback.foods,
      exercises: payload.exercises || fallback.exercises,
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
  }
})
