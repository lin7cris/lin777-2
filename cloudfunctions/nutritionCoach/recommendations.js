function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function buildItem(name, amount, calories, protein, carbs, fat, description) {
  return {
    name,
    amount,
    meal: 'dinner',
    calories,
    protein,
    carbs,
    fat,
    description,
    estimated: true
  }
}

function buildFallbackRecommendations(context) {
  const source = context || {}
  const today = source.today || {}
  const goal = String(source.profile && source.profile.goal || 'fat_loss')
  const remainingCalories = toNumber(today.remainingCalories)
  const proteinGap = Math.max(0, toNumber(today.protein && today.protein.target) - toNumber(today.protein && today.protein.value))

  if (remainingCalories < 0) {
    return [
      buildItem('清蒸鱼配绿叶菜', '1 份', 230, 30, 10, 8, '少油烹饪，适合今天热量已经超出目标时选择。'),
      buildItem('豆腐菌菇蔬菜汤', '1 大碗', 180, 18, 14, 7, '清淡有饱腹感，避免再叠加高油高糖食物。')
    ]
  }

  if (proteinGap >= 15) {
    if (goal === 'muscle_gain') {
      return [
        buildItem('鸡胸肉西兰花米饭', '1 份', 520, 45, 56, 13, '优先补足蛋白质，并提供适量训练恢复所需碳水。'),
        buildItem('牛肉饭配时蔬', '1 份', 500, 40, 52, 14, '选择少油做法，搭配一份蔬菜。')
      ]
    }
    return [
      buildItem('鸡胸肉沙拉', '1 份', 350, 35, 20, 12, '优先补足蛋白质，酱料建议分开放或少量使用。'),
      buildItem('虾仁豆腐蔬菜碗', '1 份', 380, 32, 30, 11, '高蛋白且热量适中，适合减脂晚餐。')
    ]
  }

  if (goal === 'muscle_gain') {
    return [
      buildItem('牛肉饭配时蔬', '1 份', 500, 40, 52, 14, '提供均衡蛋白质与碳水，适合增肌期正餐。'),
      buildItem('三文鱼藜麦沙拉', '1 份', 480, 34, 42, 18, '搭配优质脂肪和复合碳水。')
    ]
  }

  return [
    buildItem('鸡肉杂粮饭配时蔬', '1 份', 430, 36, 46, 11, '蛋白质、主食和蔬菜搭配均衡。'),
    buildItem('番茄牛肉荞麦面', '1 碗', 450, 32, 54, 10, '选择少油汤底，避免额外高热量配菜。')
  ]
}

function normalizeRecommendation(item) {
  const source = item || {}
  const name = String(source.name || '').trim().slice(0, 60)
  const calories = Math.round(toNumber(source.calories === undefined ? source.calorie : source.calories))
  if (!name || calories <= 0) return null

  return {
    name,
    amount: String(source.amount || '1 份').trim().slice(0, 40) || '1 份',
    meal: 'dinner',
    calories,
    protein: Math.max(0, Math.round(toNumber(source.protein))),
    carbs: Math.max(0, Math.round(toNumber(source.carbs))),
    fat: Math.max(0, Math.round(toNumber(source.fat))),
    description: String(source.description || '').trim().slice(0, 100),
    estimated: true
  }
}

function normalizeRecommendations(value, fallback) {
  const fromModel = (Array.isArray(value) ? value : [])
    .map(normalizeRecommendation)
    .filter(Boolean)
  const result = []

  fromModel.concat(Array.isArray(fallback) ? fallback : []).forEach((item) => {
    const normalized = normalizeRecommendation(item)
    if (!normalized || result.some((entry) => entry.name === normalized.name) || result.length >= 2) return
    result.push(normalized)
  })

  return result
}

module.exports = {
  buildFallbackRecommendations,
  normalizeRecommendations
}
