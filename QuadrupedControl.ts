/**
 * Quadruped
 */
//% weight= 0 color=#0abcff icon="\uf201" block="QuadrupedControl"
//% groups='["Basic control","Return data","Additional steering gear control","Joint angle control"]'
namespace QuadrupedControl {
    enum gait {
        //% block="Trot"
        Trot,
        //% block="Crawl"
        Crawl,
        //% block="S_TROT"
        S_TROT,
        //% block="F_TROT"
        F_TROT
    }
    enum Actions {
        //% block="Enable"
        Enable = 1,
        //% block="Not_Enable"
        Not_Enable = 0

    }
    //############Movement direction||运动方向
    enum Mov_dir {
        //% block="Forward"
        For,
        //% block="Backward"
        Bac,
        //% block="Turn_left"
        Turn_l,
        //% block="Turn_right"
        Turn_r,
        //% block="Shift_left"
        Shift_l,
        //% block="Shift_right"
        Shift_r
    }
    //############Movement Angle||运动角度
    enum Mov_ang {
        //% block="Left_swing"
        L_swing,
        //% block="Right_swing"
        R_swing,
        //% block="Look_down"
        Look_d,
        //% block="Look_up"
        Look_u,
        //% block="Yaw_left"
        Yaw_l,
        //% block="Yaw_right"
        Yaw_r
    }

    /**
    *TODO: Defines the initialization of the communication pins of the microbit and the adapter board, and requires initialization before invoking basic control, external servo control, and joint control. Microbit's LED dot matrix screen will not be available after initialization.
    *TODO:定义microbit和转接板的通讯引脚的初始化，且在调用基本控制、外接舵机控制和关节控制前都需进行初始化。初始化后microbit的LED点阵屏将无法使用。
    */
    //% group="Basic control"
    //% blockGap=8
    //% blockId=Quadruped_init block="init"
    export function init(){
        SPI_Init()
    }
    //###return hexadecimal number||返回状态信息
    /**
    * TODO:Returns the state information of the bot itself. (0x00 - idle, 0x01 - standing, 0x02 - self-balancing, 0x04 - trotting, 0x05 - fast diagonal gait, 0x06 - crawling, 0x07 - recovering, 0x08 - falling, 0x13 - slow diagonal gait)
    * TODO:返回机器人自身的状态信息。（0x00--空闲，0x01--站立中，0x02--自平衡中，0x04--小跑，0x05--快速对角步态，0x06--爬行，0x07--恢复中，0x08--摔倒，0x13--慢速对角步态）
    */
    //% group="Return data"
    //% blockGap=8
    //% blockId=Quadruped_Status block="Status"
    export function Status(): number {
        return ReturnData.Robot_mode
    }
    //####Reset||复位
    /**
     *TODO:The robot's movement speed and attitude angle are reset to 0.
     *TODO:机器人的移动速度和姿态角都会重置为0。
     */
    //% group="Basic control"
    //% blockGap=8
    //% blockId=Quadruped_Reset block="Reset"
    export function Reset(): void {
        ControlData.ControlX = 0.00 //x_speed
        ControlData.ControlY = 0.00 //y_speed
        ControlData.ControlRate = 0.00 // Turn to speed
        ControlData.ControlZ = 0.00 //Altitude speed
        //ControlData.ControlZH = 0.00 //height
        ControlData.ControlXatt = 0.00 //Pitch
        ControlData.ControlYatt = 0.00 //Side swing
        ControlData.ControlZatt = 0.00 //Heading
    }
    //####Height||高度
    /**
     * TODO: Robot body height adjustment. (Range 0~10,0 Lowest, 10 High)
     * TODO: 机器人本体高度调节。（范围0~10，0最低，10最高）
     */
    //% group="Basic control"
    //% blockGap=8
    //% h.min=0.00 h.max=10.00
    //% blockId=Quadruped_Height block="Height %h"
    export function Height(h: number): void {
        ControlData.ControlZH = h * 0.1
        for (let i = 0; i < 10; i++) {
            SPI_Send()
            basic.pause(100)
        }
    }
    //###Start||启动
    /**
     * TODO:The robot powers up and enters a semi-squat state. (Internal start sending instructions, basic control needs to be initialized before other blocks can be used)
     * TODO:机器人上电进入半蹲状态（内部开始发送指令，基本控制需要先初始化启动才能使用其他积木）
     */
    //% group="Basic control"
    //% blockGap=8
    //% blockId=Quadruped_Start block="Start"
    export function Start(): void {
        ControlData.GaitMode = 4
        ControlData.State = 1
        while (1) {
            SPI_Send()
            if (ReturnData.Robot_mode == 1) {
                for (let i = 0; i < 5; i++) {
                    SPI_Send()
                    basic.pause(100)
                }
                return
            }
        }
    }
    //###Heartbeat||心跳
    /**
     * TODO:This block needs to be placed in a loop to ensure that the robot's instructions are received normally and to prevent communication loss.
     * TODO:此方块需要放在循环当中，保证机器人的指令正常接收，防止通讯丢失。
     */
    //% group="Basic control"
    //% blockGap=8
    //% blockId=Quadruped_Heartbeat block="Heartbeat"
    export function Heartbeat(): void {
        SPI_Send()
        //serial.writeNumber(10)
    }
    //###Quadruped Stand||站立
    /**
     * TODO:The robot enters standing mode. (You need to stop when trotting and crawling, you can add this block to enter standing mode)
     * TODO:机器人进入站立模式。（小跑和爬行时需要原地停止，可以加这个积木进入站立模式）
     */
    //% group="Basic control"
    //% blockGap=8
    //% blockId=Quadruped_Stand block="Stand"
    export function Stand(): void {
        Standing()
    }
    //###Stop||停止
    /**
     * TODO:The robot enters shutdown mode, the fuselage crouches, and the internal stops sending commands.
     * TODO:机器人进入关机模式，机身下蹲，内部停止发送指令。
     */
    //% group="Basic control"
    //% blockGap=8
    //% blockId=Quadruped_Stop block="Stop"
    export function Stop(): void {
        if (ReturnData.Robot_mode == 0x04 || ReturnData.Robot_mode == 0x06) {
            Standing()
        }
        if (ReturnData.Robot_mode == 1 || ReturnData.Robot_mode == 0X02) {
            ControlData.ControlZH = 0.01
        }
        SPI_Send()
        basic.pause(50)
        SPI_Send()
        ControlData.State = 0
    }
    //###gait||步态
    /**
     * TODO:The robot has four gait options: trotting, crawling, slow diagonal and fast diagonal. (Note: Crawling gait can only be used when the fuselage is at its highest state)
     * TODO:机器人四种步态选择：小跑、爬行、慢速对角、快速对角。（注意：爬行步态只能在机身处于最高状态时使用）
     */
    //% group="Basic control"
    //% blockGap=8
    //% blockId=Quadruped_Gait block="Gait | %g"
    export function Gait(g: gait): void {
        switch (g) {
            case gait.Trot:
                ControlData.GaitMode = 0x01;
                while (1) {
                    SPI_Send()
                    if (ReturnData.Robot_mode == 0x04) {
                        SPI_Send()
                        //serial.writeNumber(2)
                        return
                    }
                }
            case gait.Crawl:
                ControlData.ControlZH = 1
                for (let i = 0; i < 5; i++) {
                    SPI_Send()
                    basic.pause(100)
                }
                ControlData.GaitMode = 0x03;
                while (1) {
                    SPI_Send()
                    if (ReturnData.Robot_mode == 0x06) {
                        SPI_Send()
                        //serial.writeNumber(2)
                        return
                    }
                }
            case gait.S_TROT:
                ControlData.ControlZH = 1
                for (let i = 0; i < 5; i++) {
                    SPI_Send()
                    basic.pause(100)
                }
                ControlData.GaitMode = 0x0D;
                while (1) {
                    SPI_Send()
                    if (ReturnData.Robot_mode == 0x0D) {
                        SPI_Send()
                        return
                    }
                }
            case gait.F_TROT:
                ControlData.ControlZH = 1
                for (let i = 0; i < 5; i++) {
                    SPI_Send()
                    basic.pause(100)
                }
                ControlData.GaitMode = 0x01;
                while (1) {
                    SPI_Send()
                    if (ReturnData.Robot_mode == 0x04) {
                        SPI_Send()
                        break
                    }
                }
                ControlData.GaitMode = 0x02;
                while (1) {
                    SPI_Send()
                    if (ReturnData.Robot_mode == 0x05) {
                        SPI_Send()
                        return
                    }
                }
        }
        SPI_Send()
    }
    //###Action group||动作组
    /**
    * TODO:Robot action group selection and whether to enable the call, currently stored two action groups.
    * TODO:机器人动作组选择及是否使能调用，目前存储了两个动作组。
    */
    //% group="Basic control"
    //% blockGap=8
    //% Group.min=0 Group.max=10
    //% time1.min=0 time1.max=255
    //% blockId=Quadruped_Action_groups block="Action group|%Group|state %sta"
    export function Action_groups(Group: number, sta: Actions): void {
        ControlData.ActionGroup = Group
        if (sta == Actions.Enable) {
            ControlData.ActionGroupStaus = 1
        }
        else {
            ControlData.ActionGroupStaus = 0
        }
        SPI_Send()
    }
    //###Movement direction and speed||运动方向与速度
    /**
    * TODO:The robot moves forward and backward, left and right, and rotates left and right, and the corresponding speed control. Time is measured in seconds.
    * TODO:机器人前后、左右移动和左右旋转的动作选择，及对应的速度控制。时间以秒为单位。
    */
    //% group="Basic control"
    //% blockGap=8
    //% speed1.min=0.00 speed1.max=10.00
    //% time1.min=0 time1.max=255
    //% blockId=Quadruped_Control_s block="Control direction| %m|speed %speed1|time %time1"
    export function Control_s(m: Mov_dir, speed1: number, time1: number): void {
        let Sum_S = 0.00
        let time_ms = 0
        let time_s = time1 * 1000
        let time_start = 0
        Sum_S = speed1 / 100.00
        SPI_Send()
        switch (m) {
            case Mov_dir.For:
                ControlData.ControlX = Sum_S; SPI_Send(); break;
            case Mov_dir.Bac:
                ControlData.ControlX = (-Sum_S); SPI_Send(); break;
            case Mov_dir.Turn_l:
                ControlData.ControlRate = (speed1 * 5); SPI_Send(); break;
            case Mov_dir.Turn_r:
                ControlData.ControlRate = (-speed1 * 5); SPI_Send(); break;
            case Mov_dir.Shift_l:
                ControlData.ControlY = (-Sum_S); SPI_Send(); break;
            case Mov_dir.Shift_r:
                ControlData.ControlY = Sum_S; SPI_Send(); break;
        }
        time_start = input.runningTime()
        while (1) {
            time_ms = input.runningTime() - time_start
            SPI_Send()
            if (time_s <= time_ms)
                return
        }
    }
    //###Control angle||控制角度
    /**
    * TODO:The robot swings left and right, heads up, bows down and twists left and right, and the corresponding angle control. Time is measured in seconds.
    * TODO:机器人左右摆动、抬头、低头和左右扭转的动作选择，及对应的角度控制。时间以秒为单位。
    */
    //% group="Basic control"
    //% blockGap=8
    //% angle1.min=0.00 angle1.max=10.00
    //% time1.min=0 time1.max=255
    //% blockId=Quadruped_Control_a block="Control angle |%m|angle_size %angle1|time %time1"
    export function Control_a(m: Mov_ang, angle1: number, time1: number): void {
        let time_ms = 0
        let time_s = time1 * 1000
        let time_start = 0
        switch (m) {
            case Mov_ang.Look_d:
                ControlData.ControlXatt = angle1; break;
            case Mov_ang.Look_u:
                ControlData.ControlXatt = (-angle1); break;
            case Mov_ang.L_swing:
                if (angle1 == 0) {
                    ControlData.ControlYatt = 0; break;
                }
                else {
                    ControlData.ControlYatt = angle1 + 10; break;
                }
            case Mov_ang.R_swing:
                if (angle1 == 0) {
                    ControlData.ControlYatt = 0; break;
                }
                else {
                    ControlData.ControlYatt = (-angle1) - 10; break;
                }
            case Mov_ang.Yaw_l:
                ControlData.ControlZatt = angle1; break;
            case Mov_ang.Yaw_r:
                ControlData.ControlZatt = -(angle1); break;
        }
        //for (let e = 0; e < time1; e++) {
        //    SPI_Send()
        //    basic.pause(1000)
        //}
        time_start = input.runningTime()
        while (1) {
            time_ms = input.runningTime() - time_start
            SPI_Send()
            if (time_s <= time_ms)
                return
        }

    }

}