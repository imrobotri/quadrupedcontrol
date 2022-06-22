/*全局定义*/
let SSLen = 50
let DaHeader = 0x2B
let DaTail = 0xEE
let ToSlaveBuf = pins.createBuffer(SSLen)
let InfoTemp = pins.createBuffer(SSLen)

let usb_send_cnt = 0
let ControlData = {
    State:0,
    GaitMode: 0x00,
    ActionGroupStaus: 0x00,
    ActionGroup: 0x00,
    ControlX: 0.1,
    ControlY: 0,
    ControlRate: 0,
    ControlZ: 0,
    ControlZH: 0,
    ControlXatt: 0,
    ControlYatt: 0,
    ControlZatt: 0,
}
let ReturnData = {
    Robot_mode:0,
    M_Action_group_status:0
}

// SPI初始化
function SPI_Init() {
    pins.digitalWritePin(DigitalPin.P16, 1)
    pins.digitalWritePin(DigitalPin.P12, 1)
    pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13)
    pins.spiFrequency(1000000)
    led.enable(false)
}

//SPI发送
function SPI_Send() {
    if (ControlData.State == 1){
        SPICom_Walk()
        pins.digitalWritePin(DigitalPin.P16, 0)
        pins.digitalWritePin(DigitalPin.P12, 0)
        for (let i = 0; i < 200; i++);
        for (let i = 0; i < SSLen; i++) {
            InfoTemp[i] = pins.spiWrite(ToSlaveBuf[i])
        }
        pins.digitalWritePin(DigitalPin.P12, 1)
        pins.digitalWritePin(DigitalPin.P16, 1)
        SPI_unpacking()
        basic.pause(1)
    }
}

function SPI_unpacking() {
    if (InfoTemp[0] == 0x2B && InfoTemp[2] == 0x80) {
        ReturnData.Robot_mode = InfoTemp[3]
        ReturnData.M_Action_group_status = InfoTemp[4]
    }
}
//########Stand in place||原地站立
function Standing() {
    if (ReturnData.Robot_mode == 1)
        return
    ControlData.GaitMode = 5
    while (1) {
        SPI_Send()
        if (ReturnData.Robot_mode == 1 || ReturnData.Robot_mode == 0x02) {
            //ControlData.GaitMode = 4
            SPI_Send()
            return;
        }
    }
}


//数据填充
function SPICom_Walk() {
    usb_send_cnt = 0
    ToSlaveBuf[usb_send_cnt++] = DaHeader //头
    ToSlaveBuf[usb_send_cnt++] = SSLen - 2 //固定长度
    ToSlaveBuf[usb_send_cnt++] = 1;  //功能码
    ToSlaveBuf[usb_send_cnt++] = ControlData.GaitMode
    ToSlaveBuf[usb_send_cnt++] = ControlData.ActionGroupStaus
    ToSlaveBuf[usb_send_cnt++] = ControlData.ActionGroup
    get_float_hex(ControlData.ControlX)
    get_float_hex(ControlData.ControlY)
    get_float_hex(ControlData.ControlRate)
    get_float_hex(ControlData.ControlZ)
    get_float_hex(ControlData.ControlZH) //0.1
    get_float_hex(ControlData.ControlXatt)
    get_float_hex(ControlData.ControlYatt)
    get_float_hex(ControlData.ControlZatt)
    ToSlaveBuf[SSLen - 1] = DaTail;

    serial.writeBuffer(ToSlaveBuf)

}

//#################################Data conversion||数据转换######################################################
function DecToBinTail(dec: number, pad: number) {
    let bin = "";
    let i;
    for (i = 0; i < pad; i++) {
        dec *= 2;
        if (dec >= 1) {
            dec -= 1;
            bin += "1";
        }
        else {
            bin += "0";
        }
    }
    return bin;
}

function DecToBinHead(dec: number, pad: number) {
    let bin = "";
    let i;
    for (i = 0; i < pad; i++) {
        bin = parseInt((dec % 2).toString()) + bin;
        dec /= 2;
    }
    return bin;
}

function get_float_hex(decString: number) {
    let dec = decString;
    let sign;
    let signString;
    let decValue = parseFloat(Math.abs(decString).toString());
    let fraction = 0;
    let exponent = 0;
    let ssss = []

    if (decString.toString().charAt(0) == '-') {
        sign = 1;
        signString = "1";
    }
    else {
        sign = 0;
        signString = "0";
    }
    if (decValue == 0) {
        fraction = 0;
        exponent = 0;
    }
    else {
        exponent = 127;
        if (decValue >= 2) {
            while (decValue >= 2) {
                exponent++;
                decValue /= 2;
            }
        }
        else if (decValue < 1) {
            while (decValue < 1) {
                exponent--;
                decValue *= 2;
                if (exponent == 0)
                    break;
            }
        }
        if (exponent != 0) decValue -= 1; else decValue /= 2;

    }
    let fractionString = DecToBinTail(decValue, 23);
    let exponentString = DecToBinHead(exponent, 8);
    let ss11 = parseInt(signString + exponentString + fractionString, 2)
    ToSlaveBuf[usb_send_cnt++] = ((ss11 << 24) >> 24)
    ToSlaveBuf[usb_send_cnt++] = ((ss11 << 16) >> 24)
    ToSlaveBuf[usb_send_cnt++] = ((ss11 << 8) >> 24)
    ToSlaveBuf[usb_send_cnt++] = ((ss11 >> 24))
}