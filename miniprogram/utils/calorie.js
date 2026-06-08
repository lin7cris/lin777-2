function calculateBmr(profile) {
  const base = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age
  return Math.round(profile.gender === 'male' ? base + 5 : base - 161)
}

function calculateTdee(bmr, activityLevel) {
  const factorMap = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725
  }
  return Math.round(bmr * (factorMap[activityLevel] || factorMap.light))
}

function calculateTargetCalories(tdee, goal) {
  if (goal === 'fat_loss') return Math.round(tdee - 350)
  if (goal === 'muscle_gain') return Math.round(tdee + 250)
  return tdee
}

function calculateMacroRange(weight, targetCalories) {
  return {
    protein: `${Math.round(weight * 1.5)}-${Math.round(weight * 1.8)}g`,
    carbs: `${Math.round(targetCalories * 0.4 / 4)}-${Math.round(targetCalories * 0.5 / 4)}g`,
    fat: `${Math.round(targetCalories * 0.22 / 9)}-${Math.round(targetCalories * 0.32 / 9)}g`
  }
}

module.exports = {
  calculateBmr,
  calculateTdee,
  calculateTargetCalories,
  calculateMacroRange
}
