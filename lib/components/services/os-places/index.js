'use strict'

const axios = require('axios')

class OsPlacesService {
  async boot (options) {
    this.logger = options.bootedServices.logger.child('service:osPlaces')
    this.apiKey = process.env.OS_PLACES_API_KEY || 'DISABLED'

    if (this.apiKey === 'DISABLED') {
      options.messages.detail('OS_PLACES_API_KEY is not set')
      return
    }

    this.addressLookupReceiptModel = options.bootedServices.storage.models.osPlaces_addressLookupReceipts
    this.apiUrlPrefix = 'https://api.os.uk/search/places/v1/'
  }

  async searchAddress (options = {}) {
    const { query = '', lookupType, offset = 0, limit = 10 } = options

    if (this.apiKey === 'DISABLED') {
      this.logger.debug('OS_PLACES_API_KEY is not set')
      return { results: [], totalHits: 0 }
    }

    const receipt = { query, qOffset: offset, qLimit: limit }

    if (query === '' || !query) {
      this.logger.error('Cannot search address without a query string')
      await this.addressLookupReceiptModel.create({ ...receipt, status: 'FAILED', errorMessage: 'Cannot search address without a query string', totalHits: 0 })
      return { results: [], totalHits: 0 }
    }

    let dataset = 'DPA,LPI'

    if (options.dataset && Array.isArray(options.dataset) && options.dataset.length) {
      dataset = options.dataset.join(',')
    }

    const minmatch = options.minmatch || 0.1
    const matchprecision = options.matchprecision || 10

    const url = lookupType === 'uprn'
      ? `${this.apiUrlPrefix}uprn?key=${this.apiKey}&uprn=${encodeURIComponent(query)}&dataset=${dataset}`
      : `${this.apiUrlPrefix}find?key=${this.apiKey}&query=${encodeURIComponent(query)}&offset=${offset}&maxresults=${limit}&dataset=${dataset}&minmatch=${minmatch}&matchprecision=${matchprecision}`

    try {
      const { data } = await axios.get(url)
      const totalHits = data.header.totalresults

      await this.addressLookupReceiptModel.create({ ...receipt, status: 'SUCCEEDED', totalHits })

      return { results: data.results, totalHits }
    } catch (err) {
      console.error(`There was an error trying to search address: ${query}`)
      console.error(err)

      await this.addressLookupReceiptModel.create({ ...receipt, status: 'FAILED', errorCode: err.response.status, errorMessage: err.response.statusText, totalHits: 0 })

      return { results: [], totalHits: 0 }
    }
  }
}

module.exports = {
  serviceClass: OsPlacesService
}
