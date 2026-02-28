# WebSocket 实时推送接口文档

## 连接信息

### WebSocket 端点
```
ws://your-server:8000/api/v1/ws
```

### 连接参数
- `robot_id` (可选): 指定要订阅的机器人ID。如果不指定，将接收所有机器人的消息。

### 连接示例

**订阅特定机器人**:
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws?robot_id=robot_001');
```

**订阅所有机器人**:
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws');
```

---

## 消息格式

所有 WebSocket 推送的消息均为 JSON 格式，包含以下字段：

```json
{
  "type": "消息类型",
  "robot_id": "机器人ID",
  "data": { /* 具体数据 */ }
}
```

---

## 消息类型

### 1. 位姿更新 (pose_update)

**描述**: 实时推送机器人的位置和姿态信息

**推送频率**: 高频（取决于机器人上报频率）

**消息示例**:
```json
{
  "type": "pose_update",
  "robot_id": "robot_001",
  "data": {
    "x": 1.23,
    "y": 4.56,
    "z": 0.0,
    "theta": 1.57
  }
}
```

**字段说明**:
- `x`: X坐标 (米)
- `y`: Y坐标 (米)
- `z`: Z坐标 (米)
- `theta`: 角度 (弧度)

---

### 2. 任务状态 (cmd_status)

**描述**: 推送机器人当前执行的任务状态

**推送频率**: 任务状态变化时

**消息示例**:
```json
{
  "type": "cmd_status",
  "robot_id": "robot_001",
  "data": {
    "ins_origin": 0,
    "track": 1,
    "charge": 0,
    "track_record": 0,
    "nav": 0,
    "change_pcd": 0,
    "data_record": 0,
    "slam": 0,
    "msf": 0
  }
}
```

**字段说明** (0:未运行, 1:运行中):
- `ins_origin`: INS原点任务
- `track`: 循迹任务
- `charge`: 充电任务
- `track_record`: 循迹录包任务
- `nav`: 导航任务
- `change_pcd`: 生成栅格地图任务
- `data_record`: 建图录包状态
- `slam`: 建图状态
- `msf`: 融合定位状态

---

### 3. 机器人状态 (robot_status)

**描述**: 推送机器人整体状态变化（上线/下线等）

**推送频率**: 状态变化时

**消息示例**:
```json
{
  "type": "robot_status",
  "robot_id": "robot_001",
  "data": {
    "status": "online"
  }
}
```

**字段说明**:
- `status`: 机器人状态 (online/offline)

---

### 4. 循迹状态 (track_info)

**描述**: 推送循迹任务的实时状态信息

**推送频率**: 循迹状态变化时

**消息示例**:
```json
{
  "type": "track_info",
  "robot_id": "robot_001",
  "data": {
    "taskpoint_name": "关键点1",
    "obs_mode": "停障模式",
    "track_name": "巡检路线1",
    "result": 1,
    "error_code": 0,
    "error_msg": "",
    "timestamp": "2025-02-25T10:30:45.123456"
  }
}
```

**字段说明**:
- `taskpoint_name`: 当前关键点名称
- `obs_mode`: 避障模式 (无避障/停障模式/绕障模式)
- `track_name`: 轨迹名称
- `result`: 结果码 (0:失败, 1:成功)
- `error_code`: 错误代码
- `error_msg`: 错误信息
- `timestamp`: 时间戳

---

### 5. 报警消息 (alert)

**描述**: 推送检测到的告警信息（火灾、烟雾、入侵等）

**推送频率**: 检测到告警时立即推送

**消息示例**:
```json
{
  "type": "alert",
  "robot_id": "robot_001",
  "data": {
    "alert_id": 123,
    "type": "fire",
    "severity": "high",
    "detected_at": "2025-02-25T10:30:45.123456"
  }
}
```

**字段说明**:
- `alert_id`: 告警ID
- `type`: 告警类型 (fire/smoke/intrusion/helmet/other)
- `severity`: 严重程度 (high/medium/low)
- `detected_at`: 检测时间

**告警类型**:
- `fire`: 火灾
- `smoke`: 烟雾
- `intrusion`: 入侵
- `helmet`: 安全帽检测
- `other`: 其他

---

### 6. 建图进度 (mapping_progress)

**描述**: 推送建图任务的进度

**推送频率**: 进度变化时

**消息示例**:
```json
{
  "type": "mapping_progress",
  "robot_id": "robot_001",
  "data": {
    "progress": 65,
    "timestamp": "2025-02-25T10:30:45.123456"
  }
}
```

**字段说明**:
- `progress`: 进度百分比 (0-100)
- `timestamp`: 时间戳

---

### 7. 融合定位状态 (msf_status)

**描述**: 推送融合定位（MSF）的状态

**推送频率**: 状态变化时

**消息示例**:
```json
{
  "type": "msf_status",
  "robot_id": "robot_001",
  "data": {
    "status": 1,
    "status_text": "正常",
    "error_code": 0,
    "error_msg": "",
    "timestamp": "2025-02-25T10:30:45.123456"
  }
}
```

**字段说明**:
- `status`: 状态码 (0:初始化中, 1:正常, 2:错误)
- `status_text`: 状态文本描述
- `error_code`: 错误代码
- `error_msg`: 错误信息
- `timestamp`: 时间戳

---

### 8. 机器狗UDP消息 (dog_udp_message)

**描述**: 推送机器狗的各类状态信息

**推送频率**: 机器狗上报时

**消息示例**:
```json
{
  "type": "dog_udp_message",
  "robot_id": "robot_dog_001",
  "data": {
    "code": 553656074,
    "code_hex": "0x21050f0a",
    "parsed": {
      "voltage": 24.5,
      "current": 3.2,
      "capacity": 85
    },
    "timestamp": "2025-02-25T10:30:45.123456"
  }
}
```

**字段说明**:
- `code`: 指令码（十进制）
- `code_hex`: 指令码（十六进制）
- `parsed`: 解析后的数据（根据指令码不同而不同）
- `timestamp`: 时间戳

**常见指令码**:
- `0x21050f0a`: 电池数据
- `0x1008`: 运行状态
- `0x1009`: 运动状态

---

### 9. 任务更新 (task_update)

**描述**: 推送任务执行过程中的更新信息

**推送频率**: 任务状态变化时

**消息示例**:
```json
{
  "type": "task_update",
  "robot_id": "robot_001",
  "data": {
    "task_id": 456,
    "status": "running",
    "progress": 50
  }
}
```

---

## 连接管理

### 连接建立
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws?robot_id=robot_001');

ws.onopen = () => {
  console.log('WebSocket 连接已建立');
};
```

### 接收消息
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch(message.type) {
    case 'pose_update':
      updateRobotPosition(message.data);
      break;
    case 'alert':
      showAlert(message.data);
      break;
    case 'track_info':
      updateTrackStatus(message.data);
      break;
    // ... 其他消息类型
  }
};
```

### 错误处理
```javascript
ws.onerror = (error) => {
  console.error('WebSocket 错误:', error);
};
```

### 连接关闭
```javascript
ws.onclose = (event) => {
  console.log('WebSocket 连接已关闭');
  // 可以实现重连逻辑
};
```

---

## 离线消息处理

当 WebSocket 客户端离线时，系统会将消息缓存在 Redis 中（最多100条）。客户端重新连接后，会自动接收到离线期间的消息。

**离线消息保留时间**: 1小时

---

## 认证

WebSocket 连接当前不需要 JWT token 认证。如需认证，可以通过查询参数传递 token：

```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws?robot_id=robot_001&token=YOUR_JWT_TOKEN');
```

---

## 注意事项

1. **心跳保活**: 建议客户端实现心跳机制，定期发送 ping 消息保持连接
2. **重连机制**: 建议实现断线重连逻辑，使用指数退避策略
3. **消息去重**: 部分高频消息可能重复，建议客户端根据业务需求做去重处理
4. **缓冲区管理**: 对于高频消息（如 pose_update），建议做适当的节流处理避免前端渲染压力
5. **多实例订阅**: 同一个 robot_id 可以被多个客户端同时订阅

---

## 完整示例

```javascript
class RobotWebSocketClient {
  constructor(robotId) {
    this.robotId = robotId;
    this.ws = null;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
  }

  connect() {
    const url = `ws://localhost:8000/api/v1/ws?robot_id=${this.robotId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log(`[WebSocket] 已连接到机器人 ${this.robotId}`);
      this.reconnectDelay = 1000; // 重置重连延迟
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] 错误:', error);
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] 连接已关闭，准备重连...');
      this.reconnect();
    };
  }

  handleMessage(message) {
    console.log(`[${message.type}]`, message.data);

    switch(message.type) {
      case 'pose_update':
        this.onPoseUpdate(message.data);
        break;
      case 'alert':
        this.onAlert(message.data);
        break;
      case 'track_info':
        this.onTrackInfo(message.data);
        break;
      case 'cmd_status':
        this.onCmdStatus(message.data);
        break;
      case 'mapping_progress':
        this.onMappingProgress(message.data);
        break;
      case 'dog_udp_message':
        this.onDogMessage(message.data);
        break;
    }
  }

  reconnect() {
    setTimeout(() => {
      console.log('[WebSocket] 尝试重连...');
      this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  // 回调方法（需要根据业务实现）
  onPoseUpdate(data) { /* 更新机器人位置 */ }
  onAlert(data) { /* 显示告警 */ }
  onTrackInfo(data) { /* 更新循迹状态 */ }
  onCmdStatus(data) { /* 更新任务状态 */ }
  onMappingProgress(data) { /* 更新建图进度 */ }
  onDogMessage(data) { /* 处理机器狗消息 */ }
}

// 使用示例
const client = new RobotWebSocketClient('robot_001');
client.connect();
```

---

## 技术支持

如有问题，请联系开发团队或查看相关 API 文档。
