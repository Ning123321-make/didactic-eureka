class SatelliteAPI {
    constructor() {
        this.baseUrl = '/api';
        this.initData();
        // 启动后台模拟任务（定期生成遥测、处理指令）
        this.startBackgroundTasks();
    }
    
    initData() {
        // 初始化本地存储数据
        if (!localStorage.getItem('satellites')) {
            const defaultSatellites = [
                {
                    id: 1,
                    satelliteId: "SAT001",
                    satelliteName: "天巡一号",
                    satelliteType: "低轨遥感星",
                    launchTime: "2023-01-15",
                    orbitInfo: "500km SSO 太阳同步轨道",
                    status: "在线",
                    uplinkFrequency: "2200 MHz",
                    downlinkFrequency: "1800 MHz",
                    payloadInfo: "多光谱相机，分辨率5米，幅宽60km",
                    designLife: 36,
                    operator: "中国航天科技集团",
                    createTime: "2023-01-15 10:00:00",
                    updateTime: "2023-10-20 14:30:00",
                    isDeleted: 0
                },
                {
                    id: 2,
                    satelliteId: "SAT002",
                    satelliteName: "天巡二号",
                    satelliteType: "通信试验星",
                    launchTime: "2024-06-20",
                    orbitInfo: "700km LEO",
                    status: "离线",
                    uplinkFrequency: "2250 MHz",
                    downlinkFrequency: "1850 MHz",
                    payloadInfo: "通信试验载荷",
                    designLife: 48,
                    operator: "中国航天科技集团",
                    createTime: "2024-06-20 09:00:00",
                    updateTime: "2024-06-20 09:00:00",
                    isDeleted: 0
                }
            ];
            localStorage.setItem('satellites', JSON.stringify(defaultSatellites));
        }
        
        // 初始化遥测数据
        if (!localStorage.getItem('telemetry')) {
            this.generateTelemetryData();
        }
        
        // 初始化指令数据
        if (!localStorage.getItem('commands')) {
            const defaultCommands = [
                {
                    id: 1,
                    satelliteId: "SAT001",
                    commandType: "姿态调整",
                    commandCode: "ATT_ADJ_001",
                    commandName: "调整俯仰角",
                    commandContent: '{"angle": 30.5, "duration": 3000}',
                    priority: 1,
                    commandStatus: "已执行",
                    sendTime: "2023-10-20 10:30:00",
                    executeTime: "2023-10-20 10:30:03",
                    completeTime: "2023-10-20 10:33:00",
                    resultCode: "SUCCESS",
                    resultMessage: "执行成功",
                    executionDuration: 3000,
                    operatorName: "张三"
                }
            ];
            localStorage.setItem('commands', JSON.stringify(defaultCommands));
        }
        
        // 初始化事件数据
        if (!localStorage.getItem('events')) {
            const defaultEvents = [
                {
                    id: 1,
                    satelliteId: "SAT001",
                    eventType: "遥测异常",
                    eventLevel: "WARN",
                    eventCode: "TM_ANOMALY_001",
                    eventTitle: "温度超过阈值",
                    eventDetail: "卫星SAT001温度达到45.2℃，超过警戒值40℃",
                    occurTime: "2023-10-20 09:45:00",
                    isHandled: 1,
                    handlerName: "张三",
                    handleTime: "2023-10-20 10:00:00"
                }
            ];
            localStorage.setItem('events', JSON.stringify(defaultEvents));
        }
    }

    startBackgroundTasks() {
        // 每5秒生成在线卫星的遥测数据（实时）
        if (this._telemetryInterval) clearInterval(this._telemetryInterval);
        this._telemetryInterval = setInterval(() => {
            const satellites = JSON.parse(localStorage.getItem('satellites') || '[]');
            satellites.forEach(sat => {
                if (sat.status === '在线') {
                    this.appendRealtimeTelemetry(sat.satelliteId);
                }
            });
        }, 5000);

        // 每2秒处理待执行指令
        if (this._commandInterval) clearInterval(this._commandInterval);
        this._commandInterval = setInterval(() => this.processPendingCommands(), 2000);
    }

    // 向指定卫星追加一条实时遥测数据
    appendRealtimeTelemetry(satelliteId) {
        const telemetry = JSON.parse(localStorage.getItem('telemetry') || '[]');

        // 找到该卫星最近一条数据作为基准
        const last = telemetry.slice().reverse().find(t => t.satelliteId === satelliteId);

        const now = new Date();
        const baseTemp = last ? Number(last.temperature) : 25;
        const basePower = last ? Number(last.powerLevel) : 100;
        const baseSignal = last ? Number(last.signalStrength) : 85;
        const basePitch = last ? Number(last.pitchAngle) : 0;

        // 温度 ±1 °C（边界限制）
        let temperature = Number((baseTemp + (Math.random() * 2 - 1)).toFixed(2));
        temperature = Math.max(-20, Math.min(60, temperature));

        // 电量 每次减1%，最低保持10%
        let powerLevel = Number((basePower - (basePower > 10 ? 1 : 0) + (Math.random() * 0.5 - 0.25)).toFixed(2));
        powerLevel = Math.max(0, Math.min(100, powerLevel));
        if (powerLevel < 10) powerLevel = 10;

        // 信号 70~95 波动
        let signalStrength = Number((70 + Math.random() * 25).toFixed(2));

        // 俯仰角 小幅波动 ±5°
        let pitchAngle = Number((basePitch + (Math.random() * 10 - 5)).toFixed(1));
        pitchAngle = Math.max(-90, Math.min(90, pitchAngle));

        const entry = {
            id: telemetry.length + 1,
            satelliteId,
            temperature,
            powerLevel,
            signalStrength,
            pitchAngle,
            rollAngle: Number((Math.random() * 60 - 30).toFixed(2)),
            yawAngle: Number((Math.random() * 360 - 180).toFixed(2)),
            solarPanelVoltage: Number((28 + Math.random() * 2).toFixed(2)),
            batteryVoltage: Number((24 + Math.random() * 1.5).toFixed(2)),
            transmissionPower: Number((50 + Math.random() * 20).toFixed(2)),
            memoryUsage: Number((30 + Math.random() * 50).toFixed(2)),
            cpuTemperature: Number((40 + Math.random() * 20).toFixed(2)),
            collectTime: now.toISOString().replace('T', ' ').substr(0, 19),
            dataSource: '模拟',
            dataQuality: Math.random() > 0.9 ? 3 : Math.random() > 0.8 ? 2 : 1
        };

        telemetry.push(entry);

        // 保留最近24小时数据
        const cutoff = new Date(now.getTime() - 24 * 3600000);
        const filtered = telemetry.filter(t => new Date(t.collectTime) >= cutoff);
        localStorage.setItem('telemetry', JSON.stringify(filtered));
    }

    // 处理待执行指令（模拟后台执行）
    async processPendingCommands() {
        const commands = JSON.parse(localStorage.getItem('commands') || '[]');
        const pending = commands.filter(c => c.commandStatus === '待执行');

        if (pending.length === 0) return;

        // 逐条执行（并行处理中设置执行中状态）
        pending.forEach(cmd => {
            cmd.commandStatus = '执行中';
            cmd.executeTime = new Date().toISOString().replace('T', ' ').substr(0, 19);
        });
        localStorage.setItem('commands', JSON.stringify(commands));

        // 模拟执行延迟（3秒）后设置为已执行并影响遥测或卫星状态
        setTimeout(() => {
            const cmds = JSON.parse(localStorage.getItem('commands') || '[]');
            const sats = JSON.parse(localStorage.getItem('satellites') || '[]');

            pending.forEach(p => {
                const idx = cmds.findIndex(c => c.id === p.id);
                if (idx === -1) return;

                try {
                    const content = JSON.parse(p.commandContent || '{}');

                    if (/调整|姿态/.test(p.commandName) && content.angle !== undefined) {
                        // 添加一条遥测数据，设置俯仰角为指令值
                        const now = new Date();
                        const telemetry = JSON.parse(localStorage.getItem('telemetry') || '[]');
                        telemetry.push({
                            id: telemetry.length + 1,
                            satelliteId: p.satelliteId,
                            temperature: 25 + Math.random() * 2 - 1,
                            powerLevel: Math.max(10, 90 + Math.random() * 5 - 1),
                            signalStrength: 80 + Math.random() * 10,
                            pitchAngle: Number(Number(content.angle).toFixed(1)),
                            rollAngle: Number((Math.random() * 60 - 30).toFixed(2)),
                            yawAngle: Number((Math.random() * 360 - 180).toFixed(2)),
                            solarPanelVoltage: 28 + Math.random() * 2,
                            batteryVoltage: 24 + Math.random() * 1.5,
                            transmissionPower: 50 + Math.random() * 20,
                            memoryUsage: 30 + Math.random() * 50,
                            cpuTemperature: 40 + Math.random() * 20,
                            collectTime: now.toISOString().replace('T', ' ').substr(0, 19),
                            dataSource: '模拟',
                            dataQuality: 1
                        });
                        localStorage.setItem('telemetry', JSON.stringify(telemetry));
                    }

                    if (/休眠/.test(p.commandName)) {
                        const sIdx = sats.findIndex(s => s.satelliteId === p.satelliteId);
                        if (sIdx !== -1) {
                            sats[sIdx].status = '离线';
                            sats[sIdx].updateTime = new Date().toISOString().replace('T', ' ').substr(0, 19);
                        }
                    }

                    if (/唤醒/.test(p.commandName)) {
                        const sIdx = sats.findIndex(s => s.satelliteId === p.satelliteId);
                        if (sIdx !== -1) {
                            sats[sIdx].status = '在线';
                            sats[sIdx].updateTime = new Date().toISOString().replace('T', ' ').substr(0, 19);
                            // 立即追加一条遥测
                            this.appendRealtimeTelemetry(p.satelliteId);
                        }
                    }

                    // 更新命令状态为已执行
                    cmds[idx].commandStatus = '已执行';
                    cmds[idx].completeTime = new Date().toISOString().replace('T', ' ').substr(0, 19);
                    cmds[idx].resultCode = 'SUCCESS';
                    cmds[idx].resultMessage = '执行成功';
                } catch (err) {
                    const idx2 = cmds.findIndex(c => c.id === p.id);
                    if (idx2 !== -1) {
                        cmds[idx2].commandStatus = '失败';
                        cmds[idx2].completeTime = new Date().toISOString().replace('T', ' ').substr(0, 19);
                        cmds[idx2].resultCode = 'ERROR';
                        cmds[idx2].resultMessage = String(err.message || err);
                    }
                }
            });

            localStorage.setItem('commands', JSON.stringify(cmds));
            localStorage.setItem('satellites', JSON.stringify(sats));
        }, 3000);
    }
    
    // 生成遥测数据
    generateTelemetryData() {
        const satellites = JSON.parse(localStorage.getItem('satellites') || '[]');
        const telemetry = [];
        const now = new Date();
        
        satellites.forEach(satellite => {
            if (satellite.status === '在线') {
                for (let i = 0; i < 24; i++) {
                    const time = new Date(now.getTime() - i * 3600000);
                    telemetry.push({
                        id: telemetry.length + 1,
                        satelliteId: satellite.satelliteId,
                        temperature: 25 + Math.sin(i) * 15 + Math.random() * 5,
                        powerLevel: Math.max(20, 100 - i * 3.33 + Math.random() * 10),
                        signalStrength: 80 + Math.random() * 15,
                        pitchAngle: Math.random() * 180 - 90,
                        rollAngle: Math.random() * 60 - 30,
                        yawAngle: Math.random() * 360 - 180,
                        solarPanelVoltage: 28 + Math.random() * 2,
                        batteryVoltage: 24 + Math.random() * 1.5,
                        transmissionPower: 50 + Math.random() * 20,
                        memoryUsage: 30 + Math.random() * 50,
                        cpuTemperature: 40 + Math.random() * 20,
                        collectTime: time.toISOString().replace('T', ' ').substr(0, 19),
                        dataSource: "模拟",
                        dataQuality: Math.random() > 0.8 ? 2 : Math.random() > 0.9 ? 3 : 1
                    });
                }
            }
        });
        
        localStorage.setItem('telemetry', JSON.stringify(telemetry));
    }
    
    // 卫星相关API
    async getSatellites(params = {}) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let satellites = JSON.parse(localStorage.getItem('satellites') || '[]')
                    .filter(s => s.isDeleted === 0);
                
                // 搜索过滤
                if (params.satelliteId) {
                    satellites = satellites.filter(s => 
                        s.satelliteId.includes(params.satelliteId)
                    );
                }
                
                if (params.satelliteName) {
                    satellites = satellites.filter(s => 
                        s.satelliteName.includes(params.satelliteName)
                    );
                }
                
                if (params.satelliteType) {
                    satellites = satellites.filter(s => 
                        s.satelliteType === params.satelliteType
                    );
                }
                
                if (params.status) {
                    satellites = satellites.filter(s => 
                        s.status === params.status
                    );
                }
                
                // 分页
                const page = params.page || 1;
                const size = params.size || 10;
                const total = satellites.length;
                const totalPages = Math.ceil(total / size);
                
                const start = (page - 1) * size;
                const end = start + size;
                const list = satellites.slice(start, end);
                
                resolve({
                    success: true,
                    data: {
                        list,
                        total,
                        page,
                        size,
                        totalPages
                    }
                });
            }, 300);
        });
    }
    
    async getSatellite(id) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const satellites = JSON.parse(localStorage.getItem('satellites') || '[]');
                const satellite = satellites.find(s => s.satelliteId === id && s.isDeleted === 0);
                
                resolve({
                    success: !!satellite,
                    data: satellite
                });
            }, 200);
        });
    }
    
    async addSatellite(satellite) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const satellites = JSON.parse(localStorage.getItem('satellites') || '[]');
                
                // 检查编号是否重复
                const exists = satellites.some(s => s.satelliteId === satellite.satelliteId);
                if (exists) {
                    resolve({
                        success: false,
                        message: '卫星编号已存在'
                    });
                    return;
                }
                
                // 添加新卫星
                const newSatellite = {
                    ...satellite,
                    id: Date.now(),
                    createTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
                    updateTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
                    isDeleted: 0
                };
                
                satellites.push(newSatellite);
                localStorage.setItem('satellites', JSON.stringify(satellites));
                
                // 生成遥测数据
                this.generateTelemetryData();
                
                resolve({
                    success: true,
                    message: '卫星添加成功'
                });
            }, 500);
        });
    }
    
    async updateSatellite(id, data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let satellites = JSON.parse(localStorage.getItem('satellites') || '[]');
                const index = satellites.findIndex(s => s.satelliteId === id);
                
                if (index === -1) {
                    resolve({
                        success: false,
                        message: '卫星不存在'
                    });
                    return;
                }
                
                satellites[index] = {
                    ...satellites[index],
                    ...data,
                    updateTime: new Date().toISOString().replace('T', ' ').substr(0, 19)
                };
                
                localStorage.setItem('satellites', JSON.stringify(satellites));
                
                resolve({
                    success: true,
                    message: '卫星更新成功'
                });
            }, 500);
        });
    }
    
    async deleteSatellite(id) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let satellites = JSON.parse(localStorage.getItem('satellites') || '[]');
                const index = satellites.findIndex(s => s.satelliteId === id);
                
                if (index === -1) {
                    resolve({
                        success: false,
                        message: '卫星不存在'
                    });
                    return;
                }
                
                // 逻辑删除
                satellites[index].isDeleted = 1;
                satellites[index].updateTime = new Date().toISOString().replace('T', ' ').substr(0, 19);
                
                localStorage.setItem('satellites', JSON.stringify(satellites));
                
                resolve({
                    success: true,
                    message: '卫星删除成功'
                });
            }, 500);
        });
    }
    
    async checkSatelliteId(id) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const satellites = JSON.parse(localStorage.getItem('satellites') || '[]');
                const exists = satellites.some(s => s.satelliteId === id && s.isDeleted === 0);
                
                resolve({
                    success: true,
                    data: { exists }
                });
            }, 200);
        });
    }
    
    // 遥测数据API
    async getTelemetry(satelliteId, hours = 24) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let telemetry = JSON.parse(localStorage.getItem('telemetry') || '[]');
                
                // 按卫星和时间过滤
                const now = new Date();
                const startTime = new Date(now.getTime() - hours * 3600000);
                
                telemetry = telemetry.filter(t => 
                    t.satelliteId === satelliteId && 
                    new Date(t.collectTime) >= startTime
                );
                
                // 按时间排序
                telemetry.sort((a, b) => new Date(a.collectTime) - new Date(b.collectTime));
                
                resolve({
                    success: true,
                    data: telemetry
                });
            }, 300);
        });
    }

    async getTelemetryRange(satelliteId, startTime, endTime) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let telemetry = JSON.parse(localStorage.getItem('telemetry') || '[]');

                const start = new Date(startTime);
                const end = new Date(endTime);

                telemetry = telemetry.filter(t =>
                    t.satelliteId === satelliteId &&
                    new Date(t.collectTime) >= start &&
                    new Date(t.collectTime) <= end
                );

                telemetry.sort((a, b) => new Date(a.collectTime) - new Date(b.collectTime));

                resolve({ success: true, data: telemetry });
            }, 300);
        });
    }

    async exportTelemetryCSV(satelliteId, startTime, endTime) {
        return new Promise(async (resolve) => {
            const res = await this.getTelemetryRange(satelliteId, startTime, endTime);
            if (!res.success) {
                resolve({ success: false, message: '获取遥测失败' });
                return;
            }

            const data = res.data;
            if (!data || data.length === 0) {
                resolve({ success: false, message: '无匹配的遥测数据' });
                return;
            }

            // 构造CSV
            const headers = ['卫星编号', '温度(℃)', '电量(%)', '信号强度(dB)', '角度(°)', '采集时间'];
            const rows = [headers.join(',')];
            data.forEach(d => {
                const row = [
                    d.satelliteId,
                    Number(d.temperature).toFixed(2),
                    Math.round(d.powerLevel),
                    Number(d.signalStrength).toFixed(2),
                    Number(d.pitchAngle).toFixed(1),
                    d.collectTime
                ];
                rows.push(row.join(','));
            });

            const formatDate = (dt) => {
                const d = new Date(dt);
                const YYYY = d.getFullYear();
                const MM = String(d.getMonth() + 1).padStart(2, '0');
                const DD = String(d.getDate()).padStart(2, '0');
                const hh = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');
                return `${YYYY}${MM}${DD}_${hh}${mm}`;
            };

            const filename = `${satelliteId}_${formatDate(startTime)}_${formatDate(endTime)}.csv`;

            resolve({ success: true, data: rows.join('\n'), filename });
        });
    }
    
    // 指令API
    async getCommands(params = {}) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let commands = JSON.parse(localStorage.getItem('commands') || '[]');
                
                if (params.satelliteId) {
                    commands = commands.filter(c => c.satelliteId === params.satelliteId);
                }
                
                if (params.status) {
                    commands = commands.filter(c => c.commandStatus === params.status);
                }
                
                // 分页
                const page = params.page || 1;
                const size = params.size || 10;
                const total = commands.length;
                const totalPages = Math.ceil(total / size);
                
                const start = (page - 1) * size;
                const end = start + size;
                const list = commands.slice(start, end);
                
                resolve({
                    success: true,
                    data: {
                        list,
                        total,
                        page,
                        size,
                        totalPages
                    }
                });
            }, 300);
        });
    }
    
    async sendCommand(command) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const commands = JSON.parse(localStorage.getItem('commands') || '[]');
                
                const newCommand = {
                    ...command,
                    id: Date.now(),
                    sendTime: new Date().toISOString().replace('T', ' ').substr(0, 19),
                    commandStatus: '待执行',
                    operatorName: Auth.getCurrentUser()?.realName || '未知'
                };
                
                commands.push(newCommand);
                localStorage.setItem('commands', JSON.stringify(commands));
                
                resolve({
                    success: true,
                    message: '指令发送成功'
                });
            }, 500);
        });
    }
    
    // 事件API
    async getEvents(params = {}) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let events = JSON.parse(localStorage.getItem('events') || '[]');
                
                if (params.satelliteId) {
                    events = events.filter(e => e.satelliteId === params.satelliteId);
                }
                
                if (params.isHandled !== undefined) {
                    events = events.filter(e => e.isHandled === params.isHandled);
                }
                
                // 按时间排序
                events.sort((a, b) => new Date(b.occurTime) - new Date(a.occurTime));
                
                resolve({
                    success: true,
                    data: events
                });
            }, 300);
        });
    }
    
    // 统计API
    async getStatistics() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const satellites = JSON.parse(localStorage.getItem('satellites') || '[]')
                    .filter(s => s.isDeleted === 0);
                
                const total = satellites.length;
                const online = satellites.filter(s => s.status === '在线').length;
                const types = [...new Set(satellites.map(s => s.satelliteType))].length;
                
                // 按类型统计
                const typeStats = {};
                satellites.forEach(s => {
                    typeStats[s.satelliteType] = (typeStats[s.satelliteType] || 0) + 1;
                });
                
                // 按年份统计发射数量
                const yearStats = {};
                satellites.forEach(s => {
                    if (s.launchTime) {
                        const year = s.launchTime.substring(0, 4);
                        yearStats[year] = (yearStats[year] || 0) + 1;
                    }
                });
                
                // 获取遥测数据统计
                const telemetry = JSON.parse(localStorage.getItem('telemetry') || '[]');
                const latestTelemetry = {};
                
                satellites.forEach(s => {
                    const satTelemetry = telemetry
                        .filter(t => t.satelliteId === s.satelliteId)
                        .sort((a, b) => new Date(b.collectTime) - new Date(a.collectTime));
                    
                    if (satTelemetry.length > 0) {
                        latestTelemetry[s.satelliteId] = satTelemetry[0];
                    }
                });
                
                resolve({
                    success: true,
                    data: {
                        total,
                        online,
                        offline: total - online,
                        types,
                        typeStats,
                        yearStats,
                        latestTelemetry
                    }
                });
            }, 200);
        });
    }
    
    // 导出数据
    async exportData(format = 'csv', params = {}) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let satellites = JSON.parse(localStorage.getItem('satellites') || '[]')
                    .filter(s => s.isDeleted === 0);
                
                // 应用搜索条件
                if (params.satelliteId) {
                    satellites = satellites.filter(s => 
                        s.satelliteId.includes(params.satelliteId)
                    );
                }
                
                if (params.satelliteName) {
                    satellites = satellites.filter(s => 
                        s.satelliteName.includes(params.satelliteName)
                    );
                }
                
                if (params.satelliteType) {
                    satellites = satellites.filter(s => 
                        s.satelliteType === params.satelliteType
                    );
                }
                
                if (params.status) {
                    satellites = satellites.filter(s => 
                        s.status === params.status
                    );
                }
                
                let exportData;
                if (format === 'csv') {
                    exportData = this.convertToCSV(satellites);
                } else if (format === 'json') {
                    exportData = JSON.stringify(satellites, null, 2);
                } else if (format === 'excel') {
                    exportData = this.convertToExcel(satellites);
                }
                
                resolve({
                    success: true,
                    data: exportData,
                    filename: `satellites_${this.formatDate(new Date(), 'YYYYMMDD_HHmmss')}.${format}`
                });
            }, 1000);
        });
    }
    
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [];
        
        // 添加表头
        csvRows.push(headers.join(','));
        
        // 添加数据行
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                // 处理包含逗号或引号的值
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }
    
    convertToExcel(data) {
        // 简化的Excel格式（实际项目中使用SheetJS等库）
        return this.convertToCSV(data);
    }
    
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        const second = String(d.getSeconds()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hour)
            .replace('mm', minute)
            .replace('ss', second);
    }
}

// 创建全局API实例并为旧的静态调用方式提供兼容代理
(function() {
    const instance = new SatelliteAPI();
    // 将实例放到 window 下，供直接访问
    window.SatelliteAPI = instance;

    // 兼容旧代码中使用 SatelliteAPI.getXxx(...) 的写法：
    // 为原型上的每个方法创建一个类级静态代理，代理到实例方法上。
    Object.getOwnPropertyNames(SatelliteAPI.prototype)
        .filter(name => name !== 'constructor' && typeof SatelliteAPI.prototype[name] === 'function')
        .forEach(name => {
            // 如果已经存在同名静态方法则不覆盖
            if (typeof SatelliteAPI[name] !== 'function') {
                SatelliteAPI[name] = function(...args) {
                    return instance[name](...args);
                };
            }
        });
})();
