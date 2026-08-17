const {
  STORAGE_KEYS,
  DEFAULT_PROFILE,
  formatDateKey,
  summarizeDailyRecord,
  dateRangeForDays
} = require('../../utils/records')
const { normalizeParsedDailyInput } = require('../../utils/dailyInput')
const { buildRecentFoods } = require('../../utils/recentFoods')
const { FOOD_ADVICE_MESSAGES, buildTodayFoodAdvice } = require('../../utils/todayFoodAdvice')
const { appendTranscript } = require('../../utils/voiceInput')
const { createVoiceRecorder } = require('../../utils/voiceRecorder')

const VOICE_PERMISSION_EXPLAINED_KEY = 'voicePermissionExplainedV1'

Page({
  data: {
    dateTitle: '',
    deficitStatusLabel: '🟡 接近目标',
    deficitMessage: '已形成热量缺口',
    deficitTone: 'positive',
    goalTag: '减脂日',
    calorieDeficitText: '+0',
    calorieDeficitSizeClass: 'deficit-size-large',
    calorieDeficitAbs: 0,
    deficitHeadline: '距离今日目标还差 0 kcal',
    goalProgress: 0,
    goalProgressStyle: '',
    coachSummary: '',
    coachTips: [],
    foodAdviceText: FOOD_ADVICE_MESSAGES.empty,
    targetCalories: 0,
    foodCalories: 0,
    exerciseCalories: 0,
    netCalories: 0,
    calorieDeficit: 0,
    remainingCalories: 0,
    macros: [],
    records: [],
    recentFoods: [],
    loadingRecords: false,
    recordError: '',
    deletingId: '',
    dailyInput: '',
    parsing: false,
    aiError: '',
    cameraParsing: false,
    cameraError: '',
    voiceStatus: 'idle',
    voiceDurationText: '0:00',
    voiceCanceling: false,
    voiceError: '',
    keyboardOpen: false
  },

  onLoad() {
    this.initializeVoiceRecorder()
  },

  onShow() {
    this.initializeVoiceRecorder()
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    const todayKey = formatDateKey(new Date())

    this.setData({
      dateTitle: this.formatDateTitle(todayKey),
      goalTag: this.formatGoalTag(profile.goal),
      targetCalories: profile.targetCalories
    })
    this.loadDailyRecord(todayKey, profile)
    this.loadRecentFoods()
  },

  onHide() {
    const voiceStatus = this.voiceRecorder && this.voiceRecorder.getState().status
    if (voiceStatus === 'recording' || voiceStatus === 'requestingPermission') {
      this.voiceRecorder.cancel()
    }
  },

  onUnload() {
    if (this.voiceRecorder) this.voiceRecorder.destroy()
    this.voiceRecorder = null
  },

  initializeVoiceRecorder() {
    if (this.voiceRecorder || typeof wx.getRecorderManager !== 'function') return

    this.voiceRecorder = createVoiceRecorder({
      wxApi: wx,
      onState: (state) => {
        this.setData({
          voiceStatus: state.status,
          voiceDurationText: state.durationText,
          voiceCanceling: state.canceling,
          voiceError: state.error
        })
      },
      onTranscript: (text) => this.onVoiceTranscript(text),
      onError: (message, code) => this.onVoiceError(message, code),
      onCancel: () => {
        wx.showToast({ title: '已取消录音', icon: 'none' })
      }
    })
  },

  onVoiceTranscript(text) {
    this.setData({
      dailyInput: appendTranscript(this.data.dailyInput, text),
      voiceError: ''
    })
    wx.showToast({ title: '已转为文字', icon: 'success' })
  },

  startVoiceInput() {
    const app = getApp()
    if (!app.globalData.cloudReady) {
      wx.showToast({ title: '云开发未初始化', icon: 'none' })
      return
    }

    this.initializeVoiceRecorder()
    if (!this.voiceRecorder) {
      wx.showToast({ title: '当前设备不支持录音', icon: 'none' })
      return
    }

    if (!wx.getStorageSync(VOICE_PERMISSION_EXPLAINED_KEY)) {
      wx.showModal({
        title: '语音输入',
        content: '麦克风仅用于把本次饮食和运动语音转换为可编辑文字，原始录音不会长期保存。',
        confirmText: '开始录音',
        cancelText: '继续输入',
        success: (result) => {
          if (!result.confirm) return
          wx.setStorageSync(VOICE_PERMISSION_EXPLAINED_KEY, true)
          this.voiceRecorder.start()
        }
      })
      return
    }

    this.voiceRecorder.start()
  },

  stopVoiceInput() {
    if (this.voiceRecorder) this.voiceRecorder.stop()
  },

  cancelVoiceInput() {
    if (this.voiceRecorder) this.voiceRecorder.cancel()
  },

  onVoiceCancelChange(event) {
    if (this.voiceRecorder) this.voiceRecorder.markCancel(event.detail.canceling)
  },

  onVoiceError(message, code) {
    this.setData({ voiceError: message })
    wx.showToast({ title: message, icon: 'none' })

    if (code === 'PERMISSION_DENIED') {
      wx.showModal({
        title: '需要麦克风权限',
        content: '开启麦克风后才能使用语音输入。你也可以继续使用文字输入。',
        confirmText: '去设置',
        cancelText: '继续输入',
        success: (result) => {
          if (result.confirm && this.voiceRecorder) this.voiceRecorder.openSettings()
        }
      })
    }
  },

  onCameraTap() {
    const app = getApp()
    if (!app.globalData.cloudReady) {
      this.setData({ cameraError: '图片识别服务尚未连接，请检查云环境配置。' })
      wx.showToast({ title: '云开发未初始化', icon: 'none' })
      return
    }

    wx.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: ({ tapIndex }) => {
        this.chooseFoodImage(tapIndex === 0 ? ['camera'] : ['album'])
      }
    })
  },

  chooseFoodImage(sourceType) {
    if (this.data.cameraParsing) return
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType,
      success: (result) => {
        const filePath = result.tempFilePaths && result.tempFilePaths[0]
        if (!filePath) return
        this.recognizeFoodImage(filePath)
      },
      fail: (error) => {
        if (error && error.errMsg && /cancel/i.test(error.errMsg)) return
        this.setData({ cameraError: '没有获取到图片，请重新选择。' })
        wx.showToast({ title: '没有获取到图片', icon: 'none' })
      }
    })
  },

  async recognizeFoodImage(filePath) {
    this.setData({ cameraParsing: true, cameraError: '' })
    let uploadedFileID = ''
    try {
      const compressedPath = await this.compressFoodImage(filePath)
      const mimeType = this.getImageMimeType(compressedPath)
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: this.buildFoodCloudPath(mimeType),
        filePath: compressedPath
      })
      uploadedFileID = uploadResult && uploadResult.fileID ? uploadResult.fileID : ''
      if (!uploadedFileID) {
        throw { userMessage: '图片处理失败，请重新选择一张照片。' }
      }
      const response = await wx.cloud.callFunction({
        name: 'recognizeFoodImage',
        data: {
          fileID: uploadedFileID,
          mimeType
        }
      })
      const result = response.result || {}
      if (result.success === false) {
        const errorCode = result.error && result.error.code
        throw {
          userMessage: errorCode === 'NO_FOOD_RECOGNIZED'
            ? '没有识别到明显的食物，请换一张照片。'
            : '暂时无法识别这张图片，请重新拍摄或手动记录。'
        }
      }

      const payload = normalizeParsedDailyInput({
        ...result,
        sourceText: '图片识别'
      })
      if (!payload.foods.length) {
        throw { userMessage: '没有识别到明显的食物，请换一张照片。' }
      }

      wx.setStorageSync(STORAGE_KEYS.pendingParse, payload)
      wx.navigateTo({ url: '/pages/confirm/confirm' })
    } catch (error) {
      const message = error && error.userMessage
        ? error.userMessage
        : '图片处理失败，请重新选择一张照片。'
      this.setData({ cameraError: message })
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      if (uploadedFileID && wx.cloud && typeof wx.cloud.deleteFile === 'function') {
        wx.cloud.deleteFile({ fileList: [uploadedFileID] }).catch(() => {})
      }
      this.setData({ cameraParsing: false })
    }
  },

  compressFoodImage(filePath) {
    return new Promise((resolve, reject) => {
      const compress = (width, height) => {
        if (typeof wx.compressImage !== 'function') {
          resolve(filePath)
          return
        }
        const options = {
          src: filePath,
          quality: 70,
          success: (result) => resolve(result.tempFilePath || filePath),
          fail: reject
        }
        if (width && height) {
          options.compressedWidth = width
          options.compressedHeight = height
        }
        wx.compressImage(options)
      }

      if (typeof wx.getImageInfo !== 'function') {
        compress(1280, 1280)
        return
      }
      wx.getImageInfo({
        src: filePath,
        success: (info) => {
          const width = Number(info.width) || 0
          const height = Number(info.height) || 0
          const longestSide = Math.max(width, height)
          if (!longestSide || longestSide <= 1280) {
            compress()
            return
          }
          const scale = 1280 / longestSide
          compress(Math.round(width * scale), Math.round(height * scale))
        },
        fail: () => compress(1280, 1280)
      })
    })
  },

  buildFoodCloudPath(mimeType) {
    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
    const random = Math.random().toString(36).slice(2, 10)
    return `food-recognition/${Date.now()}-${random}.${extension}`
  },

  getImageMimeType(filePath) {
    const extension = String(filePath || '').split('.').pop().toLowerCase()
    if (extension === 'png') return 'image/png'
    if (extension === 'webp') return 'image/webp'
    return 'image/jpeg'
  },

  async loadDailyRecord(date, profile) {
    const app = getApp()
    if (!app.globalData.cloudReady) {
      this.applyDailyRecord(null, profile)
      this.setData({
        loadingRecords: false,
        recordError: '云开发尚未连接，请检查环境配置后重试。',
        foodAdviceText: FOOD_ADVICE_MESSAGES.unavailable
      })
      return
    }

    this.setData({ loadingRecords: true, recordError: '' })
    try {
      const response = await wx.cloud.callFunction({
        name: 'dailyRecords',
        data: { action: 'get', date }
      })
      const result = response.result || {}
      if (result.success === false) throw new Error(result.error && result.error.message)
      this.applyDailyRecord(result.record, profile)
    } catch (error) {
      wx.showToast({ title: '读取今日记录失败', icon: 'none' })
      this.applyDailyRecord(null, profile)
      this.setData({
        recordError: '无法读取今日记录，请检查网络后重试。',
        foodAdviceText: FOOD_ADVICE_MESSAGES.unavailable
      })
    } finally {
      this.setData({ loadingRecords: false })
    }
  },

  retryDailyRecord() {
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    this.loadDailyRecord(formatDateKey(new Date()), profile)
  },

  async loadRecentFoods() {
    const app = getApp()
    if (!app.globalData.cloudReady) {
      this.setData({ recentFoods: [] })
      return
    }

    const range = dateRangeForDays(7, new Date())
    try {
      const response = await wx.cloud.callFunction({
        name: 'dailyRecords',
        data: {
          action: 'range',
          startDate: range.startDate,
          endDate: range.endDate
        }
      })
      const result = response.result || {}
      if (result.success === false) throw new Error('recent foods unavailable')
      this.setData({ recentFoods: buildRecentFoods(result.records, { limit: 6, recentReserve: 2 }) })
    } catch (error) {
      this.setData({ recentFoods: [] })
    }
  },

  selectRecentFood(event) {
    const index = Number(event.currentTarget.dataset.index)
    const selected = this.data.recentFoods[index]
    if (!selected) {
      wx.showToast({ title: '这条食物暂时无法添加', icon: 'none' })
      return
    }

    const food = {
      name: selected.name,
      amount: selected.amount,
      unit: selected.unit,
      meal: selected.meal,
      calories: selected.calories,
      protein: selected.protein,
      carbs: selected.carbs,
      fat: selected.fat,
      estimated: selected.estimated
    }
    const payload = normalizeParsedDailyInput({
      sourceText: `最近吃过：${food.name}`,
      confidence: 1,
      foods: [food],
      exercises: []
    })
    wx.setStorageSync(STORAGE_KEYS.pendingParse, payload)
    wx.navigateTo({ url: '/pages/confirm/confirm' })
  },

  applyDailyRecord(record, profile) {
    const summary = summarizeDailyRecord(record, {
      targetCalories: profile.targetCalories,
      macroTargets: profile.macros
    })
    const display = this.buildTodayDisplay(summary)
    this.setData({
      foodCalories: summary.foodCalories,
      exerciseCalories: summary.exerciseCalories,
      netCalories: summary.netCalories,
      calorieDeficit: summary.calorieDeficit,
      remainingCalories: summary.remainingCalories,
      deficitStatusLabel: summary.deficitStatusLabel,
      deficitMessage: summary.deficitMessage,
      deficitTone: summary.deficitTone,
      ...display,
      foodAdviceText: buildTodayFoodAdvice(record, profile),
      macros: summary.macros,
      records: summary.records
    })
  },

  buildTodayDisplay(summary) {
    const calorieDeficit = Number(summary.calorieDeficit) || 0
    const calorieDeficitAbs = Math.abs(calorieDeficit)
    const targetBudget = (Number(summary.targetCalories) || 0) + (Number(summary.exerciseCalories) || 0)
    const progress = targetBudget > 0
      ? Math.min(100, Math.max(0, Math.round((Number(summary.foodCalories) || 0) / targetBudget * 100)))
      : 0
    const isOver = calorieDeficit < 0
    const progressColor = isOver ? '#FF453A' : '#34C759'

    return {
      calorieDeficitAbs,
      calorieDeficitText: `${calorieDeficit >= 0 ? '+' : '-'}${calorieDeficitAbs}`,
      calorieDeficitSizeClass: this.getDeficitSizeClass(calorieDeficitAbs),
      deficitHeadline: calorieDeficit >= 0
        ? `距离今日目标还差 ${calorieDeficitAbs} kcal`
        : `今日已超过目标 ${calorieDeficitAbs} kcal`,
      goalProgress: progress,
      goalProgressStyle: `background: conic-gradient(${progressColor} 0 ${progress}%, rgba(118, 118, 128, 0.14) ${progress}% 100%);`,
      coachSummary: this.buildCoachSummary(summary, isOver),
      coachTips: this.buildCoachTips(summary, isOver)
    }
  },

  getDeficitSizeClass(value) {
    const digitCount = String(Math.abs(Number(value) || 0)).length
    if (digitCount >= 5) return 'deficit-size-compact'
    if (digitCount >= 4) return 'deficit-size-medium'
    return 'deficit-size-large'
  },

  buildCoachSummary(summary, isOver) {
    const calorieDeficit = Math.abs(Number(summary.calorieDeficit) || 0)
    if (isOver) {
      return `今天已经超过目标 ${calorieDeficit} kcal。接下来先不要追求补偿式节食，重点是把晚间摄入控制在低热量、高蛋白、低油脂的组合里。`
    }
    return `你今天还留有 ${calorieDeficit} kcal 的空间。可以把它当作晚餐预算，优先安排蛋白质和蔬菜，把饱腹感留住。`
  },

  buildCoachTips(summary, isOver) {
    if (isOver) {
      return [
        '晚餐避免油炸、奶茶和高糖零食，选择鸡蛋、鸡胸、鱼虾或豆制品。',
        '如果体力允许，增加 20 分钟轻松步行，帮助今天的热量曲线回到可控范围。',
        '明天早餐保持清淡但不要跳过，避免因为饥饿导致下一餐失控。'
      ]
    }

    const tips = [
      '晚餐可以选择一份优质蛋白，加一份蔬菜，再搭配少量主食。',
      '如果今天蛋白质进度偏低，优先补蛋白，不要把剩余热量全部给甜食。',
      '饭后轻松步行 20 分钟，可以让今日目标更稳地完成。'
    ]
    return tips
  },

  deleteDailyItem(event) {
    const { itemType, itemId, title } = event.currentTarget.dataset
    wx.showModal({
      title: '删除记录',
      content: `确定删除“${title}”吗？`,
      confirmColor: '#d64545',
      success: async (modal) => {
        if (!modal.confirm) return
        const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
        const date = formatDateKey(new Date())
        this.setData({ deletingId: itemId })
        try {
          const response = await wx.cloud.callFunction({
            name: 'dailyRecords',
            data: { action: 'delete', date, itemType, itemId }
          })
          const result = response.result || {}
          if (result.success === false) throw new Error(result.error && result.error.message)
          this.applyDailyRecord(result.record, profile)
          wx.showToast({ title: '已删除', icon: 'success' })
        } catch (error) {
          wx.showToast({ title: '删除失败，请稍后重试', icon: 'none' })
        } finally {
          this.setData({ deletingId: '' })
        }
      }
    })
  },

  formatDateTitle(dateKey) {
    const parts = dateKey.split('-')
    return `${Number(parts[1])} 月 ${Number(parts[2])} 日`
  },

  formatGoalTag(goal) {
    if (goal === 'muscle_gain') return '增肌日'
    if (goal === 'maintain') return '维持日'
    return '减脂日'
  },

  goEntry() {
    wx.navigateTo({
      url: '/pages/entry/entry'
    })
  },

  goNutritionCoach() {
    wx.navigateTo({
      url: '/pages/nutritionCoach/nutritionCoach'
    })
  },

  onDailyInput(event) {
    this.setData({
      dailyInput: event.detail.value
    })
  },

  onInputKeyboardHeightChange(event) {
    const keyboardHeight = Number(event.detail && event.detail.height) || 0
    this.setData({
      keyboardOpen: keyboardHeight > 0
    })
  },

  onInputBlur() {
    this.setData({ keyboardOpen: false })
  },

  parseDailyInput() {
    const text = this.data.dailyInput.trim()
    const profile = wx.getStorageSync(STORAGE_KEYS.profile) || DEFAULT_PROFILE
    const app = getApp()

    if (!text) {
      this.setData({ aiError: '' })
      wx.showToast({
        title: '先写点内容',
        icon: 'none'
      })
      return
    }

    if (!app.globalData.cloudReady) {
      this.setData({
        aiError: '智能识别服务尚未连接，请检查云环境配置。'
      })
      wx.showToast({
        title: '云开发未初始化',
        icon: 'none'
      })
      return
    }

    this.setData({ parsing: true, aiError: '' })

    wx.cloud.callFunction({
      name: 'parseDailyInput',
      data: { text, profile },
      success: (res) => {
        const result = res.result || {}
        if (result.success === false) {
          const rawMessage = result.error && result.error.message
            ? result.error.message
            : '智能识别失败，请稍后重试。'
          const message = this.normalizeRecognitionMessage(rawMessage)
          this.setData({ aiError: message })
          wx.showToast({
            title: message,
            icon: 'none'
          })
          return
        }

        // 统一清洗云函数返回结构，确认页只处理稳定字段。
        const payload = normalizeParsedDailyInput(result)
        wx.setStorageSync(STORAGE_KEYS.pendingParse, payload)
        this.setData({
          dailyInput: '',
          aiError: ''
        })
        wx.navigateTo({
          url: '/pages/confirm/confirm'
        })
      },
      fail: (error) => {
        this.setData({
          aiError: '智能识别失败，请检查网络后重试。'
        })
        wx.showToast({
          title: '识别失败',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ parsing: false })
      }
    })
  },

  normalizeRecognitionMessage(message) {
    const legacyPrefix = String.fromCharCode(65, 73)
    return String(message || '')
      .replace(new RegExp(`${legacyPrefix}\\s*服务`, 'g'), '智能识别服务')
      .replace(new RegExp(`${legacyPrefix}\\s*解析`, 'g'), '智能识别')
  }
})
