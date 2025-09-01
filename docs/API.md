# Aincrok API Reference

This document provides comprehensive API documentation for Aincrok's extension API, commands, and integration points.

## Extension API

Aincrok exposes a programmatic API for other extensions and integrations.

### Getting the API

```typescript
import * as vscode from "vscode"

const aincrokExtension = vscode.extensions.getExtension("aincrok.aincrok")
if (aincrokExtension) {
	const api = aincrokExtension.exports
	// Use the API
}
```

### Core API Methods

#### `createTask(options: TaskOptions): Promise<Task>`

Creates a new Aincrok task programmatically.

```typescript
interface TaskOptions {
	message: string
	mode?: string
	context?: string[]
	autoApprove?: boolean
}

const task = await api.createTask({
	message: "Refactor this function to use async/await",
	mode: "refactor",
	context: ["src/utils/api.ts"],
	autoApprove: false,
})
```

#### `getActiveTask(): Task | null`

Returns the currently active task.

```typescript
const activeTask = api.getActiveTask()
if (activeTask) {
	console.log(`Current task: ${activeTask.id}`)
}
```

#### `executeCommand(command: string, args?: any[]): Promise<any>`

Executes Aincrok commands programmatically.

```typescript
await api.executeCommand("aincrok.newTask", ["Write unit tests"])
await api.executeCommand("aincrok.switchMode", ["debug"])
```

### Task API

#### Task Properties

```typescript
interface Task {
	id: string
	message: string
	mode: string
	status: TaskStatus
	createdAt: Date
	updatedAt: Date
}

enum TaskStatus {
	PENDING = "pending",
	RUNNING = "running",
	COMPLETED = "completed",
	FAILED = "failed",
	CANCELLED = "cancelled",
}
```

#### Task Methods

```typescript
// Get task history
const messages = task.getMessages()

// Add user message
await task.addUserMessage("Can you also add error handling?")

// Cancel task
await task.cancel()

// Get task metrics
const metrics = task.getMetrics()
```

## VS Code Commands

All Aincrok commands accessible via Command Palette or programmatically.

### Core Commands

| Command       | ID                     | Description                     |
| ------------- | ---------------------- | ------------------------------- |
| New Task      | `aincrok.newTask`      | Start a new coding task         |
| Continue Task | `aincrok.continueTask` | Continue the current task       |
| Switch Mode   | `aincrok.switchMode`   | Change the current mode         |
| Open Settings | `aincrok.openSettings` | Open Aincrok settings           |
| Export Chat   | `aincrok.exportChat`   | Export conversation to markdown |

### File Commands

| Command             | ID                         | Description                  |
| ------------------- | -------------------------- | ---------------------------- |
| Add File to Context | `aincrok.addFileToContext` | Include file in conversation |
| Read File           | `aincrok.readFile`         | Read file content            |
| Edit File           | `aincrok.editFile`         | Make changes to a file       |
| Create File         | `aincrok.createFile`       | Create a new file            |

### Terminal Commands

| Command         | ID                       | Description              |
| --------------- | ------------------------ | ------------------------ |
| Execute Command | `aincrok.executeCommand` | Run terminal command     |
| Open Terminal   | `aincrok.openTerminal`   | Open integrated terminal |

## Events API

Subscribe to Aincrok events for integration and monitoring.

### Event Types

```typescript
interface AincrokEvents {
	onTaskCreated: (task: Task) => void
	onTaskUpdated: (task: Task) => void
	onTaskCompleted: (task: Task) => void
	onModeChanged: (mode: string) => void
	onMessageAdded: (message: Message) => void
}
```

### Event Subscription

```typescript
// Subscribe to task events
api.onTaskCreated((task) => {
	console.log(`New task created: ${task.id}`)
})

api.onTaskCompleted((task) => {
	console.log(`Task completed: ${task.id}`)
})

// Subscribe to mode changes
api.onModeChanged((mode) => {
	console.log(`Switched to mode: ${mode}`)
})
```

## Configuration API

Programmatically manage Aincrok configuration.

### Getting Configuration

```typescript
const config = api.getConfiguration()
console.log(config.model) // Current model
console.log(config.temperature) // Current temperature
```

### Updating Configuration

```typescript
await api.updateConfiguration({
	model: "gpt-4",
	temperature: 0.3,
	maxTokens: 8192,
})
```

### Provider Management

```typescript
// Get available providers
const providers = api.getAvailableProviders()

// Switch provider
await api.setProvider("anthropic")

// Validate API key
const isValid = await api.validateApiKey("your-api-key")
```

## Tool System API

Create custom tools for Aincrok.

### Tool Interface

```typescript
interface Tool {
	name: string
	description: string
	parameters: ToolParameter[]
	execute: (params: any) => Promise<ToolResult>
}

interface ToolParameter {
	name: string
	type: "string" | "number" | "boolean" | "array" | "object"
	description: string
	required: boolean
}

interface ToolResult {
	success: boolean
	data?: any
	error?: string
}
```

### Registering Custom Tools

```typescript
const customTool: Tool = {
	name: "analyzePerformance",
	description: "Analyze code performance",
	parameters: [
		{
			name: "filePath",
			type: "string",
			description: "Path to the file to analyze",
			required: true,
		},
	],
	execute: async (params) => {
		// Your tool implementation
		return { success: true, data: "Performance analysis complete" }
	},
}

api.registerTool(customTool)
```

## Memory Bank API

Interact with Aincrok's memory system.

### Memory Operations

```typescript
// Add memory
await api.memory.add("project-architecture", {
	type: "documentation",
	content: "This project uses Clean Architecture...",
	tags: ["architecture", "patterns"],
})

// Search memory
const memories = await api.memory.search("authentication")

// Get memory by ID
const memory = await api.memory.get("memory-id")

// Update memory
await api.memory.update("memory-id", { content: "Updated content" })

// Delete memory
await api.memory.delete("memory-id")
```

## WebView API

Interact with Aincrok's WebView interface.

### Sending Messages

```typescript
// Send message to WebView
api.webview.postMessage({
	type: "updateTheme",
	data: { theme: "dark" },
})

// Listen for WebView messages
api.webview.onDidReceiveMessage((message) => {
	console.log("Received from WebView:", message)
})
```

## REST API Endpoints

Aincrok provides local REST endpoints for external integrations.

### Authentication

```bash
# Get authentication token
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"extension": "your-extension-name"}'
```

### Task Management

```bash
# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add unit tests", "mode": "code"}'

# Get task status
curl -X GET http://localhost:3000/api/tasks/{task-id} \
  -H "Authorization: Bearer your-token"

# Cancel task
curl -X DELETE http://localhost:3000/api/tasks/{task-id} \
  -H "Authorization: Bearer your-token"
```

### Configuration

```bash
# Get configuration
curl -X GET http://localhost:3000/api/config \
  -H "Authorization: Bearer your-token"

# Update configuration
curl -X PUT http://localhost:3000/api/config \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "temperature": 0.7}'
```

## Error Handling

### Error Types

```typescript
enum AincrokErrorType {
	API_KEY_INVALID = "API_KEY_INVALID",
	MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
	RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
	CONTEXT_TOO_LARGE = "CONTEXT_TOO_LARGE",
	TOOL_EXECUTION_FAILED = "TOOL_EXECUTION_FAILED",
}

interface AincrokError {
	type: AincrokErrorType
	message: string
	details?: any
}
```

### Error Handling Patterns

```typescript
try {
	await api.createTask({ message: "Implement feature X" })
} catch (error) {
	if (error.type === AincrokErrorType.API_KEY_INVALID) {
		// Handle invalid API key
	} else if (error.type === AincrokErrorType.RATE_LIMIT_EXCEEDED) {
		// Handle rate limit
	}
}
```

## Rate Limiting

Aincrok implements rate limiting to prevent API abuse.

### Rate Limit Headers

```typescript
interface RateLimitInfo {
	limit: number
	remaining: number
	reset: Date
}

const rateLimitInfo = api.getRateLimitInfo()
console.log(`${rateLimitInfo.remaining}/${rateLimitInfo.limit} requests remaining`)
```

## Webhooks

Configure webhooks for external system integration.

### Webhook Events

- `task.created`
- `task.completed`
- `task.failed`
- `mode.changed`
- `error.occurred`

### Webhook Configuration

```json
{
	"aincrok.webhooks": [
		{
			"url": "https://your-server.com/webhook",
			"events": ["task.completed", "task.failed"],
			"secret": "your-webhook-secret"
		}
	]
}
```

## TypeScript Definitions

Full TypeScript definitions are available in the extension package:

```bash
npm install @types/aincrok
```

---

For more examples and detailed usage, see the [GitHub repository](https://github.com/your-org/aincrok) or check out the [TEMPLATES.md](TEMPLATES.md) for common integration patterns.
