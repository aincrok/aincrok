# AINCROK Configuration Guide

This guide covers all configuration options available in AINCROK to customize your AI coding assistant experience.

## Settings Overview

AINCROK settings can be configured through VS Code settings UI or by editing your `settings.json` file directly.

## Core Configuration

### API Provider Settings

```json
{
  "aincrok.apiProvider": "anthropic",
  "aincrok.anthropicApiKey": "your-api-key",
  "aincrok.model": "claude-3-5-sonnet-20241022"
}
```

### Model Configuration

```json
{
  "aincrok.temperature": 0.7,
  "aincrok.maxTokens": 4096,
  "aincrok.contextWindow": 200000,
  "aincrok.enableCaching": true
}
```

## Interface Settings

### Chat Interface

```json
{
  "aincrok.ui.theme": "auto",
  "aincrok.ui.fontSize": 14,
  "aincrok.ui.showLineNumbers": true,
  "aincrok.ui.enableMarkdownPreview": true
}
```

### Auto-approval

```json
{
  "aincrok.autoApproval.enabled": false,
  "aincrok.autoApproval.allowedCommands": [
    "npm install",
    "git status"
  ],
  "aincrok.autoApproval.maxFileSize": 100000
}
```

## Feature Configuration

### Code Actions

```json
{
  "aincrok.codeActions.enabled": true,
  "aincrok.codeActions.showInlineButtons": true,
  "aincrok.codeActions.enableGhost": false
}
```

### Terminal Integration

```json
{
  "aincrok.terminal.enabled": true,
  "aincrok.terminal.shell": "auto",
  "aincrok.terminal.workingDirectory": "${workspaceFolder}"
}
```

### File Operations

```json
{
  "aincrok.files.maxFileSize": "1MB",
  "aincrok.files.excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**"
  ],
  "aincrok.files.enableBinaryFiles": false
}
```

## Mode Configuration

### Default Modes

```json
{
  "aincrok.modes.default": "code",
  "aincrok.modes.available": [
    "code",
    "architect",
    "debug",
    "refactor"
  ]
}
```

### Custom Modes

Create custom modes for specific use cases:

```json
{
  "aincrok.customModes": {
    "reviewer": {
      "name": "Code Review",
      "systemPrompt": "You are a code reviewer...",
      "temperature": 0.3,
      "tools": ["readFile", "writeFile"]
    }
  }
}
```

## Advanced Configuration

### Memory Bank

```json
{
  "aincrok.memoryBank.enabled": true,
  "aincrok.memoryBank.maxEntries": 1000,
  "aincrok.memoryBank.autoSave": true
}
```

### Context Management

```json
{
  "aincrok.context.maxFiles": 50,
  "aincrok.context.enableAutoContext": true,
  "aincrok.context.similarityThreshold": 0.7
}
```

### Caching

```json
{
  "aincrok.caching.enabled": true,
  "aincrok.caching.ttl": 3600,
  "aincrok.caching.maxSize": "100MB"
}
```

## Provider-Specific Settings

### Anthropic

```json
{
  "aincrok.anthropic.apiKey": "your-api-key",
  "aincrok.anthropic.baseUrl": "https://api.anthropic.com",
  "aincrok.anthropic.enableCaching": true
}
```

### OpenAI

```json
{
  "aincrok.openai.apiKey": "your-api-key",
  "aincrok.openai.organization": "your-org-id",
  "aincrok.openai.baseUrl": "https://api.openai.com/v1"
}
```

### Local Models (Ollama)

```json
{
  "aincrok.ollama.baseUrl": "http://localhost:11434",
  "aincrok.ollama.model": "codellama:latest",
  "aincrok.ollama.timeout": 30000
}
```

## Environment Variables

You can also configure AINCROK using environment variables:

```bash
export AINCROK_API_KEY="your-api-key"
export AINCROK_MODEL="claude-3-5-sonnet-20241022"
export AINCROK_TEMPERATURE="0.7"
```

## Workspace-Specific Configuration

Create `.vscode/settings.json` in your project root for workspace-specific settings:

```json
{
  "aincrok.model": "gpt-4",
  "aincrok.temperature": 0.3,
  "aincrok.customInstructions": "This is a React project using TypeScript..."
}
```

## Configuration Profiles

Save and switch between different configuration profiles:

```json
{
  "aincrok.profiles": {
    "development": {
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.7
    },
    "production": {
      "model": "gpt-4",
      "temperature": 0.3
    }
  }
}
```

## Security Considerations

- Store API keys in secure locations
- Use environment variables for sensitive data
- Enable rate limiting to control costs
- Review auto-approval settings carefully

## Performance Tuning

### For Large Projects
- Reduce context window size
- Limit file inclusion patterns
- Enable caching
- Use faster models for simple tasks

### For Better Accuracy
- Increase temperature for creative tasks
- Use larger context windows
- Enable memory bank
- Provide detailed custom instructions

## Troubleshooting Configuration

1. **Settings not applying**: Reload VS Code after changing settings
2. **API key issues**: Verify key format and permissions
3. **Model not found**: Check provider compatibility
4. **Performance issues**: Review context and caching settings

---

For more information, see [PROVIDERS.md](PROVIDERS.md) for provider-specific setup or [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.