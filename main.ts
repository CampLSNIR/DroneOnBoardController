

//import { Pince } from './lib/Pince'

//const delay = ms => new Promise(res => setTimeout(res, ms));

const {Pince} = require("./lib/Pince")

const pince = new Pince(0x40)

import MAVLink from 'mavlink_ardupilotmega_v1.0';

// Instantiate the parser
// logger: pass a Winston logger or null if not used
// 1: source system id
// 50: source component id

let mavlinkParser = new MAVLink();

const port = new (require("serialport"))('/dev/ttyACM0', {
	baudRate: 115200
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


	//console.log(message.name, "GPS : ", "Latitude :", message.lat / 10000000, "Longitude :", message.lon / 10000000)

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
	port.write(heartbeat.pack(mavlinkParser))
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

async function main() {

	//await pince.Ouvrir();
	//console.log("pince.Fermer")
	//await pince.Fermer();
	//console.log("pince fermée")

	let msg

	msg = await CommandLong(0, 0, MAVLink.MAV_CMD_COMPONENT_ARM_DISARM , 1,1 )
	console.log( "msg" , msg)

	msg = await CommandLong(0, 0, MAVLink.MAV_CMD_DO_CHANGE_SPEED , 1,100,100,0 )
	console.log( "msg" , msg)

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
