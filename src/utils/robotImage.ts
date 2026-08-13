import apolloImg from '@/assets/source_data/Apollo.png'
import puduD5WImg from '@/assets/source_data/PUDU D5-W.png'
import dogImg from '@/assets/source_data/dog.png'
import carImg from '@/assets/source_data/car.png'

/**
 * 根据 机器人ID (robot_id) 获取对应的机器狗图片
 * 规则：
 * 1. 如果 id 中包含 apollo（忽略大小写），使用 Apollo.png
 * 2. 如果包含 pudu d5-w 或 pudu d5（忽略大小写），使用 PUDU D5-W.png
 * 3. 默认使用 dog.png
 * 
 * @param robotId 机器人 ID
 * @returns 对应图片的 import 路径
 */
export function getDogImageByRobotId(robotId?: string | null): string {
  if (!robotId) return dogImg

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

  return dogImg
}

/**
 * 获取机器人展示图片（包含四轮底盘与机器狗型号适配）
 * @param robotType 机器人类型
 * @param robotId 机器人 ID
 */
export function getRobotImage(robotType?: string | null, robotId?: string | null): string {
  if (robotType === 'four_wheel') {
    return carImg
  }
  return getDogImageByRobotId(robotId)
}

/**
 * 获取机器人型号 CSS 类名（用于各图标的视觉比例微调与居中校正）
 * @param robotType 机器人类型
 * @param robotId 机器人 ID
 */
export function getRobotModelClass(robotType?: string | null, robotId?: string | null): string {
  if (robotType === 'four_wheel') {
    return 'is-car'
  }
  if (!robotId) return 'is-dog'
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
  return 'is-dog'
}

export { dogImg, carImg, apolloImg, puduD5WImg }
