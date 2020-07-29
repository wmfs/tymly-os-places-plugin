class OsAddressLookup {
  init (resourceConfig, env) {
    this.services = env.bootedServices
  }

  async run (event, context) {
    const { query = '', offset = 0, limit = 10 } = event
    const osPlaces = this.services.osPlaces

    const res = await osPlaces.searchAddress({ query, offset, limit })
    context.sendTaskSuccess(res)
  }
}

module.exports = OsAddressLookup
