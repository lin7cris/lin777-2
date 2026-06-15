# AI热量记录助手

基于微信小程序原生开发与微信云开发的饮食、运动和热量记录工具。用户可以用自然语言描述每日饮食与运动，由云函数调用 AI 模型解析为结构化数据，再确认保存到个人每日记录。

## 技术结构

- 前端：原生 WXML / WXSS / JavaScript
- 后端：微信云函数与云数据库
- 小程序目录：`miniprogram/`
- 云函数目录：`cloudfunctions/`
- AI 入口：`parseDailyInput`
- 用户资料：`userProfile`
- 每日记录：`dailyRecords`

前端不会直接调用 DeepSeek、OpenAI、Gemini 或 Claude，也不保存任何 AI Key。

## 导入项目

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
DEEPSEEK_API_KEY=你的新 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-chat
```

可选：

```text
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

Key 只能保存在云函数环境变量中，不要写入前端、Git 仓库、截图或聊天记录。Key 一旦公开，应立即在供应商控制台撤销并重新生成。

项目已预留 OpenAI、Gemini 和 Claude Provider 接口，但当前只完整实现 DeepSeek。

## 页面说明

- `pages/onboarding`：首次建档与热量目标计算
- `pages/today`：今日热量、营养进度、记录列表与 AI 快速输入
- `pages/entry`：完整自然语言输入
- `pages/confirm`：查看和编辑 AI 解析结果并保存
- `pages/record`：按日期查看历史饮食和运动
- `pages/statistics`：最近 7 天 / 30 天趋势
- `pages/profile`：修改身体资料与查看推荐目标

页面统一采用 iOS 高级简约风格，包含加载、空数据、网络失败和 AI 失败状态，并针对常见手机宽度适配。

## 功能测试

完成云端配置后，按以下顺序测试：

1. 在首次建档页填写资料并保存。
2. 在今日页输入一段同时包含饮食和运动的自然语言。
3. 点击「AI 解析」，确认结果与原始描述一致。
4. 在确认页修改份量、热量或营养数据并保存。
5. 回到今日页确认汇总和记录已更新。
6. 删除一条饮食或运动，确认出现二次确认且汇总重新计算。
7. 在历史页切换日期。
8. 在统计页切换 7 天和 30 天。
9. 断开网络或临时使用错误 AI 配置，确认页面显示失败提示和重试入口。

本地自动化测试：

```bash
node --test
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
