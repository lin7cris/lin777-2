Page({
  data: {
    macros: [
      { name: '蛋白质', value: '72 / 100g', percent: 72, color: 'green' },
      { name: '碳水', value: '146 / 180g', percent: 81, color: 'amber' },
      { name: '脂肪', value: '38 / 50g', percent: 76, color: 'red' }
    ],
    records: [
      { title: '早餐', desc: '鸡蛋、牛奶、包子', calories: '520 kcal' },
      { title: '午餐', desc: '米饭、宫保鸡丁、青菜', calories: '960 kcal' },
      { title: '运动', desc: '跑步 30 分钟', calories: '-400 kcal', type: 'exercise' }
    ]
  },

  goEntry() {
    wx.navigateTo({
      url: '/pages/entry/entry'
    })
  }
})
