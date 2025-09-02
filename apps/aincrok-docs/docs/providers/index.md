# AI Providers

Aincrok supports a wide range of AI model providers, allowing you to choose the best models for your specific needs and budget.

## Overview

AI providers are services that host and serve AI models through APIs. Aincrok's flexible architecture allows you to switch between different providers and models based on your requirements.

## Supported Providers

### Premium Providers

- [**Aincrok**](./aincrok.md) - Our managed service with optimized models
- [**Anthropic**](./anthropic.md) - Claude models for advanced reasoning
- [**OpenAI**](./openai.md) - GPT models for general-purpose coding
- [**Google Gemini**](./gemini.md) - Gemini models for code understanding

### Cloud Providers

- [**AWS Bedrock**](./bedrock.md) - Enterprise-grade AI through AWS
- [**Google Vertex AI**](./vertex.md) - Google Cloud's AI platform
- [**Azure OpenAI**](./openai-compatible.md) - Microsoft's OpenAI service

### Alternative Providers

- [**OpenRouter**](./openrouter.md) - Access to multiple models through one API
- [**Groq**](./groq.md) - High-speed inference for supported models
- [**Fireworks**](./fireworks.md) - Fast and cost-effective model serving
- [**DeepSeek**](./deepseek.md) - Advanced code-focused models
- [**Mistral**](./mistral.md) - Open-source and commercial models

### Local and Self-Hosted

- [**Ollama**](./ollama.md) - Run models locally on your machine
- [**LM Studio**](./lmstudio.md) - Local model management and serving
- [**OpenAI Compatible**](./openai-compatible.md) - Any OpenAI-compatible API

### Specialized Services

- [**VS Code Language Models**](./vscode-lm.md) - Built-in VS Code AI features
- [**Human Relay**](./human-relay.md) - Human-in-the-loop for complex tasks
- [**Chutes AI**](./chutes-ai.md) - Specialized coding models
- [**Unbound**](./unbound.md) - Uncensored model access
- [**Requesty**](./requesty.md) - Proxy service for various providers

## Choosing a Provider

### Factors to Consider

**Cost**: Providers vary significantly in pricing per token

- **Budget-friendly**: Ollama (free, local), OpenRouter (competitive rates)
- **Premium**: OpenAI, Anthropic (higher quality, higher cost)

**Performance**: Different models excel at different tasks

- **Code generation**: GPT-4, Claude, DeepSeek Coder
- **Code understanding**: Gemini, GPT-4 Turbo
- **Fast responses**: Groq, local models

**Privacy**: Consider where your code is processed

- **Most private**: Local models (Ollama, LM Studio)
- **Cloud-based**: All API providers (review their privacy policies)

**Reliability**: Provider uptime and service quality

- **Enterprise-grade**: AWS Bedrock, Google Vertex, Azure OpenAI
- **Developer-focused**: OpenAI, Anthropic, Aincrok

## Getting Started

1. **Choose a provider** based on your needs and budget
2. **Get API credentials** from your chosen provider
3. **Configure Aincrok** with your provider settings
4. **Start coding** with AI assistance

For detailed setup instructions, see [Connecting API Provider](../getting-started/connecting-api-provider.md).

## Multiple Providers

You can configure multiple providers and switch between them:

- Different models for different tasks
- Fallback options for reliability
- Cost optimization strategies

Learn more about [API Configuration Profiles](../features/api-configuration-profiles.md).

## Need Help?

- Check the [FAQ](../faq.md) for common provider questions
- Join our [Discord community](https://discord.gg/aincrok) for provider recommendations
- See [Troubleshooting](../troubleshooting.md) for connection issues
