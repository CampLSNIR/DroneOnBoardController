
const rpio = require('rpio');





class Pixy2 {

    constructor() {
        const { spawn } = require('child_process');
        this.spawn = spawn
    }

    spawn: any
    get_blocks: any
    rl: any

    public async Init() {
        this.get_blocks = this.spawn('/home/pi/testPixy/pixy2/build/get_blocks_cpp_demo/get_blocks_cpp_demo');

        this.rl = require('readline').createInterface({
            input: this.get_blocks.stdout
        });
        return
    }

    public OnClose(callback: (code: number) => void) {
        this.get_blocks.on('close', (code: number) => {
            callback(code);
        })
    }

    public Read(callback: (blocks: any) => void) {
        let regex = /^.*[0-9]+.*[0-9]+.*[0-9]+.*[0-9]+.*[0-9]+.*[0-9]+.*[0-9]+$/i;
        this.rl.on('line', function (line: string) {
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
    }

    public Kill() {
        this.get_blocks.kill('SIGINT');
    }

}

export { Pixy2 };
