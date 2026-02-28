import socket
import struct
from Dxr_mqtt.dxr_mqtt import *
from Dxr_mqtt.msg import *

# 设置 MQTT 服务器地址（如果在本机运行 Mosquitto，可以用 127.0.0.1）
setServerUrl('127.0.0.1')

# 指令映射表
COMMAND_MAP = {
	"stand_down": (0x31010202, 0),  # 起立/趴下
	"power": (0x3101020A, 0),  # 力控模式
	"action": (0x31010201, 0),  # 开始运动/停止运动
	"height_down": (0x31010406, 0),  # 匍匐
	"height_normal": (0x31010406, 2),  # 正常
	"stop": (0x31010C0E, 0),  # 软急停
	"mode_manual": (0x31010C02, 0),  # 手动模式
	"mode_auto": (0x31010C03, 0),  # 非手动模式
	"foot_walk": (0x31010300, 0),  # 行走步态
	"foot_climb": (0x31010402, 0),  # 斜坡步态
	"foot_obs": (0x31010401, 0),  # 越障步态
	"foot_stair": (0x31010405, 0),  # 楼梯步态
	"foot_stair2": (0x3101040A, 0),  # 楼体步态帧模式
	"foot_stair3": (0x3101040B, 0),  # 45°楼梯步态
	"foot_l": (0x31010420, 0),  # L 行走步态
	"foot_mountain": (0x31010421, 0),  # 山地步态
	"foot_silent": (0x31010422, 0),  # 静音步态
	"mode_auto_1": (0x3101EE03, 1),  # 非手动模式-手柄摇杆
	"mode_auto_2": (0x3101EE03, 2),  # 非手动模式-导航模块
	"charge_start": (0x91910250, 1),  # 开始充电
	"charge_stop": (0x91910250, 0),  # 结束充电
	"charge_clean": (0x91910250, 2),  # 清除充电状态，恢复空闲
	"charge_state": (0x91910253, 0),  # 查询充电状态
	"ground_1": (0x3101EE01, 3),  # 实心地面
	"ground_2": (0x3101EE01, 4),  # 镂空地面
	"ground_3": (0x3101EE01, 5),  # 无踢面楼梯
	"ground_4": (0x3101EE01, 18),  # 累积帧准备状态
}

# 充电状态映射表
CHARGE_STATE_MAP = {
	0x0000: "idle（空闲状态）",
	0x0001: "do_charge_task（充电任务状态）",
	0x0002: "charging（正在充电状态）",
	0x0003: "do_over_charge_task（结束充电状态）",
	0x0004: "pile_error（充电桩断电）",
	0x0005: "safety_warning（请先拔掉充电器）",
	0x1002: "TAGRECETIMEOUT（获取定位信息超时）",
	0x1003: "MARKLAUNCHFAILED（定位算法开启失败）",
	0x1004: "GOTOSTACKFAILED（到达超时）",
	0x1005: "TAGNOVALUE（没有定位信息）",
	0x1006: "TAGPOSEJUMP（定位信息跳变）",
	0x1007: "NOCHARGEPLUG（检测充电电流失败，趴在充电桩）",
	0x100a: "NOCHARGEPLUG_STEP_BACK（检测充电电流失败，退出充电桩）",
}


class UDP_MQTT_Bridge:
	def __init__(self, udp_recv_ip='0.0.0.0', udp_recv_port=43898, udp_send_ip='127.0.0.1', udp_send_port=8888):
		self.udp_recv_ip = udp_recv_ip
		self.udp_recv_port = udp_recv_port
		self.udp_send_ip = udp_send_ip
		self.udp_send_port = udp_send_port
		self.control_ip = '192.168.1.103'  # 运动主机
		self.control_port = 43893
		self.perception_ip = '192.168.1.105'  # 感知主机
		self.perception_port = 43899
		self.charge_ip = '192.168.1.105'  # 充电数据监听地址
		self.charge_port = 3333

		# 主 UDP 套接字（监听 0.0.0.0:43898）
		self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
		self.sock.bind((self.udp_recv_ip, self.udp_recv_port))

		# 从 UDP 套接字（监听 0.0.0.0:43898）
		self.ground_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
		self.ground_sock.bind((self.udp_recv_ip, 43899))

		# 充电数据 UDP 套接字（监听 192.168.1.105:3333）
		self.charge_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
		self.charge_sock.bind((self.udp_recv_ip, self.charge_port))

		# MQTT publisher 发送接收到的 UDP 数据
		self.mqtt_pub = Dxr_Publisher('/udp_to_mqtt')

		# MQTT subscriber 接收指令后通过 UDP 发出去
		self.mqtt_sub = Dxr_Subscriber('/mqtt_to_udp', self.handle_mqtt_message)

		self.running = True
		print(f"主 UDP->MQTT 桥接服务已启动（监听 {self.udp_recv_ip}:{self.udp_recv_port}）")
		print(f"充电 UDP->MQTT 桥接服务已启动（监听 {self.udp_recv_ip}:{self.charge_port}）")

		# 用于存储最近接收到的 UDP 数据的缓冲区 (code -> latest_data)
		# 每个 entry 存储 (data, addr, timestamp)
		self.udp_data_buffer = {}
		# 保护缓冲区写入的锁
		self.buffer_lock = threading.Lock()

		# 记录特定指令上次的发送时间，用于限频
		self.last_publish_time_1008 = 0.0
		self.last_publish_time_1009 = 0.0

	def start(self):
		# 启动主 UDP 接收线程
		threading.Thread(target=self.udp_receiver_loop, daemon=True).start()
		# 启动从 UDP 接收线程
		threading.Thread(target=self.ground_udp_receiver_loop, daemon=True).start()
		# 启动充电 UDP 接收线程
		threading.Thread(target=self.charge_udp_receiver_loop, daemon=True).start()
		# 启动心跳线程
		threading.Thread(target=self.heartbeat_loop, daemon=True).start()
		# 【修改点3】：启动 MQTT 发布线程，负责限频和发布
		threading.Thread(target=self.mqtt_publisher_loop, daemon=True).start()

		while True:
			try:
				time.sleep(1)
			except KeyboardInterrupt:
				self.running = False
				self.sock.close()
				self.charge_sock.close()
				self.ground_sock.close()
				print("程序退出")
				break

	def heartbeat_loop(self):
		"""
        持续发送心跳到运动主机，并在第一次心跳后，立即发送一次连接确认指令。
        """
		print(f"心跳/连接确认线程已启动，目标 {self.control_ip}:{self.control_port}")

		# 准备需要用到的指令数据包
		heartbeat_code = 0x3040001
		heartbeat_packed_data = struct.pack("<3I", heartbeat_code, 0, 0)

		connection_confirm_code = 0x31020001
		confirm_packed_data = struct.pack("<3I", connection_confirm_code, 0, 0)

		# 用于确保确认指令只在第一次发送的标志位
		confirmation_sent = False

		while self.running:
			try:
				# 步骤 1：每一次循环都发送心跳指令
				self.sock.sendto(heartbeat_packed_data, (self.control_ip, self.control_port))

				# 步骤 2：检查标志位，如果确认指令还未发送，则立即发送
				if not confirmation_sent:
					# 紧随第一次心跳之后，发送一次性的连接确认指令
					self.sock.sendto(confirm_packed_data, (self.control_ip, self.control_port))
					print(f"已在首次心跳后发送连接确认指令: 0x{connection_confirm_code:08X}")

					# 将标志位置为True，确保此后的循环不再进入这个代码块
					confirmation_sent = True

				# 步骤 3：等待0.5秒，以维持2Hz的频率
				time.sleep(0.5)

			except Exception as e:
				print(f"[心跳线程] 错误: {e}")
				break

	def udp_receiver_loop(self):
		"""主 UDP 数据接收循环（0.0.0.0:43898）"""
		while self.running:
			try:
				data, addr = self.sock.recvfrom(2048)
				# 不再直接处理，而是将数据存入缓冲区
				self.buffer_udp_data(data, addr)
			except Exception as e:
				print(f"[主UDP接收] 错误: {e}")

	def ground_udp_receiver_loop(self):
		"""次 UDP 数据接收循环（0.0.0.0:43899）"""
		while self.running:
			try:
				data, addr = self.ground_sock.recvfrom(2048)
				# 不再直接处理，而是将数据存入缓冲区
				self.buffer_udp_data(data, addr)
			except Exception as e:
				print(f"[从UDP接收] 错误: {e}")

	def charge_udp_receiver_loop(self):
		"""充电 UDP 数据接收循环（192.168.1.105:3333）"""
		while self.running:
			try:
				data, addr = self.charge_sock.recvfrom(2048)
				print(f"[充电UDP接收] 来自 {addr} 的数据长度: {len(data)}")
				# 不再直接处理，而是将数据存入缓冲区
				self.buffer_udp_data(data, addr)
			except Exception as e:
				print(f"[充电UDP接收] 错误: {e}")

	def buffer_udp_data(self, data, addr):
		"""将接收到的 UDP 数据放入缓冲区"""
		if len(data) >= 12:
			code = int.from_bytes(data[0:4], byteorder='little')
			with self.buffer_lock:
				# 存储数据、来源和时间戳
				self.udp_data_buffer[code] = (data, addr, time.time())
		else:
			print(f"[UDP警告] 数据长度不足12字节，无法解析，来自 {addr}")

	def mqtt_publisher_loop(self):
		"""独立的 MQTT 发布线程，处理不同频率的数据发布"""
		# 0x1008 和 0x1009 的发布频率 (2Hz，即每 0.5 秒)
		publish_interval_high_freq = 0.2
		# 其他指令的发布检查频率 (例如 10Hz，即每 0.1 秒)
		# 这个值决定了非限频数据最大延迟，建议设置得小一些
		publish_interval_low_freq = 0.1

		print(
			f"MQTT 发布线程已启动。0x1008/0x1009 发布频率: {1 / publish_interval_high_freq} Hz, 其他指令检查频率: {1 / publish_interval_low_freq} Hz")

		while self.running:
			current_time = time.time()
			data_to_publish = []  # 收集这一轮要发布的数据

			with self.buffer_lock:
				# 遍历缓冲区中所有已接收到的数据类型
				# 使用 list() 复制 keys() 或 items() 可以避免在迭代时修改字典引发 RuntimeError
				for code, (data, addr, timestamp) in list(self.udp_data_buffer.items()):
					if code == 0x1008:
						if (current_time - self.last_publish_time_1008) >= publish_interval_high_freq:
							data_to_publish.append((data, addr))
							self.last_publish_time_1008 = current_time
							# 发送后从缓冲区移除，避免重复发送
							del self.udp_data_buffer[code]
					elif code == 0x1009:
						if (current_time - self.last_publish_time_1009) >= publish_interval_high_freq:
							data_to_publish.append((data, addr))
							self.last_publish_time_1009 = current_time
							# 发送后从缓冲区移除，避免重复发送
							del self.udp_data_buffer[code]
					else:
						# 对于其他指令，只要缓冲区中有新数据，就在这一轮发送
						data_to_publish.append((data, addr))
						# 发送后从缓冲区移除
						del self.udp_data_buffer[code]

			# 在锁之外发布数据，避免在发布 MQTT 时阻塞其他线程对缓冲区的访问
			for data, addr in data_to_publish:
				self.process_and_publish_data(data, addr)

			# 控制此发布线程的循环频率，确保它能定期检查并发送非限频数据
			time.sleep(publish_interval_low_freq)

	def process_and_publish_data(self, data, addr):
		"""处理接收到的 UDP 数据并发布到 MQTT"""
		# 注意：这里不再进行频率控制，只负责解析和发布
		if len(data) < 12:  # 额外的检查，尽管 buffer_udp_data 已处理
			print(f"[UDP警告] process_and_publish_data: 数据长度不足12字节，无法解析，来自 {addr}")
			return

		code = int.from_bytes(data[0:4], byteorder='little')
		param_size = int.from_bytes(data[4:8], byteorder='little')
		cmd_type = int.from_bytes(data[8:12], byteorder='little')

		mqtt_msg = msg()
		mqtt_msg.msg = {
			"code": code,
			"code_hex": hex(code),
			"param_size": param_size,
			"cmd_type": cmd_type,
			"from": f"{addr[0]}:{addr[1]}",
		}
		# 根据 code 解析结构体
		if code == 0x1008:
			parsed = self.parse_rcs_data(data)
			if parsed:
				mqtt_msg.msg["parsed"] = parsed
		elif code == 0x1009:
			parsed = self.parse_motion_state_data(data)
			if parsed:
				mqtt_msg.msg["parsed"] = parsed
		elif code == 0x100a:
			parsed = self.parse_controller_sensor_data(data)
			if parsed:
				mqtt_msg.msg["parsed"] = parsed
		elif code == 0x100b:
			parsed = self.parse_controller_safe_data(data)
			if parsed:
				mqtt_msg.msg["parsed"] = parsed
		elif code == 0x21050f0a:
			parsed = self.parse_battery_sensor_data(data)
			if parsed:
				mqtt_msg.msg["parsed"] = parsed
		elif code == 0x11050f08:
			parsed = self.parse_body_height_state(data)
			if parsed:
				mqtt_msg.msg["parsed"] = parsed
		elif code == 0x3100EE01:
			parsed = self.parse_terrain_mode_data(data)
			if parsed:
				mqtt_msg.msg["parsed"] = parsed
		elif code in [0x91910250, 0x91910253]:
			parsed = self.parse_charge_state_data(data)
			if parsed:
				mqtt_msg.msg["parsed"] = parsed
		else:
			# print(f"[UDP] 未知 code: 0x{code:04x}") # 调试时可以打开此行
			pass
		self.mqtt_pub.publish(mqtt_msg.get_json())
		# print(f"Published UDP data with code 0x{code:x} to MQTT.") # 调试时可以打开此行

	def handle_mqtt_message(self, m, client=''):
		mm = msg.getMsg(m)
		command_name = mm.msg['command_name']
		if command_name not in COMMAND_MAP:
			print(f"未知指令: {command_name}")
			return
		if command_name in ['mode_auto_1', 'mode_auto_2']:
			this_ip = self.perception_ip
			this_port = self.perception_port
			sock = self.ground_sock
		elif command_name in ['charge_start', 'charge_stop', 'charge_clean', 'charge_state']:
			this_ip = self.perception_ip
			this_port = self.charge_port
			sock = self.charge_sock  # 复用 charge_sock 发送充电指令
		else:
			this_ip = self.control_ip
			this_port = self.control_port
			sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)  # 其他指令用临时套接字
		cmd_code, cmd_value = COMMAND_MAP[command_name]
		packed_data = struct.pack("<3I", cmd_code, cmd_value, 0)

		print(f"发送 UDP 数据: {packed_data.hex()} 到 {this_ip}:{this_port}")
		sock.sendto(packed_data, (this_ip, this_port))
		if sock not in [self.sock, self.ground_sock, self.charge_sock]:
			sock.close()  # 仅关闭临时套接字

		print(f"已发送: {command_name} => 指令码=0x{cmd_code:08X}, 指令值={cmd_value} 到 {this_ip}:{this_port}")

	def parse_rcs_data(self, data):
		"""机器人运行状态信息解析"""
		try:
			header_size = 12
			payload = data[header_size:]

			robot_name = payload[:15].split(b'\x00', 1)[0].decode('utf-8', errors='ignore')
			current_mileage, total_mileage = struct.unpack("<2i", payload[16:24])
			current_run_time, total_run_time = struct.unpack("<2q", payload[24:40])
			current_motion_time, total_motion_time = struct.unpack("<2q", payload[40:56])
			joystick = struct.unpack("<4f", payload[56:72])
			rcs_state = list(struct.unpack("10B", payload[72:82]))
			error_state = struct.unpack("<I", payload[82:86])[0]

			result = {
				"robot_name": robot_name,
				"current_mileage": current_mileage,
				"total_mileage": total_mileage,
				"current_run_time": current_run_time,
				"total_run_time": total_run_time,
				"current_motion_time": current_motion_time,
				"total_motion_time": total_motion_time,
				"joystick": list(joystick),
				"rcs_state": rcs_state,
				"error_state": {
					"imu_error": bool(error_state & (1 << 0)),
					"wifi_error": bool(error_state & (1 << 1)),
					"driver_heat_warn": bool(error_state & (1 << 2)),
					"driver_error": bool(error_state & (1 << 3)),
					"motor_heat_warn": bool(error_state & (1 << 4)),
					"battery_low_warn": bool(error_state & (1 << 5)),
				}
			}
			return result
		except Exception as e:
			# print(f"[解析] RcsData 解析失败: {e}") # 调试时可以打开此行
			return None

	def parse_motion_state_data(self, data):
		"""机器人运动状态信息解析"""
		try:
			header_size = 12
			payload = data[header_size:]

			if len(payload) < 58:  # 结构体大小：58 字节
				raise ValueError(f"数据长度不足，期望至少 58 字节，实际 {len(payload)} 字节")

			# 解析字段（考虑偏移 2-3 的 2 字节填充）
			basic_state, gait_state = struct.unpack_from("<BB", payload, 0)
			max_forward_vel, max_backward_vel = struct.unpack_from("<2f", payload, 4)  # 偏移 4
			leg_odom_pos = struct.unpack_from("<3f", payload, 12)  # 偏移 12
			leg_odom_vel = struct.unpack_from("<3f", payload, 24)  # 偏移 24
			robot_distance = struct.unpack_from("<f", payload, 36)[0]  # 偏移 36
			touch_state = struct.unpack_from("<I", payload, 40)[0]  # 偏移 40
			control_state = struct.unpack_from("<I", payload, 44)[0]  # 偏移 44
			task_state = list(struct.unpack_from("<10B", payload, 48))  # 偏移 48

			result = {
				"basic_state": basic_state,
				"gait_state": gait_state,
				"max_forward_vel": max_forward_vel,
				"max_backward_vel": max_backward_vel,
				"leg_odom_pos": list(leg_odom_pos),
				"leg_odom_vel": list(leg_odom_vel),
				"robot_distance": robot_distance,
				"touch_state": touch_state,
				"control_state": {
					"narrow_walk": bool(control_state & (1 << 0)),
					"pose_safe_flag": bool(control_state & (1 << 1)),
					"joint_limit_flag": bool(control_state & (1 << 2)),
				},
				"task_state": task_state,
			}
			return result
		except (struct.error, ValueError) as e:
			# print(f"[解析] MotionStateData 解析失败: {e}") # 调试时可以打开此行
			return None

	def parse_controller_sensor_data(self, data):
		"""运动控制传感器数据解析"""
		try:
			header_size = 12
			payload = data[header_size:]

			if len(payload) < 184:
				raise ValueError(f"数据长度不足，期望 184 字节，实际 {len(payload)} 字节")

			offset = 0

			# 解析 IMU timestamp
			timestamp = struct.unpack_from("<i", payload, offset)[0]
			offset += 4

			# 解析 roll, pitch, yaw, omega_x/y/z, acc_x/y/z
			imu_floats = struct.unpack_from("<9f", payload, offset)
			imu_data = {
				"timestamp": timestamp,
				"roll": imu_floats[0],
				"pitch": imu_floats[1],
				"yaw": imu_floats[2],
				"omega_x": imu_floats[3],
				"omega_y": imu_floats[4],
				"omega_z": imu_floats[5],
				"acc_x": imu_floats[6],
				"acc_y": imu_floats[7],
				"acc_z": imu_floats[8],
			}
			offset += 36

			def parse_joint_data(name):
				nonlocal offset
				values = struct.unpack_from("<12f", payload, offset)
				offset += 48
				return {
					"fl_hipx": values[0], "fl_hipy": values[1], "fl_knee": values[2],
					"fr_hipx": values[3], "fr_hipy": values[4], "fr_knee": values[5],
					"hl_hipx": values[6], "hl_hipy": values[7], "hl_knee": values[8],
					"hr_hipx": values[9], "hr_hipy": values[10], "hr_knee": values[11],
				}

			joint_pos = parse_joint_data("pos")
			joint_vel = parse_joint_data("vel")
			joint_tau = parse_joint_data("tau")

			result = {
				"imu_data": imu_data,
				"joint_pos": joint_pos,
				"joint_vel": joint_vel,
				"joint_tau": joint_tau,
			}
			return result
		except Exception as e:
			# print(f"[解析] ControllerSensorData 解析失败: {e}") # 调试时可以打开此行
			return None

	def parse_controller_safe_data(self, data):
		"""运动控制系统状态解析"""
		try:
			header_size = 12
			payload = data[header_size:]

			if len(payload) < 68:
				raise ValueError(f"数据长度不足，期望 68 字节，实际 {len(payload)} 字节")

			offset = 0

			# 解析 motor_temperature
			motor_temp = list(struct.unpack_from("<12f", payload, offset))
			offset += 48

			# 解析 driver_temperature
			driver_temp = list(struct.unpack_from("12B", payload, offset))
			offset += 12

			# 解析 CPU 信息
			cpu_temp, cpu_freq = struct.unpack_from("<2f", payload, offset)

			result = {
				"motor_temperature": motor_temp,
				"driver_temperature": driver_temp,
				"cpu_info": {
					"temperature": cpu_temp,
					"frequency": cpu_freq
				}
			}
			return result
		except Exception as e:
			# print(f"[解析] ControllerSafeData 解析失败: {e}") # 调试时可以打开此行
			return None

	def parse_battery_sensor_data(self, data):
		"""电池信息解析"""
		try:
			header_size = 12
			payload = data[header_size:]

			if len(payload) < 39:
				raise ValueError(f"数据长度不足，期望至少 39 字节，实际 {len(payload)} 字节")

			voltage, current = struct.unpack_from("<Hh", payload, 0)
			remaining_capacity, nominal_capacity, cycles = struct.unpack_from("<HHH", payload, 4)
			production_date, balanced_low, balanced_high, protected_state = struct.unpack_from("<HHHH", payload, 10)
			software_version, battery_level, mos_state, battery_quantity, battery_ntc = struct.unpack_from("<BBBBB",
			                                                                                               payload, 18)
			battery_temperature = list(struct.unpack_from("<ffff", payload, 23))

			result = {
				"voltage": voltage,  # 电压 (V)
				"current": current,  # 电流 (10mA)
				"remaining_capacity": remaining_capacity,  # 剩余容量
				"nominal_capacity": nominal_capacity,  # 标称容量
				"cycles": cycles,  # 循环次数
				"production_date": production_date,  # 生产日期
				"balanced_low": balanced_low,
				"balanced_high": balanced_high,
				"protected_state": protected_state,
				"software_version": software_version,
				"battery_level": battery_level,  # 电池容量 (%)
				"mos_state": mos_state,
				"battery_quantity": battery_quantity,
				"battery_ntc": battery_ntc,
				"battery_temperature": battery_temperature  # 电池温度 (℃)，4个float
			}

			return result
		except (struct.error, ValueError) as e:
			# print(f"[解析] BatterySensorData 解析失败: {e}, 数据: {data.hex()}") # 调试时可以打开此行
			return None

	def parse_body_height_state(self, data):
		"""身体高度状态解析"""
		try:
			if len(data) < 12:
				# print(f"[解析] 数据长度不足: {len(data)} 字节") # 调试时可以打开此行
				return None

			instruction_code = int.from_bytes(data[0:4], byteorder='little')
			value = int.from_bytes(data[4:8], byteorder='little', signed=True)
			instruction_type = int.from_bytes(data[8:12], byteorder='little')

			state_map = {
				-1: "匍匐",  # -1代表匍匐状态
				0: "正常",  # 0代表正常状态
			}

			result = {
				"instruction_code": hex(instruction_code),
				"instruction_type": instruction_type,
				"raw_value": value,
				"state": state_map.get(value, "未知")
			}
			return result
		except Exception as e:
			# print(f"[解析] BodyHeightState 解析失败: {e}") # 调试时可以打开此行
			return None

	def parse_terrain_mode_data(self, data):
		"""地形图模式状态解析"""
		try:
			if len(data) < 12:
				# print(f"[解析] 地形图模式数据长度不足: {len(data)} 字节") # 调试时可以打开此行
				return None

			instruction_code = int.from_bytes(data[0:4], byteorder='little')
			value = int.from_bytes(data[4:8], byteorder='little')
			instruction_type = int.from_bytes(data[8:12], byteorder='little')

			# 地形图模式映射表
			mode_map = {
				3: "实心地面",
				4: "镂空地面",
				5: "无踢面楼梯",
				18: "累积帧准备状态",
				20: "累积帧"
			}

			result = {
				"instruction_code": hex(instruction_code),
				"instruction_type": instruction_type,
				"raw_value": value,
				"terrain_mode": mode_map.get(value, "无")
			}
			# print(f'{result = }') # 调试时可以打开此行
			return result
		except Exception as e:
			# print(f"[解析] TerrainModeData 解析失败: {e}") # 调试时可以打开此行
			return None

	def parse_charge_state_data(self, data):
		"""充电状态信息解析"""
		try:
			header_size = 12
			payload = data[header_size:]

			if len(data) < 12:
				raise ValueError(f"数据长度不足，期望至少 12 字节，实际 {len(data)} 字节")

			instruction_code = int.from_bytes(data[0:4], byteorder='little')
			charge_manager_state = int.from_bytes(data[4:8], byteorder='little')
			instruction_type = int.from_bytes(data[8:12], byteorder='little')

			state_description = CHARGE_STATE_MAP.get(charge_manager_state, "未知状态")

			result = {
				"instruction_code": hex(instruction_code),
				"charge_manager_state": hex(charge_manager_state),
				"instruction_type": instruction_type,
				"state_description": state_description
			}
			# print(f'charge result info is {result}') # 调试时可以打开此行
			return result
		except (struct.error, ValueError) as e:
			# print(f"[解析] ChargeStateData 解析失败: {e}, 数据: {data.hex()}") # 调试时可以打开此行
			return None


if __name__ == "__main__":
	bridge = UDP_MQTT_Bridge()
	bridge.start()