# AI 热量记录助手

「AI 热量记录助手」是一款基于微信小程序原生开发与微信云开发的 AI 饮食教练。用户可以用自然语言记录每天吃了什么、做了什么运动，系统通过云函数调用 AI 模型解析为结构化数据，并自动生成每日热量、营养素和运动消耗记录。

产品定位不是传统热量记录工具，而是帮助用户每天快速判断：

> 今天距离热量目标还有多远？

## 功能介绍

- 首次建档：填写基础身体信息，计算推荐热量和营养素目标。
- AI 自然语言解析：输入饮食和运动描述，AI 识别食物、份量、餐次、热量、蛋白质、脂肪、碳水和运动消耗。
- AI 解析确认：用户可在保存前修改每一项食物和运动数据。
- 今日首页：展示热量缺口、摄入、消耗、净摄入、营养素进度、AI Coach 建议和今日 Timeline。
- 历史记录：按日期查看每日饮食、运动和热量汇总。
- 统计分析：查看最近 7 天 / 30 天摄入、运动、净摄入、热量缺口和体重趋势。
- 我的页面：管理个人档案、推荐目标、AI 模型信息和数据同步状态。
- 云端记录：通过云函数按 `openid` 区分用户，每个用户每天保留一条 `daily_records` 记录。

## 页面截图

> 截图占位，后续可补充微信开发者工具或真机截图。

| 首页 Today | 历史记录 | 统计分析 | 我的页面 | AI 确认页 |
| --- | --- | --- | --- | --- |
| `docs/screenshots/today.png` | `docs/screenshots/history.png` | `docs/screenshots/statistics.png` | `docs/screenshots/profile.png` | `docs/screenshots/confirm.png` |

## 技术栈

- 前端：微信小程序原生 WXML / WXSS / JavaScript
- 后端：微信云开发
- 云函数：Node.js
- 云数据库：`users`、`daily_records`
- AI 入口：`parseDailyInput` 云函数
- AI Provider Layer：DeepSeek 已实现，OpenAI / Gemini / Claude 已预留接口
- 图表：原生 WXML / WXSS 绘制，不引入第三方图表库
- 测试：Node.js 内置测试运行器

前端不会直接调用 DeepSeek、OpenAI、Gemini 或 Claude，也不保存任何 AI Key。

## 项目结构

```text
.
├── miniprogram/
│   ├── pages/
│   │   ├── onboarding/     # 首次建档与基础目标计算
│   │   ├── today/          # 今日首页、热量缺口、AI 输入、今日记录
│   │   ├── entry/          # 完整自然语言录入页
│   │   ├── confirm/        # AI 解析确认与编辑页
│   │   ├── record/         # 历史记录页
│   │   ├── statistics/     # 趋势统计页
│   │   └── profile/        # 我的页面与个人档案
│   └── utils/              # 热量计算、记录汇总、表单和输入解析工具
├── cloudfunctions/
│   ├── userProfile/        # 用户档案保存和查询
│   ├── parseDailyInput/    # 统一 AI 解析入口和 Provider Layer
│   ├── dailyRecords/       # 每日记录保存、查询、删除和汇总
│   └── parseRecord/        # 早期 mock 目录，当前前端不再调用
├── tests/                  # 本地自动化测试
└── docs/                   # 产品规划、设计说明和 Roadmap
```

当前项目暂未启用独立 `components/` 目录。页面 UI 仍以原生页面 WXML/WXSS 组织，后续可将卡片、输入框、趋势图等抽取为公共组件。

## 微信开发方式

1. 打开微信开发者工具，选择「导入项目」。
2. 项目目录选择本仓库根目录。
3. 开发模式选择「小程序」，后端服务选择「微信云开发」。
4. 确认 `project.config.json` 中的 AppID 属于当前小程序账号。
5. 在 `miniprogram/utils/config.js` 中填写当前云开发环境 ID。
6. 点击「编译」，首次进入页面应为 `pages/onboarding/onboarding`。

## 云数据库

在云开发控制台创建以下集合：

| 集合 | 用途 | 推荐权限 |
| --- | --- | --- |
| `users` | 用户身体资料和推荐热量 | 所有用户不可读写 |
| `daily_records` | 每个用户每天一条饮食、运动与体重快照 | 所有用户不可读写 |

两个集合都由云函数通过 `openid` 访问。小程序前端不应直接读写数据库，因此请把集合权限设为「所有用户不可读写」，只允许云函数访问。

`daily_records` 使用 `_openid + date` 区分记录，`dailyRecords` 云函数会保证每位用户每天只保留一条记录，并在追加或删除条目后重新计算汇总。

## 上传云函数

在微信开发者工具的云函数目录中，依次右键并选择「上传并部署：云端安装依赖」：

1. `cloudfunctions/userProfile`
2. `cloudfunctions/parseDailyInput`
3. `cloudfunctions/dailyRecords`

`cloudfunctions/parseRecord` 是早期 mock 目录，不再被前端调用，无需上传部署。

修改任何云函数代码后，需要重新上传对应云函数；只修改 WXML、WXSS 或前端 JS 时，普通重新编译即可。

## AI 环境变量

在 `parseDailyInput` 云函数的环境变量中配置：

```text
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-v4-flash
```

可选：

```text
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

Key 只能保存在云函数环境变量中，不要写入前端、Git 仓库、截图或聊天记录。Key 一旦公开，应立即在供应商控制台撤销并重新生成。

## 真机运行方法

1. 确认云开发环境 ID、云函数和数据库集合已配置完成。
2. 在微信开发者工具中点击「编译」。
3. 点击「预览」生成二维码。
4. 使用绑定该小程序开发权限的微信扫码。
5. 真机测试以下流程：
   - 保存个人档案。
   - 在首页输入饮食和运动描述。
   - 进入 AI 解析确认页并修改数据。
   - 保存到今日记录。
   - 查看历史页和统计页。
   - 测试删除单条食物或运动记录。

本地自动化测试：

```bash
node --test
```

JS 语法检查：

```bash
find miniprogram cloudfunctions tests -name '*.js' -print0 | xargs -0 -n1 node --check
```

## 常见问题

### 页面提示云开发未连接

检查 `miniprogram/utils/config.js` 的环境 ID，并确认该环境属于当前 AppID。

### AI 解析失败

检查 `parseDailyInput` 是否已重新上传、环境变量是否生效，以及 `DEEPSEEK_MODEL` 是否为当前可用模型。可在云开发控制台查看云函数日志中的错误代码。

### 历史或统计读取失败

确认 `dailyRecords` 是最新版本，`daily_records` 集合已创建。集合可以保持「所有用户不可读写」，云函数仍可正常访问。

### 修改云函数后页面仍是旧结果

重新上传对应云函数，然后在微信开发者工具中清除缓存并重新编译。
