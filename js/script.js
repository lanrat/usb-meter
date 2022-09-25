
const goButton = document.getElementById("go");

var meter = new Meter();

var state = {
    data: {
        last_: null,
        history: [],
        started: null,
        // TODO: min, max, average
        // TODO download csv (https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side)
    },
    // TODO: make this configurable
    max_data: 60 * 60, // ~1 hour

    // onDisconnectCallback
    stop: async function () {
        console.log("state stop");
        // set button state
        goButton.innerText = "Start";
    },

    // onStartCallback
    start: async function () {
        console.log("state start");
        this.reset();
        // set button state
        goButton.innerText = "Stop";
        this.started = new Date();
    },

    reset: function () {
        this.data.last = null;
        this.data.history = [];
    },

    // onPacketCallback
    add: async function (p) {
        //console.log("new p:", p);
        this.data.history.unshift(p);
        if (this.data.history.length > this.max_data) {
            // trim data
            this.data.history.length = this.max_data;
        }

        this.data.last = p;

        // add to graph
        // TODO current and other vars
        Plotly.extendTraces('graph', {
            y: [[p.voltage], [p.current]],
            //x: [[durationString(p.duration)], [durationString(p.duration)]],
            x: [[p.time], [p.time]],
        }, [0, 1],this.max_data )
    }
}

const voltageElem = document.getElementById("voltage");
const currentElem = document.getElementById("current");
const powerElem = document.getElementById("power");
const energyElem = document.getElementById("energy");
const capacityElem = document.getElementById("capacity");
const resistanceElem = document.getElementById("resistance");
const temperatureElem = document.getElementById("temperature");
const timeElem = document.getElementById("time");

Object.defineProperty(state.data, "last", {
    get() {
        return this.last_;
    },
    set(p) {
        this.last_ = p;
        if (p) {
            console.log("setting state", p);
            voltageElem.innerText = `${p.voltage} V`;
            currentElem.innerText = `${p.current} A`;
            powerElem.innerText = `${p.power} W`;
            energyElem.innerText = `${p.energy} Wh`;
            capacityElem.innerText = `${p.capacity} mAh`;
            resistanceElem.innerText = `${p.resistance} Ω`;
            temperatureElem.innerText = `${p.temp} °C / ${cToF(p.temp)} °F`;
            timeElem.innerText = `${durationString(p.duration)}`;
        } else {
            console.log("clearing state");
            voltageElem.innerText = '';
            currentElem.innerText = '';
            powerElem.innerText = '';
            energyElem.innerText = '';
            capacityElem.innerText = '';
            resistanceElem.innerText = '';
            temperatureElem.innerText = '';
            timeElem.innerText = '';
        }
    }
});

function showError(msg) {
    var dialogElem = document.getElementById('dialog');
    var dialogMessageElem = document.getElementById('dialogError');
    dialogMessageElem.innerText = msg;
    dialogElem.showModal();
}

function cToF(cTemp) {
    return cTemp * 9 / 5 + 32;
}

function Go() {
    if (meter.running) {
        console.log("stopping");
        meter.disconnect();
    } else {
        navigator.bluetooth.requestDevice({
            filters: [{
                services: [UUID_SERVICE]
            }]
        })
            .then(device => {
                console.log("starting");
                goButton.innerText = "Starting....";
                console.log("got device: ", device.name);
                console.log(device);
                meter.start(device).catch(error => {
                    console.error("port start error: ", error);
                    showError(error);
                });
            })
            .catch(error => {
                console.log("no port selected. event:", error);
            });
    }
}


// TODO pause/resume button?

function Reset() {
    console.log("reset");
    meter.reset();
    state.reset();
    initPlot();
}

function initPlot() {
    const layout = {
        autosize: true,
        showlegend: true,
        automargin: true,
    };

    const config = {
        displaylogo: false,
        responsive: true
    };
    Plotly.newPlot('graph', [{
        name: "volts",
        y: [],
        x:[],
        mode: 'lines',
        line: { color: 'red' }
    },
    {
        name: "current",
        y: [],
        x:[],
        mode: 'lines',
        line: { color: '#80CAF6' }
    }], layout, config);
}

document.addEventListener('DOMContentLoaded', async () => {
    if ("bluetooth" in navigator) {
        document.getElementById("warnBlock").hidden = true;
    } else {
        showError("WebBluetooth does not seem to be supported by this device");
    }

    // setup ui callbacks
    meter.onPacketCallback = state.add.bind(state);
    meter.onDisconnectCallback = state.stop.bind(state);
    meter.onStartCallback = state.start.bind(state);

    // init graph
    initPlot();
});