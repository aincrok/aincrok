# AI Providers

Aincrok supports a wide range of AI model providers, allowing you to choose the best models for your specific needs and budget.

## Overview

AI providers are services that host and serve AI models through APIs. Aincrok's flexible architecture allows you to switch between different providers and models based on your requirements for cost, performance, privacy, and reliability.

## Supported Providers

### Premium Providers

- [**Aincrok**](providers/aincrok.md) - Our managed service with optimized models
- [**Anthropic**](providers/anthropic.md) - Claude models for advanced reasoning
- [**OpenAI**](providers/openai.md) - GPT models for general-purpose coding
- [**Google Gemini**](providers/gemini.md) - Gemini models for code understanding

### Cloud Providers

- [**AWS Bedrock**](providers/bedrock.md) - Enterprise-grade AI through AWS
- [**Google Vertex AI**](providers/vertex.md) - Google Cloud's AI platform
- [**OpenAI Compatible**](providers/openai-compatible.md) - Microsoft Azure OpenAI and other compatible services

### Alternative Providers

- [**OpenRouter**](providers/openrouter.md) - Access to multiple models through one API
- [**Groq**](providers/groq.md) - High-speed inference for supported models
- [**Fireworks**](providers/fireworks.md) - Fast and cost-effective model serving
- [**DeepSeek**](providers/deepseek.md) - Advanced code-focused models
- [**Mistral**](providers/mistral.md) - Open-source and commercial models
- [**xAI**](providers/xai.md) - Grok models from xAI

### Local and Self-Hosted

- [**Ollama**](providers/ollama.md) - Run models locally on your machine
- [**LM Studio**](providers/lmstudio.md) - Local model management and serving

### Specialized Services

- [**VS Code Language Models**](providers/vscode-lm.md) - Built-in VS Code AI features
- [**Human Relay**](providers/human-relay.md) - Human-in-the-loop for complex tasks
- [**Claude Code**](providers/claude-code.md) - Anthropic's specialized coding service
- [**Chutes AI**](providers/chutes-ai.md) - Specialized coding models
- [**Unbound**](providers/unbound.md) - Uncensored model access
- [**Requesty**](providers/requesty.md) - Proxy service for various providers
- [**Glama**](providers/glama.md) - Gaming and entertainment focused models
- [**v0**](providers/v0.md) - Vercel's v0 design and development AI

## Choosing a Provider

### Factors to Consider

**Cost**: Providers vary significantly in pricing per token

- **Budget-friendly**: Ollama (free, local), OpenRouter (competitive rates), Glama
- **Premium**: OpenAI, Anthropic (higher quality, higher cost)
- **Enterprise**: AWS Bedrock, Google Vertex (usage-based pricing)

**Performance**: Different models excel at different tasks

- **Code generation**: GPT-4, Claude, DeepSeek Coder, Anthropic models
- **Code understanding**: Gemini, GPT-4 Turbo, Claude
- **Fast responses**: Groq, local models, Fireworks

**Privacy**: Consider where your code is processed

- **Most private**: Local models (Ollama, LM Studio)
- **Cloud-based**: All API providers (review their privacy policies)
- **Enterprise-grade privacy**: AWS Bedrock, Google Vertex, Azure OpenAI

**Reliability**: Provider uptime and service quality

- **Enterprise-grade**: AWS Bedrock, Google Vertex, Azure OpenAI
- **Developer-focused**: OpenAI, Anthropic, Aincrok
- **Community-driven**: Ollama, OpenRouter

## Getting Started

1. **Choose a provider** based on your needs and budget
2. **Get API credentials** from your chosen provider
3. **Configure Aincrok** with your provider settings
4. **Start coding** with AI assistance

For detailed setup instructions, see [Connecting API Provider](getting-started/connecting-api-provider.md).

## Multiple Providers

You can configure multiple providers and switch between them:

- Different models for different tasks
- Fallback options for reliability
- Cost optimization strategies
- Specialized providers for specific use cases

Learn more about [API Configuration Profiles](features/api-configuration-profiles.md).

## Provider Comparison

| Provider   | Best For           | Cost       | Speed     | Privacy |
| ---------- | ------------------ | ---------- | --------- | ------- |
| Aincrok    | Managed experience | Medium     | Fast      | Cloud   |
| OpenAI     | General coding     | High       | Medium    | Cloud   |
| Anthropic  | Complex reasoning  | High       | Medium    | Cloud   |
| Ollama     | Privacy, cost      | Free       | Variable  | Local   |
| OpenRouter | Model variety      | Low-Medium | Fast      | Cloud   |
| Groq       | Speed              | Medium     | Very Fast | Cloud   |

## Need Help?

- Check the [FAQ](faq.md) for common provider questions
- Join our [Discord community](https://discord.gg/aincrok) for provider recommendations
- See provider-specific documentation pages for detailed setup instructions
- Review [API Configuration Profiles](features/api-configuration-profiles.md) for advanced configurations
