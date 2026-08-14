const MEAL_ALIASES = {
  breakfast: 'breakfast',
  早餐: 'breakfast',
  brunch: 'breakfast',
  lunch: 'lunch',
  午餐: 'lunch',
  中餐: 'lunch',
  dinner: 'dinner',
  晚餐: 'dinner',
  supper: 'dinner',
  snack: 'snack',
  加餐: 'snack',
  下午茶: 'snack'
}

function normalizeMeal(value) {
  const text = String(value || '').trim().toLowerCase()
  if (MEAL_ALIASES[text]) return MEAL_ALIASES[text]
  if (/早餐|早饭|早上/.test(text)) return 'breakfast'
  if (/午餐|午饭|中餐|中午/.test(text)) return 'lunch'
  if (/晚餐|晚饭|晚餐|晚上/.test(text)) return 'dinner'
  if (/加餐|零食|下午茶/.test(text)) return 'snack'
  return ''
}

function hourOf(localTime) {
  const match = String(localTime || '').match(/(?:T|\s)(\d{1,2})(?::(\d{2}))?/)
  if (!match) return new Date().getHours()
  const hour = Number(match[1])
  return Number.isFinite(hour) && hour >= 0 && hour <= 23 ? hour : new Date().getHours()
}

function buildMealContext(input) {
  const config = input || {}
  const list = Array.isArray(config.foods) ? config.foods : []
  const recordedMeals = [...new Set(list.map((food) => normalizeMeal(food && food.meal)).filter(Boolean))]
  const has = (meal) => recordedMeals.includes(meal)
  const hour = hourOf(config.localTime)

  if (!list.length) {
    return {
      mode: 'plan',
      nextMeal: '',
      title: '今日饮食规划',
      secondaryTitle: '',
      recordedMeals,
      localTime: String(config.localTime || ''),
      localHour: hour
    }
  }

  if (has('dinner')) {
    return {
      mode: 'summary',
      nextMeal: '',
      title: '今日总结',
      secondaryTitle: '',
      recordedMeals,
      localTime: String(config.localTime || ''),
      localHour: hour
    }
  }

  if (has('lunch')) {
    return {
      mode: 'next-meal',
      nextMeal: 'dinner',
      title: '晚餐推荐',
      secondaryTitle: '',
      recordedMeals,
      localTime: String(config.localTime || ''),
      localHour: hour
    }
  }

  if (has('breakfast') && hour < 14) {
    return {
      mode: 'next-meal',
      nextMeal: 'lunch',
      title: '午餐推荐',
      secondaryTitle: '晚餐规划',
      recordedMeals,
      localTime: String(config.localTime || ''),
      localHour: hour
    }
  }

  return {
    mode: 'next-meal',
    nextMeal: 'dinner',
    title: hour < 18 ? '晚餐规划' : '晚餐推荐',
    secondaryTitle: '',
    recordedMeals,
    localTime: String(config.localTime || ''),
    localHour: hour
  }
}

module.exports = {
  buildMealContext,
  normalizeMeal
}
