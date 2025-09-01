# Aincrok Troubleshooting Guide

This guide helps you diagnose and resolve common issues with Aincrok.

## Quick Diagnostics

### 1. Check Aincrok Status

```bash
# View extension logs
Code → View → Output → Select "Aincrok" from dropdown

# Check extension version
Ctrl+Shift+P → "Aincrok: About"

# Validate configuration
Ctrl+Shift+P → "Aincrok: Validate Configuration"
```

### 2. Basic Health Check

- ✅ VS Code is up to date
- ✅ Aincrok extension is installed and enabled
- ✅ API keys are configured
- ✅ Internet connection is working
- ✅ Workspace is properly opened

## Common Issues and Solutions

## Installation Issues

### Extension won't install

**Symptoms:** Installation fails or extension doesn't appear

**Solutions:**

1. **Update VS Code**: Ensure you're running a supported version
2. **Clear extension cache**:

    ```bash
    # Windows
    rmdir /s "%USERPROFILE%\.vscode\extensions"

    # macOS/Linux
    rm -rf ~/.vscode/extensions
    ```

3. **Manual installation**: Download VSIX from marketplace and install manually
4. **Check permissions**: Ensure VS Code has write permissions to extensions folder

### Extension appears disabled

**Symptoms:** Extension installed but not active

**Solutions:**

1. **Enable extension**: Go to Extensions panel, find Aincrok, click "Enable"
2. **Reload VS Code**: `Ctrl+Shift+P` → "Developer: Reload Window"
3. **Check extension compatibility**: Verify VS Code version compatibility
4. **Conflicting extensions**: Disable other AI coding assistants temporarily

## Authentication Issues

### API Key Invalid

**Symptoms:** "Invalid API key" or "Unauthorized" errors

**Solutions:**

1. **Verify key format**:

    - Anthropic: `sk-ant-api...`
    - OpenAI: `sk-proj-...` or `sk-...`
    - Google: `AIza...`

2. **Check key permissions**: Ensure key has required model access

3. **Re-generate key**: Create new API key from provider console

4. **Environment variables**: If using env vars, check they're loaded:

    ```bash
    echo $Aincrok_API_KEY
    ```

5. **Workspace settings**: Verify key isn't overridden in workspace settings

### Rate Limit Exceeded

**Symptoms:** "Rate limit exceeded" or "Too many requests"

**Solutions:**

1. **Wait and retry**: Most rate limits reset after a few minutes
2. **Upgrade plan**: Increase your provider's rate limit tier
3. **Implement delays**: Reduce frequency of requests
4. **Switch providers**: Use alternative provider temporarily

### Billing/Quota Issues

**Symptoms:** "Insufficient credits" or "Quota exceeded"

**Solutions:**

1. **Add payment method**: Ensure valid payment method is configured
2. **Check billing**: Review usage and billing status in provider console
3. **Set budgets**: Configure spending limits to avoid surprises
4. **Monitor usage**: Track token consumption regularly

## Model and Provider Issues

### Model Not Found

**Symptoms:** "Model not available" or "Model not found"

**Solutions:**

1. **Check model name**: Verify exact model identifier

    ```json
    // Correct model names
    "claude-3-5-sonnet-20241022"  // Not "claude-3.5-sonnet"
    "gpt-4o"                       // Not "gpt-4-omni"
    "gemini-1.5-pro"              // Not "gemini-pro-1.5"
    ```

2. **Regional availability**: Some models aren't available in all regions

3. **API access**: Ensure your API key has access to the model

4. **Provider status**: Check if provider is experiencing outages

### Slow or No Responses

**Symptoms:** Long delays or timeout errors

**Solutions:**

1. **Check network connection**:

    ```bash
    # Test connectivity
    ping api.anthropic.com
    ping api.openai.com
    ```

2. **Reduce context size**:

    ```json
    {
    	"aincrok.context.maxFiles": 10,
    	"aincrok.maxTokens": 4096
    }
    ```

3. **Switch to faster model**:

    - Claude Haiku instead of Sonnet
    - Gemini Flash instead of Pro
    - GPT-3.5 instead of GPT-4

4. **Local model optimization**:
    ```json
    {
    	"aincrok.ollama.numCtx": 2048,
    	"aincrok.ollama.numThread": 8
    }
    ```

### Provider Connection Issues

**Symptoms:** "Connection failed" or "Network error"

**Solutions:**

1. **Check firewall**: Ensure AI provider domains aren't blocked
2. **Proxy settings**: Configure proxy if behind corporate firewall
3. **VPN issues**: Try disabling VPN temporarily
4. **DNS problems**: Try different DNS servers (8.8.8.8, 1.1.1.1)

## Local Model Issues (Ollama)

### Ollama Not Starting

**Symptoms:** "Connection refused" to localhost:11434

**Solutions:**

1. **Start Ollama service**:

    ```bash
    # macOS/Linux
    ollama serve

    # Windows (if installed as service)
    net start ollama
    ```

2. **Check port availability**:

    ```bash
    lsof -i :11434  # macOS/Linux
    netstat -an | findstr :11434  # Windows
    ```

3. **Verify installation**:
    ```bash
    ollama --version
    ollama list
    ```

### Model Download Issues

**Symptoms:** Model pull fails or incomplete

**Solutions:**

1. **Check disk space**: Ensure sufficient storage (models can be 4-13GB)
2. **Network stability**: Stable internet for large downloads
3. **Retry download**:
    ```bash
    ollama rm model-name
    ollama pull model-name
    ```

### Insufficient Memory

**Symptoms:** Model loads but responses are very slow/poor

**Solutions:**

1. **Check system memory**:

    ```bash
    # Recommended RAM by model size
    # 7B models: 8GB RAM
    # 13B models: 16GB RAM
    # 70B models: 64GB RAM
    ```

2. **Use smaller models**:

    ```bash
    ollama pull codellama:7b  # Instead of 13b
    ```

3. **Adjust context size**:
    ```json
    {
    	"aincrok.ollama.numCtx": 2048 // Reduce from default
    }
    ```

## VS Code Integration Issues

### Commands Not Working

**Symptoms:** Aincrok commands don't appear or fail

**Solutions:**

1. **Reload window**: `Ctrl+Shift+P` → "Developer: Reload Window"
2. **Check command palette**: Ensure commands are registered
3. **Extension activation**: Verify extension activated properly
4. **Keybinding conflicts**: Check for conflicting keyboard shortcuts

### Webview Not Loading

**Symptoms:** Chat interface doesn't appear or shows blank

**Solutions:**

1. **Clear webview cache**: Reload VS Code
2. **Check browser restrictions**: Some corporate policies block webviews
3. **Disable ad blockers**: Browser extensions might interfere
4. **Reset webview**:
    ```json
    {
    	"aincrok.webview.resetOnStart": true
    }
    ```

### File Operations Failing

**Symptoms:** Can't read/write files or execute commands

**Solutions:**

1. **Check file permissions**: Ensure files aren't read-only
2. **Workspace trust**: Mark workspace as trusted
3. **Path issues**: Use absolute paths when possible
4. **File locks**: Close files in other programs

## Performance Issues

### High CPU/Memory Usage

**Symptoms:** VS Code becomes slow or unresponsive

**Solutions:**

1. **Limit concurrent requests**:

    ```json
    {
    	"aincrok.performance.maxConcurrentRequests": 1
    }
    ```

2. **Reduce context processing**:

    ```json
    {
    	"aincrok.context.enableAutoContext": false
    }
    ```

3. **Disable unnecessary features**:
    ```json
    {
    	"aincrok.codeActions.enabled": false,
    	"aincrok.memoryBank.autoSave": false
    }
    ```

### Large Project Performance

**Symptoms:** Slow analysis of large codebases

**Solutions:**

1. **Exclude directories**:

    ```json
    {
    	"aincrok.files.excludePatterns": ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"]
    }
    ```

2. **Limit file scanning**:
    ```json
    {
    	"aincrok.files.maxFiles": 1000,
    	"aincrok.files.maxFileSize": "500KB"
    }
    ```

## Configuration Issues

### Settings Not Applying

**Symptoms:** Configuration changes don't take effect

**Solutions:**

1. **Settings location**: Check if settings are in correct file

    - User: `~/.vscode/settings.json`
    - Workspace: `.vscode/settings.json`

2. **JSON syntax**: Validate settings file syntax
3. **Reload required**: Some settings need VS Code restart
4. **Setting precedence**: Workspace settings override user settings

### Invalid Configuration

**Symptoms:** Extension fails to start with config errors

**Solutions:**

1. **Validate JSON**:

    ```bash
    # Check settings file syntax
    code ~/.vscode/settings.json
    ```

2. **Reset to defaults**:

    ```json
    {
    	"aincrok.resetToDefaults": true
    }
    ```

3. **Check required fields**: Ensure all required settings are present

## Advanced Troubleshooting

### Debug Mode

Enable detailed logging:

```json
{
	"aincrok.debug.enabled": true,
	"aincrok.debug.logLevel": "debug",
	"aincrok.debug.logToFile": true
}
```

### Extension Logs

Check detailed logs:

1. **Output Panel**: View → Output → Aincrok
2. **Developer Console**: Help → Toggle Developer Tools
3. **Log Files**: Find logs in extension storage directory

### Network Debugging

Analyze network requests:

```bash
# Monitor HTTPS traffic (macOS/Linux)
sudo tcpdump -i any -A -s 0 'host api.anthropic.com'

# Windows: Use Wireshark or Fiddler
```

### Memory Profiling

For performance issues:

1. **VS Code Performance**: Help → Report Performance Issue
2. **Extension Memory**: Use VS Code's built-in profiler
3. **System Monitor**: Watch system resource usage

## Getting Help

### Automated Bug Reports

Use built-in reporting:

```
Ctrl+Shift+P → "Aincrok: Report Bug"
```

This automatically includes:

- Extension version
- VS Code version
- Configuration (sanitized)
- Recent error logs
- System information

### Information to Include

When reporting issues, include:

1. **Environment**:

    - OS version
    - VS Code version
    - Aincrok version
    - Provider and model

2. **Configuration**:

    - Relevant settings (remove API keys)
    - Custom modes/templates
    - Extensions list

3. **Error Details**:

    - Exact error message
    - Steps to reproduce
    - Expected vs actual behavior
    - Screenshots if applicable

4. **Logs**:
    - Extension output logs
    - Console errors
    - Network errors (if applicable)

### Community Resources

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community help and tips
- **Discord/Slack**: Real-time community support
- **Stack Overflow**: Technical questions (tag: `aincrok`)

### Professional Support

For enterprise users:

- Priority support channels
- Professional services consulting
- Custom integration assistance
- Training and onboarding

---

If this guide doesn't resolve your issue, please create a detailed bug report using the built-in reporting tool or visit our [GitHub Issues](https://github.com/your-org/aincrok/issues) page.
