
const goButton = document.getElementById("go");
const graphDiv = 'graph';
var meter = new Meter();

var state = {
    paused: false,
    data: {
        last_: null,
        history: [],
        started: null,
        stats: {
            min: {},
            max: {},
            average: {},
        },
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
        this.data.stats = {
            min: {},
            max: {},
            average: {},
        };
    },

    // onPacketCallback
    add: async function (p) {
        if (this.paused) {
            return;
        }

        if (!p) {
            console.error("got empty packet");
            return;
        }

        //console.log("new p:", p);
        this.data.history.unshift(p);
        if (this.data.history.length > this.max_data) {
            // trim data
            this.data.history.length = this.max_data;
        }

        this.updateStats(p);
        this.data.last = p;

        // add to graph
        var data = [[p.voltage], [p.current], [p.power], [p.energy], [p.capacity], [p.resistance], [p.temp], [p.data1], [p.data2]];
        Plotly.extendTraces(graphDiv, {
            y: data,
            x: new Array(data.length).fill([p.time]),
        }, Array.from(Array(data.length).keys()), this.max_data)
    },

    // TODO remove old values?
    updateStats: function (p) {
        for (const prop in p) {
            //console.log("updating stats for", prop);
            if (typeof this.data.stats.max[prop] == 'undefined' || p[prop] > this.data.stats.max[prop]) {
                //console.log("new max", p[prop]);
                this.data.stats.max[prop] = p[prop];
            }
            if (typeof this.data.stats.min[prop] == 'undefined' || p[prop] < this.data.stats.min[prop]) {
                this.data.stats.min[prop] = p[prop];
                //console.log("new min", p[prop]);
            }
            if (typeof this.data.stats.average[prop] == 'undefined') {
                this.data.stats.average[prop] = 0;
                //console.log("resetting adv for", prop);
            }
            var oldAverage = this.data.stats.average[prop]
            if (Number.isFinite(oldAverage)) {
                var newAverage = oldAverage + (p[prop]-oldAverage)/this.data.history.length;
                this.data.stats.average[prop] = Math.round(newAverage * 100) / 100; // round to 2 decimal places
                //console.log("adv for", prop, this.data.stats.average[prop]);
            }
        }
    },
}

const voltageElem = document.getElementById("voltage");
const currentElem = document.getElementById("current");
const powerElem = document.getElementById("power");
const energyElem = document.getElementById("energy");
const capacityElem = document.getElementById("capacity");
const resistanceElem = document.getElementById("resistance");
const temperatureElem = document.getElementById("temperature");
const timeElem = document.getElementById("time");
const usbElem = document.getElementById("usb");

const voltageStatsElem = document.getElementById("voltage_stats");
const currentStatsElem = document.getElementById("current_stats");
const powerStatsElem = document.getElementById("power_stats");
const energyStatsElem = document.getElementById("energy_stats");
const capacityStatsElem = document.getElementById("capacity_stats");
const resistanceStatsElem = document.getElementById("resistance_stats");
const temperatureStatsElem = document.getElementById("temperature_stats");
const timeStatsElem = document.getElementById("time_stats");
const usbStatsElem = document.getElementById("usb_stats");

Object.defineProperty(state.data, "last", {
    get() {
        return this.last_;
    },
    set(p) {
        this.last_ = p;
        if (p) {
            //console.log("setting state", p);
            // data
            voltageElem.innerText = `${p.voltage} V`;
            currentElem.innerText = `${p.current} A`;
            powerElem.innerText = `${p.power} W`;
            energyElem.innerText = `${p.energy} Wh`;
            capacityElem.innerText = `${p.capacity} mAh`;
            resistanceElem.innerText = `${p.resistance} Ω`;
            temperatureElem.innerText = `${p.temp} °C / ${cToF(p.temp)} °F`;
            usbElem.innerText = `${p.data1}/${p.data2} V`;
            timeElem.innerText = `${p.duration}`;

            // stats
            voltageStatsElem.innerText = `${this.stats.min.voltage} / ${this.stats.max.voltage} / ${this.stats.average.voltage}`;
            currentStatsElem.innerText = `${this.stats.min.current} / ${this.stats.max.current} / ${this.stats.average.current}`;
            powerStatsElem.innerText = `${this.stats.min.power} / ${this.stats.max.power} / ${this.stats.average.power}`;
            energyStatsElem.innerText = `${this.stats.min.energy} / ${this.stats.max.energy} / ${this.stats.average.energy}`;
            capacityStatsElem.innerText = `${this.stats.min.capacity} / ${this.stats.max.capacity} / ${this.stats.average.capacity}`;
            resistanceStatsElem.innerText = `${this.stats.min.resistance} / ${this.stats.max.resistance} / ${this.stats.average.resistance}`;
            temperatureStatsElem.innerText = `${this.stats.min.temp} / ${this.stats.max.temp} / ${this.stats.average.temp}`;
            usbStatsElem.innerText = `(${this.stats.min.data1}/${this.stats.min.data2}) / (${this.stats.max.data1}/${this.stats.max.data2}) / (${this.stats.average.data1}/${this.stats.average.data2})`;
            timeStatsElem.innerText = `Samples: ${this.history.length}`;

        } else {
            console.log("clearing state");
            // data
            voltageElem.innerText = '';
            currentElem.innerText = '';
            powerElem.innerText = '';
            energyElem.innerText = '';
            capacityElem.innerText = '';
            resistanceElem.innerText = '';
            temperatureElem.innerText = '';
            usbElem.innerText = '';
            timeElem.innerText = '000:00:00';

            // stats
            voltageStatsElem.innerText = '';
            currentStatsElem.innerText = '';
            powerStatsElem.innerText = '';
            energyStatsElem.innerText = '';
            capacityStatsElem.innerText = '';
            resistanceStatsElem.innerText = '';
            temperatureStatsElem.innerText = '';
            usbStatsElem.innerText = '';
            timeStatsElem.innerText = 'Samples: 0';
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
                goButton.innerText = "Starting....";
                console.log("got device: ", device.name, device.id);
                //console.log(device);
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

const pauseElem = document.getElementById("pause");

function Pause() {
    state.paused = !state.paused;
    if (state.paused) {
        pauseElem.innerText = "Resume";
    } else {
        pauseElem.innerText = "Pause";
    }
}

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
        responsive: true,
    };
    Plotly.newPlot(graphDiv, [{
        name: "Volts",
        y: [],
        x: [],
        mode: 'lines',
        line: { color: 'darkred' },
    },
    {
        name: "Current",
        y: [],
        x: [],
        mode: 'lines',
        line: { color: 'green' },
    },
    {
        name: "Power",
        y: [],
        x: [],
        mode: 'lines',
        line: { color: 'red' },
        visible: 'legendonly',
    },
    {
        name: "Energy",
        y: [],
        x: [],
        mode: 'lines',
        line: { color: 'purple' },
        visible: 'legendonly',
    },
    {
        name: "Capacity",
        y: [],
        x: [],
        mode: 'lines',
        line: { color: 'lightblue' },
        visible: 'legendonly',
    },
    {
        name: "Resistance",
        y: [],
        x: [],
        mode: 'lines',
        line: { color: 'blue' },
        visible: 'legendonly',
    },
    {
        name: "Temperature",
        y: [],
        x: [],
        mode: 'lines',
        line: { color: 'turquoise' },
        visible: 'legendonly',
    },
    {
        name: "USB D-",
        y: [],
        x: [],
        mode: 'lines',
        line: { color: 'lightgreen' },
        visible: 'legendonly',
    },
    {
        name: "USB D+",
        y: [],
        x: [],
        mode: 'lines',
        line: { color: 'lightgreen' },
        visible: 'legendonly',
    },
    ], layout, config);
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


function Save() {
    if (!state.data.last) {
        // no data
        showError("No data yet");
        return;
    }
    const csv_columns = ["time", "voltage", "current", "power", "resistance", "capacity", "energy", "data1", "data2", "temp", "duration",];
    const filename = "data.csv";

    var headers = [];

    let csvContent = "data:text/csv;charset=utf-8,";

    // write header
    for (var i = 0; i < csv_columns.length; i++) {
        if (state.data.last[csv_columns[i]]) {
            headers.push(csv_columns[i]);
        }
    }
    csvContent += headers.join(",") + "\r\n";

    // write data
    state.data.history.forEach(function (p) {
        for (const i in headers) {
            var h = headers[i];
            console.log("cav add: ", h, p[h], p);
            csvContent += p[h] + ",";
        }
        csvContent += "\r\n";
    });

    console.log("all csv", csvContent);

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link); // Required for FF

    link.click(); // This will download the data file named filename.
}
