/// <reference types="web-bluetooth" />
declare const goButton: HTMLElement;
declare const pauseElem: HTMLElement;
declare const dialogElem: HTMLDialogElement;
declare const dialogMessageElem: HTMLElement;
declare const warnBlockElem: HTMLElement;
declare const voltageElem: HTMLElement;
declare const currentElem: HTMLElement;
declare const powerElem: HTMLElement;
declare const energyElem: HTMLElement;
declare const capacityElem: HTMLElement;
declare const resistanceElem: HTMLElement;
declare const temperatureElem: HTMLElement;
declare const timeElem: HTMLElement;
declare const usbElem: HTMLElement;
declare const voltageStatsElem: HTMLElement;
declare const currentStatsElem: HTMLElement;
declare const powerStatsElem: HTMLElement;
declare const energyStatsElem: HTMLElement;
declare const capacityStatsElem: HTMLElement;
declare const resistanceStatsElem: HTMLElement;
declare const temperatureStatsElem: HTMLElement;
declare const timeStatsElem: HTMLElement;
declare const usbStatsElem: HTMLElement;
declare const graphDiv = "graph";
interface StateData {
    last_: Packet | null;
    history: Packet[];
    started: Date | null;
    stats: {
        min: {
            [key: string]: any;
        };
        max: {
            [key: string]: any;
        };
        average: {
            [key: string]: any;
        };
    };
}
declare class state {
    private constructor();
    static meter: Meter;
    static data_paused: boolean;
    static data: StateData;
    static max_data: number;
    static stop(e: Event): Promise<void>;
    static start(device: BluetoothDevice): Promise<void>;
    static reset(): void;
    static add(p: Packet): Promise<void>;
    static updateStats(p: Packet): void;
    static get last(): (Packet | null);
    static set last(p: Packet | null);
}
declare function showError(msg: string): void;
declare function cToF(cTemp: number): number;
declare function Go(): void;
declare function Pause(): void;
declare function Reset(): void;
declare function initPlot(): void;
declare function Save(): void;
