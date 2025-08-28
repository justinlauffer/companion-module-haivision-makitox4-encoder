module.exports = async function (self) {
    const variables = []

    // General device variables
    variables.push(
        // Connection
        {
            variableId: 'connection_status',
            name: 'Connection Status',
        },
        {
            variableId: 'device_ip',
            name: 'Device IP Address',
        },

        // System Presets
        {
            variableId: 'preset_active',
            name: 'Active Preset',
        },
        {
            variableId: 'preset_autosave',
            name: 'Preset Autosave',
        },
        {
            variableId: 'preset_modified',
            name: 'Preset Modified',
        },
        {
            variableId: 'preset_count',
            name: 'Preset Count',
        },

        // Preview Service
        {
            variableId: 'preview_enabled',
            name: 'Preview Service Enabled',
        },

        // Stream Management
        {
            variableId: 'stream_count',
            name: 'Total Stream Count',
        },

        // Device identification
        {
            variableId: 'device_type',
            name: 'Device Type',
        },
        {
            variableId: 'device_serial',
            name: 'Serial Number',
        },
        {
            variableId: 'device_part_number',
            name: 'Part Number',
        },

        // Firmware info
        {
            variableId: 'device_version',
            name: 'Firmware Version',
        },
        {
            variableId: 'device_firmware_date',
            name: 'Firmware Date',
        },
        {
            variableId: 'device_firmware_options',
            name: 'Firmware Options',
        },
        {
            variableId: 'device_boot_version',
            name: 'Boot Version',
        },

        // Hardware info
        {
            variableId: 'device_hw_compatibility',
            name: 'Hardware Compatibility',
        },
        {
            variableId: 'device_hw_revision',
            name: 'Hardware Revision',
        },
        {
            variableId: 'device_cpld_revision',
            name: 'CPLD Revision',
        },

        // Status info
        {
            variableId: 'device_status',
            name: 'Card Status',
        },
        {
            variableId: 'device_uptime',
            name: 'System Uptime',
        },
        {
            variableId: 'device_uptime_seconds',
            name: 'Uptime (seconds)',
        },
        {
            variableId: 'device_httpd_uptime',
            name: 'HTTP Server Uptime',
        },
        {
            variableId: 'device_temperature',
            name: 'Temperature',
        }
    )

    // Add variables for all 4 video encoders (0-3 to match API indices)
    for (let i = 0; i < 4; i++) {
        variables.push(
            {
                variableId: `encoder${i}_name`,
                name: `Video Encoder ${i} Name`,
            },
            {
                variableId: `encoder${i}_state`,
                name: `Video Encoder ${i} State`,
            },
            {
                variableId: `encoder${i}_codec`,
                name: `Video Encoder ${i} Codec`,
            },
            {
                variableId: `encoder${i}_bitrate`,
                name: `Video Encoder ${i} Configured Bitrate (kbps)`,
            },
            {
                variableId: `encoder${i}_resolution_config`,
                name: `Video Encoder ${i} Configured Resolution`,
            },
            {
                variableId: `encoder${i}_input_present`,
                name: `Video Encoder ${i} Input Present`,
            },
            {
                variableId: `encoder${i}_input_format`,
                name: `Video Encoder ${i} Input Format`,
            },
            {
                variableId: `encoder${i}_resolution`,
                name: `Video Encoder ${i} Output Resolution`,
            },
            {
                variableId: `encoder${i}_framerate`,
                name: `Video Encoder ${i} Framerate (fps)`,
            },
            {
                variableId: `encoder${i}_encoded_bitrate`,
                name: `Video Encoder ${i} Actual Bitrate (kbps)`,
            },
            {
                variableId: `encoder${i}_dropped_frames`,
                name: `Video Encoder ${i} Dropped Frames`,
            },
            {
                variableId: `encoder${i}_encoder_load`,
                name: `Video Encoder ${i} CPU Load`,
            }
        )
    }

    // Add variables for up to 10 streams
    for (let i = 0; i < 10; i++) {
        variables.push(
            {
                variableId: `stream${i}_name`,
                name: `Stream ${i} Name`,
            },
            {
                variableId: `stream${i}_id`,
                name: `Stream ${i} ID`,
            },
            {
                variableId: `stream${i}_address`,
                name: `Stream ${i} Address`,
            },
            {
                variableId: `stream${i}_port`,
                name: `Stream ${i} Port`,
            },
            {
                variableId: `stream${i}_type`,
                name: `Stream ${i} Type`,
            },
            {
                variableId: `stream${i}_state`,
                name: `Stream ${i} State`,
            },
            {
                variableId: `stream${i}_bitrate`,
                name: `Stream ${i} Bitrate (kbps)`,
            },
            {
                variableId: `stream${i}_uptime`,
                name: `Stream ${i} Uptime`,
            },
            {
                variableId: `stream${i}_srt_latency`,
                name: `Stream ${i} SRT Latency (ms)`,
            },
            {
                variableId: `stream${i}_srt_rtt`,
                name: `Stream ${i} SRT RTT (μs)`,
            },
            {
                variableId: `stream${i}_srt_lost`,
                name: `Stream ${i} SRT Lost Packets`,
            }
        )
    }

    self.setVariableDefinitions(variables)

    // Set initial values
    self.setVariableValues({
        // Connection
        connection_status: 'Disconnected',
        device_ip: self.config.host || 'Not configured',

        // System Presets
        preset_active: 'None',
        preset_autosave: 'Unknown',
        preset_modified: 'Unknown',
        preset_count: 0,

        // Preview Service
        preview_enabled: 'Unknown',

        // Stream Management
        stream_count: 0,

        // Device identification
        device_type: 'Unknown',
        device_serial: 'Unknown',
        device_part_number: 'Unknown',

        // Firmware info
        device_version: 'Unknown',
        device_firmware_date: 'Unknown',
        device_firmware_options: 'None',
        device_boot_version: 'Unknown',

        // Hardware info
        device_hw_compatibility: 'Unknown',
        device_hw_revision: 'Unknown',
        device_cpld_revision: 'Unknown',

        // Status info
        device_status: 'Unknown',
        device_uptime: '0 days 00:00:00',
        device_uptime_seconds: 0,
        device_httpd_uptime: '0',
        device_temperature: 'Unknown',
    })

    // Initialize all video encoder variables
    for (let i = 0; i < 4; i++) {
        self.setVariableValues({
            [`encoder${i}_name`]: `Video Encoder ${i}`,
            [`encoder${i}_state`]: 'Unknown',
            [`encoder${i}_codec`]: 'Unknown',
            [`encoder${i}_bitrate`]: '0',
            [`encoder${i}_resolution_config`]: 'Unknown',
            [`encoder${i}_input_present`]: 'No',
            [`encoder${i}_input_format`]: 'No Signal',
            [`encoder${i}_resolution`]: 'Unknown',
            [`encoder${i}_framerate`]: '0',
            [`encoder${i}_encoded_bitrate`]: '0',
            [`encoder${i}_dropped_frames`]: '0',
            [`encoder${i}_encoder_load`]: '0%',
        })
    }

    // Initialize all stream variables
    for (let i = 0; i < 10; i++) {
        self.setVariableValues({
            [`stream${i}_name`]: '',
            [`stream${i}_id`]: '',
            [`stream${i}_address`]: '',
            [`stream${i}_port`]: '',
            [`stream${i}_type`]: '',
            [`stream${i}_state`]: '',
            [`stream${i}_bitrate`]: '0',
            [`stream${i}_uptime`]: '',
            [`stream${i}_srt_latency`]: '',
            [`stream${i}_srt_rtt`]: '',
            [`stream${i}_srt_lost`]: '',
        })
    }
}