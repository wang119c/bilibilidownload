import commander from "commander";
import path from "path";
import {mkdirSync} from "fs";
import Bili from "./Bili";

function main() {
    let BVID: string | null = null
    let SESSDATA: string | null = null
    let directory: string = './output'

    commander.requiredOption('-b, --bv <string>', 'BV id')
    commander.requiredOption('-c, --cookie <number>', 'SESSDATA')
    commander.requiredOption('-d, --directory <string>', 'Output directory', './output')
    commander.parse(process.argv)

    if (commander.bv) {
        BVID = commander.bv
    }
    if (commander.cookie) {
        SESSDATA = decodeURI(commander.cookie)
    }
    if (commander.directory) {
        directory = path.join(commander.directory)
    }

    console.log('Input config:')
    console.table({
        BV: BVID,
        SESSDATA: SESSDATA,
        Directory: directory ? path.resolve(directory) : ''
    })
    if (!BVID) {
        return
    }
    mkdirSync(path.join(__dirname, '/tmp'), {recursive: true})
    const bili = new Bili(BVID, SESSDATA, directory)
    bili.run()
}

main()





