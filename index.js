const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const UpdatePresets = require('./presets')
const http = require('http')
const https = require('https')
const Jimp = require('jimp')

class MakitoX4EncoderInstance extends InstanceBase {
    constructor(internal) {
        super(internal)

        // Initialize thumbnail storage
        this.encoderThumbnails = {}

        // Initialize device choices for dropdowns
        this.encoderChoices = []
    }

    async init(config) {
        this.config = config

        this.updateStatus(InstanceStatus.Connecting)

        this.updateActions()
        this.updateFeedbacks()
        this.updateVariableDefinitions()
        this.updatePresets()

        this.initConnection()
    }

    async destroy() {
        this.log('debug', 'destroy')

        if (this.pollTimer) {
            clearInterval(this.pollTimer)
            delete this.pollTimer
        }
    }

    async configUpdated(config) {
        this.config = config

        this.updateStatus(InstanceStatus.Connecting)
        this.initConnection()
    }

    getConfigFields() {
        return [
            {
                type: 'static-text',
                id: 'info',
                width: 12,
                label: 'Information',
                value: 'This module will control Haivision Makito X4 Encoder devices via their REST API.',
            },
            {
                type: 'textinput',
                id: 'host',
                label: 'Device IP',
                width: 8,
                regex: Regex.IP,
            },
            {
                type: 'textinput',
                id: 'port',
                label: 'Port',
                width: 4,
                default: '443',
                regex: Regex.PORT,
            },
            {
                type: 'textinput',
                id: 'username',
                label: 'Username',
                width: 6,
                default: 'admin',
            },
            {
                type: 'textinput',
                id: 'password',
                label: 'Password',
                width: 6,
                default: '',
            },
            {
                type: 'checkbox',
                id: 'polling',
                label: 'Enable Polling',
                width: 6,
                default: true,
            },
            {
                type: 'number',
                id: 'pollInterval',
                label: 'Poll Interval (seconds)',
                width: 6,
                min: 1,
                max: 60,
                default: 5,
                isVisible: (configValues) => configValues.polling === true,
            },
        ]
    }

    updateActions() {
        UpdateActions(this)
    }

    updateFeedbacks() {
        UpdateFeedbacks(this)
    }

    updateVariableDefinitions() {
        UpdateVariableDefinitions(this)
    }

    updatePresets() {
        UpdatePresets(this)
    }

    async initConnection() {
        if (!this.config.host) {
            this.updateStatus(InstanceStatus.BadConfig, 'No host configured')
            return
        }

        this.useHttps = this.config.port === '443'
        this.baseURL = `${this.useHttps ? 'https' : 'http'}://${this.config.host}:${this.config.port}`
        this.authenticated = false
        this.cookies = {}

        // Authenticate first if credentials are provided
        if (this.config.username && this.config.password) {
            const authSuccess = await this.authenticate()
            if (!authSuccess) {
                this.updateStatus(InstanceStatus.ConnectionFailure, 'Authentication failed')
                return
            }
        }

        // Now get device info
        await this.getDeviceInfo()

        // Build device choices for dropdowns
        await this.buildDeviceChoices()

        // Get initial stream list for dropdown population
        await this.getStreamList()

        // Get initial preset list
        await this.getPresetList()

        if (this.config.polling) {
            this.startPolling()
        }
    }

    async authenticate() {
        try {
            // Cookie-based authentication via /apis/authentication
            this.log('debug', 'Attempting authentication via /apis/authentication')

            const authResponse = await this.makeRequest('/apis/authentication', 'POST', {
                username: this.config.username,
                password: this.config.password
            }, true) // skipAuth flag to avoid auth loop

            // The SessionID cookie should be automatically captured by makeRequest
            if (this.cookies['SessionID']) {
                this.log('info', 'Authentication successful - SessionID cookie received')
                this.authenticated = true
                return true
            } else {
                this.log('warn', 'Authentication response received but no SessionID cookie')
                return false
            }
        } catch (error) {
            this.log('error', `Authentication failed: ${error.message}`)
            return false
        }
    }

    startPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer)
        }

        this.pollTimer = setInterval(() => {
            this.getDeviceStatus()
        }, this.config.pollInterval * 1000)
    }

    async makeRequestBinary(endpoint) {
        return new Promise((resolve, reject) => {
            const client = this.useHttps ? https : http

            // Ensure endpoint starts with / and add /apis if not present
            let apiPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
            if (!apiPath.startsWith('/apis/') && !apiPath.startsWith('/apis')) {
                apiPath = `/apis${apiPath}`
            }

            const options = {
                hostname: this.config.host,
                port: this.config.port,
                path: apiPath,
                method: 'GET',
                headers: {
                    'Accept': 'image/jpeg, image/png, */*',
                    'User-Agent': 'Companion/3.0'
                },
                rejectUnauthorized: false, // Allow self-signed certificates
                timeout: 5000
            }

            // Cookie-based authentication - always send cookies if we have them
            if (this.cookies && Object.keys(this.cookies).length > 0) {
                options.headers['Cookie'] = Object.entries(this.cookies)
                    .map(([key, value]) => `${key}=${value}`)
                    .join('; ')
                this.log('debug', `Binary request with cookies to ${apiPath}`)
            }

            this.log('debug', `Making binary request to: ${options.hostname}:${options.port}${apiPath}`)

            const req = client.request(options, (res) => {
                const chunks = []

                this.log('debug', `Binary response status: ${res.statusCode}, headers: ${JSON.stringify(res.headers)}`)

                res.on('data', (chunk) => {
                    chunks.push(chunk)
                })

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        const buffer = Buffer.concat(chunks)
                        this.log('debug', `Binary data received: ${buffer.length} bytes`)
                        resolve(buffer)
                    } else {
                        this.log('error', `Binary request failed: HTTP ${res.statusCode}: ${res.statusMessage}`)
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
                    }
                })
            })

            req.on('error', (error) => {
                this.log('error', `Binary request error: ${error.message}`)
                reject(error)
            })

            req.on('timeout', () => {
                req.destroy()
                this.log('error', 'Binary request timeout')
                reject(new Error('Request timeout'))
            })

            req.end()
        })
    }

    async makeRequest(endpoint, method = 'GET', body = null, skipAuth = false) {
        return new Promise((resolve, reject) => {
            const client = this.useHttps ? https : http

            // Ensure endpoint starts with / and add /apis if not present
            let apiPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
            if (!apiPath.startsWith('/apis/') && !apiPath.startsWith('/apis')) {
                apiPath = `/apis${apiPath}`
            }

            const options = {
                hostname: this.config.host,
                port: this.config.port,
                path: apiPath,
                method: method,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Companion/3.0'
                },
                rejectUnauthorized: false, // Allow self-signed certificates
                timeout: 5000
            }

            // Cookie-based authentication - always send cookies if we have them
            if (this.cookies && Object.keys(this.cookies).length > 0) {
                options.headers['Cookie'] = Object.entries(this.cookies)
                    .map(([key, value]) => `${key}=${value}`)
                    .join('; ')
                this.log('debug', `Sending cookies: ${options.headers['Cookie']}`)
            }

            let postData = null
            if (body && method !== 'GET') {
                postData = JSON.stringify(body)
                options.headers['Content-Length'] = Buffer.byteLength(postData)
            }

            this.log('debug', `Making ${method} request to ${this.baseURL}${apiPath}`)

            const req = client.request(options, (res) => {
                let data = ''

                // Capture cookies from response
                if (res.headers['set-cookie']) {
                    res.headers['set-cookie'].forEach(cookie => {
                        const parts = cookie.split(';')[0].split('=')
                        if (parts.length === 2) {
                            this.cookies[parts[0]] = parts[1]
                        }
                    })
                }

                res.on('data', (chunk) => {
                    data += chunk
                })

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const jsonData = data ? JSON.parse(data) : {}
                            resolve(jsonData)
                        } catch (e) {
                            this.log('debug', `Response body: ${data}`)
                            resolve({ raw: data })
                        }
                    } else if (res.statusCode === 401) {
                        this.log('error', `Authentication failed (HTTP 401). Session may have expired.`)
                        // Clear cookies on auth failure
                        this.cookies = {}
                        this.authenticated = false
                        reject(new Error(`HTTP 401: Authentication required`))
                    } else {
                        this.log('error', `HTTP ${res.statusCode}: ${data}`)
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
                    }
                })
            })

            req.on('error', (error) => {
                this.log('error', `Request error: ${error.message}`)
                reject(error)
            })

            req.on('timeout', () => {
                req.destroy()
                reject(new Error('Request timeout'))
            })

            if (postData) {
                req.write(postData)
            }

            req.end()
        })
    }

    async getDeviceInfo() {
        try {
            this.log('debug', 'Getting device status from /apis/status')
            const status = await this.makeRequest('/apis/status')

            if (status) {
                this.deviceInfo = status

                // Parse the /apis/status response correctly
                this.setVariableValues({
                    // Device identification
                    device_type: status.cardType || 'Unknown',
                    device_serial: status.serialNumber || 'Unknown',
                    device_part_number: status.partNumber || 'Unknown',

                    // Firmware/version info
                    device_version: status.firmwareVersion || 'Unknown',
                    device_firmware_date: status.firmwareDate || 'Unknown',
                    device_firmware_options: status.firmwareOptions || 'None',
                    device_boot_version: status.bootVersion || 'Unknown',

                    // Hardware info
                    device_hw_compatibility: status.hardwareCompatibility || 'Unknown',
                    device_hw_revision: status.hardwareRevision || 'Unknown',
                    device_cpld_revision: status.cpldRevision || 'Unknown',

                    // Status info
                    device_status: status.cardStatus || 'Unknown',
                    device_uptime: status.uptime || '0 days 00:00:00',
                    device_uptime_seconds: status.uptimeSec || 0,
                    device_httpd_uptime: status.httpdUptime || '0',
                    device_temperature: status.temperature ? `${status.temperature}°C` : 'Unknown',

                    // Connection status
                    connection_status: status.cardStatus === 'OK' ? 'Connected' : 'Error',

                    // Keep IP from config
                    device_ip: this.config.host || 'Not configured',
                })

                this.updateStatus(InstanceStatus.Ok)
                this.log('info', `Connected to ${status.cardType || 'Makito X4 Encoder'} (S/N: ${status.serialNumber || 'Unknown'})`)
            }
        } catch (error) {
            this.updateStatus(InstanceStatus.ConnectionFailure, error.message)
            this.setVariableValues({
                connection_status: 'Disconnected',
            })
            this.log('error', `Failed to connect: ${error.message}. Check IP, port, and credentials.`)
        }
    }

    async getDeviceStatus() {
        try {
            // Get system status first
            const statusData = await this.makeRequest('/apis/status')

            if (statusData) {
                // Update system status variables
                this.deviceInfo = statusData
                this.setVariableValues({
                    device_status: statusData.cardStatus || 'Unknown',
                    device_uptime: statusData.uptime || '0 days 00:00:00',
                    device_uptime_seconds: statusData.uptimeSec || 0,
                    device_httpd_uptime: statusData.httpdUptime || '0',
                    device_temperature: statusData.temperature ? `${statusData.temperature}°C` : 'Unknown',
                    connection_status: statusData.cardStatus === 'OK' ? 'Connected' : 'Error',
                })

                // Get stats for all 4 video encoders (0-3)
                for (let i = 0; i < 4; i++) {
                    try {
                        const encoderData = await this.makeRequest(`/apis/videnc/${i}`)
                        if (!this.encodersStatus) this.encodersStatus = {}
                        this.encodersStatus[i] = encoderData
                        this.processEncoderStatus(encoderData, i)
                        this.log('debug', `Got video encoder ${i} data`)

                        // Update encoder name in choices if needed
                        if (encoderData && encoderData.info && encoderData.info.name) {
                            if (this.encoderChoices && this.encoderChoices[i]) {
                                const currentName = this.encoderChoices[i].label
                                if (currentName !== encoderData.info.name) {
                                    this.log('debug', `Encoder ${i} name changed from "${currentName}" to "${encoderData.info.name}"`)
                                    this.encoderChoices[i].label = encoderData.info.name
                                    // Update actions and feedbacks to reflect new name
                                    this.updateActions()
                                    this.updateFeedbacks()
                                }
                            }
                        }

                        // Fetch thumbnails periodically (every 10th poll)
                        if (this.presetListCounter && this.presetListCounter % 10 === 0) {
                            // Only fetch thumbnail if encoder is active
                            const stats = encoderData?.stats || encoderData
                            this.log('debug', `Encoder ${i} thumbnail check - Counter: ${this.presetListCounter}, State: ${stats?.state}`)
                            if (stats && (stats.state === 'running' || stats.state === 'active' || stats.state === 1)) {
                                this.log('info', `Encoder ${i} is active, fetching thumbnail`)
                                this.getThumbnail('encoder', i)
                            } else {
                                this.log('debug', `Encoder ${i} not active (state ${stats?.state}), skipping thumbnail`)
                            }
                        }
                    } catch (error) {
                        this.log('debug', `Encoder ${i} stats failed: ${error.message}`)
                    }
                }
            }

            // Get preset list periodically
            if (!this.presetListCounter) {
                this.presetListCounter = 0
            }
            this.presetListCounter++

            if (this.presetListCounter % 5 === 0) {
                await this.getPresetList()
            }

            // Get stream list more frequently to update status
            if (this.presetListCounter % 3 === 0) {
                await this.getStreamList()
                // Process stream statuses for variables
                this.processStreamStatuses()
            }

            this.checkFeedbacks()
        } catch (error) {
            this.log('error', `Failed to get device status: ${error.message}`)
            this.updateStatus(InstanceStatus.ConnectionFailure)
        }
    }

    processEncoderStatus(encoderData, encoderIndex) {
        // Handle both direct response and nested data structure
        const info = encoderData?.info || encoderData
        const stats = encoderData?.stats || {}

        if (info || stats) {
            const varPrefix = `encoder${encoderIndex}_`
            const variables = {}

            // Encoder name from info
            variables[`${varPrefix}name`] = info?.name || `Video Encoder ${encoderIndex}`

            // Map encoder state values according to API docs
            // States: 0=STOPPED, 3=AWAIT_FRAMING, 5=NOT_ENCODING, 7=WORKING, 8=RESETTING, 128=FAILED
            let stateStr = 'Unknown'
            if (typeof stats.state !== 'undefined') {
                switch(stats.state) {
                    case 0: stateStr = 'Stopped'; break;
                    case 3: stateStr = 'Awaiting Frame'; break;
                    case 5: stateStr = 'Not Encoding'; break;
                    case 7: stateStr = 'Working'; break;
                    case 8: stateStr = 'Resetting'; break;
                    case 128: stateStr = 'Failed'; break;
                    default: stateStr = `State ${stats.state}`; break;
                }
            }
            variables[`${varPrefix}state`] = stateStr

            // Codec mapping: 0=H.264, 1=H.265
            let codecStr = 'Unknown'
            if (typeof info?.codecAlgorithm !== 'undefined') {
                codecStr = info.codecAlgorithm === 1 ? 'H.265' : 'H.264'
            }
            variables[`${varPrefix}codec`] = codecStr

            // Configured bitrate from info - convert to Mbps if over 1000 kbps
            let configuredBitrate = info?.bitrate || 0
            if (configuredBitrate >= 1000) {
                variables[`${varPrefix}bitrate`] = `${(configuredBitrate / 1000).toFixed(1)} Mbps`
            } else {
                variables[`${varPrefix}bitrate`] = `${configuredBitrate} kbps`
            }

            // Configured resolution from info
            variables[`${varPrefix}resolution_config`] = info?.resolution || 'Unknown'

            // Input status from stats
            variables[`${varPrefix}input_present`] = stats.inputPresent ? 'Yes' : 'No'
            variables[`${varPrefix}input_format`] = stats.inputFormat || 'No Signal'

            // Output resolution from stats (may differ from configured)
            variables[`${varPrefix}resolution`] = stats.resolution || info?.resolution || 'Unknown'

            // Framerate from stats
            variables[`${varPrefix}framerate`] = stats.framerate || '0'

            // Actual encoded bitrate from stats - convert to Mbps if over 1000 kbps
            let actualBitrate = stats.bitrate || 0
            if (actualBitrate >= 1000) {
                variables[`${varPrefix}encoded_bitrate`] = `${(actualBitrate / 1000).toFixed(1)} Mbps`
            } else {
                variables[`${varPrefix}encoded_bitrate`] = `${actualBitrate} kbps`
            }

            // Dropped frames from stats
            variables[`${varPrefix}dropped_frames`] = stats.droppedFrames || '0'

            // Encoder load/CPU usage from stats
            if (stats.encoderLoad) {
                variables[`${varPrefix}encoder_load`] = `${stats.encoderLoad}%`
            } else {
                variables[`${varPrefix}encoder_load`] = '0%'
            }

            this.setVariableValues(variables)
        }
    }

    processStreamStatuses() {
        // Process stream variables
        if (this.streamList && Array.isArray(this.streamList)) {
            for (let i = 0; i < Math.min(10, this.streamList.length); i++) {
                const stream = this.streamList[i]
                if (stream && stream.info) {
                    const variables = {}
                    const varPrefix = `stream${i}_`

                    // Map stream state to readable string
                    let stateStr = 'Unknown'
                    const stateMap = {
                        0: 'Stopped',
                        1: 'Streaming',
                        2: 'Failed',
                        3: 'Connecting',
                        4: 'Securing',
                        5: 'Listening',
                        6: 'Paused',
                        7: 'Publishing',
                        8: 'Resolving',
                        9: 'Scrambled'
                    }

                    if (stream.stats && typeof stream.stats.state !== 'undefined') {
                        stateStr = stateMap[stream.stats.state] || `State ${stream.stats.state}`
                    }

                    // Basic stream info
                    variables[`${varPrefix}name`] = stream.info.name || ''
                    variables[`${varPrefix}id`] = stream.info.id || ''
                    variables[`${varPrefix}address`] = stream.info.address || ''
                    variables[`${varPrefix}port`] = stream.info.port || ''

                    // Stream type
                    const encapTypes = {
                        2: 'UDP',
                        3: 'RTP',
                        34: 'SRT',
                        64: 'RTSP'
                    }
                    variables[`${varPrefix}type`] = encapTypes[stream.info.encapsulation] || 'Unknown'

                    // Stream statistics if available
                    if (stream.stats) {
                        variables[`${varPrefix}state`] = stateStr

                        // Convert bitrate to Mbps if over 1000 kbps
                        let streamBitrate = stream.stats.bitrate || 0
                        if (streamBitrate >= 1000) {
                            variables[`${varPrefix}bitrate`] = `${(streamBitrate / 1000).toFixed(1)} Mbps`
                        } else {
                            variables[`${varPrefix}bitrate`] = `${streamBitrate} kbps`
                        }

                        variables[`${varPrefix}uptime`] = stream.stats.uptime || ''

                        // SRT-specific stats
                        if (stream.info.encapsulation === 34 && stream.stats.srt) {
                            variables[`${varPrefix}srt_latency`] = stream.stats.srt.latency || ''
                            variables[`${varPrefix}srt_rtt`] = stream.stats.srt.rtt || ''
                            variables[`${varPrefix}srt_lost`] = stream.stats.srt.lost || ''
                        }
                    }

                    this.setVariableValues(variables)
                }
            }

            // Clear remaining stream variables if less than 10 streams
            for (let i = this.streamList.length; i < 10; i++) {
                const variables = {}
                const varPrefix = `stream${i}_`

                variables[`${varPrefix}name`] = ''
                variables[`${varPrefix}id`] = ''
                variables[`${varPrefix}address`] = ''
                variables[`${varPrefix}port`] = ''
                variables[`${varPrefix}type`] = ''
                variables[`${varPrefix}state`] = ''
                variables[`${varPrefix}bitrate`] = '0'
                variables[`${varPrefix}uptime`] = ''
                variables[`${varPrefix}srt_latency`] = ''
                variables[`${varPrefix}srt_rtt`] = ''
                variables[`${varPrefix}srt_lost`] = ''

                this.setVariableValues(variables)
            }
        }
    }

    async startEncoder(deviceNum = '0') {
        try {
            await this.makeRequest(`/apis/videnc/${deviceNum}/start`, 'PUT')
            this.log('info', `Encoder ${deviceNum} started`)
            setTimeout(() => this.getDeviceStatus(), 1000)
        } catch (error) {
            this.log('error', `Failed to start encoder ${deviceNum}: ${error.message}`)
        }
    }

    async stopEncoder(deviceNum = '0') {
        try {
            await this.makeRequest(`/apis/videnc/${deviceNum}/stop`, 'PUT')
            this.log('info', `Encoder ${deviceNum} stopped`)
            setTimeout(() => this.getDeviceStatus(), 1000)
        } catch (error) {
            this.log('error', `Failed to stop encoder ${deviceNum}: ${error.message}`)
        }
    }

    async buildDeviceChoices() {
        try {
            // Build encoder choices by getting configuration for each encoder
            this.encoderChoices = []
            for (let i = 0; i < 4; i++) {
                try {
                    const encoderConfig = await this.makeRequest(`/apis/videnc/${i}`)
                    if (encoderConfig && encoderConfig.info) {
                        this.encoderChoices.push({
                            id: i,
                            label: encoderConfig.info.name || `Video Encoder ${i}`
                        })
                    } else {
                        this.encoderChoices.push({
                            id: i,
                            label: `Video Encoder ${i}`
                        })
                    }
                } catch (error) {
                    // If encoder doesn't exist or error, still add it to list
                    this.encoderChoices.push({
                        id: i,
                        label: `Video Encoder ${i}`
                    })
                }
            }

            this.log('debug', `Built encoder choices: ${JSON.stringify(this.encoderChoices)}`)

            // Update actions and feedbacks with new choices
            this.updateActions()
            this.updateFeedbacks()
        } catch (error) {
            this.log('error', `Failed to build device choices: ${error.message}`)
        }
    }

    getEncoderChoices() {
        return this.encoderChoices || [
            { id: 0, label: 'Encoder 0' },
            { id: 1, label: 'Encoder 1' },
            { id: 2, label: 'Encoder 2' },
            { id: 3, label: 'Encoder 3' }
        ]
    }

    async getStreamList() {
        try {
            const streams = await this.makeRequest('/apis/streams')
            if (streams && streams.data) {
                this.streamList = streams.data

                // Create a mapping of stream ID to name for easy lookup
                this.streamMap = {}
                // Build choices array for dropdown
                this.streamChoices = []

                streams.data.forEach(stream => {
                    if (stream.info) {
                        const streamName = stream.info.name || `Stream ${stream.info.id}`
                        this.streamMap[stream.info.id] = streamName

                        // Add to choices array with additional info
                        let label = streamName
                        if (stream.info.address && stream.info.port) {
                            label += ` (${stream.info.address}:${stream.info.port})`
                        }
                        // Add encapsulation type
                        const encapTypes = {
                            2: 'UDP',
                            3: 'RTP',
                            34: 'SRT',
                            64: 'RTSP'
                        }
                        if (encapTypes[stream.info.encapsulation]) {
                            label += ` [${encapTypes[stream.info.encapsulation]}]`
                        }

                        this.streamChoices.push({
                            id: String(stream.info.id),
                            label: label
                        })
                    }
                })

                // Update stream count variable
                this.setVariableValues({
                    stream_count: streams.data.length
                })

                // Update action definitions with new stream choices
                this.updateActions()

                this.log('debug', `Found ${streams.data.length} streams`)
                return streams.data
            }
            return []
        } catch (error) {
            this.log('debug', `Failed to get stream list: ${error.message}`)
            this.streamList = []
            this.streamChoices = []
            return []
        }
    }

    async getPresetList() {
        try {
            const presets = await this.makeRequest('/apis/presets')
            if (presets && presets.data) {
                this.presetList = presets.data
                this.presetInfo = {
                    autosave: presets.autosave,
                    active: presets.active,
                    activeIsStartup: presets.activeIsStartup,
                    activeWasModified: presets.activeWasModified
                }
                // Set variables for preset info
                this.setVariableValues({
                    preset_active: presets.active || 'None',
                    preset_autosave: presets.autosave ? 'Enabled' : 'Disabled',
                    preset_modified: presets.activeWasModified ? 'Yes' : 'No',
                    preset_count: presets.data ? presets.data.length : 0,
                })

                // Build preset choices for dropdown
                if (presets.data && Array.isArray(presets.data)) {
                    this.presetChoices = presets.data.map(preset => ({
                        id: preset,
                        label: preset
                    }))

                    // Update actions with new preset choices
                    this.updateActions()
                }

                this.log('debug', `Found ${presets.data.length} presets`)
                return presets.data
            }
            return []
        } catch (error) {
            this.log('debug', `Failed to get preset list: ${error.message}`)
            return []
        }
    }

    async getThumbnail(type, index) {
        if (type === 'encoder') {
            try {
                const imageData = await this.makeRequestBinary(`/apis/preview/${index}`)
                if (imageData) {
                    // Process the image with Jimp
                    const image = await Jimp.read(imageData)
                    const resized = await image.scaleToFit(72, 72).quality(70).getBufferAsync(Jimp.MIME_PNG)

                    // Store the resized thumbnail as base64
                    this.encoderThumbnails[index] = `data:image/png;base64,${resized.toString('base64')}`

                    this.log('debug', `Encoder ${index} thumbnail updated`)
                    this.checkFeedbacks(`encoder_thumbnail`)
                }
            } catch (error) {
                this.log('debug', `Failed to get encoder ${index} thumbnail: ${error.message}`)
            }
        }
    }
}

runEntrypoint(MakitoX4EncoderInstance, UpgradeScripts)