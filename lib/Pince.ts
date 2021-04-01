
const rpio = require('rpio');


const delay = ms => new Promise(res => setTimeout(res, ms));

class Pince {
	status : boolean;
	tb = new Buffer(2);
	BASE_CHANNEL = 6;
	available = false;
	constructor( addr: number ) {
		rpio.i2cBegin();
  		rpio.i2cSetSlaveAddress( addr ); // default address
  		rpio.i2cSetBaudRate(100000);
  		
  		this.tb[0] = 0x00; this.tb[1] = 0x11;
  		rpio.i2cWrite(this.tb); // sleep
  		this.tb[0] = 0xFE; this.tb[1] = 0x65;
  		rpio.i2cWrite(this.tb); // set prescale to 50 hz
  		this.tb[0] = 0x00; this.tb[1] = 0x01;
  		rpio.i2cWrite(this.tb);
  		rpio.msleep(1); // see datasheet
  		this.tb[0] = 0x00; this.tb[1] = 0x81;
  		rpio.i2cWrite(this.tb);
  		this.tb[1] = 0x00;
  		rpio.i2cWrite(this.tb);
  	}

    public async Fermer() {
    	this.available = false
    	for (var i = 1; i < 600; i++) {
			await delay( 1 )
			this.setPWM(0, 0, i);
		}
		this.setPWM(0, 0, 0);
    	this.available = true
    	this.status = false
        return
    }
    public async Ouvrir() {
    	this.available = false
    	this.setPWM(0, 0, 1);
    	await delay( 1000 );
    	this.setPWM(0, 0, 0);
    	this.available = true
    	this.status = true
        return
    }
    public async GetStatus() {
        return this.status
    }

    public async IsAvailable() {
        return this.available
    }

    private setPWM(channel, on, off){
    	this.tb[0] = channel * 4 + this.BASE_CHANNEL;
  		this.tb[1] = on;
  		rpio.i2cWrite(this.tb);
		
  		this.tb[0] = channel * 4 + (this.BASE_CHANNEL + 1);
  		this.tb[1] = on >> 8;
  		rpio.i2cWrite(this.tb);
		
  		this.tb[0] = channel * 4 + (this.BASE_CHANNEL + 2);
  		this.tb[1] = off;
  		rpio.i2cWrite(this.tb);
		
  		this.tb[0] = channel * 4 + (this.BASE_CHANNEL + 3);
  		this.tb[1] = off >> 8;
  		rpio.i2cWrite(this.tb);   
    }
}

export { Pince };