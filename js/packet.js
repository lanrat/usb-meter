
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
    REPORT:  0x01,
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

    p.duration = {
        hour: data.getUint16(23),
        minute: data.getUint8(25),
        second: data.getUint8(26),
    };

    p.backlightTime = data.getUint8(27);

    p.time = new Date();

    // settings
    p.over_voltage_protection = data.getUint16(28) / 100;
    p.lower_voltage_protection = data.getUint16(30) / 100;
    p.over_current_protection = data.getUint16(32) / 100;

    // checksum
    p.checksum = data.getUint8(35);
    const payload = new Uint8Array(data.buffer.slice(2, -1));
    console.log("payload for crc", buf2hex(payload));
    const checksum = payload.reduce((acc, item) => (acc + item) & 0xff, 0) ^ 0x44;
    p.checksum_valid = (p.checksum == checksum);

    // TODO: fix
    // https://github.com/NiceLabs/atorch-console/blob/master/docs/protocol-design.md#checksum-algorithm
    // if (!p.checksum_valid) {
    //     console.error(`checksum failure, got ${checksum}, expected ${p.checksum}`);
    // }

    return p;
}

function packetStr(p) {
    return `[${p.time.toLocaleString()}] ${p.voltage.toFixed(2)}V ${p.current.toFixed(2)}A ${p.temp}°C ${p.capacity}mAh ${p.energy.toFixed(2)}Wh (${pad(p.duration.hour, 2)}:${pad(p.duration.minute, 2)}:${pad(p.duration.second, 2)})`;
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
