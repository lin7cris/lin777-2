const { buildNutritionPlan } = require('../../utils/calorie')
const { buildProfileForSave } = require('../../utils/profileForm')
const { STORAGE_KEYS, DEFAULT_PROFILE } = require('../../utils/records')

const genderOptions = [
  { label: '女', value: 'female' },
  { label: '男', value: 'male' }
]

const activityOptions = [
  { label: '久坐', value: 'sedentary' },
  { label: '轻度活动', value: 'light' },
  { label: '中度活动', value: 'moderate' },
  { label: '高强度活动', value: 'active' }
]

const goalOptions = [
  { label: '减脂', value: 'fat_loss' },
  { label: '增肌', value: 'muscle_gain' },
  { label: '维持', value: 'maintain' }
]

Page({
  data: {
    saving: false,
    form: DEFAULT_PROFILE,
    result: buildNutritionPlan(DEFAULT_PROFILE),
    genderOptions,
    activityOptions,
    goalOptions,
    genderIndex: 0,
    activityIndex: 1,
    goalIndex: 0
  },

  onLoad() {
    // 已有本地资料时优先回显，避免每次进入都变回默认数据。
    const savedProfile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    this.applyProfile(savedProfile)
  },

  // 将用户资料同步到表单、选项索引和推荐结果。
  applyProfile(profile) {
    const form = {
      ...DEFAULT_PROFILE,
      ...profile
    }

    this.setData({
      form,
      result: buildNutritionPlan(buildProfileForSave(form)),
      genderIndex: this.findOptionIndex(genderOptions, form.gender),
      activityIndex: this.findOptionIndex(activityOptions, form.activityLevel),
      goalIndex: this.findOptionIndex(goalOptions, form.goal)
    })
  },

  findOptionIndex(options, value) {
    const index = options.findIndex((item) => item.value === value)
    return index >= 0 ? index : 0
  },

  // 输入时保留字符串，这样用户可以正常清空后重新输入。
  onNumberInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    }, () => this.refreshResult())
  },

  // picker 展示中文文案，表单中保存稳定的枚举值。
  onPickerChange(event) {
    const field = event.currentTarget.dataset.field
    const index = Number(event.detail.value)
    const optionMap = {
      gender: { options: genderOptions, indexKey: 'genderIndex' },
      activityLevel: { options: activityOptions, indexKey: 'activityIndex' },
      goal: { options: goalOptions, indexKey: 'goalIndex' }
    }
    const config = optionMap[field]
    if (!config || !config.options[index]) return

    this.setData({
      [`form.${field}`]: config.options[index].value,
      [config.indexKey]: index
    }, () => this.refreshResult())
  },

  // 只在数字字段完整时刷新结果，避免清空输入框时显示无意义的负数。
  refreshResult() {
    const profile = buildProfileForSave(this.data.form)
    if (!this.isProfileValid(profile)) return

    this.setData({
      result: buildNutritionPlan(profile)
    })
  },

  isProfileValid(profile) {
    return Boolean(
      profile.gender &&
      profile.age > 0 &&
      profile.height > 0 &&
      profile.weight > 0 &&
      profile.targetWeight > 0 &&
      profile.activityLevel &&
      profile.goal
    )
  },

  // 首次建档同时保存本地和云端，云端失败不阻止用户开始记录。
  async startRecord() {
    const profile = buildProfileForSave(this.data.form)
    if (!this.isProfileValid(profile)) {
      wx.showToast({ title: '请完整填写资料', icon: 'none' })
      return
    }

    const savedProfile = {
      ...profile,
      ...buildNutritionPlan(profile)
    }

    this.setData({ saving: true, result: savedProfile })
    wx.setStorageSync(STORAGE_KEYS.profile, savedProfile)

    try {
      const app = getApp()
      if (app.globalData.cloudReady) {
        await wx.cloud.callFunction({
          name: 'userProfile',
          data: {
            action: 'save',
            profile: savedProfile
          }
        })
      }
    } catch (error) {
      console.warn('save onboarding profile to cloud failed', error)
      wx.showToast({ title: '已保存到本机', icon: 'none' })
    } finally {
      this.setData({ saving: false })
      wx.switchTab({ url: '/pages/today/today' })
    }
  }
})
