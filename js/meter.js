const resetPacketHex = 'FF.55.11.01.05.00.00.00.00.53';

class Meter {
    constructor() {
        this.device = null;
        this.running = false;
        this.characteristic = null;
        this.max_data = 60 * 60; // ~1 hour
        // callbacks for UI
        this.onDisconnectCallback = null;
        this.onStartCallback = null;
        this.onPacketCallback = null;
    }

    async onDisconnect(event) {
        // Object event.target is Bluetooth Device getting disconnected.
        this.running = false;
        console.log('> Bluetooth Device disconnected', event);
        if (this.onDisconnectCallback) {
            this.onDisconnectCallback(event);
        }
    }

    async handleCharacteristicValueChanged(event) {
        // https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTCharacteristic
        //console.log("handleCharacteristicValueChanged event:", event);
        const value = event.target.value;
        //console.log('Received ', buf2hex(value.buffer));
        var p = parse(value);
        console.log(`got packet: ${packetStr(p)}`);
        if (this.onPacketCallback) {
            this.onPacketCallback(p, event);
        }
    }

    async disconnect() {
        console.log('Disconnecting from Bluetooth Device...');
        if (this.characteristic) {
            await this.characteristic.stopNotifications();
        }
        if (this.device && this.device.gatt.connected) {
            meter.device.gatt.disconnect();
        } else {
            console.log('> Bluetooth Device is already disconnected');
        }
    }

    async start(device) {
        if (this.running) {
            console.error("meter already running");
            return;
        }
        this.device = device;
        this.device.addEventListener('gattserverdisconnected', meter.onDisconnect.bind(this));
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
                characteristic.addEventListener('characteristicvaluechanged',
                    this.handleCharacteristicValueChanged.bind(this));
                console.log('Notifications have been started.');
                this.running = true;
                // TODO: sometimes need to press button to start receiving data.
                // TODO: automate by sending command, via timeout?
                if (this.onStartCallback) {
                    this.onStartCallback(this.device);
                }
            });
    }

    async sendPacket(packet) {
        if (!this.characteristic) {
            console.error("can't send if no characteristic!");
            return;
        }
        console.log("sending packet:", packet);
        return this.characteristic.writeValueWithoutResponse(packet);
    }

    async reset() {
        if (!this.running) {
            console.error("can't reset if not running!");
            return;
        }
        var packet = hex2packet(resetPacketHex);
        return await this.sendPacket(packet)
    }

}

// given a hex string, returns a packet
// does not set checksum
function hex2packet(hex) {
    var packet = new Uint8Array(resetPacketHex.replaceAll('.','').match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
    }));
    return packet;
}

// https://stackoverflow.com/questions/40031688/javascript-arraybuffer-to-hex
function buf2hex(buffer) { // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('.');
}


// BLE Service
const UUID_SERVICE = "0000ffe0-0000-1000-8000-00805f9b34fb";
// BLE Notify
const UUID_NOTIFY = "0000ffe1-0000-1000-8000-00805f9b34fb";


// offset 0
const START_OF_FRAME_BYTE1 = 0xFF;
// offset 1
const START_OF_FRAME_BYTE2 = 0x55;

// offset 2
const MESSAGE = {
    REPORT: 0x01,
    REPLY: 0x02,
    COMMAND: 0x11,
}
const msgMap = new Map([
    [MESSAGE.REPORT, "report"],
    [MESSAGE.REPLY, "reply"],
    [MESSAGE.COMMAND, "command"],
]);

// offset 3
const DEVICE_TYPE = {
    AC: 0x01,
    DC: 0x02,
    USB: 0x03,
}
const typeMap = new Map([
    [DEVICE_TYPE.AC, "AC"],
    [DEVICE_TYPE.DC, "DC"],
    [DEVICE_TYPE.USB, "USB"],
]);

const REPORT_PACKET_LEN = 36;

/*
example packet:
ff-55-01-03-00-02-07-00-00-00-00-02-7b-00-00-02-3c-00-0b-00-0a-00-17-00-01-31-1e-3c-0c-80-00-00-03-20-00-d1
00-01-02-03-04-05-06-07-08-09-10-11-12-13-14-15-16-17-18-19-20-21-22-23-24-25-26-27-28-29-30-31-32-33-34-35
00-01: Header
      02: Msg Type
         03: device type
            04-05-06: Voltage
                     07-08-09: Amps
                               10-11-12: Ah
                                       13-14-15-16: Wh
                                                   17-18: Data 1 (-)
                                                         19-20: Data 2 (+)
                                                               21-22: Temp (C)
                                                                     23-24: Hours
                                                                           25: Minutes
                                                                              26: Seconds
                                                                                 27: backlightTime
                                                                                    28-29: Over Voltage Protection Setting
                                                                                          30-31: Under Voltage Protection Setting
                                                                                                32-33: Over Current Protection Setting
                                                                                                      34: ?????
                                                                                                         35: CRC
00-01-02-03-04-05-06-07-08-09-10-11-12-13-14-15-16-17-18-19-20-21-22-23-24-25-26-27-28-29-30-31-32-33-34-35
*/

function parse(data) {
    if (data.byteLength < 2 || data.getUint8(0) != START_OF_FRAME_BYTE1 || data.getUint8(1) != START_OF_FRAME_BYTE2) {
        console.error("unexpected header", data);
        return;
    }
    if (data.byteLength != REPORT_PACKET_LEN) {
        console.error("invalid packet length");
        return;
    }

    var p = {};
    p.msg = data.getUint8(2);
    p.msg_name = msgMap.get(p.msg);

    if (p.msg != MESSAGE.REPORT) {
        console.error("unexpected message type:", p.msg, p.msg_name);
        return p;
    }

    p.type = data.getUint8(3);
    p.type_name = typeMap.get(p.type);

    p.voltage = data.getUint24(4) / 100; // volts
    p.current = data.getUint24(7) / 100; // amps
    p.power = Math.round(100 * p.voltage * p.current) / 100; // W
    p.resistance = Math.round(100 * p.voltage / p.current) / 100; // resistance 

    p.capacity = data.getUint24(10); // mAh
    p.energy = data.getUint32(13) / 100; // Wh

    // other types untested
    if (p.type == DEVICE_TYPE.USB) {
        p.data1 = data.getUint16(17) / 100; // D-
        p.data2 = data.getUint16(19) / 100; // D+
    }

    p.temp = data.getUint16(21); // Temp (C)

    p.duration_raw = {
        hour: data.getUint16(23),
        minute: data.getUint8(25),
        second: data.getUint8(26),
    };

    p.duration = durationString(p.duration_raw);

    p.backlightTime = data.getUint8(27);

    p.time = new Date();

    // settings
    p.over_voltage_protection = data.getUint16(28) / 100;
    p.lower_voltage_protection = data.getUint16(30) / 100;
    p.over_current_protection = data.getUint16(32) / 100;

    // checksum
    // p.checksum = data.getUint8(35);
    // const payload = new Uint8Array(data.buffer.slice(2, -1));
    // console.log("payload for crc", buf2hex(payload));
    // const checksum = payload.reduce((acc, item) => (acc + item) & 0xff, 0) ^ 0x44;
    // p.checksum_valid = (p.checksum == checksum);
    //p.checksum_valid = validateChecksum(data);

    return p;
}

// https://github.com/NiceLabs/atorch-console/blob/master/docs/protocol-design.md#checksum-algorithm
// TODO: can't seem to get this to work with the packets I receive
// https://jsfiddle.net/3xmv6u0b/95/
// https://github.com/NiceLabs/atorch-console/blob/master/src/service/atorch-packet/packet-meter-usb.spec.ts
function validateChecksum(buffer) {
    const packet = new Uint8Array(buffer.buffer);
    console.log("validateChecksum in: ", buf2hex(buffer.buffer));
    console.log("validateChecksum packet: ", buf2hex(packet));
    const payload = packet.slice(2, -1);
    const checksum = payload.reduce((acc, item) => (acc + item) & 0xff, 0) ^ 0x44;
    const checksum_packet = packet[packet.length - 1]
    var result = checksum_packet == checksum;
    if (!result) {
        console.error(`checksum failure, got ${checksum.toString(16)}, expected ${checksum_packet.toString(16)}`);
    }
    return result;
}

function packetStr(p) {
    return `[${p.time.toLocaleString()}] ${p.voltage.toFixed(2)}V ${p.current.toFixed(2)}A ${p.temp}°C ${p.capacity}mAh ${p.energy.toFixed(2)}Wh (${p.duration})`;
}

function durationString(duration) {
    return `${pad(duration.hour, 3)}:${pad(duration.minute, 2)}:${pad(duration.second, 2)}`
}

function pad(s, n) {
    return String(s).padStart(n, '0');
}

// add getUint24() to DataView type
DataView.prototype.getUint24 = function (pos) {
    var val1 = this.getUint16(pos);
    var val2 = this.getUint8(pos + 2);
    return (val1 << 8) | val2;
}
