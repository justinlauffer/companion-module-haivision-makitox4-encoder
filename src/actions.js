module.exports = function (self) {
    // Get encoder choices for this encoder module
    const getEncoderChoices = () => {
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
        choices: getEncoderChoices(),
    }

    self.setActionDefinitions({
        encoder_start: {
            name: 'Encoder Start',
            options: [deviceNumberOption],
            callback: async (action) => {
                await self.startEncoder(action.options.deviceNumber)
            },
        },
        encoder_stop: {
            name: 'Encoder Stop',
            options: [deviceNumberOption],
            callback: async (action) => {
                await self.stopEncoder(action.options.deviceNumber)
            },
        },
        encoder_toggle: {
            name: 'Encoder Toggle Start/Stop',
            options: [deviceNumberOption],
            callback: async (action) => {
                const deviceNum = action.options.deviceNumber
                // Check current encoder state
                if (self.encodersStatus && self.encodersStatus[deviceNum]) {
                    const status = self.encodersStatus[deviceNum].stats || self.encodersStatus[deviceNum]
                    // If encoder is running/active, stop it. Otherwise start it.
                    if (status.state === 'running' || status.state === 'active' || status.state === 1) {
                        await self.stopEncoder(deviceNum)
                    } else {
                        await self.startEncoder(deviceNum)
                    }
                } else {
                    // If we don't have status, default to starting
                    await self.startEncoder(deviceNum)
                }
            },
        },
        encoder_restart: {
            name: 'Encoder Restart',
            options: [deviceNumberOption],
            callback: async (action) => {
                const deviceNum = action.options.deviceNumber
                await self.stopEncoder(deviceNum)
                setTimeout(async () => {
                    await self.startEncoder(deviceNum)
                }, 2000)
            },
        },
        set_encoder_bitrate: {
            name: 'Set Encoder Bitrate',
            options: [
                deviceNumberOption,
                {
                    type: 'number',
                    label: 'Bitrate (kbps)',
                    id: 'bitrate',
                    default: 5000,
                    min: 100,
                    max: 50000,
                },
            ],
            callback: async (action) => {
                try {
                    const deviceNum = action.options.deviceNumber
                    await self.makeRequest(`/apis/videnc/${deviceNum}`, 'PUT', {
                        bitrate: action.options.bitrate
                    })
                    self.log('info', `Encoder ${deviceNum} bitrate set to ${action.options.bitrate} kbps`)
                    // Refresh encoder status
                    setTimeout(() => self.getDeviceStatus(), 1000)
                } catch (error) {
                    self.log('error', `Failed to set encoder bitrate: ${error.message}`)
                }
            },
        },
        set_encoder_resolution: {
            name: 'Set Encoder Resolution',
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
            callback: async (action) => {
                try {
                    const deviceNum = action.options.deviceNumber
                    await self.makeRequest(`/apis/videnc/${deviceNum}`, 'PUT', {
                        resolution: action.options.resolution
                    })
                    self.log('info', `Encoder ${deviceNum} resolution set to ${action.options.resolution}`)
                    // Refresh encoder status
                    setTimeout(() => self.getDeviceStatus(), 1000)
                } catch (error) {
                    self.log('error', `Failed to set encoder resolution: ${error.message}`)
                }
            },
        },
        set_encoder_framerate: {
            name: 'Set Encoder Framerate/GOP',
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
            callback: async (action) => {
                try {
                    const deviceNum = action.options.deviceNumber
                    await self.makeRequest(`/apis/videnc/${deviceNum}`, 'PUT', {
                        gopSize: parseInt(action.options.framerate) * 2 // GOP size is typically 2x framerate
                    })
                    self.log('info', `Encoder ${deviceNum} GOP/framerate set to ${action.options.framerate} fps`)
                    // Refresh encoder status
                    setTimeout(() => self.getDeviceStatus(), 1000)
                } catch (error) {
                    self.log('error', `Failed to set encoder framerate: ${error.message}`)
                }
            },
        },
        set_encoder_codec: {
            name: 'Set Encoder Codec',
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
            callback: async (action) => {
                try {
                    const deviceNum = action.options.deviceNumber
                    // Map codec names to API values: 0=H.264, 1=H.265
                    const codecValue = action.options.codec === 'h265' ? 1 : 0
                    await self.makeRequest(`/apis/videnc/${deviceNum}`, 'PUT', {
                        codecAlgorithm: codecValue
                    })
                    self.log('info', `Encoder ${deviceNum} codec set to ${action.options.codec}`)
                    // Refresh encoder status
                    setTimeout(() => self.getDeviceStatus(), 1000)
                } catch (error) {
                    self.log('error', `Failed to set encoder codec: ${error.message}`)
                }
            },
        },
        set_stream_destination: {
            name: 'Set Stream Destination',
            options: [
                deviceNumberOption,
                {
                    type: 'textinput',
                    label: 'Destination IP',
                    id: 'ip',
                    default: '239.0.0.1',
                    regex: '/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/',
                },
                {
                    type: 'number',
                    label: 'Port',
                    id: 'port',
                    default: 5004,
                    min: 1,
                    max: 65535,
                },
            ],
            callback: async (action) => {
                try {
                    // This would typically create/update a stream, not modify encoder directly
                    self.log('warn', 'Stream destination should be set when creating/editing streams, not on encoder directly')
                    // You would use POST /apis/streams to create a new stream with these settings
                } catch (error) {
                    self.log('error', `Failed to set stream destination: ${error.message}`)
                }
            },
        },
        fetch_encoder_thumbnail: {
            name: 'Fetch Encoder Thumbnail (Test)',
            options: [
                deviceNumberOption,
            ],
            callback: async (action) => {
                try {
                    const deviceNum = action.options.deviceNumber
                    self.log('info', `Manually fetching thumbnail for encoder ${deviceNum}`)
                    await self.getThumbnail('encoder', parseInt(deviceNum))

                    // Check if thumbnail was stored
                    if (self.encoderThumbnails && self.encoderThumbnails[deviceNum]) {
                        self.log('info', `Thumbnail successfully fetched and stored for encoder ${deviceNum}`)
                    } else {
                        self.log('warn', `Thumbnail fetch completed but no data stored for encoder ${deviceNum}`)
                    }
                } catch (error) {
                    self.log('error', `Failed to fetch encoder thumbnail: ${error.message}`)
                }
            },
        },
        save_system_preset: {
            name: 'Save System Preset',
            options: [
                {
                    type: 'textinput',
                    label: 'Preset Name (with .cfg extension)',
                    id: 'name',
                    default: 'preset1.cfg',
                },
                {
                    type: 'checkbox',
                    label: 'Set as Startup Preset',
                    id: 'startup',
                    default: false,
                },
            ],
            callback: async (action) => {
                try {
                    // Ensure .cfg extension
                    let presetName = action.options.name
                    if (!presetName.endsWith('.cfg')) {
                        presetName += '.cfg'
                    }
                    await self.makeRequest(`/apis/presets/${presetName}`, 'PUT', {
                        startup: action.options.startup
                    })
                    self.log('info', `System preset saved: ${presetName}`)
                } catch (error) {
                    self.log('error', `Failed to save system preset: ${error.message}`)
                }
            },
        },
        load_system_preset: {
            name: 'Load System Preset',
            options: [
                {
                    type: 'textinput',
                    label: 'Preset Name (with .cfg extension)',
                    id: 'name',
                    default: 'preset1.cfg',
                },
            ],
            callback: async (action) => {
                try {
                    // Ensure .cfg extension
                    let presetName = action.options.name
                    if (!presetName.endsWith('.cfg')) {
                        presetName += '.cfg'
                    }
                    await self.makeRequest(`/apis/presets/${presetName}/load`, 'PUT')
                    self.log('info', `System preset loaded: ${presetName}`)
                    // Refresh status after loading preset
                    setTimeout(() => self.getDeviceStatus(), 2000)
                } catch (error) {
                    self.log('error', `Failed to load system preset: ${error.message}`)
                }
            },
        },
        delete_system_preset: {
            name: 'Delete System Preset',
            options: [
                {
                    type: 'textinput',
                    label: 'Preset Name (with .cfg extension)',
                    id: 'name',
                    default: 'preset1.cfg',
                },
                {
                    type: 'checkbox',
                    label: 'Confirm Delete',
                    id: 'confirm',
                    default: false,
                },
            ],
            callback: async (action) => {
                if (!action.options.confirm) {
                    self.log('warn', 'Preset deletion not confirmed')
                    return
                }
                try {
                    // Ensure .cfg extension
                    let presetName = action.options.name
                    if (!presetName.endsWith('.cfg')) {
                        presetName += '.cfg'
                    }
                    await self.makeRequest(`/apis/presets/${presetName}`, 'DELETE')
                    self.log('info', `System preset deleted: ${presetName}`)
                } catch (error) {
                    self.log('error', `Failed to delete system preset: ${error.message}`)
                }
            },
        },
        rename_system_preset: {
            name: 'Rename System Preset',
            options: [
                {
                    type: 'textinput',
                    label: 'Current Name (with .cfg extension)',
                    id: 'currentName',
                    default: 'preset1.cfg',
                },
                {
                    type: 'textinput',
                    label: 'New Name (with .cfg extension)',
                    id: 'newName',
                    default: 'preset2.cfg',
                },
                {
                    type: 'checkbox',
                    label: 'Overwrite if exists',
                    id: 'overwrite',
                    default: false,
                },
            ],
            callback: async (action) => {
                try {
                    // Ensure .cfg extension
                    let currentName = action.options.currentName
                    if (!currentName.endsWith('.cfg')) {
                        currentName += '.cfg'
                    }
                    let newName = action.options.newName
                    if (!newName.endsWith('.cfg')) {
                        newName += '.cfg'
                    }
                    await self.makeRequest(`/apis/presets/${currentName}/rename`, 'PUT', {
                        name: newName,
                        overwriteIfAlreadyExists: action.options.overwrite
                    })
                    self.log('info', `System preset renamed from ${currentName} to ${newName}`)
                } catch (error) {
                    self.log('error', `Failed to rename system preset: ${error.message}`)
                }
            },
        },
        duplicate_system_preset: {
            name: 'Duplicate System Preset',
            options: [
                {
                    type: 'textinput',
                    label: 'Preset Name (with .cfg extension)',
                    id: 'name',
                    default: 'preset1.cfg',
                },
            ],
            callback: async (action) => {
                try {
                    // Ensure .cfg extension
                    let presetName = action.options.name
                    if (!presetName.endsWith('.cfg')) {
                        presetName += '.cfg'
                    }
                    await self.makeRequest(`/apis/presets/${presetName}/duplicate`, 'PUT')
                    self.log('info', `System preset duplicated: ${presetName}`)
                } catch (error) {
                    self.log('error', `Failed to duplicate system preset: ${error.message}`)
                }
            },
        },
        set_startup_preset: {
            name: 'Set Startup Preset',
            options: [
                {
                    type: 'textinput',
                    label: 'Preset Name (with .cfg extension)',
                    id: 'name',
                    default: 'preset1.cfg',
                },
            ],
            callback: async (action) => {
                try {
                    // Ensure .cfg extension
                    let presetName = action.options.name
                    if (!presetName.endsWith('.cfg')) {
                        presetName += '.cfg'
                    }
                    await self.makeRequest(`/apis/presets/${presetName}/startup`, 'PUT')
                    self.log('info', `Startup preset set to: ${presetName}`)
                } catch (error) {
                    self.log('error', `Failed to set startup preset: ${error.message}`)
                }
            },
        },
        set_preset_autosave: {
            name: 'Set Preset Autosave',
            options: [
                {
                    type: 'checkbox',
                    label: 'Enable Autosave',
                    id: 'autosave',
                    default: true,
                },
            ],
            callback: async (action) => {
                try {
                    await self.makeRequest('/apis/presets', 'PUT', {
                        autosave: action.options.autosave
                    })
                    self.log('info', `Preset autosave ${action.options.autosave ? 'enabled' : 'disabled'}`)
                } catch (error) {
                    self.log('error', `Failed to set preset autosave: ${error.message}`)
                }
            },
        },
        enable_preview_service: {
            name: 'Enable Preview Service',
            options: [
                {
                    type: 'checkbox',
                    label: 'Enable Preview',
                    id: 'enabled',
                    default: true,
                },
            ],
            callback: async (action) => {
                try {
                    // Get current settings first
                    const currentSettings = await self.makeRequest('/apis/services/preview')

                    // Update only the enabled flag
                    const updatedSettings = {
                        ...currentSettings,
                        enabled: action.options.enabled
                    }

                    await self.makeRequest('/apis/services/preview', 'PUT', updatedSettings)
                    self.log('info', `Preview service ${action.options.enabled ? 'enabled' : 'disabled'}`)
                } catch (error) {
                    self.log('error', `Failed to set preview service: ${error.message}`)
                }
            },
        },
        create_stream: {
            name: 'Create Stream',
            options: [
                {
                    type: 'textinput',
                    label: 'Stream Name',
                    id: 'name',
                    default: 'New Stream',
                },
                {
                    type: 'dropdown',
                    label: 'Encapsulation',
                    id: 'encapsulation',
                    default: '2',
                    choices: [
                        { id: '2', label: 'TS over UDP' },
                        { id: '3', label: 'TS over RTP' },
                        { id: '34', label: 'TS over SRT' },
                        { id: '64', label: 'RTSP' },
                    ],
                },
                {
                    type: 'textinput',
                    label: 'Address (IP/hostname or "Any")',
                    id: 'address',
                    default: 'Any',
                },
                {
                    type: 'number',
                    label: 'Port',
                    id: 'port',
                    default: 5004,
                    min: 1,
                    max: 65535,
                },
                {
                    type: 'dropdown',
                    label: 'SRT Mode (for SRT only)',
                    id: 'srtMode',
                    default: '1',
                    choices: [
                        { id: '0', label: 'Caller' },
                        { id: '1', label: 'Listener' },
                        { id: '2', label: 'Rendezvous' },
                    ],
                },
                {
                    type: 'number',
                    label: 'SRT Latency (ms)',
                    id: 'latency',
                    default: 120,
                    min: 20,
                    max: 8000,
                },
            ],
            callback: async (action) => {
                try {
                    const streamData = {
                        name: action.options.name,
                        encapsulation: parseInt(action.options.encapsulation),
                        address: action.options.address,
                        port: action.options.port,
                    }

                    // Add SRT-specific options if SRT encapsulation
                    if (action.options.encapsulation === '34') {
                        streamData.srtMode = parseInt(action.options.srtMode)
                        streamData.latency = action.options.latency
                    }

                    await self.makeRequest('/apis/streams', 'POST', streamData)
                    self.log('info', `Stream created: ${action.options.name}`)
                    // Refresh stream list
                    setTimeout(() => self.getStreamList(), 1000)
                } catch (error) {
                    self.log('error', `Failed to create stream: ${error.message}`)
                }
            },
        },
        delete_stream: {
            name: 'Delete Stream',
            options: [
                {
                    type: 'dropdown',
                    label: 'Stream',
                    id: 'streamId',
                    default: '-1',
                    choices: self.streamChoices || [{ id: '-1', label: 'No Stream' }],
                },
                {
                    type: 'checkbox',
                    label: 'Confirm Delete',
                    id: 'confirm',
                    default: false,
                },
            ],
            callback: async (action) => {
                if (!action.options.confirm) {
                    self.log('warn', 'Stream deletion not confirmed')
                    return
                }
                if (action.options.streamId === '-1') {
                    self.log('warn', 'No stream selected for deletion')
                    return
                }
                try {
                    const streamName = (self.streamMap && self.streamMap[action.options.streamId]) || `Stream ${action.options.streamId}`
                    await self.makeRequest(`/apis/streams/${action.options.streamId}`, 'DELETE')
                    self.log('info', `Stream "${streamName}" deleted`)
                    // Refresh stream list
                    setTimeout(() => self.getStreamList(), 1000)
                } catch (error) {
                    self.log('error', `Failed to delete stream: ${error.message}`)
                }
            },
        },
        stream_start: {
            name: 'Stream Start',
            options: [
                {
                    type: 'dropdown',
                    label: 'Stream',
                    id: 'streamId',
                    default: '-1',
                    choices: self.streamChoices || [{ id: '-1', label: 'No Streams Available' }],
                },
            ],
            callback: async (action) => {
                if (action.options.streamId === '-1') {
                    self.log('warn', 'No stream selected')
                    return
                }
                try {
                    const streamName = (self.streamMap && self.streamMap[action.options.streamId]) || `Stream ${action.options.streamId}`
                    await self.makeRequest(`/apis/streams/${action.options.streamId}/start`, 'PUT')
                    self.log('info', `Stream "${streamName}" started`)
                    // Refresh stream list to update status
                    setTimeout(() => self.getStreamList(), 1000)
                } catch (error) {
                    self.log('error', `Failed to start stream: ${error.message}`)
                }
            },
        },
        stream_stop: {
            name: 'Stream Stop',
            options: [
                {
                    type: 'dropdown',
                    label: 'Stream',
                    id: 'streamId',
                    default: '-1',
                    choices: self.streamChoices || [{ id: '-1', label: 'No Streams Available' }],
                },
            ],
            callback: async (action) => {
                if (action.options.streamId === '-1') {
                    self.log('warn', 'No stream selected')
                    return
                }
                try {
                    const streamName = (self.streamMap && self.streamMap[action.options.streamId]) || `Stream ${action.options.streamId}`
                    await self.makeRequest(`/apis/streams/${action.options.streamId}/stop`, 'PUT')
                    self.log('info', `Stream "${streamName}" stopped`)
                    // Refresh stream list to update status
                    setTimeout(() => self.getStreamList(), 1000)
                } catch (error) {
                    self.log('error', `Failed to stop stream: ${error.message}`)
                }
            },
        },
        stream_toggle: {
            name: 'Stream Toggle Start/Stop',
            options: [
                {
                    type: 'dropdown',
                    label: 'Stream',
                    id: 'streamId',
                    default: '-1',
                    choices: self.streamChoices || [{ id: '-1', label: 'No Streams Available' }],
                },
            ],
            callback: async (action) => {
                if (action.options.streamId === '-1') {
                    self.log('warn', 'No stream selected')
                    return
                }
                try {
                    // Get current stream status
                    const stream = self.streamList && self.streamList.find(s => s.info && s.info.id == action.options.streamId)
                    const streamName = (self.streamMap && self.streamMap[action.options.streamId]) || `Stream ${action.options.streamId}`

                    if (stream && stream.stats) {
                        // Stream states: 0=STOPPED, 1=STREAMING, 2=FAILED, 3=CONNECTING, 5=LISTENING
                        // If stream is running (state 1) or listening (state 5), stop it. Otherwise start it.
                        if (stream.stats.state === 1 || stream.stats.state === 5) {
                            await self.makeRequest(`/apis/streams/${action.options.streamId}/stop`, 'PUT')
                            self.log('info', `Stream "${streamName}" stopped (was in state ${stream.stats.state})`)
                        } else {
                            await self.makeRequest(`/apis/streams/${action.options.streamId}/start`, 'PUT')
                            self.log('info', `Stream "${streamName}" started (was in state ${stream.stats.state})`)
                        }
                    } else {
                        // If we can't determine status, try to start
                        await self.makeRequest(`/apis/streams/${action.options.streamId}/start`, 'PUT')
                        self.log('info', `Stream "${streamName}" start attempted (status unknown)`)
                    }

                    // Refresh stream list to update status
                    setTimeout(() => self.getStreamList(), 1000)
                } catch (error) {
                    self.log('error', `Failed to toggle stream: ${error.message}`)
                }
            },
        },
        stream_restart: {
            name: 'Stream Restart',
            options: [
                {
                    type: 'dropdown',
                    label: 'Stream',
                    id: 'streamId',
                    default: '-1',
                    choices: self.streamChoices || [{ id: '-1', label: 'No Streams Available' }],
                },
            ],
            callback: async (action) => {
                if (action.options.streamId === '-1') {
                    self.log('warn', 'No stream selected')
                    return
                }
                try {
                    const streamName = (self.streamMap && self.streamMap[action.options.streamId]) || `Stream ${action.options.streamId}`

                    // Stop the stream
                    self.log('info', `Stopping stream "${streamName}" for restart...`)
                    await self.makeRequest(`/apis/streams/${action.options.streamId}/stop`, 'PUT')

                    // Wait 5 seconds
                    self.log('info', `Waiting 5 seconds before restarting stream "${streamName}"...`)
                    setTimeout(async () => {
                        try {
                            // Start the stream
                            await self.makeRequest(`/apis/streams/${action.options.streamId}/start`, 'PUT')
                            self.log('info', `Stream "${streamName}" restarted successfully`)

                            // Refresh stream list to update status
                            setTimeout(() => self.getStreamList(), 1000)
                        } catch (error) {
                            self.log('error', `Failed to restart stream "${streamName}": ${error.message}`)
                        }
                    }, 5000)
                } catch (error) {
                    self.log('error', `Failed to stop stream for restart: ${error.message}`)
                }
            },
        },
        edit_stream: {
            name: 'Edit Stream',
            options: [
                {
                    type: 'dropdown',
                    label: 'Stream to Edit',
                    id: 'streamId',
                    default: '-1',
                    choices: self.streamChoices || [{ id: '-1', label: 'No Stream' }],
                },
                {
                    type: 'textinput',
                    label: 'New Stream Name (leave empty to keep current)',
                    id: 'name',
                    default: '',
                },
                {
                    type: 'textinput',
                    label: 'New Address (leave empty to keep current)',
                    id: 'address',
                    default: '',
                },
                {
                    type: 'textinput',
                    label: 'New Port (leave empty to keep current)',
                    id: 'port',
                    default: '',
                },
            ],
            callback: async (action) => {
                if (action.options.streamId === '-1') {
                    self.log('warn', 'No stream selected for editing')
                    return
                }
                try {
                    // Get current stream config first
                    const currentStream = await self.makeRequest(`/apis/streams/${action.options.streamId}`)
                    if (!currentStream || !currentStream.data) {
                        self.log('error', 'Could not get current stream configuration')
                        return
                    }

                    const streamData = {
                        ...currentStream.data.info,
                    }

                    // Update only provided fields
                    if (action.options.name) streamData.name = action.options.name
                    if (action.options.address) streamData.address = action.options.address
                    if (action.options.port) streamData.port = parseInt(action.options.port)

                    const streamName = (self.streamMap && self.streamMap[action.options.streamId]) || `Stream ${action.options.streamId}`
                    await self.makeRequest(`/apis/streams/${action.options.streamId}`, 'PUT', streamData)
                    self.log('info', `Stream "${streamName}" updated`)
                    // Refresh stream list
                    setTimeout(() => self.getStreamList(), 1000)
                } catch (error) {
                    self.log('error', `Failed to edit stream: ${error.message}`)
                }
            },
        },
        reboot_device: {
            name: 'Reboot Device',
            options: [
                {
                    type: 'checkbox',
                    label: 'Confirm Reboot',
                    id: 'confirm',
                    default: false,
                },
            ],
            callback: async (action) => {
                if (action.options.confirm) {
                    try {
                        const response = await self.makeRequest('/apis/reboot', 'POST')
                        if (response && response.upgrade === 1) {
                            self.log('info', 'Device reboot initiated (upgrade pending - extended reboot time expected)')
                            self.updateStatus('warning', 'Device rebooting with upgrade...')
                        } else {
                            self.log('info', 'Device reboot initiated')
                            self.updateStatus('warning', 'Device rebooting...')
                        }
                    } catch (error) {
                        self.log('error', `Failed to reboot device: ${error.message}`)
                    }
                } else {
                    self.log('warn', 'Reboot not confirmed')
                }
            },
        },
        custom_api_call: {
            name: 'Custom API Call',
            options: [
                {
                    type: 'textinput',
                    label: 'API Endpoint',
                    id: 'endpoint',
                    default: '',
                },
                {
                    type: 'dropdown',
                    label: 'Method',
                    id: 'method',
                    default: 'GET',
                    choices: [
                        { id: 'GET', label: 'GET' },
                        { id: 'POST', label: 'POST' },
                        { id: 'PUT', label: 'PUT' },
                        { id: 'DELETE', label: 'DELETE' },
                    ],
                },
                {
                    type: 'textinput',
                    label: 'Body (JSON)',
                    id: 'body',
                    default: '{}',
                },
            ],
            callback: async (action) => {
                try {
                    let body = null
                    if (action.options.method !== 'GET' && action.options.body) {
                        body = JSON.parse(action.options.body)
                    }
                    const result = await self.makeRequest(action.options.endpoint, action.options.method, body)
                    self.log('info', `Custom API call successful: ${JSON.stringify(result)}`)
                } catch (error) {
                    self.log('error', `Custom API call failed: ${error.message}`)
                }
            },
        },
    })
}