# LLM Provider Setup Guide

Aincrok supports multiple AI providers to give you flexibility in choosing the best model for your needs. This guide covers setup instructions for all supported providers.

## Provider Overview

| Provider       | Models Available         | Strengths                          | Setup Difficulty |
| -------------- | ------------------------ | ---------------------------------- | ---------------- |
| Anthropic      | Claude 3.5 Sonnet, Haiku | Code generation, reasoning         | Easy             |
| OpenAI         | GPT-4o, GPT-4, GPT-3.5   | General purpose, fast              | Easy             |
| Google         | Gemini Pro, Gemini Flash | Multimodal, cost-effective         | Medium           |
| Local (Ollama) | CodeLlama, Mistral, etc. | Privacy, no API costs              | Medium           |
| OpenRouter     | 100+ models              | Model variety, competitive pricing | Easy             |

## Anthropic (Claude)

Claude models are excellent for code generation and complex reasoning tasks.

### Setup Steps

1. Visit [Anthropic Console](https://console.anthropic.com)
2. Create an account or sign in
3. Generate an API key
4. Configure in Aincrok:

```json
{
	"aincrok.apiProvider": "anthropic",
	"aincrok.anthropicApiKey": "sk-ant-api...",
	"aincrok.model": "claude-3-5-sonnet-20241022"
}
```

### Available Models

- `claude-3-5-sonnet-20241022` - Best for complex coding tasks
- `claude-3-5-haiku-20241022` - Fast, cost-effective option
- `claude-3-opus-20240229` - Maximum capability (higher cost)

### Cost Information

- Sonnet: $3/1M input, $15/1M output tokens
- Haiku: $0.25/1M input, $1.25/1M output tokens
- Opus: $15/1M input, $75/1M output tokens

### Advanced Configuration

```json
{
	"aincrok.anthropic.baseUrl": "https://api.anthropic.com",
	"aincrok.anthropic.maxRetries": 3,
	"aincrok.anthropic.timeout": 60000,
	"aincrok.anthropic.enableCaching": true
}
```

## OpenAI

OpenAI models provide excellent general-purpose AI capabilities.

### Setup Steps

1. Visit [OpenAI Platform](https://platform.openai.com)
2. Create account and add payment method
3. Generate API key from API Keys section
4. Configure in Aincrok:

```json
{
	"aincrok.apiProvider": "openai",
	"aincrok.openaiApiKey": "sk-proj-...",
	"aincrok.model": "gpt-4o"
}
```

### Available Models

- `gpt-4o` - Latest multimodal model
- `gpt-4-turbo` - High performance, large context
- `gpt-4` - Reliable, proven model
- `gpt-3.5-turbo` - Fast, cost-effective

### Organization Setup

For team usage:

```json
{
	"aincrok.openai.organization": "org-...",
	"aincrok.openai.project": "proj_..."
}
```

### Azure OpenAI

```json
{
	"aincrok.apiProvider": "azure-openai",
	"aincrok.azureOpenai.apiKey": "your-azure-key",
	"aincrok.azureOpenai.endpoint": "https://your-resource.openai.azure.com",
	"aincrok.azureOpenai.deploymentName": "gpt-4"
}
```

## Google (Gemini)

Google's Gemini models offer strong performance at competitive prices.

### Setup Steps

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Create or select a project
3. Generate API key
4. Configure in Aincrok:

```json
{
	"aincrok.apiProvider": "gemini",
	"aincrok.geminiApiKey": "AIza...",
	"aincrok.model": "gemini-1.5-pro"
}
```

### Available Models

- `gemini-1.5-pro` - Best overall performance
- `gemini-1.5-flash` - Fast, cost-effective
- `gemini-1.0-pro` - Stable, reliable

### Vertex AI Setup

For enterprise use:

```json
{
	"aincrok.apiProvider": "vertex",
	"aincrok.vertex.projectId": "your-project-id",
	"aincrok.vertex.location": "us-central1",
	"aincrok.vertex.credentials": "/path/to/service-account.json"
}
```

## Local Models (Ollama)

Run models locally for privacy and cost savings.

### Setup Steps

1. Install [Ollama](https://ollama.ai)
2. Pull a model: `ollama pull codellama:13b`
3. Configure Aincrok:

```json
{
	"aincrok.apiProvider": "ollama",
	"aincrok.ollama.baseUrl": "http://localhost:11434",
	"aincrok.model": "codellama:13b"
}
```

### Recommended Models

#### For Coding

- `codellama:13b` - Meta's code-focused model
- `deepseek-coder:6.7b` - Excellent code generation
- `starcoder2:15b` - Strong code understanding

#### For General Use

- `mixtral:8x7b` - High performance mixture model
- `llama3.1:8b` - Latest Llama model
- `qwen2.5-coder:7b` - Alibaba's coding model

### Performance Tuning

```json
{
	"aincrok.ollama.numCtx": 8192,
	"aincrok.ollama.temperature": 0.1,
	"aincrok.ollama.topP": 0.9,
	"aincrok.ollama.repeatPenalty": 1.1
}
```

## OpenRouter

Access 100+ models through a single API.

### Setup Steps

1. Visit [OpenRouter](https://openrouter.ai)
2. Create account and add credits
3. Generate API key
4. Configure Aincrok:

```json
{
	"aincrok.apiProvider": "openrouter",
	"aincrok.openrouterApiKey": "sk-or-v1-...",
	"aincrok.model": "anthropic/claude-3.5-sonnet"
}
```

### Popular Models

- `anthropic/claude-3.5-sonnet` - Claude via OpenRouter
- `openai/gpt-4o` - GPT-4o via OpenRouter
- `google/gemini-pro-1.5` - Gemini via OpenRouter
- `meta-llama/llama-3.1-405b` - Largest Llama model

### Cost Tracking

```json
{
	"aincrok.openrouter.enableCreditsTracking": true,
	"aincrok.openrouter.monthlyBudget": 100
}
```

## Other Providers

### Groq (Fast Inference)

```json
{
	"aincrok.apiProvider": "groq",
	"aincrok.groqApiKey": "gsk_...",
	"aincrok.model": "llama3-70b-8192"
}
```

### Mistral AI

```json
{
	"aincrok.apiProvider": "mistral",
	"aincrok.mistralApiKey": "...",
	"aincrok.model": "mistral-large-latest"
}
```

### Fireworks AI

```json
{
	"aincrok.apiProvider": "fireworks",
	"aincrok.fireworksApiKey": "...",
	"aincrok.model": "accounts/fireworks/models/mixtral-8x22b"
}
```

### xAI (Grok)

```json
{
	"aincrok.apiProvider": "xai",
	"aincrok.xaiApiKey": "xai-...",
	"aincrok.model": "grok-beta"
}
```

## Provider Comparison

### For Code Generation

1. **Claude 3.5 Sonnet** - Best overall for complex coding
2. **GPT-4o** - Great general coding capabilities
3. **CodeLlama 13B** - Best local option
4. **Gemini 1.5 Pro** - Good balance of cost/performance

### For Fast Responses

1. **Claude 3.5 Haiku** - Fastest commercial option
2. **Gemini 1.5 Flash** - Very fast, good quality
3. **Groq models** - Extremely fast inference
4. **Local small models** - No network latency

### For Cost Efficiency

1. **Local models** - No per-token costs
2. **Gemini Flash** - Cheapest commercial option
3. **Claude Haiku** - Good performance/cost ratio
4. **OpenRouter** - Competitive pricing

## Multi-Provider Setup

Use different providers for different tasks:

```json
{
	"aincrok.providers": {
		"coding": {
			"provider": "anthropic",
			"model": "claude-3-5-sonnet-20241022"
		},
		"quickTasks": {
			"provider": "gemini",
			"model": "gemini-1.5-flash"
		},
		"local": {
			"provider": "ollama",
			"model": "codellama:13b"
		}
	}
}
```

## Security Best Practices

### API Key Management

- Use environment variables for API keys
- Rotate keys regularly
- Never commit keys to version control
- Use separate keys for development/production

### Network Security

- Use HTTPS endpoints only
- Configure firewalls for local models
- Monitor API usage for anomalies

### Data Privacy

- Review provider data retention policies
- Use local models for sensitive code
- Enable conversation encryption when available

## Troubleshooting

### Common Issues

**API Key Invalid**

- Check key format and permissions
- Verify billing is set up
- Test key with provider's direct API

**Rate Limits**

- Check provider rate limits
- Implement exponential backoff
- Consider upgrading tier

**Model Not Found**

- Verify model name spelling
- Check model availability in region
- Update to latest model versions

**Local Model Issues**

- Ensure Ollama is running
- Check model is downloaded
- Verify sufficient system memory

### Performance Issues

**Slow Responses**

- Try smaller/faster models
- Reduce context window size
- Use regional endpoints when available

**High Costs**

- Monitor token usage
- Use cheaper models for simple tasks
- Enable response caching

---

For specific configuration examples, see [CONFIGURATION.md](CONFIGURATION.md). For troubleshooting, check [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
