const { STORAGE_KEYS, DEFAULT_PROFILE } = require('../../utils/records')

Page({
  data: {
    profile: DEFAULT_PROFILE,
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
    this.setData({
      profile,
      genderText: profile.gender === 'male' ? '男' : '女',
      goalText: this.goalText(profile.goal),
      activityText: this.activityText(profile.activityLevel)
    })
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
