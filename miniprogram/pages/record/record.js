Page({
  data: {
    bars: [
      { day: '一', height: 180 },
      { day: '二', height: 236 },
      { day: '三', height: 144 },
      { day: '四', height: 208 },
      { day: '五', height: 264 },
      { day: '六', height: 192 },
      { day: '日', height: 164, active: true }
    ],
    days: [
      { date: '今天', net: '净摄入 1280 kcal', delta: '低于目标 260' },
      { date: '昨天', net: '净摄入 1510 kcal', delta: '接近目标' },
      { date: '6 月 6 日', net: '净摄入 1740 kcal', delta: '高于目标 200', warning: true }
    ]
  }
})
