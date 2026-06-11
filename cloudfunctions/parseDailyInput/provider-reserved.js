const { AiProviderError } = require('./errors')

function createReservedProvider(name) {
  return {
    name,
    model: '',
    async parseDailyInput() {
      throw new AiProviderError('PROVIDER_NOT_IMPLEMENTED', `${name} provider is not implemented`)
    }
  }
}

module.exports = {
  createReservedProvider
}
