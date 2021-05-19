

//import { Pince } from './lib/Pince'

const waitfor = ms => new Promise(res => setTimeout(res, ms));

const {Pince} = require("./lib/Pince")
const { Pixy2 } = require("./lib/Pixy2")

const pince = new Pince(0x40)
const camera = new Pixy2()

import MAVLink from 'mavlink_ardupilotmega_v1.0';
import { resolve } from 'node:path';

// Instantiate the parser
// logger: pass a Winston logger or null if not used
// 1: source system id
// 50: source component id

const mavlinkParser = new MAVLink();
const SerialPort = require("serialport")

const port = new SerialPort('/dev/ttyACM0', {
	baudRate: 115200
})

const holybro = new SerialPort('/dev/ttyUSB0', {
	baudRate: 57600
})

//port.on('readable', function () {
//	console.log('Data:', port.read())
//	mavlinkParser.parseBuffer(port.read());
//})



port.on('data', function (data) {
	mavlinkParser.parseBuffer(data);
})

//https://mavlink.io/en/messages/ardupilotmega.html

let nomsg = {
	"HEARTBEAT": true,
	"GLOBAL_POSITION_INT": true, //gps + estimation
	"GPS_RAW_INT": true, // GPS uniquement sans estimation
	"SYS_STATUS": true, // battery etc
	"HWSTATUS": true, //status
	"RAW_IMU": true, //  9 DOF sensor
	"VFR_HUD": true, // donnée HUD vit alt ....
	"RC_CHANNELS_RAW": true, // pas compris
	"SERVO_OUTPUT_RAW": true, // ??
	"SCALED_PRESSURE": true, // Barometer 
	"SYSTEM_TIME": true, // date et h
	"MISSION_CURRENT": true, // mission actuelle
	"NAV_CONTROLLER_OUTPUT": true, // objectif angle
	"MEMINFO": true,
	"ATTITUDE": true, // ... 
	"AHRS": true, // Status of DCM attitude estimator.
	"SENSOR_OFFSETS": true, //Offsets and calibrations values for hardware sensors
	"STATUSTEXT": true, // status + severité
	"PARAM_VALUE": true, // pas compris ? .. Emit the value of a onboard parameter. he parameter microservice is documented at https://mavlink.io/en/services/parameter.html
	"LOCAL_POSITION_NED" : true,
}

mavlinkParser.on('message', function (message) {
	if (!nomsg[message.name]) {
		//console.log(message)
	}
});

mavlinkParser.on('GLOBAL_POSITION_INT', function (message) { // GLOBAL_POSITION_INT gps + estimation , GPS_RAW_INT GPS uniquement
	console.log(message.name, "GPS : ", "Latitude :", message.lat / 10000000, "Longitude :", message.lon / 10000000)
});

mavlinkParser.on('VFR_HUD', function (message) {
	//console.log(message.name, "Airspeed : ", message.airspeed, "m/s", "Groundspeed : ", message.groundspeed, "m/s", "Altitude : ", message.alt, "m")
});

mavlinkParser.on('STATUSTEXT', function (message) {

	console.log(message.name, "[", message.severity, "]", message.text)

});

//mavlinkParser.on('SYS_STATUS', function (message) {
//	console.log(message)
//});

const heartbeat = new MAVLink.messages.heartbeat(
	MAVLink.MAV_TYPE_ONBOARD_CONTROLLER, 
	MAVLink.MAV_AUTOPILOT_INVALID, 
	MAVLink.MAV_MODE_FLAG_GUIDED_ENABLED,
	0, 
	MAVLink.MAV_STATE_ACTIVE,  
	3
);

mavlinkParser.on('HEARTBEAT', function (message) {

	//console.log(message.name, "[", message.severity, "]", message.text)
	//port.write(heartbeat.pack(mavlinkParser))
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

async function CommandLong(target_system, target_component, command, confirmation?, param1?, param2?, param3?, param4?, param5?, param6?, param7?){
	return new Promise(resolve => {

		let command_long = new MAVLink.messages.command_long(target_system, target_component, command, confirmation, param1, param2, param3, param4, param5, param6, param7);
		port.write(command_long.pack(mavlinkParser))

		mavlinkParser.on('COMMAND_ACK', function (message) {
			if( message.command == command){
				resolve( message )
			}
		})
	})
}

function CreateMisstionItem(command: number, seq: number, x: number, y: number, z: number) {
	return new MAVLink.messages.mission_item(1, 0, seq, 0, command, 0, 0, 0, 0, 0, 0, x, y, z)
}

let mission = [
	CreateMisstionItem(MAVLink.MAV_CMD_NAV_WAYPOINT, 0, 0, 0, 0),
	CreateMisstionItem(MAVLink.MAV_CMD_NAV_WAYPOINT, 1.1, 1.1, 1.1, 50),
	CreateMisstionItem(MAVLink.MAV_CMD_NAV_LAND, 2.1, 1.1, 1.1, 100),
	CreateMisstionItem(MAVLink.MAV_CMD_NAV_WAYPOINT, 3.1, 1.1, 1.1, 150)
]

function IsJsonString(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

let jsonbuffer = ""

holybro.on('data', function (read) {

	let data = jsonbuffer + read.toString()
	console.log(data)

	if (IsJsonString(data)) {
		let obj = JSON.parse(data)
		jsonbuffer = ""
		obj.path = JSON.parse(obj.path)
		CreateMission(obj)
	} else {
		jsonbuffer = data
	}
})

async function CreateMission(mission: any) {
	return new Promise(resolve => {
		const numItems = mission.path.length

		console.log("numItems", numItems)

		const missioncount = new MAVLink.messages.mission_count(1, 0, numItems);

		port.write(missioncount.pack(mavlinkParser))

		mavlinkParser.on('MISSION_REQUEST', function (message) {

			let p = mission.path[message.seq]
			console.log(message.seq, mission.path[message.seq])
			if (p) {
				port.write(CreateMisstionItem(MAVLink.MAV_CMD_NAV_WAYPOINT, message.seq, p.lat, p.lng, 30).pack(mavlinkParser))
			}

			if (message.seq == mission.path.length - 1) {
				console.log("salut")
				resolve(true)
			}
		})
	})
}

async function DetectObject(callback: (blocks: any) => void) {

	const { spawn } = require('child_process');

	const get_blocks = spawn('/home/pi/testPixy/pixy2/build/get_blocks_cpp_demo/get_blocks_cpp_demo');

	const rl = require('readline').createInterface({
		input: get_blocks.stdout
	});

	let regex = /^.*[0-9]+.*[0-9]+.*[0-9]+.*[0-9]+.*[0-9]+.*[0-9]+.*[0-9]+$/i;

	rl.on('line', function (line) {
		if (regex.test(line)) {
			let splt = line.split(": ")
			let x = Number(splt[3].split(" ")[0])
			let y = Number(splt[4].split(" ")[0])
			let width = Number(splt[5].split(" ")[0])
			let height = Number(splt[6].split(" ")[0])
			let index = Number(splt[7].split(" ")[0])
			let age = Number(splt[8].split(" ")[0])

			callback({
				x: x,
				y: y,
				width: width,
				height: height,
				index: index,
				age: age
			})
		}
	});

	get_blocks.on('close', (code) => {
		if (code !== 0) {
			console.log(`ps process exited with code ${code}`);
		}
	})


}

let timeout = null

async function closeIn3Sec() {

	clearTimeout(timeout);

	timeout = setTimeout(async () => {
		if (pince.IsAvailable()) {
			console.log("Ouvrir")
			await pince.Ouvrir();
		} else {
			closeIn3Sec()
		}

	}, 3000);

}

async function main() {

	camera.Init()
	camera.Read(function (blocks) {
		console.log(blocks)
	})

	//while (true) {
	//	await pince.Ouvrir();
	//	await waitfor(3000);
	//	await pince.Fermer();
	//	await waitfor(3000);
//
	//}

	//await pince.Ouvrir();
	//console.log("pince.Fermer")
	//await pince.Fermer();
	//console.log("pince fermée")

	//let msg

	//msg = await CommandLong(0, 0, MAVLink.MAV_CMD_COMPONENT_ARM_DISARM , 1,1 )
	//console.log( "msg" , msg)
	//
	//msg = await CommandLong(0, 0, MAVLink.MAV_CMD_DO_CHANGE_SPEED , 1,100,100,0 )
	//console.log( "msg" , msg)

	//let command_long = new MAVLink.messages.command_long(1, 1, MAVLink.MAV_CMD_COMPONENT_ARM_DISARM , 1,0);
	//port.write(command_long.pack(mavlinkParser))
	
}

main()




//console.log(MAVLink.MAV_DATA_STREAM_ALL, MAVLink.target_component, MAVLink.target_system, MAVLink.messages)

//the_connection.mav.request_data_stream_send(the_connection.target_system, the_connection.target_component, mavutil.mavlink.MAV_DATA_STREAM_ALL, args.rate, 1)

//let request = new MAVLink.messages.request_data_stream(1, 0, MAVLink.MAVLINK_MESSAGE_INFO_BATTERY_STATUS, 1, 1);
//port.write(request.pack(mavlinkParser))




// Create a buffer consisting of the packed message, and send it across the wire.
// You need to pass a MAVLink instance to pack. It will then take care of setting sequence number, system and component id.
// Hack alert: the MAVLink connection could/should encapsulate this.

//let p = new Buffer(request.pack(mavlinkParser));
