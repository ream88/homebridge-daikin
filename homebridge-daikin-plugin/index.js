const { Service, Characteristic } = require('hap-nodejs')
const bonjour = require('bonjour')
const http = require('./http')
const mdnsResolver = require('mdns-resolver')

const BONJOUR_TYPE = 'homebridge'
const PLUGIN_NAME = 'homebridge-daikin-plugin'
const PLATFORM_NAME = 'daikin-esp8266'

const DAIKIN = { MIN_TEMPERATURE: 18, MAX_TEMPERATURE: 32 }

module.exports = (homebridge) => {
  homebridge.registerAccessory(PLUGIN_NAME, PLATFORM_NAME, Daikin)
}

class Daikin {
  constructor (log, config) {
    this.log = log
    this.config = config
    this.host = null

    // TODO: Remove state
    this.targetTemperature = 18

    this.service = new Service.Thermostat(this.config['name'])

    this.service
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .setProps({
        validValues: [
          // I only want an on and off switch for the AC
          Characteristic.TargetHeatingCoolingState.OFF,
          Characteristic.TargetHeatingCoolingState.COOL
        ]
      })
      .on('get', this.getTargetHeatingCoolingState.bind(this))
      .on('set', this.setTargetHeatingCoolingState.bind(this))

    this.service
      .getCharacteristic(Characteristic.TargetTemperature)
      .setProps({
        minStep: 1,
        minValue: DAIKIN.MIN_TEMPERATURE,
        maxValue: DAIKIN.MAX_TEMPERATURE
      })
      .on('get', this.getTargetTemperature.bind(this))
      .on('set', this.setTargetTemperature.bind(this))

    this.service
      .getCharacteristic(Characteristic.CurrentTemperature)
      .setValue(18)

    // this.service
    //   .getCharacteristic(Characteristic.CurrentRelativeHumidity)

    // this.service
    //   .getCharacteristic(Characteristic.TemperatureDisplayUnits)

    this.findESP8266()
  }

  findESP8266 () {
    bonjour().findOne({ type: BONJOUR_TYPE }, async (service) => {
      try {
        this.host = await this.resolveHost(service)
        this.log(`Found the ESP8266 running at ${this.host}`)

        http
          .request({ method: 'GET', hostname: this.host, path: '/' })
          .then((body) => {
            this.service.getCharacteristic(Characteristic.On).updateValue(body === 'on')
          })
          .catch((error) => this.log.error(error.message))
      } catch (err) {
        this.log.error(err)
      } finally {
        setTimeout(() => this.findESP8266(), 60000)
      }
    })
  }

  async resolveHost (service) {
    const host = await mdnsResolver.resolve4(service.host)

    switch (service.txt.type) {
      case PLATFORM_NAME:
        return host

      default:
        return Promise.reject(new Error(`Found an ESP8266 running at ${host}, however its type \`${service.txt.type}\` is not compatible with \`${PLATFORM_NAME}\`!`))
    }
  }

  // @implements {homebridge/lib/server.js}
  getServices () {
    const info = new Service.AccessoryInformation()
      .setCharacteristic(Characteristic.Manufacturer, 'Mario Uher')
      .setCharacteristic(Characteristic.Model, 'LOLIN D1 mini')

    return [info, this.service]
  }

  setTargetTemperature (value, callback) {
    this.log(`setTargetTemperature: ${value}`)
    this.targetTemperature = value
    callback()
  }

  getTargetTemperature (callback) {
    callback(null, this.targetTemperature)
  }

  setTargetHeatingCoolingState (value, callback) {
    this.log(`setTargetHeatingCoolingState: ${value}`)

    if (this.host === null) {
      this.log.warn('Host is null')
      return
    }

    let on = value === Characteristic.TargetHeatingCoolingState.COOL

    http
      .request({ method: 'POST', hostname: this.host, body: on ? 'on' : 'off' })
      .then((body) => { callback() })
      .catch((error) => this.log.error(error.message))
  }

  getTargetHeatingCoolingState (callback) {
    if (this.host === null) {
      this.log.warn('Host is null')
      return
    }

    http
      .request({ method: 'GET', hostname: this.host })
      .then((body) => { callback(null, body === 'on') })
      .catch((error) => this.log.error(error.message))
  }
}
