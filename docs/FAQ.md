# Aincrok Frequently Asked Questions

## General Questions

### What is Aincrok?

Aincrok (Aincrok Is Not Cline Roo Or Kilo) is an intelligent AI coding assistant VS Code extension that helps developers with code generation, debugging, refactoring, and other programming tasks through natural language conversations.

### How is Aincrok different from other AI coding assistants?

Aincrok offers:

- Multiple AI provider support (Anthropic, OpenAI, Google, local models)
- Flexible mode system for different types of tasks
- Advanced context management and memory system
- Extensible template system
- Strong focus on privacy and customization

### Is Aincrok free to use?

Aincrok itself is free and open-source. However, you'll need API access to AI providers:

- Commercial providers (OpenAI, Anthropic) charge per token
- Local models (via Ollama) are free but require your hardware
- Some providers offer free tiers with usage limits

## Setup and Configuration

### Which AI provider should I choose?

**For best coding performance:** Anthropic Claude 3.5 Sonnet
**For cost-effectiveness:** Google Gemini Flash or local models
**For privacy:** Local models via Ollama
**For variety:** OpenRouter (access to 100+ models)

See our [PROVIDERS.md](PROVIDERS.md) guide for detailed comparisons.

### How do I set up my API keys securely?

Best practices:

1. Use environment variables: `export Aincrok_API_KEY="your-key"`
2. Store in VS Code settings (encrypted by VS Code)
3. Never commit API keys to version control
4. Use separate keys for development/production

### Can I use multiple providers simultaneously?

Yes! Aincrok supports multi-provider configurations:

```json
{
	"aincrok.providers": {
		"coding": { "provider": "anthropic", "model": "claude-3-5-sonnet-20241022" },
		"quickTasks": { "provider": "gemini", "model": "gemini-1.5-flash" }
	}
}
```

### How do I run models locally?

1. Install [Ollama](https://ollama.ai)
2. Pull a model: `ollama pull codellama:13b`
3. Configure Aincrok:

```json
{
	"aincrok.apiProvider": "ollama",
	"aincrok.model": "codellama:13b"
}
```

## Usage Questions

### How do I provide context to Aincrok?

Several ways to provide context:

- **@ mentions**: `@filename.py` to reference specific files
- **Selected text**: Highlight code before starting conversation
- **Workspace analysis**: Aincrok automatically analyzes your project
- **Memory bank**: Aincrok remembers previous conversations and learnings

### What are modes and how do I use them?

Modes are specialized configurations for different types of tasks:

- **Code**: General programming assistance
- **Debug**: Problem diagnosis and troubleshooting
- **Architect**: System design and architecture
- **Refactor**: Code improvement and optimization

Switch modes with: `Ctrl+Shift+P` → "Aincrok: Switch Mode"

### How do I create custom modes?

Create a YAML file in `.aincrok/modes/`:

```yaml
name: "Code Reviewer"
systemPrompt: "You are a senior code reviewer focusing on..."
temperature: 0.3
tools: ["readFile", "writeFile"]
```

### Can Aincrok execute terminal commands?

Yes, Aincrok can run terminal commands when appropriate:

- Always asks for confirmation before execution
- Can be configured for auto-approval of safe commands
- Supports shell integration for better context

### How does the memory bank work?

Aincrok maintains a memory bank that:

- Remembers project-specific patterns and preferences
- Learns from your coding style
- Stores architecture decisions and conventions
- Can be manually updated with custom knowledge

## Performance and Costs

### How can I reduce AI API costs?

Cost optimization strategies:

- Use cheaper models for simple tasks (e.g., Haiku for quick questions)
- Enable response caching to avoid repeat requests
- Use local models for development work
- Set monthly budget limits
- Optimize context size

### Why are responses slow?

Common causes and solutions:

- **Large context**: Reduce the number of files included
- **Complex model**: Try a faster model like Gemini Flash
- **Network issues**: Check internet connection
- **API rate limits**: Upgrade your provider plan
- **Local model**: Ensure sufficient system resources

### How much does it cost to run Aincrok?

Costs vary by provider and usage:

- **Claude 3.5 Sonnet**: ~$0.01-0.05 per conversation
- **GPT-4**: ~$0.02-0.10 per conversation
- **Gemini Flash**: ~$0.001-0.01 per conversation
- **Local models**: Hardware costs only

Typical monthly usage: $10-50 for moderate use, $50-200 for heavy use.

## Privacy and Security

### Is my code sent to AI providers?

Yes, when using cloud providers, code is sent to:

- Anthropic (for Claude models)
- OpenAI (for GPT models)
- Google (for Gemini models)

For privacy, use local models via Ollama.

### How is my data handled?

- Aincrok doesn't store your code
- AI providers may temporarily store data for processing
- Check each provider's privacy policy
- Local models keep everything on your machine

### Can I use Aincrok in enterprise environments?

Yes! Enterprise considerations:

- Use providers with enterprise agreements (Azure OpenAI, Google Cloud)
- Consider local model deployment
- Review data residency requirements
- Implement network security policies

## Troubleshooting

### Aincrok won't start or shows errors

Common solutions:

1. **Restart VS Code** - Fixes most temporary issues
2. **Check API keys** - Verify they're valid and have sufficient quota
3. **Update extension** - Ensure you have the latest version
4. **Check logs** - View Aincrok output panel for error details

### "Model not found" error

This usually means:

- Model name is misspelled
- Model not available in your region
- API key lacks access to that model
- Provider doesn't support the model

### Slow or no responses

Check:

- Internet connection
- API key validity and quota
- Provider service status
- Extension logs for errors

### File operations not working

Ensure:

- VS Code has file system permissions
- Files aren't locked by other programs
- Workspace is properly opened
- File paths are correct

## Advanced Features

### How do I create custom tools?

Aincrok supports custom tool development:

```typescript
const customTool = {
	name: "analyzePerformance",
	description: "Analyze code performance",
	execute: async (params) => {
		// Your tool logic here
		return { success: true, data: "Analysis complete" }
	},
}

api.registerTool(customTool)
```

### Can I integrate Aincrok with CI/CD?

Yes! Aincrok provides:

- REST API endpoints
- Webhook support
- Command-line interface
- GitHub Actions integration

### How do I contribute to Aincrok?

We welcome contributions:

1. Check our [GitHub repository](https://github.com/your-org/aincrok)
2. Read the contributing guidelines
3. Submit issues and pull requests
4. Join our community discussions

### Can I create my own AI provider plugin?

Yes! Aincrok supports custom provider plugins. See our [API documentation](API.md) for provider interface specifications.

## Getting Help

### Where can I get support?

- **Documentation**: Check our comprehensive docs
- **GitHub Issues**: Report bugs and feature requests
- **Community**: Join our Discord/Reddit community
- **Stack Overflow**: Tag questions with `aincrok`

### How do I report bugs?

1. Use the built-in bug reporting: `Ctrl+Shift+P` → "Aincrok: Report Bug"
2. Include error messages and logs
3. Provide steps to reproduce
4. Share your configuration (without API keys)

### How often is Aincrok updated?

We release updates regularly:

- **Patch releases**: Bug fixes, weekly
- **Minor releases**: New features, monthly
- **Major releases**: Significant changes, quarterly

### Can I request new features?

Absolutely! We prioritize features based on:

- Community requests and votes
- Implementation complexity
- Alignment with project goals
- Available development resources

Submit feature requests through GitHub Issues with the "enhancement" label.

---

Still have questions? Check our [GitHub Discussions](https://github.com/your-org/aincrok/discussions) or reach out to the community!
