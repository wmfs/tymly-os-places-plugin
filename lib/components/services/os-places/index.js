'use strict'

const axios = require('axios')

class OsPlacesService {
  async boot (options) {
    this.apiKey = process.env.OS_PLACES_API_KEY || 'DISABLED'

    if (this.apiKey === 'DISABLED') {
      options.messages.detail('OS_PLACES_API_KEY is not set')
      return
    }

    this.apiUrl = `https://api.ordnancesurvey.co.uk/places/v1/addresses/find?key=${this.apiKey}`
  }

  async searchAddress (options = {}) {
    const { query = '', offset = 0, limit = 10 } = options

    if (query === '') {
      console.error(`Cannot search address without a query string`)
      return []
    }

    try {
      const { data } = await axios.get(`${this.apiUrl}&query=${query}&offset=${offset}&maxresults=${limit}`)

      return data.results
    } catch (err) {
      console.error(`There was an error trying to search address: ${query}`)
      console.error(err)

      return []
    }
  }
}

module.exports = {
  serviceClass: OsPlacesService
}
