# UDP to MQTT 接口数据文档

本工具（UDP_MQTT_Bridge）负责将机器人底层 UDP 数据包解析为 JSON 格式，并发布至 MQTT 的 `/udp_to_mqtt` 主题。同时监听 `/mqtt_to_udp` 接收控制指令。

## 1. 消息总览
- **MQTT 发布主题**: `/udp_to_mqtt`
- **数据格式**: 标准 JSON
- **核心逻辑**: 工具会解析 UDP 包头，提取 `code`，并根据不同的 `code` 将数据负载（Payload）转换为人类可读的 `parsed` 字典。

---

## 2. 通用消息结构
所有发送至 MQTT 的消息均包含以下基础字段：

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `code` | Integer | 指令码（十进制） |
| `code_hex` | String | 指令码（十六进制，如 `"0x1008"`） |
| `param_size` | Integer | UDP 数据负载长度 |
| `cmd_type` | Integer | 指令类型标识 |
| `from` | String | 数据源地址（IP:Port） |
| `parsed` | Object | **解析后的详细数据**（若 code 未定义解析规则，则无此字段） |

---

## 3. 详细数据解析 (`parsed` 字段内容)

### 3.1 机器人运行状态 (`0x1008`)
包含基础运行信息、里程、累计时间及硬件错误标志。

- **关键字段**:
  - `robot_name`: 机器人名称字符串。
  - `current_mileage`: 本次启动后的里程。
  - `total_mileage`: 累计总里程。
  - `joystick`: 遥控器 4 轴摇杆数据。
  - `error_state`: 包含 `imu_error`, `driver_error`, `battery_low_warn` 等布尔值。

### 3.2 运动状态信息 (`0x1009`)
实时反馈机器人的运动参数。

- **关键字段**:
  - `gait_state`: 当前步态 ID（如行走、爬坡等）。
  - `leg_odom_pos`: 足端里程计位置 `[x, y, z]`。
  - `leg_odom_vel`: 足端里程计速度 `[vx, vy, vz]`。
  - `touch_state`: 四足触地掩码。
  - `control_state`: 包含 `narrow_walk` (窄道模式) 等策略标志。

### 3.3 运动传感器数据 (`0x100a`)
高频发送的 IMU 数据与 12 个关节的精细状态。

- **imu_data**: `roll`, `pitch`, `yaw`, `acc_x/y/z`, `omega_x/y/z`。
- **joint_pos / vel / tau**: 分别对应 12 个关节的 **位置**、**速度** 和 **扭矩**。
  - *命名规则*: `fl_` (左前), `fr_` (右前), `hl_` (左后), `hr_` (右后)。

### 3.4 电池信息 (`0x21050f0a`)
- **关键字段**:
  - `voltage`: 电压。
  - `battery_level`: 剩余电量百分比 (%)。
  - `current`: 电流 (单位: 10mA)。
  - `battery_temperature`: 电池组内 4 个位置的实时温度 (℃)。

### 3.5 充电与环境状态
- **充电状态 (0x91910250/0x91910253)**: 
  - `state_description`: 如 "正在充电", "idle(空闲)" 等文字描述。
- **高度状态 (0x11050f08)**: 
  - `state`: "正常" 或 "匍匐"。
- **地形模式 (0x3100EE01)**: 
  - `terrain_mode`: "实心地面", "镂空地面", "无踢面楼梯" 等。

---

## 4. 频率与性能说明
为了兼顾实时性与系统负载，工具内部实现了频率控制：
1. **高频限制**: `0x1008` 和 `0x1009` 被限制在 **5Hz** (每 0.2s 发布一次)。
2. **常规指令**: `0x100a`, `0x21050f0a` 等其他指令在缓冲区更新后以 **10Hz** 的检查频率进行发布。
3. **并发安全**: 使用 `threading.Lock` 保护 UDP 接收缓冲区，确保多线程下数据不冲突。

---

## 5. 控制指令发送格式 (MQTT -> UDP)
若要通过 MQTT 控制机器人，请向 `/mqtt_to_udp` 发送以下格式的 JSON：

```json
{
  "command_name": "stand_down" // 对应代码中 COMMAND_MAP 的键名
}