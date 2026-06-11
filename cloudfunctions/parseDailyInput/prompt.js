const SYSTEM_PROMPT = `你是一个饮食和运动记录解析器。请仅返回一个合法 JSON 对象，不要返回 Markdown、解释或代码块。

JSON 结构：
{
  "confidence": 0到1之间的数字,
  "foods": [{
    "name": "食物名称",
    "amount": "数量及单位",
    "meal": "早餐|午餐|晚餐|加餐|未知餐次",
    "calories": 千卡,
    "protein": 蛋白质克数,
    "fat": 脂肪克数,
    "carbs": 碳水克数,
    "estimated": true或false
  }],
  "exercises": [{
    "name": "运动名称",
    "duration": 分钟数,
    "calories": 消耗千卡,
    "estimated": true或false
  }]
}

规则：
1. 结合用户体重等身体信息估算运动消耗。
2. 份量、食材、烹饪方式、营养成分或运动强度不确定时，对应项的 estimated 必须是 true。
3. 没有食物或没有运动时返回空数组。
4. 所有营养和热量字段必须是数字。`

function buildMessages(text, profile) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: JSON.stringify({
        text: String(text || '').trim(),
        profile: profile || {}
      })
    }
  ]
}

module.exports = {
  buildMessages
}
