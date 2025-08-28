const { combineRgb } = require('@companion-module/base')

module.exports = function (self) {
    const presets = []

    // Encoder control presets
    presets.push({
        type: 'button',
        category: 'Encoder Control',
        name: 'Start Encoder',
        style: {
            text: 'ENC\\nSTART',
            size: '18',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 100, 0),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'encoder_start',
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [
            {
                feedbackId: 'encoder_status',
                options: {
                    status: 'running',
                },
                style: {
                    bgcolor: combineRgb(0, 255, 0),
                    color: combineRgb(0, 0, 0),
                },
            },
        ],
    })

    presets.push({
        type: 'button',
        category: 'Encoder Control',
        name: 'Stop Encoder',
        style: {
            text: 'ENC\\nSTOP',
            size: '18',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(100, 0, 0),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'encoder_stop',
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [
            {
                feedbackId: 'encoder_status',
                options: {
                    status: 'stopped',
                },
                style: {
                    bgcolor: combineRgb(255, 0, 0),
                    color: combineRgb(255, 255, 255),
                },
            },
        ],
    })

    presets.push({
        type: 'button',
        category: 'Encoder Control',
        name: 'Toggle Encoder',
        style: {
            text: 'ENC\\nTOGGLE',
            size: '18',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(50, 50, 50),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'encoder_toggle',
                        options: {
                            deviceNumber: '0',
                        },
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [
            {
                feedbackId: 'encoder_status',
                options: {
                    deviceNumber: '0',
                    status: 'running',
                },
                style: {
                    bgcolor: combineRgb(0, 255, 0),
                    color: combineRgb(0, 0, 0),
                },
            },
            {
                feedbackId: 'encoder_status',
                options: {
                    deviceNumber: '0',
                    status: 'stopped',
                },
                style: {
                    bgcolor: combineRgb(255, 0, 0),
                    color: combineRgb(255, 255, 255),
                },
            },
        ],
    })

    presets.push({
        type: 'button',
        category: 'Encoder Control',
        name: 'Restart Encoder',
        style: {
            text: 'ENC\\nRESTART',
            size: '14',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(100, 100, 0),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'encoder_restart',
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [],
    })

    presets.push({
        type: 'button',
        category: 'Encoder Settings',
        name: 'Set HD 1080p',
        style: {
            text: 'HD\\n1080p',
            size: '14',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 0, 100),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'set_encoder_resolution',
                        options: {
                            resolution: '1920x1080',
                        },
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [
            {
                feedbackId: 'encoder_resolution_match',
                options: {
                    resolution: '1920x1080',
                },
            },
        ],
    })

    presets.push({
        type: 'button',
        category: 'Encoder Settings',
        name: 'Set 4K UHD',
        style: {
            text: '4K\\nUHD',
            size: '14',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(100, 0, 100),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'set_encoder_resolution',
                        options: {
                            resolution: '3840x2160',
                        },
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [
            {
                feedbackId: 'encoder_resolution_match',
                options: {
                    resolution: '3840x2160',
                },
            },
        ],
    })

    presets.push({
        type: 'button',
        category: 'Encoder Settings',
        name: 'Set H.264 Codec',
        style: {
            text: 'H.264',
            size: '18',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(50, 50, 50),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'set_encoder_codec',
                        options: {
                            codec: 'h264',
                        },
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [
            {
                feedbackId: 'encoder_codec_match',
                options: {
                    codec: 'h264',
                },
            },
        ],
    })

    // Add encoder thumbnail presets
    for (let i = 0; i < 4; i++) {
        presets.push({
            type: 'button',
            category: 'Encoder Thumbnails',
            name: `Encoder ${i + 1} Thumbnail`,
            style: {
                text: `ENC ${i + 1}\\n$(makitox4:encoder${i + 1}_state)`,
                size: '14',
                color: combineRgb(255, 255, 255),
                bgcolor: combineRgb(0, 0, 0),
                show_topbar: false,
            },
            steps: [
                {
                    down: [
                        {
                            actionId: 'encoder_toggle',
                            options: {
                                deviceNumber: String(i),
                            },
                        },
                    ],
                    up: [],
                },
            ],
            feedbacks: [
                {
                    feedbackId: 'encoder_thumbnail',
                    options: {
                        deviceNumber: String(i),
                    },
                },
                {
                    feedbackId: 'encoder_status',
                    options: {
                        deviceNumber: String(i),
                        status: 'running',
                    },
                    style: {
                        bgcolor: combineRgb(0, 255, 0, 64), // Semi-transparent green overlay
                    },
                },
            ],
        })
    }

    presets.push({
        type: 'button',
        category: 'Encoder Settings',
        name: 'Set H.265 Codec',
        style: {
            text: 'H.265\\nHEVC',
            size: '14',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(75, 75, 75),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'set_encoder_codec',
                        options: {
                            codec: 'h265',
                        },
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [
            {
                feedbackId: 'encoder_codec_match',
                options: {
                    codec: 'h265',
                },
            },
        ],
    })

    presets.push({
        type: 'button',
        category: 'System Presets',
        name: 'Save Current Config',
        style: {
            text: 'SAVE\\nPRESET',
            size: '14',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 100, 50),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'save_system_preset',
                        options: {
                            name: 'current.cfg',
                            startup: false,
                        },
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [],
    })

    presets.push({
        type: 'button',
        category: 'System Presets',
        name: 'Load Preset',
        style: {
            text: 'LOAD\\nPRESET',
            size: '14',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 50, 100),
        },
        steps: [
            {
                down: [
                    {
                        actionId: 'load_system_preset',
                        options: {
                            name: 'preset1.cfg',
                        },
                    },
                ],
                up: [],
            },
        ],
        feedbacks: [],
    })

    // Common system presets
    presets.push({
        type: 'button',
        category: 'System',
        name: 'Connection Status',
        style: {
            text: 'CONN\\n$(makitox4:connection_status)',
            size: '14',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(50, 50, 50),
        },
        steps: [],
        feedbacks: [
            {
                feedbackId: 'connection_status',
                style: {
                    bgcolor: combineRgb(0, 255, 0),
                    color: combineRgb(0, 0, 0),
                },
            },
        ],
    })

    presets.push({
        type: 'button',
        category: 'System',
        name: 'Device Info',
        style: {
            text: '$(makitox4:device_name)\\n$(makitox4:device_model)',
            size: '7',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 0, 0),
        },
        steps: [],
        feedbacks: [],
    })

    presets.push({
        type: 'button',
        category: 'Status',
        name: 'Encoder Status',
        style: {
            text: 'ENC: $(makitox4:encoder_state)\\n$(makitox4:encoder_resolution)@$(makitox4:encoder_framerate)fps',
            size: '7',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 0, 0),
        },
        steps: [],
        feedbacks: [
            {
                feedbackId: 'encoder_status',
                options: {
                    status: 'running',
                },
                style: {
                    bgcolor: combineRgb(0, 100, 0),
                },
            },
            {
                feedbackId: 'encoder_status',
                options: {
                    status: 'error',
                },
                style: {
                    bgcolor: combineRgb(200, 0, 0),
                },
            },
        ],
    })

    presets.push({
        type: 'button',
        category: 'Status',
        name: 'Bitrate Monitor',
        style: {
            text: 'BITRATE\\n$(makitox4:encoder_bitrate) kbps',
            size: '14',
            color: combineRgb(255, 255, 255),
            bgcolor: combineRgb(0, 0, 0),
        },
        steps: [],
        feedbacks: [],
    })

    self.setPresetDefinitions(presets)
}