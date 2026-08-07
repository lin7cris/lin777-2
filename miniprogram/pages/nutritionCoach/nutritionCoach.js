const { STORAGE_KEYS, formatDateKey } = require('../../utils/records')
const { buildCoachMacros, buildCoachSummary } = require('../../utils/nutritionCoachView')

Page({
  data: {
    loading: true,
    error: '',
    emptyReason: '',
    hasContent: false,
    summary: {
      caloriesIn: 0,
      caloriesOut: 0,
      targetCalories: 0,
      remainingCalories: 0,
      completion: 0,
      text: ''
    },
    nutritionAnalysis: '',
    macros: [],
    suggestions: [],
    dinnerRecommendation: '',
    recommendations: [],
    savingRecommendationIndex: -1,
    recommendationError: ''
  },

  onShow() {
    this.loadNutritionCoach()
  },

  async loadNutritionCoach() {
    const app = getApp()
    const date = formatDateKey(new Date())

    if (!app.globalData.cloudReady) {
      this.setData({
        loading: false,
        error: '云开发尚未连接，请稍后重试。',
        emptyReason: '',
        hasContent: false
      })
      return
    }

    this.setData({ loading: true, error: '', emptyReason: '' })
    try {
      const profileResponse = await wx.cloud.callFunction({
        name: 'userProfile',
        data: { action: 'get' }
      })
      const profileResult = profileResponse.result || {}
      const profile = profileResult.profile || null
      if (!profile) {
        this.setData({
          loading: false,
          hasContent: false,
          emptyReason: '请先完成身体信息，才能生成适合你的饮食建议。'
        })
        return
      }
      this.profile = profile

      const dailyResponse = await wx.cloud.callFunction({
        name: 'dailyRecords',
        data: { action: 'get', date }
      })
      const dailyResult = dailyResponse.result || {}
      const record = dailyResult.record || {}

      if (dailyResult.success === false) {
        throw new Error(dailyResult.error && dailyResult.error.message || '读取今日记录失败')
      }
      if (!Array.isArray(record.foods) || !record.foods.length) {
        this.setData({
          loading: false,
          hasContent: false,
          emptyReason: '记录今天的饮食后，即可生成个性化分析。'
        })
        return
      }

      const summary = buildCoachSummary(record, profile)
      const nutritionData = {
        caloriesIn: summary.caloriesIn,
        caloriesOut: summary.caloriesOut,
        remainingCalories: summary.remainingCalories,
        protein: Number(record.totalProtein) || 0,
        carbs: Number(record.totalCarbs) || 0,
        fat: Number(record.totalFat) || 0
      }

      const coachResponse = await wx.cloud.callFunction({
        name: 'nutritionCoach',
        data: {
          date,
          userInfo: profile,
          todayRecords: record,
          nutritionData,
          targetCalories: summary.targetCalories
        }
      })
      const coachResult = coachResponse.result || {}
      if (coachResult.success === false) {
        throw new Error(coachResult.error && coachResult.error.message || '生成营养建议失败')
      }

      this.setData({
        loading: false,
        hasContent: true,
        summary: {
          ...summary,
          text: coachResult.summary || '你的饮食记录已更新。'
        },
        nutritionAnalysis: coachResult.nutritionAnalysis || '',
        macros: buildCoachMacros(record, profile),
        suggestions: Array.isArray(coachResult.suggestions) ? coachResult.suggestions.slice(0, 4) : [],
        dinnerRecommendation: coachResult.dinnerRecommendation || '暂时没有生成今晚推荐。',
        recommendations: Array.isArray(coachResult.recommendations) ? coachResult.recommendations.slice(0, 2) : [],
        recommendationError: ''
      })
    } catch (error) {
      this.setData({
        loading: false,
        error: 'AI营养教练暂时无法回复，请稍后重试。',
        emptyReason: '',
        hasContent: false
      })
    }
  },

  retryNutritionCoach() {
    this.loadNutritionCoach()
  },

  goNutritionChat() {
    wx.navigateTo({ url: '/pages/nutritionChat/nutritionChat' })
  },

  async addRecommendation(event) {
    const index = Number(event.currentTarget.dataset.index)
    const recommendation = this.data.recommendations[index]
    if (!recommendation || this.data.savingRecommendationIndex >= 0) return

    const app = getApp()
    if (!app.globalData.cloudReady) {
      this.setData({ recommendationError: '云开发尚未连接，无法写入今日记录。' })
      wx.showToast({ title: '云开发未初始化', icon: 'none' })
      return
    }

    const profile = this.profile || wx.getStorageSync(STORAGE_KEYS.profile) || {}
    this.setData({ savingRecommendationIndex: index, recommendationError: '' })
    try {
      const response = await wx.cloud.callFunction({
        name: 'dailyRecords',
        data: {
          action: 'save',
          date: formatDateKey(new Date()),
          sourceText: `营养教练推荐：${recommendation.name}`,
          foods: [{
            name: recommendation.name,
            amount: recommendation.amount,
            meal: recommendation.meal || 'dinner',
            calories: Number(recommendation.calories) || 0,
            protein: Number(recommendation.protein) || 0,
            carbs: Number(recommendation.carbs) || 0,
            fat: Number(recommendation.fat) || 0,
            estimated: true
          }],
          exercises: [],
          weight: profile.weight,
          targetCalories: profile.targetCalories
        }
      })
      const result = response.result || {}
      if (result.success === false) {
        throw new Error(result.error && result.error.message || '写入今日记录失败')
      }
      wx.showToast({ title: '已加入今日记录', icon: 'success' })
      await this.loadNutritionCoach()
    } catch (error) {
      const message = '加入记录失败，请稍后重试。'
      this.setData({ recommendationError: message })
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ savingRecommendationIndex: -1 })
    }
  }
})
