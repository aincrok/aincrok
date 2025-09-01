# Tips & Tricks

A collection of quick tips to help you get the most out of Aincrok.

## Workspace Organization

- **Drag Aincrok to the Secondary Sidebar**: Move Aincrok to the [Secondary Sidebar](https://code.visualstudio.com/api/ux-guidelines/sidebars#secondary-sidebar) so you can see the Explorer, Search, Source Control, etc. while keeping Aincrok accessible.
- **Drag Files into Chat**: Once you have Aincrok in a separate sidebar, you can drag files from the explorer into the chat window (even multiple at once). Just make sure to hold down the shift key after you start dragging the files.
- **Multiple Repository Copies**: For really accelerated development, check out multiple copies of your repository and run Aincrok on all of them in parallel (using git to resolve any conflicts, same as with human devs).

## Performance Optimization

- **Turn Off Unused MCP Servers**: If you're not using [MCP](/features/mcp/overview), turn it off in the <Codicon name="notebook" /> Prompts tab to significantly cut down the size of the system prompt.
- **Limit File Types for Custom Modes**: To keep your [custom modes](/features/custom-modes) on track, limit the types of files that they're allowed to edit.
- **File Read Threshold**: To manage large files and reduce context/resource usage, adjust the `File read auto-truncate threshold` setting. This setting controls the number of lines read from a file in one batch. Lower values can improve performance when working with very large files, but may require more read operations. You can find this setting in the Aincrok settings under 'Advanced Settings'.

## Token Management

- **Thinking Models Token Allocation**: Be thoughtful about your `Max Tokens` setting for thinking models. Every token you allocate to that takes away from space available to store conversation history. Consider only using high `Max Tokens` / `Max Thinking Tokens` settings with modes like Architect and Debug, and keeping Code mode at 16k max tokens or less.
- **Context Limit Recovery**: If you hit the dreaded `input length and max tokens exceed context limit` error, you can recover by:
    - Deleting a message from the conversation
    - Rolling back to a previous checkpoint
    - Switching over to a model with a long context window like Gemini for a message

## Custom Modes & Workflows

- **Job Posting-Based Modes**: If there's a real world job posting for something you want a custom mode to do, try asking Code mode to `Create a custom mode based on the job posting at @[url]`
- **Debug Mode Best Practice**: When using Debug mode, ask Aincrok to "start a new task in Debug mode with all of the necessary context needed to figure out X" so that the debugging process uses its own context window and doesn't pollute the main task

## Keyboard Shortcuts & Commands

- Use `Ctrl/Cmd + Shift + P` to open the command palette, then search for "Aincrok" to see all available commands
- Use `Ctrl/Cmd + K, Ctrl/Cmd + M` to open the [command palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) with "Aincrok:" already prefilled
- Set up custom keyboard shortcuts in VS Code for your most-used Aincrok commands

## Community Contribution

- Add your own tips by clicking "Edit this page" below!
- Share your discoveries in our [Discord community](https://aincrok.dev/discord)

---

## Video Demonstrations

| Browser Tab                                                                                                                          | Auto-Approve Tab                                                                                                                     | Display Tab                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| [![Aincrok Demo 1](https://img.youtube.com/vi/VMPKXt8k050/maxresdefault.jpg)](https://youtube.com/shorts/VMPKXt8k050?feature=shared) | [![Aincrok Demo 2](https://img.youtube.com/vi/NBccFnYDQ-k/maxresdefault.jpg)](https://youtube.com/shorts/NBccFnYDQ-k?feature=shared) | [![Aincrok Demo 3](https://img.youtube.com/vi/qYrT2pbfS7E/maxresdefault.jpg)](https://youtube.com/shorts/qYrT2pbfS7E?feature=shared) |

---

_Have your own tip to share? Consider contributing to this documentation or sharing in our [Discord community](https://aincrok.dev/discord)!_
