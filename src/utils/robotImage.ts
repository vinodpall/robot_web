import apolloImg from '@/assets/source_data/Apollo.png'
import puduD5WImg from '@/assets/source_data/PUDU D5-W.png'
import dogImg from '@/assets/source_data/dog.png'
import carImg from '@/assets/source_data/car.png'

/**
 * 校验机器人 ID 或 名称 是否匹配已知特定型号图标（如 Apollo, PUDU D5 等）
 */
function getSpecificModelImageByRobotId(robotId?: string | null, robotName?: string | null): string | null {
  const text = `${robotId || ''} ${robotName || ''}`.toLowerCase().trim()
  if (!text) return null

  // 包含 apollo 或 阿波罗，切换到 Apollo 图标
  if (text.includes('apollo') || text.includes('阿波罗')) {
    return apolloImg
  }

  // 包含 pudu 或 普渡，切换到 PUDU 图标
  if (text.includes('pudu') || text.includes('普渡')) {
    return puduD5WImg
  }

  return null
}

/**
 * 判断是否为车类底盘（包含四轮底盘 four_wheel、八轮车 eight_wheel 等）
 */
export function isVehicleType(robotType?: string | null, robotId?: string | null, robotName?: string | null): boolean {
  if (robotType) {
    const lowerType = robotType.toLowerCase().trim()
    if (
      lowerType === 'four_wheel' ||
      lowerType === 'four-wheel' ||
      lowerType === 'fourwheel' ||
      lowerType === '4wheel' ||
      lowerType === '4_wheel' ||
      lowerType === 'eight_wheel' ||
      lowerType === 'eight-wheel' ||
      lowerType === 'eightwheel' ||
      lowerType === '8wheel' ||
      lowerType === '8_wheel' ||
      lowerType === 'tracked' ||
      lowerType === 'track' ||
      lowerType === 'car' ||
      lowerType === 'vehicle' ||
      lowerType === 'ugv' ||
      lowerType === 'chassis' ||
      lowerType.includes('wheel') ||
      lowerType.includes('car') ||
      lowerType.includes('vehicle') ||
      lowerType.includes('ugv') ||
      lowerType.includes('chassis') ||
      lowerType.includes('tracked')
    ) {
      return true
    }
  }

  const idAndName = `${robotId || ''} ${robotName || ''}`.toLowerCase().trim()
  if (idAndName) {
    if (
      idAndName.includes('eight_wheel') ||
      idAndName.includes('eight-wheel') ||
      idAndName.includes('eightwheel') ||
      idAndName.includes('8wheel') ||
      idAndName.includes('8_wheel') ||
      idAndName.includes('four_wheel') ||
      idAndName.includes('four-wheel') ||
      idAndName.includes('fourwheel') ||
      idAndName.includes('4wheel') ||
      idAndName.includes('4_wheel') ||
      idAndName.includes('四轮') ||
      idAndName.includes('八轮') ||
      idAndName.includes('履带') ||
      idAndName.includes('底盘') ||
      idAndName.includes('无人车') ||
      idAndName.includes('巡逻车') ||
      idAndName.includes('巡检车') ||
      idAndName.includes('car') ||
      idAndName.includes('vehicle') ||
      idAndName.includes('ugv') ||
      idAndName.includes('wheel') ||
      idAndName.includes('chassis') ||
      idAndName.includes('tracked')
    ) {
      return true
    }
  }

  return false
}

/**
 * 根据 机器人ID 与 名称 获取对应的机器狗/机器人图片
 * 规则：
 * 1. 如果 id 或 名称 中包含 apollo（忽略大小写），使用 Apollo.png
 * 2. 如果包含 pudu d5-w 或 pudu d5（忽略大小写），使用 PUDU D5-W.png
 * 3. 默认使用 dog.png
 */
export function getDogImageByRobotId(robotId?: string | null, robotName?: string | null): string {
  const specificImg = getSpecificModelImageByRobotId(robotId, robotName)
  if (specificImg) {
    return specificImg
  }
  return dogImg
}

/**
 * 获取机器人展示图片（包含四轮底盘、八轮车与机器狗型号适配）
 * @param robotType 机器人类型
 * @param robotId 机器人 ID
 * @param robotName 机器人展示名称（可选）
 */
export function getRobotImage(robotType?: string | null, robotId?: string | null, robotName?: string | null): string {
  // 1. 优先检测 robotId 与 robotName 是否匹配已知特定型号（Apollo、PUDU D5 等）
  const specificImg = getSpecificModelImageByRobotId(robotId, robotName)
  if (specificImg) {
    return specificImg
  }

  // 2. 判断是否为车类底盘（四轮底盘 / 八轮车等）
  if (isVehicleType(robotType, robotId, robotName)) {
    return carImg
  }

  // 3. 默认机器狗图片
  return dogImg
}

/**
 * 获取机器人型号 CSS 类名（用于各图标的视觉比例微调与居中校正）
 * @param robotType 机器人类型
 * @param robotId 机器人 ID
 * @param robotName 机器人展示名称（可选）
 */
export function getRobotModelClass(robotType?: string | null, robotId?: string | null, robotName?: string | null): string {
  const idAndName = `${robotId || ''} ${robotName || ''}`.toLowerCase()
  if (idAndName) {
    if (idAndName.includes('apollo') || idAndName.includes('阿波罗')) {
      return 'is-apollo'
    }
    if (idAndName.includes('pudu') || idAndName.includes('普渡')) {
      return 'is-pudu-d5'
    }
  }

  if (isVehicleType(robotType, robotId, robotName)) {
    return 'is-car'
  }

  return 'is-dog'
}

export { dogImg, carImg, apolloImg, puduD5WImg }
