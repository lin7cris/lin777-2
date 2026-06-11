# parseDailyInput

The mini program calls this cloud function as its only AI parsing entry point.

## Environment variables

- `AI_PROVIDER`: provider name. Defaults to `deepseek`.
- `DEEPSEEK_API_KEY`: required when `AI_PROVIDER=deepseek`.
- `DEEPSEEK_BASE_URL`: optional. Defaults to `https://api.deepseek.com`.

The DeepSeek provider uses `deepseek-v4-flash`. API keys must be configured in the cloud-function environment and must never be added to mini-program code or committed files.

Reserved provider names are `openai`, `gemini`, and `claude`. They currently return `PROVIDER_NOT_IMPLEMENTED` through the standard friendly error contract.
