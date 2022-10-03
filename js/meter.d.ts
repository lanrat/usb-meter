/// <reference types="web-bluetooth" />
declare const UUID_SERVICE = "0000ffe0-0000-1000-8000-00805f9b34fb";
declare const UUID_NOTIFY = "0000ffe1-0000-1000-8000-00805f9b34fb";
declare class Meter {
    private device;
    running: boolean;
    private characteristic;
    onDisconnectCallback: EventListener | null;
    onStartCallback: ((device: BluetoothDevice) => void) | null;
    onPacketCallback: ((p: Packet, evt: Event) => void) | null;
    constructor();
    onDisconnect(event: Event): Promise<void>;
    handleCharacteristicValueChanged(event: Event): Promise<void>;
    disconnect(): Promise<void>;
    start(device: BluetoothDevice): Promise<void>;
    sendPacket(packet: Uint8Array): Promise<void>;
    reset(): Promise<void>;
}
declare function hex2packet(hex: string): Uint8Array;
declare function buf2hex(buffer: ArrayBuffer): string;
declare const resetPacketEnergyHex = "FF.55.11.01.01.00.00.00.00.57";
declare const resetPacketCapacityHex = "FF.55.11.01.02.00.00.00.00.50";
declare const resetPacketRuntimeHex = "FF.55.11.01.03.00.00.00.00.51";
declare const resetPacketHex = "FF.55.11.01.05.00.00.00.00.53";
declare const plusPacketHex = "FF.55.11.01.11.00.00.00.00.67";
declare const minusPacketHex = "FF.55.11.01.12.00.00.00.00.60";
declare const setupPacketHex = "FF.55.11.01.31.00.00.00.00.07";
declare const enterPacketHex = "FF.55.11.01.32.00.00.00.00.00";
declare const usbPlusPacketHex = "FF.55.11.03.33.00.00.00.00.03";
declare const usbMinusPacketHex = "FF.55.11.03.34.00.00.00.00.0c";
interface PacketDuration {
    hour: number;
    minute: number;
    second: number;
}
declare const START_OF_FRAME_BYTE1 = 255;
declare const START_OF_FRAME_BYTE2 = 85;
declare enum MESSAGE {
    REPORT = 1,
    REPLY = 2,
    COMMAND = 17
}
declare enum DEVICE_TYPE {
    AC = 1,
    DC = 2,
    USB = 3
}
declare const REPORT_PACKET_LEN = 36;
declare class Packet {
    [key: string]: any;
    msg: MESSAGE;
    msg_name: string;
    type: DEVICE_TYPE;
    type_name: string;
    voltage: number;
    current: number;
    power: number;
    resistance: number;
    capacity: number;
    energy: number;
    temp: number;
    duration: string;
    backlightTime: number;
    time: Date;
    over_voltage_protection: number;
    lower_voltage_protection: number;
    over_current_protection: number;
    duration_raw: PacketDuration;
    data1: number | null;
    data2: number | null;
    constructor(data: DataView);
    string(): string;
    static durationString(duration: PacketDuration): string;
    static pad(s: number, n: number): string;
    static validateChecksum(buffer: ArrayBuffer): boolean;
}
interface DataView {
    getUint24(pos: number): number;
}
