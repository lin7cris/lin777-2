const { buildNutritionPlan } = require('../../utils/calorie')
const { STORAGE_KEYS } = require('../../utils/records')

Page({
  data: {
    profile: {
      gender: 'female',
      age: 28,
      height: 165,
      weight: 62,
      targetWeight: 56,
      activityLevel: 'light',
      goal: 'fat_loss'
    },
    result: {
      bmr: 0,
      tdee: 0,
      targetCalories: 0,
      macros: {
        protein: '',
        carbs: '',
        fat: ''
      }
    }
  },

  onLoad() {
    // 首次建档使用同一套推荐计算，保证和“我的”页保存结果一致。
    const result = buildNutritionPlan(this.data.profile)
    this.setData({
      result
    })
  },

  startRecord() {
    // 保存首屏默认资料，用户之后可在“我的”页编辑并同步云端。
    wx.setStorageSync(STORAGE_KEYS.profile, {
      ...this.data.profile,
      ...this.data.result
    })

    wx.switchTab({
      url: '/pages/today/today'
    })
  }
})
