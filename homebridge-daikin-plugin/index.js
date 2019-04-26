const { Service, Characteristic, uuid: UUID } = require('hap-nodejs')
const bonjour = require('bonjour')
const http = require('./http')
const mdnsResolver = require('mdns-resolver')

const PLUGIN_NAME = 'homebridge-daikin-plugin'
const PLATFORM_NAME = 'daikin-esp8266'

const MIN_TEMPERATURE = 18
const MAX_TEMPERATURE = 32

class Daikin {
  constructor (log, config) {
    this.log = log
    this.config = config

    this.bonjour = bonjour().findOne({ type: PLATFORM_NAME })
    this.bonjour.on('up', (service) => {
      this.foundAccessory(service)
    })

    this.targetTemperature = 18
    this.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF

    this.service = new Service.Thermostat(this.config['name'])

    this.service
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .setProps({
        validValues: [
          Characteristic.TargetHeatingCoolingState.OFF,
          Characteristic.TargetHeatingCoolingState.COOL
          // I only want an on and off switch for the AC
          // Characteristic.TargetHeatingCoolingState.AUTO
        ]
      })
      .on('get', this.getTargetHeatingCoolingState.bind(this))
      .on('set', this.setTargetHeatingCoolingState.bind(this))

    this.service
      .getCharacteristic(Characteristic.TargetTemperature)
      .setProps({
        minStep: 1,
        minValue: MIN_TEMPERATURE,
        maxValue: MAX_TEMPERATURE
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
  }

  async foundAccessory (service) {
    if (service.txt.type && service.txt.type === PLATFORM_NAME) {
      const uuid = UUID.generate(service.txt.mac)
      const host = await mdnsResolver.resolve4(service.host)
      const accessoryConfig = { host: host, port: service.port, name: service.name, serial: service.txt.mac }

      this.log(host)

      // this.log('< GET /')
      // http
      //   .request({ method: 'GET', hostname: '10.0.0.34', path: '/' })
      //   .then((body) => {
      //     this.log(`> ${body}`)
      //     this.service.getCharacteristic(Characteristic.On).updateValue(body === 'on')
      //   })
      //   .catch((error) => this.log.error(error.message))
    }
  }

  getServices () {
    this.informationService = new Service.AccessoryInformation()
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, 'Mario Uher')
      .setCharacteristic(Characteristic.Model, 'LOLIN D1 mini')

    return [this.informationService, this.service]
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
    this.targetHeatingCoolingState = value
    callback()
  }

  getTargetHeatingCoolingState (callback) {
    callback(null, this.targetHeatingCoolingState)
  }
}

module.exports = (homebridge) => {
  homebridge.registerAccessory(PLUGIN_NAME, PLATFORM_NAME, Daikin)
}
