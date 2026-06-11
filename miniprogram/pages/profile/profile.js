const { STORAGE_KEYS, DEFAULT_PROFILE } = require('../../utils/records')
const { buildNutritionPlan } = require('../../utils/calorie')
const { buildProfileForSave } = require('../../utils/profileForm')

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
    dirty: false,
    profile: DEFAULT_PROFILE,
    form: DEFAULT_PROFILE,
    genderOptions,
    activityOptions,
    goalOptions,
    genderIndex: 0,
    activityIndex: 1,
    goalIndex: 0,
    genderText: '女',
    goalText: '减脂',
    activityText: '轻度活动',
    options: [
      { name: '重新计算推荐热量' },
      { name: '食物识别偏好' },
      { name: '导出每日记录' },
      { name: '隐私与数据授权' }
    ]
  },

  onShow() {
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    this.applyProfile(profile)
    this.loadCloudProfile()
  },

  // 从云数据库读取当前用户资料，读取失败时保留本地缓存，不影响页面编辑。
  async loadCloudProfile() {
    const app = getApp()
    if (!app.globalData.cloudReady) return

    try {
      const result = await wx.cloud.callFunction({
        name: 'userProfile',
        data: { action: 'get' }
      })
      const profile = result.result && result.result.profile

      // 如果用户已经开始编辑，避免慢返回的云端旧数据覆盖输入框。
      if (!this.data.dirty && profile) {
        this.applyProfile(profile)
      }
    } catch (error) {
      console.warn('load cloud user profile failed', error)
    }
  },

  // 把 profile 同步到展示数据、表单数据和 picker 当前索引。
  applyProfile(profile) {
    const normalized = {
      ...DEFAULT_PROFILE,
      ...profile,
      macros: profile.macros || DEFAULT_PROFILE.macros
    }

    this.setData({
      profile: normalized,
      form: normalized,
      genderIndex: this.findOptionIndex(genderOptions, normalized.gender),
      activityIndex: this.findOptionIndex(activityOptions, normalized.activityLevel),
      goalIndex: this.findOptionIndex(goalOptions, normalized.goal),
      genderText: this.genderText(normalized.gender),
      goalText: this.goalText(normalized.goal),
      activityText: this.activityText(normalized.activityLevel)
    })
  },

  // 根据选项值定位 picker 的索引，找不到时回到第一项。
  findOptionIndex(options, value) {
    const index = options.findIndex((item) => item.value === value)
    return index >= 0 ? index : 0
  },

  // 处理年龄、身高、体重等数字输入，统一保存在 form 中。
  onNumberInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      dirty: true,
      [`form.${field}`]: event.detail.value
    })
  },

  // 处理 picker 选择，把用户可读选项转换为内部枚举值。
  onPickerChange(event) {
    const field = event.currentTarget.dataset.field
    const index = Number(event.detail.value)
    const optionMap = {
      gender: { options: genderOptions, indexKey: 'genderIndex' },
      activityLevel: { options: activityOptions, indexKey: 'activityIndex' },
      goal: { options: goalOptions, indexKey: 'goalIndex' }
    }
    const config = optionMap[field]
    if (!config) return

    this.setData({
      dirty: true,
      [`form.${field}`]: config.options[index].value,
      [config.indexKey]: index
    })
  },

  // 保存用户信息：计算推荐结果，写入本地缓存，并同步到云数据库 users 集合。
  async saveProfile() {
    const profile = buildProfileForSave(this.data.form)
    if (!this.validateProfile(profile)) return

    const plan = buildNutritionPlan(profile)
    const savedProfile = {
      ...profile,
      ...plan
    }

    this.setData({ saving: true })
    wx.setStorageSync(STORAGE_KEYS.profile, savedProfile)
    this.applyProfile(savedProfile)

    try {
      await this.saveProfileToCloud(savedProfile)
      this.setData({ dirty: false })
      wx.showToast({
        title: '已保存',
        icon: 'success'
      })
    } catch (error) {
      console.error('save cloud user profile failed', error)
      wx.showToast({
        title: '已本地保存',
        icon: 'none'
      })
    } finally {
      this.setData({ saving: false })
    }
  },

  // 做最小输入校验，阻止空值或 0 值写入云端。
  validateProfile(profile) {
    const valid = profile.gender &&
      profile.age > 0 &&
      profile.height > 0 &&
      profile.weight > 0 &&
      profile.targetWeight > 0 &&
      profile.activityLevel &&
      profile.goal

    if (!valid) {
      wx.showToast({
        title: '请完整填写资料',
        icon: 'none'
      })
    }

    return valid
  },

  // 通过云函数按当前 openid 同步 users 记录，避免客户端权限差异影响保存。
  async saveProfileToCloud(profile) {
    const app = getApp()
    if (!app.globalData.cloudReady) {
      throw new Error('cloud is not initialized')
    }

    return wx.cloud.callFunction({
      name: 'userProfile',
      data: {
        action: 'save',
        profile
      }
    })
  },

  genderText(gender) {
    return gender === 'male' ? '男' : '女'
  },

  goalText(goal) {
    if (goal === 'muscle_gain') return '增肌'
    if (goal === 'maintain') return '维持'
    return '减脂'
  },

  activityText(activityLevel) {
    const map = {
      sedentary: '久坐',
      light: '轻度活动',
      moderate: '中度活动',
      active: '高强度活动'
    }
    return map[activityLevel] || map.light
  }
})
