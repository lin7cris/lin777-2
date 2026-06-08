const {
  calculateBmr,
  calculateTdee,
  calculateTargetCalories,
  calculateMacroRange
} = require('../../utils/calorie')

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
    const bmr = calculateBmr(this.data.profile)
    const tdee = calculateTdee(bmr, this.data.profile.activityLevel)
    const targetCalories = calculateTargetCalories(tdee, this.data.profile.goal)
    const macros = calculateMacroRange(this.data.profile.weight, targetCalories)

    this.setData({
      result: { bmr, tdee, targetCalories, macros }
    })
  },

  startRecord() {
    wx.switchTab({
      url: '/pages/today/today'
    })
  }
})
