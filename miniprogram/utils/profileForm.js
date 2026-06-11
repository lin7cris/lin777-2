function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function buildProfileForSave(form) {
  return {
    gender: form.gender,
    age: toNumber(form.age),
    height: toNumber(form.height),
    weight: toNumber(form.weight),
    targetWeight: toNumber(form.targetWeight),
    activityLevel: form.activityLevel,
    goal: form.goal
  }
}

module.exports = {
  buildProfileForSave
}
