# Troubleshooting

This guide helps you solve common issues when using Aincrok.

## Common Issues

### Installation Problems

**Extension not appearing in VS Code**

- Refresh VS Code extensions marketplace
- Try restarting VS Code
- Check if your VS Code version is supported

**Extension installed but not working**

- Ensure you have configured an AI provider
- Check the VS Code Output panel for error messages
- Verify your API keys are correct

### Provider Configuration Issues

**API key not working**

- Verify the API key is correct and has the right permissions
- Check if you have sufficient credits/quota with your provider
- Ensure the API key hasn't expired

**Models not responding**

- Check your internet connection
- Verify provider service status
- Try switching to a different model or provider

### Performance Issues

**Slow responses**

- Check your network connection
- Try using a faster model
- Consider using local models for better performance
- Reduce context size if working with large files

**High token usage**

- Use more specific prompts
- Disable MCP if not needed
- Choose smaller models for simple tasks
- Break large tasks into smaller chunks

### File Operation Issues

**Files not being read correctly**

- Check file permissions
- Ensure files are saved before processing
- Verify file paths are correct

**Changes not being applied**

- Review and approve suggested changes
- Check if files are locked by other processes
- Ensure you have write permissions

## Getting Help

### Check Logs

1. Open VS Code Output panel (`View > Output`)
2. Select "Aincrok" from the dropdown
3. Look for error messages or warnings

### Community Support

- Join our [Discord community](https://discord.gg/aincrok) for real-time help
- Check [GitHub Issues](https://github.com/aincrok/aincrok/issues) for known problems
- Visit our [FAQ](faq.md) for common questions

### Reporting Issues

When reporting issues, please include:

- VS Code version
- Aincrok extension version
- Operating system
- Error messages from the Output panel
- Steps to reproduce the problem

## Advanced Troubleshooting

### Reset Configuration

If you're experiencing persistent issues, try resetting your configuration:

1. Open VS Code Settings
2. Search for "Aincrok"
3. Reset settings to defaults
4. Reconfigure your providers

### Clean Reinstall

For severe issues, try a clean reinstall:

1. Uninstall the Aincrok extension
2. Restart VS Code
3. Clear extension data (if needed)
4. Reinstall the latest version
5. Reconfigure from scratch

### Debug Mode

Enable debug mode for detailed logging:

1. Open Aincrok settings
2. Enable "Debug Mode"
3. Reproduce the issue
4. Check the enhanced logs in Output panel

## Known Issues

### Platform-Specific Issues

**Windows**

- Some antivirus software may interfere with extension operations
- Windows Defender exclusions may be needed

**macOS**

- Gatekeeper may block certain operations
- Check Security & Privacy settings if needed

**Linux**

- Ensure proper file permissions are set
- Some distributions may need additional dependencies

### Provider-Specific Issues

**OpenAI**

- Rate limits may cause temporary slowdowns
- Check usage limits in your OpenAI dashboard

**Local Models (Ollama)**

- Ensure Ollama service is running
- Verify model is downloaded and available
- Check system resources (RAM, CPU)

For issues not covered here, please reach out to our community or create a GitHub issue with detailed information about your problem.
