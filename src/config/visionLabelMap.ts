/**
 * 算法检测结果中英文映射词典
 */
export const VISION_LABEL_MAP: Record<string, string> = {
  smoke: '烟雾',
  fire: '火焰',
  person: '行人',
  car: '车',
  IRPerson: '夜视行人',
  open: '开启',
  cover: '关闭',
  close: '关闭',
  'fire hydrant': '消防栓',
  bol: '扫帚',
  axe: '消防斧',
  exting: '灭火器',
  shovel: '消防铲',
  sandbox: '砂箱',
  firebucket: '消防桶',
  left: '左',
  up: '上',
  down: '下',
  right: '右',
  ok: '中',
  Warning: '警告',
  Normal: '正常',
  manhole_cover: '井盖',
  Pothole: '坑洼',
  LCD: '液晶屏',
  button: '指示灯',
  pointer_watch: '指针表',
  switch: '开关',
  light: '指示灯',
  drip: '滴漏区域',
  hat: '戴帽',
  no_hat: '未戴帽',
  animal: '动物',
  face: '人脸',
  lpr: '车牌',
  box: '箱子',
  monkey: '猕猴',
  guanyong: '管涌'
}

/**
 * 翻译算法检测标签
 * 支持精确匹配和忽略大小写匹配，若不在词典中则返回原文本
 */
export const translateVisionLabel = (rawLabel?: string | null): string => {
  if (!rawLabel) return ''
  const trimmed = String(rawLabel).trim()
  if (!trimmed) return ''

  // 1. 精确匹配
  if (VISION_LABEL_MAP[trimmed]) {
    return VISION_LABEL_MAP[trimmed]
  }

  // 2. 忽略大小写匹配
  const lowerCaseKey = Object.keys(VISION_LABEL_MAP).find(
    k => k.toLowerCase() === trimmed.toLowerCase()
  )
  if (lowerCaseKey) {
    return VISION_LABEL_MAP[lowerCaseKey]
  }

  return trimmed
}
