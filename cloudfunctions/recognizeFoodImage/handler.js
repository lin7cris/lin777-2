const { FoodImageError, friendlyError } = require('./errors')
const { normalizeImageInput, normalizeFoodResult } = require('./schema')
const { createVitaProvider } = require('./provider-vita')

function createRecognizeFoodImageHandler(options) {
  const config = options || {}
  const cloud = config.cloud
  const recognize = config.recognize || ((input) => createVitaProvider().recognize(input))
  const logger = config.logger || console

  return async function recognizeFoodImageHandler(event) {
    const fileID = String(event && event.fileID || '').trim()
    try {
      let input
      if (fileID) {
        if (!cloud || typeof cloud.downloadFile !== 'function') {
          throw new FoodImageError('CLOUD_FILE_FAILED', 'cloud storage is unavailable')
        }
        const downloaded = await cloud.downloadFile({ fileID })
        if (!downloaded || !downloaded.fileContent) {
          throw new FoodImageError('CLOUD_FILE_FAILED', 'cloud file content is empty')
        }
        input = normalizeImageInput({
          imageBase64: Buffer.from(downloaded.fileContent).toString('base64'),
          mimeType: String(event && event.mimeType || 'image/jpeg').toLowerCase()
        })
      } else {
        input = normalizeImageInput(event)
      }
      const result = normalizeFoodResult(await recognize(input))
      if (!result.foods.length) {
        throw new FoodImageError('NO_FOOD_RECOGNIZED', 'no food was recognized')
      }
      return { success: true, ...result }
    } catch (error) {
      const safeError = friendlyError(error)
      logger.error('recognizeFoodImage failed', {
        code: safeError.code,
        message: error && error.message ? error.message : safeError.message,
        requestId: safeError.requestId
      })
      return { success: false, error: safeError, foods: [], summary: '', warning: safeError.message }
    } finally {
      if (fileID && cloud && typeof cloud.deleteFile === 'function') {
        try {
          await cloud.deleteFile({ fileList: [fileID] })
        } catch (error) {
          logger.error('recognizeFoodImage cleanup failed', {
            code: error && error.code ? error.code : 'CLOUD_FILE_DELETE_FAILED',
            message: error && error.message ? error.message : 'cloud file cleanup failed',
            requestId: error && (error.requestId || error.RequestId) ? (error.requestId || error.RequestId) : ''
          })
        }
      }
    }
  }
}

module.exports = { createRecognizeFoodImageHandler }
