export interface BaseResponse<T = any> {
    code: number,
    message: number,
    ttl: number,
    data: T
}

export interface UserData {
    isLogin: boolean
    email_verified: number
    face: string
    level_info: {
        current_level: number
        current_min: number
        current_exp: number
        next_exp: number
    },
    mid: number
    mobile_verified: number
    money: number
    moral: number
    official: {
        role: number
        title: string
        desc: string
        type: number
    },
    officialVerify: {
        type: number
        desc: string
    },
    pendant: {
        pid: number
        name: string
        image: string
        expire: number
        image_enhance: string
    },
    scores: number
    uname: string
    vipDueDate: number
    vipStatus: number
    vipType: number
    vip_pay_type: number
    vip_theme_type: number
    wallet: {
        mid: number
        bcoin_balance: number
        coupon_balance: number
        coupon_due_time: number
    },
    "has_shop": boolean,
    "shop_url": string
    "allowance_count": number
    "answer_status": number
}


export interface PartItem {
    cid: number
    page: number
    from: string
    part: string
    duration: number
    vid: string
    weblink: string
    dimension: {
        width: number
        height: number
        rotate: number
    }
}

export interface VideoData {
    bvid: string
    aid: number
    videos: number
    tid: number
    tname: string
    copyright: number
    pic: string
    title: string
    pubdate: number
    ctime: number
    desc: string
    state: number
    attribute: number
    duration: number
    pages: PartItem[]
}

export interface FlvData {
    order: number
    length: number
    size: number
    ahead: string
    vhead: string
    url: string
    backup_url: string[]
}

export interface DashData {
    duration: number
    minBufferTime: number
    min_buffer_time: number
    video: {
        id: number
        baseUrl: string
        base_url: string
        backupUrl: string[],
        backup_url: string[],
        bandwidth: number
        mimeType: string
        mime_type: string
        codecs: string
        width: number
        height: number
        frameRate: string
        frame_rate: string
        sar: string
        startWithSap: number
        start_with_sap: number
        SegmentBase: {
            Initialization: string
            indexRange: string
        },
        segment_base: {
            initialization: string
            index_range: string
        },
        codecid: number
    }[],
    audio: {
        id: number
        baseUrl: string
        base_url: string
        backupUrl: string[],
        backup_url: string[],
        bandwidth: number
        mimeType: string
        mime_type: string
        codecs: string
        width: number
        height: number
        frameRate: string
        frame_rate: string
        sar: string
        startWithSap: number
        start_with_sap: number
        SegmentBase: {
            Initialization: string
            indexRange: string
        },
        segment_base: {
            initialization: string
            index_range: string
        },
        codecid: number
    }[]
}
