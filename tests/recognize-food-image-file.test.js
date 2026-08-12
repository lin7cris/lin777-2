const assert = require('assert')

const { createRecognizeFoodImageHandler } = require('../cloudfunctions/recognizeFoodImage/handler')

async function run() {
  let deletedFileId = ''
  const handler = createRecognizeFoodImageHandler({
    cloud: {
      downloadFile: async ({ fileID }) => {
        assert.strictEqual(fileID, 'cloud://food/test.jpg')
        return { fileContent: Buffer.from('real-image-bytes') }
      },
      deleteFile: async ({ fileList }) => {
        deletedFileId = fileList[0]
      }
    },
    recognize: async ({ imageBase64, mimeType }) => {
      assert.strictEqual(imageBase64, Buffer.from('real-image-bytes').toString('base64'))
      assert.strictEqual(mimeType, 'image/jpeg')
      return {
        foods: [{ name: '苹果', amount: 150, unit: 'g', calories: 78, protein: 0.4, carbs: 21, fat: 0.3 }]
      }
    },
    logger: { error() {} }
  })

  const result = await handler({ fileID: 'cloud://food/test.jpg', mimeType: 'image/jpeg' })
  assert.strictEqual(result.success, true)
  assert.strictEqual(result.foods[0].name, '苹果')
  assert.strictEqual(deletedFileId, 'cloud://food/test.jpg')
}

async function verifyCleanupOnFailure() {
  let deleted = false
  const handler = createRecognizeFoodImageHandler({
    cloud: {
      downloadFile: async () => ({ fileContent: Buffer.from('bytes') }),
      deleteFile: async () => { deleted = true }
    },
    recognize: async () => {
      const error = new Error('upstream failed')
      error.code = 'VITA_REQUEST_FAILED'
      throw error
    },
    logger: { error() {} }
  })

  const result = await handler({ fileID: 'cloud://food/failure.jpg', mimeType: 'image/jpeg' })
  assert.strictEqual(result.success, false)
  assert.strictEqual(deleted, true)
}

run().then(verifyCleanupOnFailure).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
