const {
  emptyDailyRecord,
  mergeDailyRecord,
  deleteDailyItem
} = require('./logic')

function validDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

function validRange(startDate, endDate) {
  if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) return false
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)
  const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1
  return days >= 1 && days <= 31
}

function createDailyRecordsHandler(options) {
  const config = options || {}
  const repository = config.repository
  const getOpenId = config.getOpenId
  const now = config.now || (() => new Date())
  const logger = config.logger || console
  const idGenerator = config.idGenerator || ((type, index) => (
    `${type}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}`
  ))

  return async function dailyRecordsHandler(event) {
    const input = event || {}
    const action = String(input.action || 'get')
    const date = String(input.date || '')
    const startDate = String(input.startDate || '')
    const endDate = String(input.endDate || '')

    try {
      const openid = String(getOpenId() || '')
      if (!openid) {
        const error = new Error('missing openid')
        error.code = 'UNAUTHORIZED'
        throw error
      }
      if (action === 'range') {
        if (!validRange(startDate, endDate)) {
          const error = new Error('invalid date range')
          error.code = 'INVALID_INPUT'
          throw error
        }
        const records = await repository.range(openid, startDate, endDate)
        return { success: true, records }
      }

      if (!validDate(date)) {
        const error = new Error('date must use YYYY-MM-DD')
        error.code = 'INVALID_INPUT'
        throw error
      }

      if (action === 'get') {
        const record = await repository.get(openid, date)
        return { success: true, record: record || emptyDailyRecord(date) }
      }

      if (action === 'save') {
        const existing = await repository.get(openid, date)
        const timestamp = now().toISOString()
        const record = mergeDailyRecord(existing, input, {
          openid,
          date,
          now: timestamp,
          idGenerator
        })
        await repository.save(openid, date, record)
        return { success: true, record }
      }

      if (action === 'delete') {
        const existing = await repository.get(openid, date)
        if (!existing) {
          const error = new Error('daily record not found')
          error.code = 'RECORD_NOT_FOUND'
          throw error
        }
        const record = deleteDailyItem(existing, input.itemType, input.itemId, {
          now: now().toISOString()
        })
        await repository.save(openid, date, record)
        return { success: true, record }
      }

      const error = new Error(`unsupported action: ${action}`)
      error.code = 'INVALID_ACTION'
      throw error
    } catch (error) {
      logger.error('dailyRecords failed', {
        action,
        code: error && error.code
      })
      return {
        success: false,
        error: {
          code: error && error.code || 'DAILY_RECORDS_ERROR',
          message: error && error.code === 'INVALID_INPUT'
            ? '日期格式不正确'
            : error && error.code === 'RECORD_NOT_FOUND'
              ? '当天记录不存在'
              : '每日记录操作失败，请稍后重试'
        }
      }
    }
  }
}

module.exports = {
  createDailyRecordsHandler
}
