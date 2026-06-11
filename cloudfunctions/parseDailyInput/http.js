const https = require('https')

const { AiProviderError } = require('./errors')

function requestJson(options) {
  const bodyText = JSON.stringify(options.body || {})
  const url = new URL(options.url)

  return new Promise((resolve, reject) => {
    const request = https.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 443,
      path: `${url.pathname}${url.search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyText),
        ...(options.headers || {})
      }
    }, (response) => {
      let responseText = ''

      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        responseText += chunk
      })
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new AiProviderError(
            'AI_HTTP_ERROR',
            `DeepSeek HTTP ${response.statusCode}`,
            { statusCode: response.statusCode }
          ))
          return
        }

        try {
          resolve(JSON.parse(responseText))
        } catch (error) {
          reject(new AiProviderError('AI_INVALID_RESPONSE', 'DeepSeek returned invalid JSON'))
        }
      })
    })

    request.setTimeout(options.timeoutMs || 20000, () => {
      request.destroy(new AiProviderError('AI_TIMEOUT', 'DeepSeek request timed out'))
    })
    request.on('error', (error) => {
      if (error && error.code === 'AI_TIMEOUT') {
        reject(error)
        return
      }
      reject(new AiProviderError('AI_HTTP_ERROR', 'DeepSeek request failed'))
    })
    request.write(bodyText)
    request.end()
  })
}

module.exports = {
  requestJson
}
