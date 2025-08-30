# AINCROK - AI Code Assistant for VS Code

<div align="center">
  <img src="readme-banner.svg" alt="AINCROK Banner" width="600">
</div>
> AINCROK Is Not Cline Roo Or Kilo
[![Version](https://img.shields.io/visual-studio-marketplace/v/aincrok.aincrok)](https://marketplace.visualstudio.com/items?itemName=aincrok.aincrok)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/aincrok.aincrok)](https://marketplace.visualstudio.com/items?itemName=aincrok.aincrok)
[![License](https://img.shields.io/github/license/aincrok/aincrok)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/aincrok/aincrok)](https://github.com/aincrok/aincrok)
## 🚀 Overview
AINCROK is a powerful AI-powered code assistant for Visual Studio Code, forked from Kilocode with significant enhancements. It provides intelligent code completion, multi-file editing, and seamless integration with various LLM providers.

## 💡 Why Choose AINCROK?

In a landscape filled with AI coding assistants like Kilo Code, Roo Code, and Cline, developers often face frustrating issues: excessive token consumption leading to high costs, subtle bugs and hallucinations in generated code, non-deterministic outputs, poor handling of complex problems, unintended codebase bloat, inefficient context management in large or legacy projects, and instability in agentic workflows (e.g., ignoring linter errors, creating duplicate files, or failing on tool calls).

AINCROK stands out by prioritizing **cost-effectiveness**, **stability**, and **efficiency**. Built with disruptive features inspired by community feedback and best practices (like the 12-factor agents), it reduces token waste through precise LSP integrations, persistent memory layers, and optimized API calls. Unlike competitors that add unnecessary code or hallucinate non-existent functions, AINCROK ensures reliable, targeted edits, better context awareness, and human-in-the-loop safeguards to minimize technical debt and errors. Whether you're a solo developer or managing large codebases, AINCROK empowers you to code smarter, faster, and cheaper—without the headaches.

Join thousands of adopters who are ditching bloated, unreliable tools for a more robust alternative. Star us on GitHub and see the difference!

## ✨ Features

- 🤖 **Multi-Provider Support**: OpenAI, Anthropic, Google, and more
- 📝 **Autonomous Multi-File Editing**: Edit multiple files simultaneously
- 💬 **Persistent Conversation History**: Never lose your coding context
- 🎨 **Intuitive WebView Interface**: Modern, responsive UI within VS Code
- 🚀 **Template System**: Customizable prompts and workflows
- 💻 **Terminal Integration**: Execute commands directly from conversations
- 🔧 **Highly Configurable**: Adapt to your workflow

### 🚧 Coming Soon

We're rapidly evolving AINCROK with features designed to address common pain points in agentic coding. These will further enhance cost savings, precision, and usability:

- **LSP Integration**: Precise file operations and symbol-level edits to eliminate incorrect discoveries and reduce token usage by up to 70%.
- **Memory Layer & Knowledge Base**: Multi-level persistent memory for context-aware sessions, minimizing repeated API calls and hallucinations.
- **API Call Optimization**: Batching, local fallbacks, and throttling to cut costs by 30-50%.
- **Advanced Prompt Caching**: Reuse responses for faster, cheaper interactions.
- **Hassle-Free System Prompt Customization**: Easy editing with auto-included tool manuals—no more warnings or manual setups.
- **Remote Control & Monitoring**: Pause, resume, and oversee agents from your smartphone while multitasking.
- **Enhanced Stability**: Robust error handling, retries, and logging to outperform competitors in reliability.
- **Improved Multi-Agent & Subtask System**: Bug-free hierarchies with pausable subtasks that retain parent references.
- **Precise Edits Mode**: Avoid unintended changes and whole-file rewrites using targeted LSP diffs.
- **Efficient Context for Large Codebases**: RAG-like retrieval and vector stores to handle massive projects without token bloat.
- **Human-in-the-Loop Tools**: Flag uncertainties, pause for approvals, and integrate notifications for safer workflows.

Stay tuned—these features are in active development and will roll out soon to make AINCROK the go-to choice for efficient AI-assisted coding!

## 📦 Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P`
3. Type `ext install aincrok.aincrok`

### From Source

```bash
git clone https://github.com/aincrok/aincrok.git
cd aincrok
npm install
npm run compile
```

## 🔧 Configuration

See [Configuration Guide](docs/CONFIGURATION.md) for detailed setup instructions.

## 📖 Documentation

- [Getting Started](docs/GETTING_STARTED.md)
- [Configuration Guide](docs/CONFIGURATION.md)
- [API Reference](docs/API.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

Apache 2.0 - See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

AINCROK is built upon the excellent foundation of:

- [Kilocode](https://github.com/Kilo-Org/kilocode) - Original codebase
- [Cline](https://github.com/cline/cline)
- [Roo Code](https://github.com/RooCodeInc/Roo-Code)

## 📬 Support

- [GitHub Issues](https://github.com/aincrok/aincrok/issues)
- [Discord Community](https://discord.gg/yeYsX7cZUr)
- [Documentation](https://aincrok.dev/docs)
