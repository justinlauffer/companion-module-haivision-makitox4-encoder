const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
    // Use encoder choices for device selection
    const getDeviceChoices = () => {
        return self.encoderChoices && self.encoderChoices.length > 0
            ? self.encoderChoices
            : [
                { id: '0', label: 'Encoder 1' },
                { id: '1', label: 'Encoder 2' },
                { id: '2', label: 'Encoder 3' },
                { id: '3', label: 'Encoder 4' },
            ]
    }

    const deviceNumberOption = {
        type: 'dropdown',
        label: 'Encoder',
        id: 'deviceNumber',
        default: '0',
        choices: getDeviceChoices(),
    }

    self.setFeedbackDefinitions({
        encoder_status: {
            type: 'boolean',
            name: 'Encoder Status',
            description: 'Change button color based on encoder status',
            defaultStyle: {
                bgcolor: combineRgb(0, 255, 0),
                color: combineRgb(0, 0, 0),
            },
            options: [
                deviceNumberOption,
                {
                    type: 'dropdown',
                    label: 'Status',
                    id: 'status',
                    default: 'running',
                    choices: [
                        { id: 'running', label: 'Running' },
                        { id: 'stopped', label: 'Stopped' },
                        { id: 'error', label: 'Error' },
                    ],
                },
            ],
            callback: (feedback) => {
                const deviceNum = feedback.options.deviceNumber
                if (self.encodersStatus && self.encodersStatus[deviceNum]) {
                    const status = self.encodersStatus[deviceNum].stats || self.encodersStatus[deviceNum]
                    return status.state === feedback.options.status
                }
                return false
            },
        },
        encoder_bitrate_compare: {
            type: 'boolean',
            name: 'Encoder Bitrate Compare',
            description: 'Change button color based on encoder bitrate comparison',
            defaultStyle: {
                bgcolor: combineRgb(255, 255, 0),
                color: combineRgb(0, 0, 0),
            },
            options: [
                deviceNumberOption,
                {
                    type: 'dropdown',
                    label: 'Comparison',
                    id: 'comparison',
                    default: 'greater',
                    choices: [
                        { id: 'greater', label: 'Greater than' },
                        { id: 'less', label: 'Less than' },
                        { id: 'equal', label: 'Equal to' },
                    ],
                },
                {
                    type: 'number',
                    label: 'Value (kbps)',
                    id: 'value',
                    default: 5000,
                    min: 0,
                    max: 50000,
                },
            ],
            callback: (feedback) => {
                const deviceNum = feedback.options.deviceNumber
                if (self.encodersStatus && self.encodersStatus[deviceNum]) {
                    const stats = self.encodersStatus[deviceNum].stats || self.encodersStatus[deviceNum]
                    const bitrate = stats.bitrate || 0
                    const value = feedback.options.value

                    switch (feedback.options.comparison) {
                        case 'greater':
                            return bitrate > value
                        case 'less':
                            return bitrate < value
                        case 'equal':
                            return bitrate === value
                        default:
                            return false
                    }
                }
                return false
            },
        },
        connection_status: {
            type: 'boolean',
            name: 'Connection Status',
            description: 'Change button color based on connection status',
            defaultStyle: {
                bgcolor: combineRgb(0, 255, 0),
                color: combineRgb(0, 0, 0),
            },
            options: [],
            callback: () => {
                // Check if we have device info which means we're connected
                return self.deviceInfo && self.deviceInfo.cardStatus === 'OK'
            },
        },
        encoder_resolution_match: {
            type: 'boolean',
            name: 'Encoder Resolution Match',
            description: 'Change button color if encoder resolution matches',
            defaultStyle: {
                bgcolor: combineRgb(0, 100, 255),
                color: combineRgb(255, 255, 255),
            },
            options: [
                deviceNumberOption,
                {
                    type: 'dropdown',
                    label: 'Resolution',
                    id: 'resolution',
                    default: '1920x1080',
                    choices: [
                        { id: '3840x2160', label: '4K (3840x2160)' },
                        { id: '1920x1080', label: 'Full HD (1920x1080)' },
                        { id: '1280x720', label: 'HD (1280x720)' },
                        { id: '720x480', label: 'SD (720x480)' },
                    ],
                },
            ],
            callback: (feedback) => {
                const deviceNum = feedback.options.deviceNumber
                if (self.encodersStatus && self.encodersStatus[deviceNum]) {
                    const stats = self.encodersStatus[deviceNum].stats || self.encodersStatus[deviceNum]
                    const video = stats.video || stats
                    return video.resolution === feedback.options.resolution
                }
                return false
            },
        },
        encoder_framerate_match: {
            type: 'boolean',
            name: 'Encoder Framerate Match',
            description: 'Change button color if encoder framerate matches',
            defaultStyle: {
                bgcolor: combineRgb(100, 200, 100),
                color: combineRgb(0, 0, 0),
            },
            options: [
                deviceNumberOption,
                {
                    type: 'dropdown',
                    label: 'Framerate',
                    id: 'framerate',
                    default: '30',
                    choices: [
                        { id: '60', label: '60 fps' },
                        { id: '50', label: '50 fps' },
                        { id: '30', label: '30 fps' },
                        { id: '25', label: '25 fps' },
                        { id: '24', label: '24 fps' },
                    ],
                },
            ],
            callback: (feedback) => {
                const deviceNum = feedback.options.deviceNumber
                if (self.encodersStatus && self.encodersStatus[deviceNum]) {
                    const stats = self.encodersStatus[deviceNum].stats || self.encodersStatus[deviceNum]
                    const video = stats.video || stats
                    return video.framerate == feedback.options.framerate
                }
                return false
            },
        },
        encoder_codec_match: {
            type: 'boolean',
            name: 'Encoder Codec Match',
            description: 'Change button color if encoder codec matches',
            defaultStyle: {
                bgcolor: combineRgb(200, 100, 200),
                color: combineRgb(255, 255, 255),
            },
            options: [
                deviceNumberOption,
                {
                    type: 'dropdown',
                    label: 'Codec',
                    id: 'codec',
                    default: 'h264',
                    choices: [
                        { id: 'h264', label: 'H.264' },
                        { id: 'h265', label: 'H.265 (HEVC)' },
                    ],
                },
            ],
            callback: (feedback) => {
                const deviceNum = feedback.options.deviceNumber
                if (self.encodersStatus && self.encodersStatus[deviceNum]) {
                    const stats = self.encodersStatus[deviceNum].stats || self.encodersStatus[deviceNum]
                    const video = stats.video || stats
                    return video.codec === feedback.options.codec
                }
                return false
            },
        },
        encoder_thumbnail: {
            type: 'advanced',
            name: 'Encoder Thumbnail',
            description: 'Display encoder thumbnail as button background',
            options: [
                deviceNumberOption,
            ],
            callback: (feedback) => {
                const deviceNum = parseInt(feedback.options.deviceNumber)
                self.log('debug', `Encoder thumbnail feedback called for device ${deviceNum}`)
                self.log('debug', `encoderThumbnails exists: ${!!self.encoderThumbnails}`)
                self.log('debug', `encoderThumbnails[${deviceNum}] exists: ${!!(self.encoderThumbnails && self.encoderThumbnails[deviceNum])}`)

                if (self.encoderThumbnails && self.encoderThumbnails[deviceNum]) {
                    const thumbnail = self.encoderThumbnails[deviceNum]
                    self.log('info', `Returning encoder thumbnail for device ${deviceNum}, size: ${thumbnail.length}`)
                    self.log('debug', `First 100 chars of thumbnail: ${thumbnail.substring(0, 100)}`)

                    // Return the base64 data URI
                    return { png64: thumbnail }
                }
                self.log('debug', `No encoder thumbnail available for device ${deviceNum}`)
                return {}
            },
        },
    })
}