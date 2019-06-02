<p align="center">
  <img src="https://github.com/ream88/homebridge-esp8266-example/blob/master/logo.png" width="382" />
</p>

# homebridge-esp8266-example

This is an example for building custom HomeKit appliances using
[Homebridge](https://homebridge.io) and ESP8266-based micro-controllers.

## [sketch](/sketch)

This is an Arduino sketch for any ESP8266-based micro-controller which allows
the built-in LED to be toggled on and off via a simple HTTP API:

```
curl http://10.0.0.34
# => "on" or "off"

curl -d on http://10.0.0.34
# => "on"

curl -d off http://10.0.0.34
# => "off"
```

### Usage

Be sure to create a `sketch/config.h` based on `sketch/config.example.h` using
your WiFi credentials. Either use the Arduino IDE or [something which builds
upon the
IDE](https://marketplace.visualstudio.com/items?itemName=vsciot-vscode.vscode-arduino)
to compile and flash this sketch onto the micro-controller. After booting and
obtaining an IP the HTTP API should be ready and accepting your requests.

## [homebridge-esp8266-plugin](/homebridge-esp8266-plugin)

This is a custom Homebridge plugin providing a simple switch accessory which
allows you to toggle the LED via  the Home app on iOS/macOS or by using Siri on
your Apple device including HomePod.

### Usage

Nothing special here if you're used to Homebridge, just install the dependencies
and start Homebridge:

```
npm install
npm start
```

## Links

The main inspiration and some HomeKit terms explained.

- https://github.com/oznu/homekit-daikin-ir-thermostat
- https://github.com/oznu/homebridge-daikin-esp8266
- http://blog.theodo.fr/2017/08/make-siri-perfect-home-companion-devices-not-supported-apple-homekit/
- https://github.com/KhaosT/HAP-NodeJS/blob/81319b35d1588453cfcb1a823805643de7df74dc/lib/gen/HomeKitTypes.js

Alternatives, not considered yet.

- https://github.com/pfalcon/esp-open-sdk/
- https://github.com/maximkulkin/esp-homekit-demo
- https://diyprojects.io/project-esp8266-homekit-sha-2017-direct-inclusion-ios-without-homebridge/#.XIZniy2ZNGw
- https://www.predic8.de/mqtt.htm

## TODOs

- [x] Implement [bonjour](https://www.npmjs.com/package/bonjour) to get rid of fixed IPs.
- [x] Switch from a single accessory to a Homebridge platform with multiple ones.
- [ ] Try out MQTT.
