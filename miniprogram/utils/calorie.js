// 使用 Mifflin-St Jeor 公式计算基础代谢，输入单位为 kg / cm / 岁。
function calculateBmr(profile) {
  const base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age
  return Math.round(profile.gender === 'male' ? base + 5 : base - 161)
}

// 根据日常活动强度把 BMR 放大为每日总消耗 TDEE。
function calculateTdee(bmr, activityLevel) {
  const factorMap = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725
  }
  return Math.round(bmr * (factorMap[activityLevel] || factorMap.light))
}

// 根据目标对 TDEE 做温和调整，避免一开始给用户过激热量差。
function calculateTargetCalories(tdee, goal) {
  if (goal === 'fat_loss') return Math.round(tdee - 350)
  if (goal === 'muscle_gain') return Math.round(tdee + 250)
  return tdee
}

// 按体重和目标热量生成蛋白质、碳水、脂肪建议范围。
function calculateMacroRange(weight, targetCalories) {
  return {
    protein: `${Math.round(weight * 1.5)}-${Math.round(weight * 1.8)}g`,
    carbs: `${Math.round(targetCalories * 0.4 / 4)}-${Math.round(targetCalories * 0.5 / 4)}g`,
    fat: `${Math.round(targetCalories * 0.22 / 9)}-${Math.round(targetCalories * 0.32 / 9)}g`
  }
}

// 聚合用户资料对应的所有推荐结果，页面和测试都通过这一层复用计算。
function buildNutritionPlan(profile) {
  const bmr = calculateBmr(profile)
  const tdee = calculateTdee(bmr, profile.activityLevel)
  const targetCalories = calculateTargetCalories(tdee, profile.goal)
  const macros = calculateMacroRange(profile.weight, targetCalories)

  return {
    bmr,
    tdee,
    targetCalories,
    macros
  }
}

module.exports = {
  buildNutritionPlan,
  calculateBmr,
  calculateTdee,
  calculateTargetCalories,
  calculateMacroRange
}
