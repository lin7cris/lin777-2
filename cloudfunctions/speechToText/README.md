# speechToText

将最长 45 秒的中文普通话 MP3 录音转换为文字。云函数按当前 `openid` 接受调用，仅返回转写文本，不保存原始语音、不写入数据库，也不会在日志中输出音频或转写正文。

## 运行凭证

- `TENCENTCLOUD_SECRETID`：CloudBase 自动注入的临时 SecretId。
- `TENCENTCLOUD_SECRETKEY`：CloudBase 自动注入的临时 SecretKey。
- `TENCENTCLOUD_SESSIONTOKEN`：CloudBase 自动注入的临时 SessionToken。
- `TENCENTCLOUD_REGION`：CloudBase 自动注入的运行地域。

上述变量由 CloudBase 运行时提供，不需要也不允许手动配置 `TENCENTCLOUD_*` 环境变量。永久密钥不得写入小程序前端、云函数代码或 Git 仓库。

## 部署

在微信开发者工具中右键 `cloudfunctions/speechToText`，选择“上传并部署：云端安装依赖”。部署后直接用真机验证麦克风授权、录音、取消和转写流程。

## 请求限制

- 格式：MP3。
- 时长：800 毫秒至 45 秒。
- 解码后的音频大小：不超过 2 MB。
- 引擎：`16k_zh`。
