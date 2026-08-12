# 热量记录助手

「热量记录助手」是一款基于微信小程序原生开发与微信云开发的饮食热量记录工具。用户可以用自然语言记录每天吃了什么、做了什么运动，系统通过云函数进行智能识别，整理为可确认、可编辑、可追踪的每日健康记录。

产品目标是帮助用户快速回答：

> 今天的饮食、运动和热量目标完成得怎么样？

## 功能介绍

- 首次建档：填写基础身体信息，计算推荐热量和营养素目标。
- 智能识别：输入饮食和运动描述，识别食物、份量、餐次、热量、蛋白质、脂肪、碳水和运动消耗。
- 语音输入：录制最长 45 秒的中文饮食或运动描述，转写后可继续编辑再提交。
- 拍照识别食物：拍照或从相册选择食物图片，压缩后上传 CloudBase 临时文件，由 YT-VITA 识别单个或多个食物。
- 今日营养分析：根据当天饮食、运动和个人目标生成热量与三大营养素评价。
- 智能饮食推荐：基于剩余热量和蛋白质缺口给出可直接加入今日记录的晚餐建议。
- AI 私人营养顾问：支持围绕饮食调整、运动安排和明日计划连续咨询，并在云端保存最近对话上下文。
- 识别结果确认：用户可在保存前修改每一项食物和运动数据。
- 多食物确认：每种识别到的食物作为独立条目进入确认页，可修改名称、份量、营养数据或删除后再保存。
- 今日首页：展示热量缺口、摄入、消耗、净摄入、营养素进度、今日建议和今日 Timeline。
- 历史记录：按日期查看每日饮食、运动和热量汇总。
- 统计分析：查看最近 7 天 / 30 天摄入、运动、净摄入、热量缺口和体重趋势。
- 我的页面：管理个人档案、推荐目标、识别服务状态和数据同步状态。
- 云端记录：通过云函数按 `openid` 区分用户，每个用户每天保留一条 `daily_records` 记录。

## 页面截图

> 截图占位，后续可补充微信开发者工具或真机截图。

| 首页 Today | 营养教练 | 私人顾问 | 历史记录 | 统计分析 |
| --- | --- | --- | --- | --- |
| `docs/screenshots/today.png` | `docs/screenshots/nutrition-coach.png` | `docs/screenshots/nutrition-chat.png` | `docs/screenshots/history.png` | `docs/screenshots/statistics.png` |

## 技术栈

- 前端：微信小程序原生 WXML / WXSS / JavaScript
- 后端：微信云开发
- 云函数：Node.js
- 云数据库：`users`、`daily_records`、`nutrition_chat_records`
- 智能服务入口：`parseDailyInput`、`nutritionCoach`、`nutritionChat` 云函数
- 图表：原生 WXML / WXSS 绘制，不引入第三方图表库
- 测试：Node.js 内置测试运行器

前端不直接调用外部识别接口，也不保存任何接口密钥。

## 项目结构

```text
.
├── miniprogram/
│   ├── components/
│   │   └── daily-composer/  # 文字、语音、拍照入口和提交按钮
│   ├── pages/
│   │   ├── onboarding/     # 首次建档与基础目标计算
│   │   ├── today/          # 今日首页、热量缺口、智能输入、今日记录
│   │   ├── nutritionCoach/ # 今日营养分析、智能饮食推荐
│   │   ├── nutritionChat/  # 私人营养顾问连续对话
│   │   ├── entry/          # 完整自然语言录入页
│   │   ├── confirm/        # 识别结果确认与编辑页
│   │   ├── record/         # 历史记录页
│   │   ├── statistics/     # 趋势统计页
│   │   └── profile/        # 我的页面与个人档案
│   └── utils/              # 热量计算、记录汇总、表单和输入解析工具
├── cloudfunctions/
│   ├── userProfile/        # 用户档案保存和查询
│   ├── parseDailyInput/    # 统一智能识别入口
│   ├── speechToText/       # 一次性语音转写，不保存原始录音
│   ├── recognizeFoodImage/ # 临时图片下载、YT-VITA 识别与识别后清理
│   ├── dailyRecords/       # 每日记录保存、查询、删除和汇总
│   ├── nutritionCoach/     # 今日营养分析和智能饮食推荐
│   ├── nutritionChat/      # 私人营养顾问和聊天上下文保存
│   └── parseRecord/        # 早期 mock 目录，当前前端不再调用
├── tests/                  # 本地自动化测试
└── docs/                   # 产品规划、设计说明和 Roadmap
```

首页录入区域使用独立 `daily-composer` 原生组件，其他页面仍以页面级 WXML/WXSS 组织。

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
| `nutrition_chat_records` | 私人营养顾问的用户与助手消息 | 所有用户不可读写（`ADMINONLY`） |

以上集合均由云函数通过 `openid` 访问。小程序前端不应直接读写数据库；`nutrition_chat_records` 已使用 `ADMINONLY` 权限，聊天记录只能经 `nutritionChat` 云函数访问。

`daily_records` 使用 `_openid + date` 区分记录，`dailyRecords` 云函数会保证每位用户每天只保留一条记录，并在追加或删除条目后重新计算汇总。

## 上传云函数

在微信开发者工具的云函数目录中，依次右键并选择「上传并部署：云端安装依赖」：

1. `cloudfunctions/userProfile`
2. `cloudfunctions/parseDailyInput`
3. `cloudfunctions/speechToText`
4. `cloudfunctions/dailyRecords`
5. `cloudfunctions/nutritionCoach`
6. `cloudfunctions/nutritionChat`
7. `cloudfunctions/recognizeFoodImage`

`cloudfunctions/parseRecord` 是早期 mock 目录，不再被前端调用，无需上传部署。

修改任何云函数代码后，需要重新上传对应云函数；只修改 WXML、WXSS 或前端 JS 时，普通重新编译即可。

`recognizeFoodImage` 接收小程序上传的临时 `fileID` 和图片 MIME 类型，在云函数内读取图片并转换为识别请求所需格式。识别成功或失败后都会尝试删除临时云文件；图片不会写入 `daily_records` 或聊天记录。其环境变量 `VITA_API_KEY` 只配置在云函数环境中，模型使用 `youtu-vita`，前端不接触密钥。

## 识别服务配置

智能识别相关接口密钥只允许配置在云函数环境变量中，不要写入前端、Git 仓库、截图或聊天记录。

如密钥曾经公开，应立即在供应商控制台撤销并重新生成。

`parseDailyInput`、`nutritionCoach` 和 `nutritionChat` 均需要在各自云函数环境中配置 `DEEPSEEK_API_KEY`；营养教练与顾问当前使用 `DEEPSEEK_MODEL=deepseek-v4-flash`。生产错误仅向用户展示友好提示，云函数日志仅保留错误代码、友好说明和请求 ID。

语音转写使用 `speechToText` 云函数，并读取 CloudBase 自动注入的临时凭证：

- `TENCENTCLOUD_SECRETID`
- `TENCENTCLOUD_SECRETKEY`
- `TENCENTCLOUD_SESSIONTOKEN`
- `TENCENTCLOUD_REGION`

这些变量无需手动配置；CloudBase 也不允许自定义 `TENCENTCLOUD_*` 环境变量。

小程序只在用户主动点击麦克风后录音，转写完成后不保存原始语音。发布前还需要在微信公众平台的隐私保护指引中声明麦克风用于将饮食和运动语音转换为可编辑文字。

腾讯云账号需先开通语音识别服务，并确保云函数运行角色具备 ASR 调用权限。

## 真机运行方法

1. 确认云开发环境 ID、云函数和数据库集合已配置完成。
2. 在微信开发者工具中点击「编译」。
3. 点击「预览」生成二维码。
4. 使用绑定该小程序开发权限的微信扫码。
5. 真机测试以下流程：
   - 保存个人档案。
   - 首次点击麦克风，确认用途说明和系统授权正常。
   - 分别测试点击开始/结束、长按松开结束、上滑取消和 45 秒自动结束。
   - 确认转写文字只填入输入框，可以继续修改，且不会自动保存。
   - 在首页输入饮食和运动描述。
   - 点击相机，分别测试拍照和从相册选择；验证大图会先压缩、识别结果可编辑，且识别后不保留临时图片。
   - 进入识别结果确认页并修改数据。
   - 保存到今日记录。
   - 进入「AI营养教练」，验证今日分析、推荐加入今日记录和连续提问。
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

### 智能识别失败

检查 `parseDailyInput` 是否已重新上传、云函数环境变量是否生效。可在云开发控制台按请求 ID 查询安全日志。

### 语音转写失败

确认 `speechToText` 已使用“云端安装依赖”方式上传，并检查腾讯云 ASR 服务是否开通、三个环境变量是否配置。麦克风授权和真实录音必须使用微信真机预览验证，开发者工具模拟器只能检查页面状态。

### 历史或统计读取失败

确认 `dailyRecords` 是最新版本，`daily_records` 集合已创建。集合可以保持「所有用户不可读写」，云函数仍可正常访问。

### 修改云函数后页面仍是旧结果

重新上传对应云函数，然后在微信开发者工具中清除缓存并重新编译。
