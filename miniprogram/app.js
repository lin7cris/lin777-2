const { cloudEnvId } = require('./utils/config')

App({
  globalData: {
    cloudReady: false,
    profile: null
  },

  onLaunch() {
    if (!wx.cloud) {
      wx.showModal({
        title: '基础库版本过低',
        content: '请使用 2.2.3 或以上基础库以支持云开发。',
        showCancel: false
      })
      return
    }

    if (!cloudEnvId || cloudEnvId === 'your-cloud-env-id') {
      this.globalData.cloudReady = false
      return
    }

    wx.cloud.init({
      env: cloudEnvId,
      traceUser: true
    })

    this.globalData.cloudReady = true
  }
})
