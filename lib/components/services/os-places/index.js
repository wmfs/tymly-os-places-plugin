'use strict'

const axios = require('axios')

class OsPlacesService {
  async boot (options) {
    this.apiKey = process.env.OS_PLACES_API_KEY || 'DISABLED'

    if (this.apiKey === 'DISABLED') {
      options.messages.detail('OS_PLACES_API_KEY is not set')
      return
    }

    this.addressLookupReceiptModel = options.bootedServices.storage.models.osPlaces_addressLookupReceipts
  }

  async searchAddress (options = {}) {
    let queryString
    const { query = '', lookupType, offset = 0, limit = 10 } = options
    if (lookupType === 'uprn') {
      this.apiUrl = `https://api.ordnancesurvey.co.uk/places/v1/addresses/uprn?key=${this.apiKey}`
    } else {
      this.apiUrl = `https://api.ordnancesurvey.co.uk/places/v1/addresses/find?key=${this.apiKey}`
    }

    const receipt = { query, qOffset: offset, qLimit: limit }

    if (this.apiKey === 'DISABLED') {
      options.messages.detail('OS_PLACES_API_KEY is not set')
      return { results: [], totalHits: 0 }
    }

    if (query === '') {
      console.error('Cannot search address without a query string')
      await this.addressLookupReceiptModel.create({ ...receipt, status: 'FAILED', errorMessage: 'Cannot search address without a query string', totalHits: 0 })
      return { results: [], totalHits: 0 }
    }

    if (lookupType === 'uprn') {
      queryString = `${this.apiUrl}&uprn=${encodeURIComponent(query)}`
    } else {
      queryString = `${this.apiUrl}&query=${encodeURIComponent(query)}&offset=${offset}&maxresults=${limit}&dataset=DPA,LPI`
    }

    try {
      const { data } = await axios.get(queryString)

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
