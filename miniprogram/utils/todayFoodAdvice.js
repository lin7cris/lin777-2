const { buildCoachMacros, buildCoachSummary } = require('./nutritionCoachView')

const FOOD_ADVICE_MESSAGES = {
  empty: '记录今天的饮食后，我可以帮你看看接下来怎么吃。',
  nearGoal: '今天摄入已经接近目标，接下来注意控制份量即可。',
  overTarget: '今天摄入已超过目标，接下来尽量选择清淡、低热量食物。',
  unavailable: '暂时无法生成建议，稍后再试。'
}

function buildGoalAdvice(goal, remainingCalories) {
  const calorieText = `今天还可以吃约 ${remainingCalories} kcal`
  if (goal === 'muscle_gain') {
    return `${calorieText}，下一餐可以搭配优质蛋白和适量主食。`
  }
  if (goal === 'maintain') {
    return `${calorieText}，下一餐注意蛋白质、主食和蔬菜均衡搭配。`
  }
  return `${calorieText}，下一餐优先选择蛋白质、蔬菜和适量主食。`
}

function buildTodayFoodAdvice(record, profile) {
  try {
    const foods = record && record.foods
    if (!Array.isArray(foods) || !foods.length) return FOOD_ADVICE_MESSAGES.empty

    const summary = buildCoachSummary(record, profile)
    const remainingCalories = Math.max(0, Math.round(summary.remainingCalories))
    if (summary.remainingCalories < 0) return FOOD_ADVICE_MESSAGES.overTarget
    if (summary.remainingCalories <= 200) return FOOD_ADVICE_MESSAGES.nearGoal

    const macros = buildCoachMacros(record, profile)
    const protein = macros.find((item) => item.key === 'protein')
    const carbs = macros.find((item) => item.key === 'carbs')
    const fat = macros.find((item) => item.key === 'fat')
    const calorieText = `今天还可以吃约 ${remainingCalories} kcal`

    if (protein && protein.value < protein.range.lower * 0.75) {
      return `${calorieText}，蛋白质偏低，下一餐优先选择鸡胸肉、鸡蛋或豆制品。`
    }
    if (fat && fat.value > fat.range.upper) {
      return `${calorieText}，脂肪摄入偏高，下一餐尽量少油并增加蔬菜。`
    }
    if (carbs && carbs.value < carbs.range.lower * 0.65) {
      return `${calorieText}，碳水偏少，可以适量补充米饭、玉米或薯类。`
    }

    return buildGoalAdvice(profile && profile.goal, remainingCalories)
  } catch (error) {
    return FOOD_ADVICE_MESSAGES.unavailable
  }
}

module.exports = {
  FOOD_ADVICE_MESSAGES,
  buildTodayFoodAdvice
}
