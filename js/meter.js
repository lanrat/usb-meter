"use strict";
// packets
// https://github.com/syssi/esphome-atorch-dl24/blob/main/components/atorch_dl24/button/__init__.py#L12
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// BLE Service
const UUID_SERVICE = "0000ffe0-0000-1000-8000-00805f9b34fb";
// BLE Notify
const UUID_NOTIFY = "0000ffe1-0000-1000-8000-00805f9b34fb";
class Meter {
    constructor() {
        this.device = null;
        this.running = false;
        this.characteristic = null;
        // callbacks for UI
        this.onDisconnectCallback = null;
        this.onStartCallback = null;
        this.onPacketCallback = null;
    }
    onDisconnect(event) {
        return __awaiter(this, void 0, void 0, function* () {
            // Object event.target is Bluetooth Device getting disconnected.
            var device = event.target;
            this.running = false;
            console.log('> Bluetooth Device disconnected', device.name, device.id);
            if (this.onDisconnectCallback) {
                this.onDisconnectCallback(event);
            }
        });
    }
    handleCharacteristicValueChanged(event) {
        return __awaiter(this, void 0, void 0, function* () {
            // https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTCharacteristic
            //console.log("handleCharacteristicValueChanged event:", event);
            const characteristic = event.target;
            if (!characteristic.value) {
                console.error(`got empty characteristic`);
                return;
            }
            //console.log('Received ', buf2hex(value.buffer));
            try {
                var p = new Packet(characteristic.value);
            }
            catch (e) {
                console.error("got bad packet", e);
                return;
            }
            console.log(`got packet: ${p.string()}`);
            if (this.onPacketCallback) {
                this.onPacketCallback(p, event);
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Disconnecting from Bluetooth Device...');
            if (this.characteristic) {
                yield this.characteristic.stopNotifications();
            }
            if (this.device && this.device.gatt && this.device.gatt.connected) {
                this.device.gatt.disconnect();
            }
            else {
                console.log('> Bluetooth Device is already disconnected');
            }
        });
    }
    start(device) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.running) {
                console.error("meter already running");
                return;
            }
            this.device = device;
            this.device.addEventListener('gattserverdisconnected', this.onDisconnect.bind(this));
            if (!this.device.gatt) {
                throw new Error("bluetooth device has no gatt!");
            }
            // Attempts to connect to remote GATT Server.
            return this.device.gatt.connect()
                .then(server => {
                //console.log("server: ", server);
                return server.getPrimaryService(UUID_SERVICE);
            })
                .then(service => {
                //console.log("service:", service);
                return service.getCharacteristic(UUID_NOTIFY);
            })
                .then(characteristic => {
                this.characteristic = characteristic;
                return characteristic.startNotifications();
            })
                .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', this.handleCharacteristicValueChanged.bind(this));
                console.log('Notifications have been started.');
                this.running = true;
                // TODO: sometimes need to press button to start receiving data.
                // TODO: automate by sending command, via timeout?
                if (this.onStartCallback && this.device) {
                    this.onStartCallback(this.device);
                }
            });
        });
    }
    sendPacket(packet) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.characteristic) {
                console.error("can't send if no characteristic!");
                return;
            }
            console.log("sending packet:", packet);
            return this.characteristic.writeValueWithoutResponse(packet);
        });
    }
    reset() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.running) {
                console.error("can't reset if not running!");
                return;
            }
            var packet = hex2packet(resetPacketHex);
            return yield this.sendPacket(packet);
        });
    }
}
// given a hex string, returns a packet
// does not set checksum
function hex2packet(hex) {
    var packet = new Uint8Array(hex.replaceAll('.', '').match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16);
    }));
    return packet;
}
// https://stackoverflow.com/questions/40031688/javascript-arraybuffer-to-hex
function buf2hex(buffer) {
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('.');
}
const resetPacketEnergyHex = 'FF.55.11.01.01.00.00.00.00.57';
const resetPacketCapacityHex = 'FF.55.11.01.02.00.00.00.00.50';
const resetPacketRuntimeHex = 'FF.55.11.01.03.00.00.00.00.51';
const resetPacketHex = 'FF.55.11.01.05.00.00.00.00.53';
const plusPacketHex = 'FF.55.11.01.11.00.00.00.00.67';
const minusPacketHex = 'FF.55.11.01.12.00.00.00.00.60';
const setupPacketHex = 'FF.55.11.01.31.00.00.00.00.07';
const enterPacketHex = 'FF.55.11.01.32.00.00.00.00.00';
const usbPlusPacketHex = 'FF.55.11.03.33.00.00.00.00.03';
const usbMinusPacketHex = 'FF.55.11.03.34.00.00.00.00.0c';
// offset 0
const START_OF_FRAME_BYTE1 = 0xFF;
// offset 1
const START_OF_FRAME_BYTE2 = 0x55;
// offset 2
var MESSAGE;
(function (MESSAGE) {
    MESSAGE[MESSAGE["REPORT"] = 1] = "REPORT";
    MESSAGE[MESSAGE["REPLY"] = 2] = "REPLY";
    MESSAGE[MESSAGE["COMMAND"] = 17] = "COMMAND";
})(MESSAGE || (MESSAGE = {}));
// offset 3
var DEVICE_TYPE;
(function (DEVICE_TYPE) {
    DEVICE_TYPE[DEVICE_TYPE["AC"] = 1] = "AC";
    DEVICE_TYPE[DEVICE_TYPE["DC"] = 2] = "DC";
    DEVICE_TYPE[DEVICE_TYPE["USB"] = 3] = "USB";
})(DEVICE_TYPE || (DEVICE_TYPE = {}));
const REPORT_PACKET_LEN = 36;
class Packet {
    constructor(data) {
        this.data1 = null;
        this.data2 = null;
        if (data.byteLength < 2 || data.getUint8(0) != START_OF_FRAME_BYTE1 || data.getUint8(1) != START_OF_FRAME_BYTE2) {
            var e = new Error(`unexpected header: ${data}`);
            console.error(e);
            throw e;
        }
        if (data.byteLength != REPORT_PACKET_LEN) {
            var e = new Error(`invalid packet length: ${data}`);
            console.error(e);
            throw e;
        }
        this.msg = data.getUint8(2);
        this.msg_name = MESSAGE[this.msg];
        if (this.msg != MESSAGE.REPORT) {
            var e = new Error(`"unexpected message type: ${this.msg}, ${this.msg_name}`);
            console.error(e);
            throw e;
        }
        this.type = data.getUint8(3);
        this.type_name = DEVICE_TYPE[this.type];
        if (this.type == DEVICE_TYPE.DC) {
            this.voltage = data.getUint24(4) / 10; // volts
            this.current = data.getUint24(7) / 1000; // amps
            this.capacity = data.getUint24(10) * 10; // mAh
            this.energy = 0; // Wh
        }
        else {
            this.voltage = data.getUint24(4) / 100; // volts
            this.current = data.getUint24(7) / 100; // amps
            this.capacity = data.getUint24(10); // mAh
            this.energy = data.getUint32(13) / 100; // Wh
        }
        this.power = Math.round(100 * this.voltage * this.current) / 100; // W
        this.resistance = Math.round(100 * this.voltage / this.current) / 100; // resistance 
        // other types untested
        if (this.type == DEVICE_TYPE.USB) {
            this.data1 = data.getUint16(17) / 100; // D-
            this.data2 = data.getUint16(19) / 100; // D+
        }
        if (this.type == DEVICE_TYPE.DC) {
            this.temp = data.getUint16(24); // Temp (C)
        }
        else {
            this.temp = data.getUint16(21); // Temp (C)
        }
        if (this.type == DEVICE_TYPE.DC) {
            this.duration_raw = {
                hour: data.getUint16(26),
                minute: data.getUint8(28),
                second: data.getUint8(29),
            };
        }
        else {
            this.duration_raw = {
                hour: data.getUint16(23),
                minute: data.getUint8(25),
                second: data.getUint8(26),
            };
        }
        this.duration = Packet.durationString(this.duration_raw);
        this.backlightTime = data.getUint8(27);
        this.time = new Date();
        // settings
        this.over_voltage_protection = data.getUint16(28) / 100;
        this.lower_voltage_protection = data.getUint16(30) / 100;
        this.over_current_protection = data.getUint16(32) / 100;
        // checksum
        // p.checksum = data.getUint8(35);
        // const payload = new Uint8Array(data.buffer.slice(2, -1));
        // console.log("payload for crc", buf2hex(payload));
        // const checksum = payload.reduce((acc, item) => (acc + item) & 0xff, 0) ^ 0x44;
        // p.checksum_valid = (p.checksum == checksum);
        //p.checksum_valid = Packet.validateChecksum(data.buffer);
    }
    string() {
        return `[${this.time.toLocaleString()}] ${this.voltage.toFixed(2)}V ${this.current.toFixed(2)}A ${this.temp}°C ${this.capacity}mAh ${this.energy.toFixed(2)}Wh (${this.duration})`;
    }
    static durationString(duration) {
        return `${Packet.pad(duration.hour, 3)}:${Packet.pad(duration.minute, 2)}:${Packet.pad(duration.second, 2)}`;
    }
    static pad(s, n) {
        return String(s).padStart(n, '0');
    }
    // https://github.com/NiceLabs/atorch-console/blob/master/docs/protocol-design.md#checksum-algorithm
    // TODO: can't seem to get this to work with the packets I receive
    // https://jsfiddle.net/3xmv6u0b/95/
    // https://github.com/NiceLabs/atorch-console/blob/master/src/service/atorch-packet/packet-meter-usb.spec.ts
    static validateChecksum(buffer) {
        const packet = new Uint8Array(buffer);
        console.log("validateChecksum in: ", buf2hex(buffer));
        console.log("validateChecksum packet: ", buf2hex(packet));
        const payload = packet.slice(2, -1);
        const checksum = payload.reduce((acc, item) => (acc + item) & 0xff, 0) ^ 0x44;
        const checksum_packet = packet[packet.length - 1];
        var result = checksum_packet == checksum;
        if (!result) {
            console.error(`checksum failure, got ${checksum.toString(16)}, expected ${checksum_packet.toString(16)}`);
        }
        return result;
    }
}
DataView.prototype.getUint24 = function (pos) {
    var val1 = this.getUint16(pos);
    var val2 = this.getUint8(pos + 2);
    return (val1 << 8) | val2;
};
//# sourceMappingURL=meter.js.map