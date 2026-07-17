# speechToText

将最长 45 秒的中文普通话 MP3 录音转换为文字。云函数按当前 `openid` 接受调用，仅返回转写文本，不保存原始语音、不写入数据库，也不会在日志中输出音频或转写正文。

## 环境变量

- `TENCENTCLOUD_SECRET_ID`：腾讯云 API SecretId。
- `TENCENTCLOUD_SECRET_KEY`：腾讯云 API SecretKey。
- `TENCENTCLOUD_ASR_REGION`：ASR 请求地域，默认 `ap-shanghai`。

长期密钥只能配置在云函数环境变量中，不得写入小程序前端或 Git 仓库。建议使用仅允许调用语音识别服务的子账号密钥，并定期轮换。

## 部署

在微信开发者工具中右键 `cloudfunctions/speechToText`，选择“上传并部署：云端安装依赖”。部署后在云开发控制台配置环境变量，再用真机验证麦克风授权、录音、取消和转写流程。

## 请求限制

- 格式：MP3。
- 时长：800 毫秒至 45 秒。
- 解码后的音频大小：不超过 2 MB。
- 引擎：`16k_zh`。

