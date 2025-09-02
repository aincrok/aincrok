---
---

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export const FreeTierAmount = () => {
const {siteConfig} = useDocusaurusContext();
return siteConfig.customFields.freeTierAmount;
};

# Frequently Asked Questions

This page answers some common questions about Aincrok.

## General

### What is Aincrok?

Aincrok is an open-source AI agent extension for Visual Studio Code. It helps you write code more efficiently by generating code, automating tasks, and providing suggestions.

### How does Aincrok work?

Aincrok uses large language models (LLMs) to understand your requests and translate them into actions. It can:

- Read and write files in your project.
- Execute commands in your VS Code terminal.
- Perform web browsing (if enabled).
- Use external tools via the Model Context Protocol (MCP).

You interact with Aincrok through a chat interface, where you provide instructions and review/approve its proposed actions.

### What can Aincrok do?

Aincrok can help with a variety of coding tasks, including:

- Generating code from natural language descriptions.
- Refactoring existing code.
- Fixing bugs.
- Writing documentation.
- Explaining code.
- Answering questions about your codebase.
- Automating repetitive tasks.
- Creating new files and projects.

### Is Aincrok free to use?

The Aincrok extension itself is free and open-source. In addition, Aincrok has a free tier with <FreeTierAmount /> worth of Claude 3.7 Sonnet tokens. We'll give out more free tokens if you leave useful feedback.

After that, you can add a credit card to buy more tokens (securely processed through Stripe. Our pricing matches Anthropic's API rates exactly. We don't take any cut, either per token or per top-up. In the future we'll add more LLM providers.

Alternatively, you can "Bring Your Own API" (like [Anthropic](providers/anthropic), [OpenAI](providers/openai), [OpenRouter](providers/openrouter), [Requesty](providers/requesty), etc.) for its AI capabilities. These providers typically charge for API usage based on the number of tokens processed. You will need to create an account and obtain an API key from your chosen provider. See [Setting Up Your First AI Provider](getting-started/connecting-api-provider) for details.

### What are the risks of using Aincrok?

Aincrok is a powerful tool, and it's important to use it responsibly. Here are some things to keep in mind:

- **Aincrok can make mistakes.** Always review Aincrok's proposed changes carefully before approving them.
- **Aincrok can execute commands.** Be very cautious about allowing Aincrok to run commands, especially if you're using auto-approval.
- **Aincrok can access the internet.** If you're using a provider that supports web browsing, be aware that Aincrok could potentially access sensitive information.

## Setup & Installation

### How do I install Aincrok?

See the [Installation Guide](/getting-started/installing) for detailed instructions.

### Which API providers are supported?

Aincrok supports a wide range of API providers, including:

- [Aincrok (Claude)](/providers/aincrok)
- [Anthropic (Claude)](/providers/anthropic)
- [OpenAI](/providers/openai)
- [OpenRouter](/providers/openrouter)
- [Google Gemini](/providers/gemini)
- [Glama](/providers/glama)
- [AWS Bedrock](/providers/bedrock)
- [GCP Vertex AI](/providers/vertex)
- [Ollama](/providers/ollama)
- [LM Studio](/providers/lmstudio)
- [DeepSeek](/providers/deepseek)
- [Mistral](/providers/mistral)
- [Unbound](/providers/unbound)
- [Requesty](/providers/requesty)
- [VS Code Language Model API](/providers/vscode-lm)

### How do I get an API key?

Each API provider has its own process for obtaining an API key. See the [Setting Up Your First AI Provider](/getting-started/connecting-api-provider) for links to the relevant documentation for each provider.

### Can I use Aincrok with local models?

Yes, Aincrok supports running models locally using [Ollama](/providers/ollama) and [LM Studio](/providers/lmstudio). See [Using Local Models](/advanced-usage/local-models) for instructions.

## Usage

### How do I start a new task?

Open the Aincrok panel (<img src="/img/aincrok-icon.svg" width="12" />) and type your task in the chat box. Be clear and specific about what you want Aincrok to do. See [The Chat Interface](/basic-usage/the-chat-interface) for best practices.

### What are modes in Aincrok?

[Modes](/basic-usage/using-modes) are different personas that Aincrok can adopt, each with a specific focus and set of capabilities. The built-in modes are:

- **Code:** For general-purpose coding tasks.
- **Architect:** For planning and technical leadership.
- **Ask:** For answering questions and providing information.
- **Debug:** For systematic problem diagnosis.
  You can also create [Custom Modes](/features/custom-modes).

### How do I switch between modes?

Use the dropdown menu in the chat input area to select a different mode, or use the `/` command to switch to a specific mode.

### What are tools and how do I use them?

[Tools](/basic-usage/how-tools-work) are how Aincrok interacts with your system. Aincrok automatically selects and uses the appropriate tools to complete your tasks. You don't need to call tools directly. You will be prompted to approve or reject each tool use.

### What are context mentions?

[Context mentions](/basic-usage/context-mentions) are a way to provide Aincrok with specific information about your project, such as files, folders, or problems. Use the "@" symbol followed by the item you want to mention (e.g., `@/src/file.ts`, `@problems`).

### Can Aincrok access the internet?

Yes, if you are using a provider with a model that support web browsing. Be mindful of the security implications of allowing this.

### Can Aincrok run commands in my terminal?

Yes, Aincrok can execute commands in your VS Code terminal. You will be prompted to approve each command before it's executed, unless you've enabled auto-approval for commands. Be extremely cautious about auto-approving commands. If you're experiencing issues with terminal commands, see the [Shell Integration Guide](/features/shell-integration) for troubleshooting.

### How do I provide feedback to Aincrok?

You can provide feedback by approving or rejecting Aincrok's proposed actions. You can provide additional feedback by using the feedback field.

### Can I customize Aincrok's behavior?

Yes, you can customize Aincrok in several ways:

- **Custom Instructions:** Provide general instructions that apply to all modes, or mode-specific instructions.
- **Custom Modes:** Create your own modes with tailored prompts and tool permissions.
- **`.clinerules` Files:** Create `.clinerules` files in your project to provide additional guidelines.
- **Settings:** Adjust various settings, such as auto-approval, diff editing, and more.

### Does Aincrok have any auto approval settings?

Yes, Aincrok has a few settings that when enabled will automatically approve actions. Find out more [here](/features/auto-approving-actions).

## Advanced Features

### Can I use Aincrok offline?

Yes, if you use a [local model](/advanced-usage/local-models).

### What is MCP (Model Context Protocol)?

[MCP](/features/mcp/overview) is a protocol that allows Aincrok to communicate with external servers, extending its capabilities with custom tools and resources.

### Can I create my own MCP servers?

Yes, you can create your own MCP servers to add custom functionality to Aincrok. See the [MCP documentation](https://github.com/modelcontextprotocol) for details.

## Troubleshooting

### Aincrok isn't responding. What should I do?

- Make sure your API key is correct and hasn't expired.
- Check your internet connection.
- Check the status of your chosen API provider.
- Try restarting VS Code.
- If the problem persists, report the issue on [GitHub](https://github.com/aincrok/aincrok/issues) or [Discord](https://aincrok.ai/discord).

### I'm seeing an error message. What does it mean?

The error message should provide some information about the problem. If you're unsure how to resolve it, seek help in the community forums.

### Aincrok made changes I didn't want. How do I undo them?

Aincrok uses VS Code's built-in file editing capabilities. You can use the standard "Undo" command (Ctrl/Cmd + Z) to revert changes. Also, if experimental checkpoints are enabled, Aincrok can revert changes made to a file.

### How do I report a bug or suggest a feature?

Please report bugs or suggest features on the Aincrok [Issues page](https://github.com/aincrok/aincrok/issues) and [Feature Requests page](https://github.com/aincrok/aincrok/discussions/categories/ideas).
