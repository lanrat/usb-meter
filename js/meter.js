const packetElem = document.getElementById("packet");
//const startBtnElem = document.getAnimations("start");


class Meter {
    constructor() {
        this.device = null;
        this.running = false;
        this.data = {};
        this.max_data = 60*60; // ~1 hour
        this.reset();
    }

    reset() {
        this.data.last = null;
        this.data.history = [];
    }

    async onDisconnect(event) {
        // Object event.target is Bluetooth Device getting disconnected.
        this.running = false;
        console.log('> Bluetooth Device disconnected', event);
    }

    async handleCharacteristicValueChanged(event) {
        // https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTCharacteristic
        console.log("handleCharacteristicValueChanged event:", event);
        const value = event.target.value;
        console.log('Received ', buf2hex(value.buffer));
        var p = parse(value);
        console.log(`got packet: ${packetStr(p)}`);
        this.add(p); // TODO
    }

    async disconnect() {
        console.log('Disconnecting from Bluetooth Device...');
        if (this.device && this.device.gatt.connected) {
            meter.device.gatt.disconnect();
            // data.state = "off"; // TODO
        } else {
            console.log('> Bluetooth Device is already disconnected');
        }
        meter.running = false;
    }

    async start(device) {
        this.reset();
        this.device = device;
        // TODO: set button "connecting" state
        this.device.addEventListener('gattserverdisconnected', meter.onDisconnect.bind(this));
        // Attempts to connect to remote GATT Server.
        this.device.gatt.connect()
            .then(server => {
                //console.log("server: ", server);
                return server.getPrimaryService(UUID_SERVICE);
            })
            .then(service => {
                //console.log("service:", service);
                return service.getCharacteristic(UUID_NOTIFY);
            })
            .then(characteristic => characteristic.startNotifications())
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged',
                    this.handleCharacteristicValueChanged.bind(this));
                console.log('Notifications have been started.');
                // TODO: set button state
                this.running = true;
                // TODO: sometimes need to press button to start receiving data.
                // todo automate by sending command, via timeout?
            })
            .catch(error => {
                console.error(error);
                // TODO move this to calling/parent function
                showError(error);
            });
    }

    async add(p) {
        console.log("new p:", p);
        this.data.last = p;
        this.data.history.unshift(p);
        if (this.data.history.length > this.max_data) {
            // trim data
            this.data.history.length = this.max_data;
        }
        // TODO data binding
        packetElem.innerText = packetStr(p);
    }
}

// Object.defineProperty(data, "state", {
//     get() {
//         return startBtnElem.value;
//     },
//     set(v) {
//         console.log("setting state", v);
//         startBtnElem.value = v;
//     }
// });


function go() {
    // TODO debounce
    // TODO set button state
    if (meter.running) {
        console.log("stopping");
        meter.disconnect();
    } else {
        console.log("starting")
        navigator.bluetooth.requestDevice({
            filters: [{
                services: [UUID_SERVICE]
            }]
        })
            .then(device => {
                console.log("got device: ", device.name);
                console.log(device);
                meter.start(device);
                // TODO move error logic here (from start)
            })
            .catch(error => {
                console.log("no port selected. event:", error);
                // TODO move this to calling/parent function
                //showError(error);
            });
    }
}

// https://stackoverflow.com/questions/40031688/javascript-arraybuffer-to-hex
function buf2hex(buffer) { // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('.');
}

function showError(msg) {
    var dialogElem = document.getElementById('dialog');
    var dialogMessageElem = document.getElementById('dialogError');
    dialogMessageElem.innerText = msg;
    dialogElem.showModal();
}

const meter = new Meter();