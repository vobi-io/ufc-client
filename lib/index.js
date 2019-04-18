'use strict'

const rp = require('request-promise-native')
const querystring = require('querystring')
const fs = require('fs')

const Commands = Object.freeze({
  START_SMS_TRANS: 'v',
  START_DMS_AUTH: 'a',
  MAKE_DMS_TRANS: 't',
  GET_TRANS_RESULT: 'c',
  REVERSE: 'r',
  REFUND: 'k',
  CLOSE_DAY: 'b'
})

class UfcClient {
  constructor(url, sslCertPath, sslKeyPass) {
    this.url = url || 'https://securepay.ufc.ge:18443/ecomm2/MerchantHandler'
    this.sslCertPath = sslCertPath
    this.sslKeyPath = sslCertPath
    this.caCertPath = sslCertPath
    this.sslKeyPass = sslKeyPass
  }

  async sendRequest (bodyString) {
    try {
      const options = {
        url: this.url,
        cert: fs.readFileSync(this.sslCertPath),
        key: fs.readFileSync(this.sslKeyPath),
        passphrase: this.sslKeyPass,
        ca: fs.readFileSync(this.caCertPath),
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        body: bodyString
      }

      const result = await rp(options)

      return this.parseResult(result.body)
    } catch (e) {
      console.log('in sendRequest: ', e)
      return Promise.reject(e)
    }
  }

  parseResult (result) {
    try {
      const resultArr = result.split('\n')
      const resultObj = {}

      resultArr.forEach(entry => {
        const [key, value] = entry.split(':')
        resultObj[key.trim()] = value.trim()
      })

      return resultObj
    } catch (e) {
      console.log('in resultToArray: ', e)
      return Promise.reject(e)
    }
  }

  async startSMSTrans ({
    amount,
    currency = 981,
    ip = '127.0.0.1',
    language = 'GE',
    description = '',
    properties = []
  }) {
    try {
      const params = {
        command: Commands.START_SMS_TRANS,
        amount,
        currency,
        client_ip_addr: ip,
        description,
        language,
        msg_type: 'SMS'
      }
      console.log('params', params)

      const bodyString = querystring.stringify(params)

      const result = await this.sendRequest(bodyString)

      if (!result.TRANSACTION_ID) {
        throw new Error('UFC start sms trans error')
      }

      return result
    } catch (e) {
      console.log('in startSMSTrans', e)
      return Promise.reject(e)
    }
  }

  async startDMSAuth ({
    amount,
    currency = 981,
    ip = '127.0.0.1',
    language = 'GE',
    description = '',
    properties = []
  }) {
    try {
      const params = {
        command: Commands.START_DMS_AUTH,
        amount: amount,
        currency: currency,
        client_ip_addr: ip,
        description: description,
        language: language,
        msg_type: 'DMS'
      }

      const bodyString = querystring.stringify(params)

      return await this.sendRequest(bodyString)
    } catch (e) {
      console.log('in startDMSAuth', e)
      return Promise.reject(e)
    }
  }

  async makeDMSTrans ({
    authId,
    amount,
    currency = 981,
    ip = '127.0.0.1',
    language = 'GE',
    description = '',
    properties = []
  }) {
    try {
      const params = {
        command: Commands.MAKE_DMS_TRANS,
        auth_id: authId,
        amount,
        currency,
        client_ip_addr: ip,
        description,
        language,
        msg_type: 'DMS'
      }

      const bodyString = querystring.stringify(params)

      return await this.sendRequest(bodyString)
    } catch (e) {
      console.log('in makeDMSTrans', e)
      return Promise.reject(e)
    }
  }

  async getTransResult ({ transId, ip = '127.0.0.1', properties = [] }) {
    try {
      const params = {
        command: Commands.GET_TRANS_RESULT,
        trans_id: transId,
        client_ip_addr: ip
      }

      const bodyString = querystring.stringify(params)

      return await this.sendRequest(bodyString)
    } catch (e) {
      console.log('in getTransResult', e)
      return Promise.reject(e)
    }
  }

  async reverse ({
    transId,
    amount,
    suspectedFraud = '',
    properties = []
  }) {
    try {
      const bodyString = querystring.stringify({
        command: Commands.REVERSE,
        trans_id: transId,
        amount
      })

      return await this.sendRequest(bodyString)
    } catch (e) {
      console.log('in reverse', e)
      return Promise.reject(e)
    }
  }

  async refund ({ transId, properties = [] }) {
    try {
      const bodyString = querystring.stringify({
        command: Commands.REFUND,
        trans_id: transId
      })

      return await this.sendRequest(bodyString)
    } catch (e) {
      console.log('in refund', e)
      return Promise.reject(e)
    }
  }

  async closeDay ({ properties = [] }) {
    try {
      const params = {
        command: Commands.CLOSE_DAY
      }

      const bodyString = querystring.stringify(params)

      return await this.sendRequest(bodyString)
    } catch (e) {
      console.log('in closeDay', e)
      return Promise.reject(e)
    }
  }
}

module.exports = UfcClient
