const { formatDateKey } = require('../../utils/records')

Page({
  data: {
    messages: [],
    draft: '',
    loadingHistory: true,
    sending: false,
    error: '',
    scrollIntoView: ''
  },

  onLoad() {
    this.loadHistory()
  },

  async loadHistory() {
    const app = getApp()
    if (!app.globalData.cloudReady) {
      this.setData({ loadingHistory: false, error: '云开发尚未连接，请稍后重试。' })
      return
    }

    try {
      const response = await wx.cloud.callFunction({ name: 'nutritionChat', data: { action: 'history' } })
      const result = response.result || {}
      if (result.success === false) throw new Error(result.error && result.error.message || '读取咨询记录失败')
      const messages = (Array.isArray(result.messages) ? result.messages : []).map((item, index) => ({
        id: item._id || `history-${index}`,
        role: item.role === 'assistant' ? 'assistant' : 'user',
        message: item.message || ''
      }))
      const lastMessage = messages[messages.length - 1]
      this.setData({ messages, loadingHistory: false, scrollIntoView: lastMessage ? lastMessage.id : '' })
    } catch (error) {
      this.setData({ loadingHistory: false, error: error && error.message || '读取咨询记录失败，请稍后重试。' })
    }
  },

  onDraftInput(event) {
    this.setData({ draft: event.detail.value })
  },

  async sendMessage() {
    const message = String(this.data.draft || '').trim()
    if (!message || this.data.sending) return

    const app = getApp()
    if (!app.globalData.cloudReady) {
      this.setData({ error: '云开发尚未连接，请稍后重试。' })
      return
    }

    const clientId = `message-${Date.now()}`
    const optimistic = { id: clientId, role: 'user', message }
    const messages = this.data.messages.concat(optimistic)
    this.setData({ messages, draft: '', sending: true, error: '', scrollIntoView: clientId })

    try {
      const response = await wx.cloud.callFunction({
        name: 'nutritionChat',
        data: { action: 'ask', message, date: formatDateKey(new Date()) }
      })
      const result = response.result || {}
      if (result.success === false) throw new Error(result.error && result.error.message || '营养师暂时无法回复')
      const assistantId = `message-${Date.now()}-assistant`
      this.setData({
        messages: this.data.messages.concat({ id: assistantId, role: 'assistant', message: result.answer || '' }),
        scrollIntoView: assistantId
      })
    } catch (error) {
      this.setData({
        messages: this.data.messages.filter((item) => item.id !== clientId),
        draft: message,
        error: error && error.message || '营养师暂时无法回复，请稍后重试。'
      })
    } finally {
      this.setData({ sending: false })
    }
  }
})
