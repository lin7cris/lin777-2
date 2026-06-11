const { AiProviderError } = require('./errors')
const { createDeepSeekProvider } = require('./provider-deepseek')
const openai = require('./provider-openai')
const gemini = require('./provider-gemini')
const claude = require('./provider-claude')

function getProvider(name, overrides) {
  const providerName = String(name || 'deepseek').trim().toLowerCase()
  const providers = {
    deepseek: createDeepSeekProvider(),
    openai,
    gemini,
    claude,
    ...(overrides || {})
  }
  const provider = providers[providerName]

  if (!provider) {
    throw new AiProviderError('UNSUPPORTED_AI_PROVIDER', `Unsupported AI provider: ${providerName}`)
  }

  return provider
}

module.exports = {
  getProvider
}
