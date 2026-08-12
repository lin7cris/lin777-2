const HOLD_THRESHOLD_MS = 350
const CANCEL_DISTANCE_PX = 60

Component({
  properties: {
    value: { type: String, value: '' },
    parsing: { type: Boolean, value: false },
    voiceStatus: { type: String, value: 'idle' },
    voiceDurationText: { type: String, value: '0:00' },
    voiceCanceling: { type: Boolean, value: false },
    voiceError: { type: String, value: '' },
    imageParsing: { type: Boolean, value: false }
  },

  lifetimes: {
    detached() {
      this.clearHoldTimer()
    }
  },

  methods: {
    onInput(event) {
      this.triggerEvent('input', { value: event.detail.value })
    },

    onSubmit() {
      if (this.data.parsing || this.data.voiceStatus === 'recording' || this.data.voiceStatus === 'transcribing') return
      this.triggerEvent('submit')
    },

    onCameraTap() {
      if (this.data.imageParsing || this.data.voiceStatus === 'recording' || this.data.voiceStatus === 'transcribing') return
      this.triggerEvent('cameratap')
    },

    onMicTap() {
      if (this.suppressTap) {
        this.suppressTap = false
        return
      }
      if (this.data.voiceStatus === 'transcribing' || this.data.voiceStatus === 'requestingPermission') return
      if (this.data.voiceStatus === 'recording') {
        this.triggerEvent('voicestop')
      } else {
        this.triggerEvent('voicestart')
      }
    },

    onMicTouchStart(event) {
      if (this.data.voiceStatus === 'transcribing' || this.data.voiceStatus === 'requestingPermission') return
      const touch = event.touches && event.touches[0]
      this.touchStartY = touch ? touch.clientY : 0
      this.holdRecording = false
      this.holdCanceling = false
      this.clearHoldTimer()
      this.holdTimer = setTimeout(() => {
        if (this.data.voiceStatus === 'recording') return
        this.holdRecording = true
        this.triggerEvent('voicestart')
      }, HOLD_THRESHOLD_MS)
    },

    onMicTouchMove(event) {
      if (!this.holdRecording) return
      const touch = event.touches && event.touches[0]
      const canceling = Boolean(touch && this.touchStartY - touch.clientY >= CANCEL_DISTANCE_PX)
      if (canceling === this.holdCanceling) return
      this.holdCanceling = canceling
      this.triggerEvent('voicecancelchange', { canceling })
    },

    onMicTouchEnd() {
      this.clearHoldTimer()
      if (!this.holdRecording) return

      this.suppressTap = true
      if (this.holdCanceling) {
        this.triggerEvent('voicecancel')
      } else {
        this.triggerEvent('voicestop')
      }
      this.holdRecording = false
      this.holdCanceling = false
    },

    onMicTouchCancel() {
      this.clearHoldTimer()
      if (!this.holdRecording) return
      this.suppressTap = true
      this.triggerEvent('voicecancel')
      this.holdRecording = false
      this.holdCanceling = false
    },

    onKeyboardHeightChange(event) {
      this.triggerEvent('keyboardheightchange', event.detail)
    },

    onBlur() {
      this.triggerEvent('blur')
    },

    clearHoldTimer() {
      if (this.holdTimer) clearTimeout(this.holdTimer)
      this.holdTimer = null
    }
  }
})

module.exports = {
  HOLD_THRESHOLD_MS,
  CANCEL_DISTANCE_PX
}
