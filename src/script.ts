// buttons
const goButton = document.getElementById("go")!;
const pauseElem = document.getElementById("pause")!;

// dialog
const dialogElem = document.getElementById('dialog')! as HTMLDialogElement;
const dialogMessageElem = document.getElementById('dialogError')!;
const warnBlockElem = document.getElementById("warnBlock")!;

// table values
const voltageElem = document.getElementById("voltage")!;
const currentElem = document.getElementById("current")!;
const powerElem = document.getElementById("power")!;
const energyElem = document.getElementById("energy")!;
const capacityElem = document.getElementById("capacity")!;
const resistanceElem = document.getElementById("resistance")!;
const temperatureElem = document.getElementById("temperature")!;
const timeElem = document.getElementById("time")!;
const usbElem = document.getElementById("usb")!;
// table stats
const voltageStatsElem = document.getElementById("voltage_stats")!;
const currentStatsElem = document.getElementById("current_stats")!;
const powerStatsElem = document.getElementById("power_stats")!;
const energyStatsElem = document.getElementById("energy_stats")!;
const capacityStatsElem = document.getElementById("capacity_stats")!;
const resistanceStatsElem = document.getElementById("resistance_stats")!;
const temperatureStatsElem = document.getElementById("temperature_stats")!;
const timeStatsElem = document.getElementById("time_stats")!;
const usbStatsElem = document.getElementById("usb_stats")!;

const graphDiv = 'graph';

interface StateData {
    last_: Packet | null,
    history: Packet[],
    started: Date | null,
    stats: {
        min: {
            [key: string]: any
        };
        max: {
            [key: string]: any
        },
        average: {
            [key: string]: any
        },
    },
}

class state {
    private constructor() { }

    static meter = new Meter();
    static data_paused = false;
    static data: StateData = {} as StateData;

    // TODO: make this configurable
    static max_data = 60 * 60; // ~1 hour

    // onDisconnectCallback
    static async stop(e: Event) {
        console.log("state stop");
        // set button state
        goButton.innerText = "Start";
    }

    // onStartCallback
    static async start(device: BluetoothDevice) {
        console.log("state start");
        this.reset();
        // set button state
        goButton.innerText = "Stop";
        this.data.started = new Date();
    }

    static reset() {
        this.last = null;
        this.data.history = [];
        this.data.stats = {
            min: {},
            max: {},
            average: {},
        };
    }

    // onPacketCallback
    static async add(p: Packet) {
        if (this.data_paused) {
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
        this.last = p;

        // add to graph
        var data = [[p.voltage], [p.current], [p.power], [p.energy], [p.capacity], [p.resistance], [p.temp], [p.data1], [p.data2]];
        Plotly.extendTraces(graphDiv, {
            y: data,
            x: new Array(data.length).fill([p.time]),
        }, Array.from(Array(data.length).keys()), this.max_data)
    }

    // TODO remove old values?
    static updateStats(p: Packet) {
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
                var newAverage = oldAverage + (p[prop] - oldAverage) / this.data.history.length;
                this.data.stats.average[prop] = Math.round(newAverage * 100) / 100; // round to 2 decimal places
                //console.log("adv for", prop, this.data.stats.average[prop]);
            }
        }
    }

    static get last(): (Packet | null) {
        return this.data.last_;
    }

    static set last(p: Packet | null) {
        this.data.last_ = p;
        if (p) {
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
            voltageStatsElem.innerText = `${this.data.stats.min.voltage} / ${this.data.stats.max.voltage} / ${this.data.stats.average.voltage}`;
            currentStatsElem.innerText = `${this.data.stats.min.current} / ${this.data.stats.max.current} / ${this.data.stats.average.current}`;
            powerStatsElem.innerText = `${this.data.stats.min.power} / ${this.data.stats.max.power} / ${this.data.stats.average.power}`;
            energyStatsElem.innerText = `${this.data.stats.min.energy} / ${this.data.stats.max.energy} / ${this.data.stats.average.energy}`;
            capacityStatsElem.innerText = `${this.data.stats.min.capacity} / ${this.data.stats.max.capacity} / ${this.data.stats.average.capacity}`;
            resistanceStatsElem.innerText = `${this.data.stats.min.resistance} / ${this.data.stats.max.resistance} / ${this.data.stats.average.resistance}`;
            temperatureStatsElem.innerText = `${this.data.stats.min.temp} / ${this.data.stats.max.temp} / ${this.data.stats.average.temp}`;
            usbStatsElem.innerText = `(${this.data.stats.min.data1}/${this.data.stats.min.data2}) / (${this.data.stats.max.data1}/${this.data.stats.max.data2}) / (${this.data.stats.average.data1}/${this.data.stats.average.data2})`;
            timeStatsElem.innerText = `Samples: ${this.data.history.length}`;

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
}

function showError(msg: string) {
    dialogMessageElem.innerText = msg;
    dialogElem.showModal();
}

function cToF(cTemp: number): number {
    return cTemp * 9 / 5 + 32;
}

function Go() {
    if (state.meter.running) {
        console.log("stopping");
        state.meter.disconnect();
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
                state.meter.start(device).catch(error => {
                    console.error("port start error: ", error);
                    showError(error);
                });
            })
            .catch(error => {
                console.log("no port selected. event:", error);
            });
    }
}


function Pause() {
    state.data_paused = !state.data_paused;
    if (state.data_paused) {
        pauseElem.innerText = "Resume";
    } else {
        pauseElem.innerText = "Pause";
    }
}

function Reset() {
    console.log("reset");
    state.meter.reset();
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
        line: { color: 'darkRed' },
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
        line: { color: 'lightGreen' },
        visible: 'legendonly',
    },
    {
        name: "USB D+",
        y: [],
        x: [],
        mode: 'lines',
        line: { color: 'lightGreen' },
        visible: 'legendonly',
    },
    ], layout, config);
}

document.addEventListener('DOMContentLoaded', async () => {
    if ("bluetooth" in navigator) {
        warnBlockElem.hidden = true;
    } else {
        showError("WebBluetooth does not seem to be supported by this device");
    }

    // setup ui callbacks
    state.meter.onPacketCallback = state.add.bind(state);
    state.meter.onDisconnectCallback = state.stop.bind(state);
    state.meter.onStartCallback = state.start.bind(state);

    // init graph
    initPlot();
});


function Save() {
    if (!state.last) {
        // no data
        showError("No data yet");
        return;
    }
    const csv_columns: Array<string> = ["time", "voltage", "current", "power", "resistance", "capacity", "energy", "data1", "data2", "temp", "duration",];
    const filename: string = "data.csv";

    var headers: Array<string> = [];

    let csvContent = "data:text/csv;charset=utf-8,";

    // write header
    for (var i = 0; i < csv_columns.length; i++) {
        if (state.last[csv_columns[i]]) {
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
    link.remove();
}
