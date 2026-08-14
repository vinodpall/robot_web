import apolloImg from '@/assets/source_data/Apollo.png'
import puduD5WImg from '@/assets/source_data/PUDU D5-W.png'
import dogImg from '@/assets/source_data/dog.png'
import carImg from '@/assets/source_data/car.png'

/**
 * 校验机器人 ID 是否匹配已知特定型号图标（如 Apollo, PUDU D5 等）
 */
function getSpecificModelImageByRobotId(robotId?: string | null): string | null {
  if (!robotId) return null

  const lowerId = robotId.toLowerCase()

  if (lowerId.includes('apollo')) {
    return apolloImg
  }

  if (
    lowerId.includes('pudu d5-w') ||
    lowerId.includes('pudu-d5-w') ||
    lowerId.includes('pudu_d5_w') ||
    lowerId.includes('pudu d5') ||
    lowerId.includes('pudu-d5') ||
    lowerId.includes('pudu_d5')
  ) {
    return puduD5WImg
  }

  return null
}

/**
 * 判断是否为车类底盘（包含四轮底盘 four_wheel、八轮车 eight_wheel 等）
 */
export function isVehicleType(robotType?: string | null, robotId?: string | null): boolean {
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

  if (robotId) {
    const lowerId = robotId.toLowerCase().trim()
    if (
      lowerId.includes('eight_wheel') ||
      lowerId.includes('eight-wheel') ||
      lowerId.includes('eightwheel') ||
      lowerId.includes('8wheel') ||
      lowerId.includes('8_wheel') ||
      lowerId.includes('four_wheel') ||
      lowerId.includes('four-wheel') ||
      lowerId.includes('fourwheel') ||
      lowerId.includes('4wheel') ||
      lowerId.includes('4_wheel') ||
      lowerId.includes('car') ||
      lowerId.includes('vehicle') ||
      lowerId.includes('ugv') ||
      lowerId.includes('wheel') ||
      lowerId.includes('chassis') ||
      lowerId.includes('tracked')
    ) {
      return true
    }
  }

  return false
}

/**
 * 根据 机器人ID (robot_id) 获取对应的机器狗/机器人图片
 * 规则：
 * 1. 如果 id 中包含 apollo（忽略大小写），使用 Apollo.png
 * 2. 如果包含 pudu d5-w 或 pudu d5（忽略大小写），使用 PUDU D5-W.png
 * 3. 默认使用 dog.png
 */
export function getDogImageByRobotId(robotId?: string | null): string {
  const specificImg = getSpecificModelImageByRobotId(robotId)
  if (specificImg) {
    return specificImg
  }
  return dogImg
}

/**
 * 获取机器人展示图片（包含四轮底盘、八轮车与机器狗型号适配）
 * @param robotType 机器人类型
 * @param robotId 机器人 ID
 */
export function getRobotImage(robotType?: string | null, robotId?: string | null): string {
  // 1. 优先检测 robotId 是否匹配已知特定型号（Apollo、PUDU D5 等）
  const specificImg = getSpecificModelImageByRobotId(robotId)
  if (specificImg) {
    return specificImg
  }

  // 2. 判断是否为车类底盘（四轮底盘 / 八轮车等）
  if (isVehicleType(robotType, robotId)) {
    return carImg
  }

  // 3. 默认机器狗图片
  return dogImg
}

/**
 * 获取机器人型号 CSS 类名（用于各图标的视觉比例微调与居中校正）
 * @param robotType 机器人类型
 * @param robotId 机器人 ID
 */
export function getRobotModelClass(robotType?: string | null, robotId?: string | null): string {
  if (robotId) {
    const lowerId = robotId.toLowerCase()
    if (lowerId.includes('apollo')) {
      return 'is-apollo'
    }
    if (
      lowerId.includes('pudu d5-w') ||
      lowerId.includes('pudu-d5-w') ||
      lowerId.includes('pudu_d5_w') ||
      lowerId.includes('pudu d5') ||
      lowerId.includes('pudu-d5') ||
      lowerId.includes('pudu_d5')
    ) {
      return 'is-pudu-d5'
    }
  }

  if (isVehicleType(robotType, robotId)) {
    return 'is-car'
  }

  return 'is-dog'
}

export { dogImg, carImg, apolloImg, puduD5WImg }
