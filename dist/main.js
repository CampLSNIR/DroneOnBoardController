"use strict";
//import { Pince } from './lib/Pince'
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//const delay = ms => new Promise(res => setTimeout(res, ms));
var Pince = require("./lib/Pince").Pince;
var pince = new Pince(0x40);
var mavlink_ardupilotmega_v1_0_1 = __importDefault(require("mavlink_ardupilotmega_v1.0"));
// Instantiate the parser
// logger: pass a Winston logger or null if not used
// 1: source system id
// 50: source component id
var mavlinkParser = new mavlink_ardupilotmega_v1_0_1.default();
var port = new (require("serialport"))('/dev/ttyACM0', {
    baudRate: 115200
});
//port.on('readable', function () {
//	console.log('Data:', port.read())
//	mavlinkParser.parseBuffer(port.read());
//})
port.on('data', function (data) {
    mavlinkParser.parseBuffer(data);
});
//https://mavlink.io/en/messages/ardupilotmega.html
var nomsg = {
    "HEARTBEAT": true,
    "GLOBAL_POSITION_INT": true,
    "GPS_RAW_INT": true,
    "SYS_STATUS": true,
    "HWSTATUS": true,
    "RAW_IMU": true,
    "VFR_HUD": true,
    "RC_CHANNELS_RAW": true,
    "SERVO_OUTPUT_RAW": true,
    "SCALED_PRESSURE": true,
    "SYSTEM_TIME": true,
    "MISSION_CURRENT": true,
    "NAV_CONTROLLER_OUTPUT": true,
    "MEMINFO": true,
    "ATTITUDE": true,
    "AHRS": true,
    "SENSOR_OFFSETS": true,
    "STATUSTEXT": true,
    "PARAM_VALUE": true,
    "LOCAL_POSITION_NED": true,
};
mavlinkParser.on('message', function (message) {
    if (!nomsg[message.name]) {
        //console.log(message)
    }
});
mavlinkParser.on('GLOBAL_POSITION_INT', function (message) {
    //console.log(message.name, "GPS : ", "Latitude :", message.lat / 10000000, "Longitude :", message.lon / 10000000)
});
mavlinkParser.on('VFR_HUD', function (message) {
    //console.log(message.name, "Airspeed : ", message.airspeed, "m/s", "Groundspeed : ", message.groundspeed, "m/s", "Altitude : ", message.alt, "m")
});
mavlinkParser.on('STATUSTEXT', function (message) {
    console.log(message.name, "[", message.severity, "]", message.text);
});
//mavlinkParser.on('SYS_STATUS', function (message) {
//	console.log(message)
//});
var heartbeat = new mavlink_ardupilotmega_v1_0_1.default.messages.heartbeat(mavlink_ardupilotmega_v1_0_1.default.MAV_TYPE_ONBOARD_CONTROLLER, mavlink_ardupilotmega_v1_0_1.default.MAV_AUTOPILOT_INVALID, mavlink_ardupilotmega_v1_0_1.default.MAV_MODE_FLAG_GUIDED_ENABLED, 0, mavlink_ardupilotmega_v1_0_1.default.MAV_STATE_ACTIVE, 3);
mavlinkParser.on('HEARTBEAT', function (message) {
    //console.log(message.name, "[", message.severity, "]", message.text)
    port.write(heartbeat.pack(mavlinkParser));
    //console.log( message )
});
/*
Send a command with up to four parameters to the MAV

                target_system             : System which should execute the command (uint8_t)
                target_component          : Component which should execute the command, 0 for all components (uint8_t)
                command                   : Command ID, as defined by MAV_CMD enum. (uint16_t)
                confirmation              : 0: First transmission of this command. 1-255: Confirmation transmissions (e.g. for kill command) (uint8_t)
                param1                    : Parameter 1, as defined by MAV_CMD enum. (float)
                param2                    : Parameter 2, as defined by MAV_CMD enum. (float)
                param3                    : Parameter 3, as defined by MAV_CMD enum. (float)
                param4                    : Parameter 4, as defined by MAV_CMD enum. (float)
                param5                    : Parameter 5, as defined by MAV_CMD enum. (float)
                param6                    : Parameter 6, as defined by MAV_CMD enum. (float)
                param7                    : Parameter 7, as defined by MAV_CMD enum. (float)

*/
function CommandLong(target_system, target_component, command, confirmation, param1, param2, param3, param4, param5, param6, param7) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var command_long = new mavlink_ardupilotmega_v1_0_1.default.messages.command_long(target_system, target_component, command, confirmation, param1, param2, param3, param4, param5, param6, param7);
                    port.write(command_long.pack(mavlinkParser));
                    mavlinkParser.on('COMMAND_ACK', function (message) {
                        if (message.command == command) {
                            resolve(message);
                        }
                    });
                })];
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, CommandLong(0, 0, mavlink_ardupilotmega_v1_0_1.default.MAV_CMD_COMPONENT_ARM_DISARM, 1, 1)];
                case 1:
                    msg = _a.sent();
                    console.log("msg", msg);
                    return [4 /*yield*/, CommandLong(0, 0, mavlink_ardupilotmega_v1_0_1.default.MAV_CMD_DO_CHANGE_SPEED, 1, 100, 100, 0)];
                case 2:
                    msg = _a.sent();
                    console.log("msg", msg);
                    return [2 /*return*/];
            }
        });
    });
}
main();
//console.log(MAVLink.MAV_DATA_STREAM_ALL, MAVLink.target_component, MAVLink.target_system, MAVLink.messages)
//the_connection.mav.request_data_stream_send(the_connection.target_system, the_connection.target_component, mavutil.mavlink.MAV_DATA_STREAM_ALL, args.rate, 1)
//let request = new MAVLink.messages.request_data_stream(1, 0, MAVLink.MAVLINK_MESSAGE_INFO_BATTERY_STATUS, 1, 1);
//port.write(request.pack(mavlinkParser))
// Create a buffer consisting of the packed message, and send it across the wire.
// You need to pass a MAVLink instance to pack. It will then take care of setting sequence number, system and component id.
// Hack alert: the MAVLink connection could/should encapsulate this.
//let p = new Buffer(request.pack(mavlinkParser));
//# sourceMappingURL=main.js.map