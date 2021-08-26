import {BaseResponse, PartItem, UserData, VideoData} from "./type";
import axios from "axios";
import {BaseStream, DashStream, FlvStream} from "./BaseStream";
import path from "path";
import progress from "progress"
import {createWriteStream, mkdirSync} from "fs";
import ffmpeg from 'fluent-ffmpeg'
import rimraf from "rimraf";

export default class Bili {
    BVID: string | null = null
    SESSDATA: string | null = null
    userAgent: string = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36`
    directory: string = './output'

    constructor(bvId: string, sessData: null | string, directory: string) {
        this.BVID = bvId
        this.SESSDATA = sessData
        this.directory = directory
    }

    async run() {
        await this.getCurrentUserData()
        const videoData: VideoData = await this.getVideoData()
        await this.dealVideoData(videoData)
    }

    async getAcceptQuality(cid: number): Promise<number[]> {
        try {
            const result = await axios.get<BaseResponse<BaseStream>>('https://api.bilibili.com/x/player/playurl', {
                params: {
                    bvid: this.BVID,
                    cid,
                    fourk: 1
                },
                headers: {
                    Cookie: `SESSDATA=${this.SESSDATA || ''}`,
                    'User-Agent': this.userAgent
                }
            })

            if (result.data.code === 0) {
                return result.data.data.accept_quality.sort((a, b) => b - a)
            } else {
                throw `Failed to obtain video information`
            }
        } catch (err) {
            throw new Error(err)
        }
    }


    async getVideoUrl(cid: number, qualityId: number): Promise<DashStream | FlvStream> {
        try {
            const result = await axios.get<BaseResponse>('https://api.bilibili.com/x/player/playurl', {
                params: {
                    bvid: this.BVID,
                    cid,
                    fnval: 16,
                    qn: qualityId,
                    fourk: 1
                },
                headers: {
                    Cookie: `SESSDATA=${this.SESSDATA || ''}`,
                    'User-Agent': this.userAgent
                }
            })

            if (result.data.code === 0) {
                const _data = result.data.data
                const acceptFormat: string[] = _data.accept_format.split(',')
                if ((acceptFormat.includes('mp4') || acceptFormat.includes('hdflv2')) || Object.keys(_data).includes('dash')) {
                    return new DashStream(
                        _data.from,
                        _data.result,
                        _data.message,
                        _data.quality,
                        _data.format,
                        _data.timelength,
                        _data.accept_format,
                        _data.accept_description,
                        _data.accept_quality,
                        _data.video_codecid,
                        _data.seek_param,
                        _data.seek_type,
                        _data.dash
                    )

                } else {
                    return new FlvStream(
                        _data.from,
                        _data.result,
                        _data.message,
                        _data.quality,
                        _data.format,
                        _data.timelength,
                        _data.accept_format,
                        _data.accept_description,
                        _data.accept_quality,
                        _data.video_codecid,
                        _data.seek_param,
                        _data.seek_type,
                        _data.durl
                    )
                }
            } else {
                throw `Error getting video download link`
            }
        } catch (err) {
            throw new Error(err)
        }
    }

    // 正常名称
    normalizeName(str: string): string {
        str = str.replace(/(\?|\*)/g, '')
        str = str.replace(/(\/|\|)/g, ' ')
        str = str.replace(/:/g, '-')
        str = str.replace(/"/g, '\`')
        str = str.replace(/</g, '(')
        str = str.replace(/>/g, ')')
        return str
    }


    // 转换格式
    transform(value?: number): string {
        if (!value || value <= 0) {
            return '0 bytes'
        }

        const s = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
        const e = Math.floor(Math.log(value) / Math.log(1024))
        return `${(value / Math.pow(1024, Math.floor(e))).toFixed(2)}${s[e]}`
    }

    // 下载视频
    async download(part: PartItem, url: string, type?: string): Promise<string> {
        const response = await axios.get(url, {
            responseType: 'stream',
            headers: {
                'User-Agent': this.userAgent,
                'Referer': `https://www.bilibili.com/video/${this.BVID}`
            }
        })
        let downloaded: number = 0
        const contentType: string = type || String(response.headers['content-type'])
        const total: number = Number(response.headers['content-length'])
        const filePath: string = path.join(__dirname, '/tmp', `${part.cid}-${total}`)
        const bar = new progress(`${contentType} [:bar] :percent :downloaded/:length`, {
            width: 30,
            total: total
        })
        response.data.pipe(createWriteStream(filePath))

        return new Promise<string>((resolve, reject) => {
            response.data.on('data', (chunk: Buffer) => {
                downloaded += chunk.length
                bar.tick(chunk.length, {
                    downloaded: this.transform(downloaded),
                    length: this.transform(total)
                })
            })
            response.data.on('end', () => resolve(filePath))
            response.data.on('error', (err: any) => reject(err))
        })
    }

    // 转化视频
    convert(fileName: string, part: PartItem, paths: string[]) {
        return new Promise<void>((resolve, reject) => {
            if (paths.length <= 0) {
                return
            }
            mkdirSync(path.join(this.directory), {recursive: true})
            const command = ffmpeg()

            for (const item of paths) {
                command.mergeAdd(item)
            }

            command.videoCodec(`copy`)
            command.audioCodec(`copy`)
            command.output(path.join(this.directory, `${fileName}_${this.BVID}_${part.part}.mkv`))

            command.on('start', () => {
                console.log(`Convert start`)
            })
            command.on('error', err => {
                for (const item of paths) {
                    rimraf.sync(item)
                }
                reject(err)
            })
            command.on('end', () => {
                for (const item of paths) {
                    rimraf.sync(item)
                }
                console.log(`Convert complete`)
                resolve()
            })

            command.run()
        })
    }

    // 处理视频信息
    async dealVideoData(videoData: VideoData) {
        for (const item of videoData.pages) {
            const qualityArray = await this.getAcceptQuality(item.cid)
            let stream = await this.getVideoUrl(item.cid, qualityArray[0]);
            const paths = []

            console.log(`Part: ${item.page}`)
            console.log(`Name: ${item.part}`)

            console.log(stream instanceof DashStream)

            if (stream instanceof DashStream) {
                const videoPath = await this.download(item, stream.stream.video.baseUrl, stream.dash.video[0].mimeType)
                const audioPath = await this.download(item, stream.stream.audio.baseUrl, stream.dash.audio[0].mimeType)
                paths.push(videoPath)
                paths.push(audioPath)
            }

            if (stream instanceof FlvStream) {
                const filePath = await this.download(item, stream.durl[0].url)
                paths.push(filePath)
            }

            await this.convert(this.normalizeName(videoData.title), item, paths)
        }
        rimraf.sync(path.join(__dirname, '/tmp'))
        console.log(`Task complete`)
    }


    // 获取当前用户信息
    async getCurrentUserData(): Promise<void> {
        try {
            const result = await axios.get<BaseResponse<UserData>>('https://api.bilibili.com/nav', {
                headers: {
                    Cookie: `SESSDATA=${this.SESSDATA || ''}`,
                    'User-Agent': this.userAgent
                }
            })
            if (result.data.code === 0) {
                console.log('Current user:')
                console.table({
                    id: result.data.data.mid,
                    name: result.data.data.uname,
                    isVip: result.data.data.vipStatus === 1
                })
            } else {
                throw `Error getting user information`
            }
        } catch (err) {
            throw new Error(err)
        }
    }

    // 获取视频信息
    async getVideoData(): Promise<VideoData> {
        try {
            const result = await axios.get<BaseResponse<VideoData>>('https://api.bilibili.com/x/web-interface/view', {
                params: {
                    bvid: this.BVID
                },
                headers: {
                    Cookie: `SESSDATA=${this.SESSDATA || ''}`,
                    'User-Agent': this.userAgent
                }
            })

            if (result.data.code === 0) {
                let info: { [key: string]: string } = {
                    BV: result.data.data.bvid,
                    AV: `AV${result.data.data.aid}`,
                    Title: result.data.data.title,
                    // desc: result.data.data.desc
                }

                for (const [index, item] of result.data.data.pages.entries()) {
                    info[`Part-${index + 1}`] = item.part
                }

                console.log('Video data:')
                console.table(info)
                return result.data.data
            } else {
                throw `Error getting video data`
            }
        } catch (err) {
            throw new Error(err)
        }
    }
}
