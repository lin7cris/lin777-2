const https = require('https')

function requestJson(url, options) {
  const config = options || {}
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: config.method || 'POST',
      headers: config.headers || {},
      timeout: config.timeout || 30000
    }, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { body += chunk })
      response.on('end', () => {
        let parsed
        try {
          parsed = body ? JSON.parse(body) : {}
        } catch (error) {
          const parseError = new Error('VITA returned invalid JSON')
          parseError.code = 'VITA_REQUEST_FAILED'
          parseError.requestId = response.headers['x-request-id'] || ''
          return reject(parseError)
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          const apiError = new Error(String(parsed.error && (parsed.error.message || parsed.error) || 'VITA request failed'))
          apiError.code = 'VITA_REQUEST_FAILED'
          apiError.requestId = String(parsed.request_id || response.headers['x-request-id'] || '')
          return reject(apiError)
        }
        resolve(parsed)
      })
    })

    request.on('timeout', () => {
      request.destroy(new Error('VITA request timed out'))
    })
    request.on('error', (error) => {
      if (!error.code) error.code = 'VITA_REQUEST_FAILED'
      reject(error)
    })
    request.write(config.body || '')
    request.end()
  })
}

module.exports = { requestJson }
