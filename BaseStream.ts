import {DashData, FlvData} from "./type";

export class BaseStream{
    constructor(
        public from: string,
        public result: string,
        public message: string,
        public quality: number,
        public format: string,
        public timelength: number,
        public accept_format: string,
        public accept_description: string[],
        public accept_quality: number[],
        public video_codecid: number,
        public seek_param: string,
        public seek_type: string
    ) {}
}

export class DashStream{
    get stream() {
        return {
            video: this.dash.video.sort((a, b) => b.bandwidth - a.bandwidth)[0],
            audio: this.dash.audio.sort((a, b) => b.bandwidth - a.bandwidth)[0]
        }
    }

    constructor(
        public from: string,
        public result: string,
        public message: string,
        public quality: number,
        public format: string,
        public timelength: number,
        public accept_format: string,
        public accept_description: string[],
        public accept_quality: number[],
        public video_codecid: number,
        public seek_param: string,
        public seek_type: string,
        public dash: DashData
    ) {}
}

export class FlvStream{
    constructor(
        public from: string,
        public result: string,
        public message: string,
        public quality: number,
        public format: string,
        public timelength: number,
        public accept_format: string,
        public accept_description: string[],
        public accept_quality: number[],
        public video_codecid: number,
        public seek_param: string,
        public seek_type: string,
        public durl: FlvData[]
    ) {}
}
