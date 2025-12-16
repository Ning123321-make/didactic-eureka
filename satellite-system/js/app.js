// 公共JavaScript文件 - 模拟数据和工具函数

// 模拟数据库 - 使用localStorage存储数据
class MockDatabase {
    constructor() {
        this.storage = window.localStorage;
        this.initData();
    }

    initData() {
        // 初始化卫星数据
        if (!this.getSatellites().length) {
            const initialSatellites = [
                {
                    id: 'SAT001',
                    name: '试验星 001',
                    type: '低轨遥感星',
                    launchTime: '2025-01-10',
                    orbit: '500km 近地轨道',
                    status: '在线',
                    uplinkFreq: '145.8 MHz',
                    downlinkFreq: '437.8 MHz',
                    payload: '光学传感器，分辨率 1m'
                },
                {
                    id: 'SAT002',
                    name: '试验星 002',
                    type: '通信试验星',
                    launchTime: '2025-02-15',
                    orbit: '600km 中轨',
                    status: '在线',
                    uplinkFreq: '146.0 MHz',
                    downlinkFreq: '438.0 MHz',
                    payload: '2个信号转发器，覆盖亚洲地区'
                },
                // 添加更多卫星...
                {
                    id: 'SAT003',
                    name: '试验星 003',
                    type: '导航试验星',
                    launchTime: '2025-03-20',
                    orbit: '550km 近地轨道',
                    status: '离线',
                    uplinkFreq: '145.9 MHz',
                    downlinkFreq: '437.9 MHz',
                    payload: 'GPS-like导航系统'
                }
            ];
            this.storage.setItem('satellites', JSON.stringify(initialSatellites));
        }

        // 初始化遥测数据
        if (!this.getTelemetry().length) {
            this.generateInitialTelemetry();
        }

        // 初始化指令记录
        if (!this.getCommands().length) {
            this.storage.setItem('commands', JSON.stringify([]));
        }
    }

    // 卫星相关方法
    getSatellites() {
        return JSON.parse(this.storage.getItem('satellites') || '[]');
    }

    saveSatellite(satellite) {
        const satellites = this.getSatellites();
        const index = satellites.findIndex(s => s.id === satellite.id);
        if (index >= 0) {
            satellites[index] = satellite;
        } else {
            satellites.push(satellite);
        }
        this.storage.setItem('satellites', JSON.stringify(satellites));
    }

    deleteSatellite(id) {
        const satellites = this.getSatellites().filter(s => s.id !== id);
        this.storage.setItem('satellites', JSON.stringify(satellites));
        // 删除相关遥测数据和指令
        this.deleteTelemetryBySatellite(id);
        this.deleteCommandsBySatellite(id);
    }

    // 遥测数据相关方法
    getTelemetry() {
        return JSON.parse(this.storage.getItem('telemetry') || '[]');
    }

    saveTelemetry(data) {
        const telemetry = this.getTelemetry();
        telemetry.push(data);
        // 只保留最近1天的模拟数据
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const filtered = telemetry.filter(t => new Date(t.timestamp) > oneDayAgo);
        this.storage.setItem('telemetry', JSON.stringify(filtered));
    }

    getLatestTelemetry(satelliteId) {
        const telemetry = this.getTelemetry().filter(t => t.satelliteId === satelliteId);
        return telemetry.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null;
    }

    getTelemetryHistory(satelliteId, startTime, endTime) {
        const allTelemetry = this.getTelemetry();
        const filtered = allTelemetry.filter(t => {
            const matchesSatellite = t.satelliteId === satelliteId;
            const recordTime = new Date(t.timestamp.replace(' ', 'T'));
            const start = new Date(startTime.replace(' ', 'T'));
            const end = new Date(endTime.replace(' ', 'T'));
            const inTimeRange = recordTime >= start && recordTime <= end;
            return matchesSatellite && inTimeRange;
        });
        return filtered.sort((a, b) => new Date(a.timestamp.replace(' ', 'T')) - new Date(b.timestamp.replace(' ', 'T')));
    }

    deleteTelemetryBySatellite(satelliteId) {
        const telemetry = this.getTelemetry().filter(t => t.satelliteId !== satelliteId);
        this.storage.setItem('telemetry', JSON.stringify(telemetry));
    }

    // 指令相关方法
    getCommands() {
        return JSON.parse(this.storage.getItem('commands') || '[]');
    }

    saveCommand(command) {
        const commands = this.getCommands();
        commands.push(command);
        this.storage.setItem('commands', JSON.stringify(commands));
    }

    updateCommandStatus(id, status) {
        const commands = this.getCommands();
        const command = commands.find(c => c.id === id);
        if (command) {
            command.status = status;
            this.storage.setItem('commands', JSON.stringify(commands));
        }
    }

    getCommandsBySatellite(satelliteId) {
        return this.getCommands().filter(c => c.satelliteId === satelliteId);
    }

    deleteCommandsBySatellite(satelliteId) {
        const commands = this.getCommands().filter(c => c.satelliteId !== satelliteId);
        this.storage.setItem('commands', JSON.stringify(commands));
    }

    // 生成初始遥测数据
    generateInitialTelemetry() {
        const satellites = this.getSatellites().filter(s => s.status === '在线');
        const telemetry = [];
        const now = new Date();

        satellites.forEach(satellite => {
            for (let i = 0; i < 360; i++) { // 30分钟的数据，每5秒一条
                const timestamp = new Date(now.getTime() - (360 - i) * 5000);
                telemetry.push({
                    satelliteId: satellite.id,
                    temperature: 20 + Math.random() * 40,
                    battery: Math.max(10, 100 - i * 0.2),
                    signalStrength: 70 + Math.random() * 25,
                    angle: -90 + Math.random() * 180,
                    timestamp: timestamp.toISOString().replace('T', ' ').substring(0, 19)
                });
            }
        });

        this.storage.setItem('telemetry', JSON.stringify(telemetry));
    }

    // 模拟生成新遥测数据
    generateTelemetry() {
        const satellites = this.getSatellites().filter(s => s.status === '在线');
        satellites.forEach(satellite => {
            const latest = this.getLatestTelemetry(satellite.id);
            const newData = {
                satelliteId: satellite.id,
                temperature: latest ? Math.max(-20, Math.min(60, latest.temperature + (Math.random() - 0.5) * 2)) : 25,
                battery: latest ? Math.max(10, latest.battery - 1) : 100,
                signalStrength: 70 + Math.random() * 25,
                angle: latest ? latest.angle + (Math.random() - 0.5) * 10 : 0,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
            this.saveTelemetry(newData);
        });
    }
}

// 全局数据库实例
const db = new MockDatabase();

// 工具函数
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

function formatDateTime(date) {
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

function validateSatelliteId(id) {
    return /^SAT\d{3}$/.test(id);
}

function validateAngle(angle) {
    return angle >= -90 && angle <= 90;
}

// 导出到CSV
function exportToCSV(data, filename) {
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// 启动模拟数据生成
setInterval(() => {
    db.generateTelemetry();
}, 5000);