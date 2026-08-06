# AI 营养教练设计规格

## 目标

在不改动既有饮食记录、解析、保存和统计链路的前提下，为已有饮食记录的用户提供基于当天及近 7 天数据的个性化饮食建议。建议仅用于一般健康饮食参考，不构成医疗建议，也不得引导极端节食。

## 已有系统边界

- 用户资料通过 `userProfile` 云函数按 `_openid` 写入 `users` 集合；前端本地缓存键为 `calorieProfile`。
- `dailyRecords` 云函数按 `_openid + date` 读写 `daily_records`，一位用户一天一条记录。
- `parseDailyInput` 保持现状，继续只负责自然语言饮食和运动解析。
- DeepSeek 配置继续完全由云函数环境变量 `AI_PROVIDER`、`DEEPSEEK_API_KEY` 和 `DEEPSEEK_MODEL` 提供，前端不接触密钥。

## 数据与计算

### 用户资料

建议使用：`gender`、`age`、`height`、`weight`、`targetWeight`、`activityLevel`、`goal`、`targetCalories` 与 `macros`。虽然产品界面可能只展示部分字段，营养计算仍依赖完整资料。

### 当日记录

从 `daily_records` 读取：

```json
{
  "date": "2026-08-06",
  "foods": [{ "name": "鸡蛋", "amount": "2 个", "calories": 140, "protein": 12, "carbs": 1, "fat": 10 }],
  "exercises": [{ "name": "跑步", "duration": 30, "calories": 230 }],
  "targetCalories": 1506,
  "totalCaloriesIn": 1560,
  "totalCaloriesOut": 320,
  "netCalories": 1240,
  "calorieDeficit": 266,
  "totalProtein": 74,
  "totalCarbs": 160,
  "totalFat": 48,
  "weight": 62
}
```

热量缺口保持既有公式：`targetCalories + totalCaloriesOut - totalCaloriesIn`。建议服务不重新定义热量或营养素计算。

## 架构

新增独立云函数 `nutritionCoach`。前端将当天资料和汇总作为输入，同时函数以当前 `openid` 查询 `users`、当天记录与最近 7 天 `daily_records`。云端数据优先于客户端同名字段，避免过期或被篡改的客户端数据影响建议；前端字段在云端没有资料时仅作为兼容回退。

`nutritionCoach` 不写数据库、不调用 `dailyRecords`、不调用 `parseDailyInput`，只读当前用户的数据并调用 DeepSeek。它实现自己的 Prompt、响应 JSON 校验和 DeepSeek Provider 封装，环境变量及 HTTP 协议与 `parseDailyInput` 一致，避免改变现有解析函数的稳定行为。

## 云函数接口

请求：

```json
{
  "userInfo": {},
  "todayRecords": {},
  "nutritionData": {},
  "targetCalories": 1506,
  "date": "2026-08-06",
  "mode": "advice"
}
```

- `date` 缺省时使用云函数当前日期。
- `mode` 为 `advice` 或 `report`；两者都不保存结果。
- 仅在存在当日饮食记录且资料完整时请求模型。

成功响应：

```json
{
  "success": true,
  "summary": "今天整体控制良好，晚餐仍可安排高蛋白食物。",
  "nutritionAnalysis": "蛋白质距离建议上限仍有约 28g，脂肪摄入已接近建议范围。",
  "suggestions": ["晚餐优先补充蛋白质", "避免额外高油零食"],
  "dinnerRecommendation": [
    { "name": "鸡胸肉蔬菜饭", "calorie": 390, "description": "鸡胸肉、绿叶蔬菜和少量米饭" },
    { "name": "牛肉面（少油）", "calorie": 450, "description": "选择少油汤底并搭配青菜" }
  ],
  "rating": 4,
  "dailyReport": {
    "performance": "良好",
    "completion": 79,
    "strengths": ["热量控制接近目标"],
    "gaps": ["蛋白质仍可补充"],
    "note": "建议仅供日常饮食参考，不代替医疗或营养诊疗。"
  }
}
```

失败响应使用统一结构：`success: false`、`error: { code, message }`。前端只展示友好中文文案，不暴露密钥、上游响应或堆栈。

## Prompt 约束

系统角色为“专业私人营养教练”。输入必须包含用户资料、目标热量、当日三大营养素和近 7 天概览。输出只能是合法 JSON；建议应简洁、可执行、以实际记录为依据；不得做诊断、治疗承诺、夸大减脂效果或建议极端节食。晚餐方案必须不超过剩余可用热量的合理范围，并标注估算热量。

## 页面与状态

### 首页

在既有热量概览后、营养素前新增「AI 营养建议」白色 24px 圆角卡片。卡片展示今日摄入、剩余热量、模型摘要和“查看完整饮食分析”。

- 当天无食物记录：展示“记录一餐后可生成个性化建议”，点击引导现有输入框，不调模型。
- 加载：展示卡片骨架。
- 失败：展示可读错误和“重新生成”。
- 成功结果在同一当日记录版本内进行本地短暂缓存；保存或删除食物/运动后失效，下一次加载重新生成。

### 详情页

新增 `pages/nutritionCoach/nutritionCoach`，由首页跳转。

1. 今日饮食分析：今日摄入、目标、完成度、星级评价和营养分析。
2. 今日建议：自然语言摘要与可执行建议列表。
3. 晚餐推荐：两种方案、估算热量和简短组成。
4. 今日饮食报告：点击后以 `mode: report` 获取完整报告；展示表现、完成度、优点和可改进点。

页面使用现有 Apple Health 视觉系统：浅灰背景、白色卡片、24px 卡片圆角、绿色仅作积极状态强调；不改变 TabBar、输入、确认保存或记录删除流程。

## 错误与边界

- 未初始化云开发：保留本地当日数据，显示“建议服务暂不可用”。
- 无网络、超时、模型返回非 JSON：显示“暂时无法生成建议，请稍后重试”。
- 当天无食物：不调用模型；运动记录单独存在也不生成饮食建议。
- 资料不完整：提示前往资料页补全必要资料。
- DeepSeek Key 缺失或 Provider 不支持：云函数返回受控错误，前端不展示配置细节。
- 没有历史记录：仍可基于当天生成建议，并在 Prompt 中明确“历史数据不足”。

## 文件边界

- 修改：`miniprogram/app.json`、`miniprogram/pages/today/today.js`、`today.wxml`、`today.wxss`。
- 新增：`miniprogram/pages/nutritionCoach/nutritionCoach.{js,json,wxml,wxss}`。
- 新增：`cloudfunctions/nutritionCoach/{index.js,handler.js,prompt.js,provider-deepseek.js,http.js,schema.js,errors.js,repository.js,package.json}`。
- 新增：营养教练 Prompt、Handler、Provider、首页状态、详情页状态的 Node 原生测试。
- 不修改：`cloudfunctions/parseDailyInput/**`、`cloudfunctions/dailyRecords/**`、`cloudfunctions/userProfile/**` 的现有行为和云数据库结构。

## 验收标准

1. 有当日食物记录和完整资料时，首页与详情页可获得严格 JSON 的建议。
2. 保存或删除一条记录后，旧建议缓存失效，建议随最新总量更新。
3. 建议仅访问当前 `openid` 的资料和近 7 天记录。
4. 无记录、缺资料、网络失败和模型失败均有可恢复界面状态。
5. 原有文本识别、语音输入、确认保存、历史与统计测试保持通过。
6. 微信开发者工具普通编译、模拟器和真机均能从首页打开详情页，并能通过真实饮食记录验证建议结果。
