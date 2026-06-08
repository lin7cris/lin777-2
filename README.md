# AI热量记录助手

微信小程序云开发项目，用于记录每日饮食摄入、运动消耗，并通过 AI/云函数把自然语言记录整理为结构化热量数据。

## 项目设置

- 开发模式：小程序
- 后端服务：微信云开发
- 语言：JavaScript
- 小程序根目录：`miniprogram/`
- 云函数根目录：`cloudfunctions/`

## 打开方式

1. 打开微信开发者工具。
2. 选择「导入项目」。
3. 项目目录选择本目录。
4. 将 `project.config.json` 中的 `appid` 从 `touristappid` 替换为你的真实 AppID。
5. 在 `miniprogram/utils/config.js` 中填写云环境 ID。
6. 上传并部署 `cloudfunctions/parseRecord` 云函数。

## 页面

- `pages/onboarding`：首次建档与推荐热量
- `pages/today`：今日热量总览
- `pages/entry`：自然语言录入
- `pages/confirm`：AI 解析确认
- `pages/record`：统计记录
- `pages/profile`：我的设置
