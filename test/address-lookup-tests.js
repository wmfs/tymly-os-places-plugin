/* eslint-env mocha */

const expect = require('chai').expect
const tymly = require('@wmfs/tymly')
const path = require('path')

describe('OS Address Lookup Tests', function () {
  this.timeout(process.env.TIMEOUT || 5000)

  let statebox, osPlaces, receiptModel

  before(function () {
    if (!process.env.OS_PLACES_API_KEY) {
      console.log('Missing environment variable OS_PLACES_API_KEY')
      this.skip()
    }
  })

  it('boot Tymly', done => {
    tymly.boot(
      {
        pluginPaths: [
          path.resolve(__dirname, '../')
        ],
        blueprintPaths: [
          path.resolve(__dirname, './fixtures/test-blueprint')
        ]
      },
      async (err, services) => {
        if (err) return done(err)

        statebox = services.statebox
        osPlaces = services.osPlaces
        receiptModel = services.storage.models.osPlaces_addressLookupReceipts

        done()
      }
    )
  })

  describe('Address Lookup - service function', function () {
    it('test the address lookup with query=kebab', async () => {
      const res = await osPlaces.searchAddress({ query: 'kebab' })
      expect(res.results.length).to.eql(10)
    })

    it('test the address lookup with query=null', async () => {
      const res = await osPlaces.searchAddress({})
      expect(res.results.length).to.eql(0)
    })

    it('test the address lookup with no parameters', async () => {
      const res = await osPlaces.searchAddress()
      expect(res.results.length).to.eql(0)
    })

    it('test the address lookup with bad query for URL', async () => {
      const res = await osPlaces.searchAddress({ query: 'kebab % & 123 ?' })
      expect(res.results.length).to.eql(10)
    })
  })

  describe('Address Lookup - state resource', function () {
    const stateMachine = 'tymlyTest_addressSearch'

    it('test the address lookup with query=kebab', async () => {
      const execDesc = await statebox.startExecution(
        { query: 'kebab' },
        stateMachine,
        { sendResponse: 'COMPLETE', userId: 'Dave' }
      )

      expect(execDesc.currentResource).to.eql('module:osAddressLookup')
      expect(execDesc.status).to.eql('SUCCEEDED')
      expect(execDesc.ctx.test.results.length).to.eql(10)
    })

    it('test the address lookup with no input', async () => {
      const execDesc = await statebox.startExecution(
        {},
        stateMachine,
        { sendResponse: 'COMPLETE', userId: 'Dave' }
      )

      expect(execDesc.currentResource).to.eql('module:osAddressLookup')
      expect(execDesc.status).to.eql('SUCCEEDED')
      expect(execDesc.ctx.test.results.length).to.eql(0)
    })
  })

  describe('check receipt model for succeeded/failed receipts', function () {
    it('find all', async () => {
      const res = await receiptModel.find({})
      expect(res.length).to.eql(6)

      const succeededRes = res.filter(r => r.status === 'SUCCEEDED')
      expect(succeededRes.length).to.eql(3)

      const failedRes = res.filter(r => r.status === 'FAILED')
      expect(failedRes.length).to.eql(3)
    })
  })
})
