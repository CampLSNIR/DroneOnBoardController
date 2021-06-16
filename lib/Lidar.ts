
class Lidar {

    constructor() {
        const { spawn } = require('child_process');
        this.spawn = spawn
    }

    spawn: any
    ultra_lite: any
    rl: any

    public async Init() {
        this.ultra_lite = this.spawn('/home/pi/Desktop/en.uldLinux330/Linux_build/user_lib/ultra_lite');

        this.rl = require('readline').createInterface({
            input: this.ultra_lite.stdout
        });
        return
    }

    public OnClose(callback: (code: number) => void) {
        this.ultra_lite.on('close', (code: number) => {
            callback(code);
        })
    }

    public Read(callback: (distance: number) => void) {
        this.rl.on('line', function (line: string) {

            try {
                callback(JSON.parse(line).dist)
            } catch (e) {
                console.log(line)
            }
        })
    };


    public Kill() {
        this.ultra_lite.kill('SIGINT');
    }

}

export { Lidar };
