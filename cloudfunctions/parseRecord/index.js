const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event) => {
  const text = event.text || ''

  return {
    sourceText: text,
    confidence: 0.86,
    foods: [
      { name: '鸡蛋', amount: '1 个', calories: 70, protein: 6, carbs: 1, fat: 5 },
      { name: '牛奶', amount: '250ml', calories: 150, protein: 8, carbs: 12, fat: 8 },
      { name: '包子', amount: '2 个', calories: 420, protein: 14, carbs: 68, fat: 12 },
      { name: '米饭', amount: '1 碗', calories: 260, protein: 5, carbs: 58, fat: 1 },
      { name: '宫保鸡丁', amount: '1 份', calories: 520, protein: 32, carbs: 22, fat: 32 },
      { name: '青菜', amount: '1 份', calories: 90, protein: 4, carbs: 12, fat: 3 }
    ],
    exercises: [
      { name: '跑步', duration: 30, intensity: '中等强度', calories: 310 }
    ]
  }
}
