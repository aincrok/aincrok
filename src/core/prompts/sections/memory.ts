// aincrok_change - updated for Cipher memory system
/**
 * Memory system integration instructions for the AI assistant
 * These prompts ensure the AI proactively uses the Cipher memory system
 */

import { Memory, MemoryType } from "../../memory/IMemoryProvider"

// Define MemoryType for backward compatibility
const MemoryTypeCompat = {
	SEMANTIC: "knowledge" as const,
	PROCEDURAL: "pattern" as const,
	EPISODIC: "business_rule" as const,
}

export const CIPHER_MEMORY_SYSTEM = `
# Memory System Integration

You are equipped with Cipher, an advanced dual-memory system that MUST be used proactively to maintain context and continuity across sessions. This is CRITICAL for providing consistent, contextual assistance.

## MANDATORY Memory Usage Protocol

### 1. ALWAYS Check Memory Before Starting Tasks
Before beginning ANY coding task, you MUST:
- Search for relevant past decisions: cipher_memory_search(query: current_task_description)
- Review recent work in the same area: cipher_memory_search(query: current_file_path)
- Check for team knowledge: cipher_workspace_search(query: current_context) [if workspace enabled]

Example internal process (happens automatically):
\`\`\`
User: "Fix the authentication bug"
Your first action: cipher_memory_search(query: "authentication bug fix implementation")
→ Discovers: "Previous fix attempt on auth used JWT refresh strategy"
→ Continues from that context rather than starting fresh
\`\`\`

### 2. System 1 Memory (Knowledge) - Automatic Capture
The following are AUTOMATICALLY stored without explicit commands:
- **Code Patterns**: When you see repeated patterns (>2 occurrences)
- **Business Rules**: When user explains domain logic
- **API Contracts**: When you discover API requirements
- **Configuration**: When you learn about project setup
- **Conventions**: When you identify coding standards

You don't need to explicitly call cipher_extract_and_operate_memory() for these - they're captured automatically.
However, you MUST search for them before making assumptions.

### 3. System 2 Memory (Reasoning) - Problem-Solving Process
AUTOMATICALLY captured during complex problem-solving:
- **Debugging Steps**: Your investigation process
- **Decision Points**: Why you chose approach A over B
- **Trade-offs**: Performance vs readability decisions
- **Failed Attempts**: What didn't work and why

This happens transparently when you're working through problems.

### 4. Proactive Memory Injection
Relevant memories are AUTOMATICALLY injected into your context when:
- Opening a file (memories about that file/module)
- Starting a task (memories about similar tasks)
- Encountering errors (memories about similar errors)

You'll see them as:
<context_memories>
[Memory from 2 days ago]: "User prefers functional approach in data transformers"
[Memory from last week]: "Database queries must include tenant_id for multi-tenancy"
</context_memories>

### 5. Explicit Memory Storage (User-Requested Only)
ONLY use cipher_store_reasoning_memory explicitly when:
- User says "remember that..." or "don't forget..."
- Critical business rule is discovered
- Security requirement is identified

### 6. Workspace Memory (Team Knowledge Sharing)
When workspace is enabled, you MUST:
- Check workspace memories before implementing features
- Share important discoveries with team
- Learn from team patterns

### 7. Memory Search Strategies

Always search BEFORE:
- Implementing a feature: cipher_memory_search(query: feature_name + "implementation approach")
- Fixing a bug: cipher_memory_search(query: error_message + "previous fixes")
- Refactoring: cipher_memory_search(query: component_name + "design decisions")
- Adding tests: cipher_memory_search(query: component_name + "test strategy")

### 8. Memory Continuity Rules

YOU MUST maintain continuity by:
1. **Session Start**: Load context from previous session
2. **Task Switch**: Save and load context
3. **Error Recovery**: Learn from failures
4. **Pattern Recognition**: Identify and reuse

## Memory Tools Available

### Automatic Tools (Called by System):
- **auto_capture_pattern**: Detects and stores repeated patterns
- **auto_extract_reasoning**: Captures your problem-solving steps
- **auto_inject_context**: Adds relevant memories to your context

### Tools You Call:
- **cipher_memory_search(query, limit?)**: Find relevant past knowledge
- **cipher_memory_search(query="", limit?, sort="recent")**: Get recent work context  
- **cipher_extract_and_operate_memory(content, metadata?)**: Explicitly save important info
- **cipher_workspace_search(query)**: Access team knowledge (if workspace enabled)
- **cipher_store_workspace_memory(memories)**: Share discoveries with team (if workspace enabled)
- **cipher_health_check()**: Verify memory system status

## Critical Reminders

⚠️ NEVER assume - ALWAYS search memory first
⚠️ NEVER repeat work - CHECK if it's been done before
⚠️ NEVER lose context - MEMORIES maintain continuity
⚠️ NEVER work in isolation - USE workspace memories when available

## Example Workflow

\`\`\`
User opens project and asks: "Continue working on the API refactoring"

Your AUTOMATIC process:
1. [System injects recent memories about API refactoring]
2. cipher_memory_search(query: "API refactoring approach decisions")
   → Finds: "Decided to use repository pattern, started with UserRepository"
3. cipher_memory_search(query: "src/api/")
   → Finds: "Authentication middleware needs update after refactoring"
4. cipher_workspace_search(query: "API refactoring")
   → Finds: "Team member noted: Consider GraphQL migration in phase 2"

You now have FULL CONTEXT and continue from exactly where work stopped, 
knowing the decisions made, patterns established, and team considerations.
\`\`\`

Remember: The memory system is your persistent brain across sessions. USE IT CONSTANTLY.
`

export const MEMORY_CONTEXT_RULES = `
## Memory Context Integration

When memories are retrieved, they appear in your context as:

<context_memories>
[Memory ID: cipher_k4j2n | 2 days ago | Type: business_rule]
All API responses must include a 'status' field with 'success' or 'error'

[Memory ID: cipher_9xm3p | 1 week ago | Type: reasoning]
Chose Redux over Context API because:
1. Complex state with multiple consumers
2. Need for time-travel debugging
3. Middleware for API calls

[Memory ID: cipher_2qt7v | 3 hours ago | Type: pattern]
Repository pattern used consistently:
- Interface definition in /interfaces
- Implementation in /repositories
- Dependency injection via constructor
</context_memories>

You MUST treat these memories as authoritative project knowledge and follow them unless explicitly told otherwise by the user.
`

/**
 * Format memories into structured prompt section for AI context
 * Updated for Cipher dual-memory system
 */
export function getMemorySection(memories: Memory[], cwd: string): string {
	if (!memories || memories.length === 0) {
		return ""
	}

	let section = "\n<context_memories>\n"

	memories.forEach((memory) => {
		section += `[Memory ID: ${memory.id} | ${memory.timeAgo || "Recently"} | Type: ${memory.type}]\n`
		section += `${memory.content}\n`

		if (memory.metadata && Object.keys(memory.metadata).length > 0) {
			section += `Metadata: ${JSON.stringify(memory.metadata)}\n`
		}

		section += "\n"
	})

	section += "</context_memories>\n\n"
	section +=
		"IMPORTANT: The above memories are authoritative project knowledge. Follow them unless explicitly overridden.\n"

	return section
}

/**
 * Organize memories by their hierarchical type
 */
function organizeMemoriesByType(memories: Memory[]): Record<string, Memory[]> {
	const organized: Record<string, Memory[]> = {
		"short-term": [],
		working: [],
		episodic: [],
		semantic: [],
		procedural: [],
	}

	memories.forEach((mem) => {
		const type = mem.type || MemoryTypeCompat.SEMANTIC
		if (organized[type]) {
			organized[type].push(mem)
		}
	})

	// Sort each type by relevance score (descending) then by timestamp (newest first)
	Object.keys(organized).forEach((type) => {
		organized[type].sort((a, b) => {
			// Primary sort by relevance score
			const scoreA = a.relevanceScore || 0
			const scoreB = b.relevanceScore || 0
			if (scoreB !== scoreA) {
				return scoreB - scoreA
			}
			// Secondary sort by timestamp (newest first)
			return b.timestamp - a.timestamp
		})
	})

	return organized
}

/**
 * Convert timestamp to human-readable time ago format
 */
function getTimeAgo(timestamp: number): string {
	const now = Date.now()
	const diff = now - timestamp

	const minutes = Math.floor(diff / (1000 * 60))
	const hours = Math.floor(diff / (1000 * 60 * 60))
	const days = Math.floor(diff / (1000 * 60 * 60 * 24))

	if (minutes < 1) {
		return "Just now"
	} else if (minutes < 60) {
		return `${minutes} minutes ago`
	} else if (hours < 24) {
		return `${hours} hours ago`
	} else if (days < 30) {
		return `${days} days ago`
	} else {
		return new Date(timestamp).toLocaleDateString()
	}
}

/**
 * Get memory statistics for debugging and optimization
 */
export function getMemoryStats(memories: Memory[]): {
	total: number
	byType: Record<string, number>
	averageRelevance: number
	timeRange: { oldest: number; newest: number }
} {
	if (memories.length === 0) {
		return {
			total: 0,
			byType: {},
			averageRelevance: 0,
			timeRange: { oldest: 0, newest: 0 },
		}
	}

	const byType: Record<string, number> = {}
	let totalRelevance = 0
	let relevantCount = 0
	let oldest = memories[0].timestamp
	let newest = memories[0].timestamp

	memories.forEach((mem) => {
		// Count by type
		const type = mem.type || MemoryTypeCompat.SEMANTIC
		byType[type] = (byType[type] || 0) + 1

		// Calculate relevance
		if (mem.relevanceScore !== undefined) {
			totalRelevance += mem.relevanceScore
			relevantCount++
		}

		// Track time range
		if (mem.timestamp < oldest) oldest = mem.timestamp
		if (mem.timestamp > newest) newest = mem.timestamp
	})

	return {
		total: memories.length,
		byType,
		averageRelevance: relevantCount > 0 ? totalRelevance / relevantCount : 0,
		timeRange: { oldest, newest },
	}
}

/**
 * Filter memories for specific context (utility function)
 */
export function filterMemoriesForContext(
	memories: Memory[],
	context: {
		types?: string[]
		taskId?: string
		filePaths?: string[]
		minRelevance?: number
		maxAge?: number // in milliseconds
	},
): Memory[] {
	let filtered = memories

	// Filter by types
	if (context.types && context.types.length > 0) {
		filtered = filtered.filter((mem) => context.types!.includes(mem.type))
	}

	// Filter by task ID
	if (context.taskId) {
		filtered = filtered.filter((mem) => mem.task_id === context.taskId)
	}

	// Filter by file paths
	if (context.filePaths && context.filePaths.length > 0) {
		filtered = filtered.filter((mem) =>
			mem.file_context?.some((filePath) =>
				context.filePaths!.some(
					(contextPath) => filePath.includes(contextPath) || contextPath.includes(filePath),
				),
			),
		)
	}

	// Filter by minimum relevance
	if (context.minRelevance !== undefined) {
		filtered = filtered.filter((mem) => (mem.relevanceScore || 0) >= context.minRelevance!)
	}

	// Filter by maximum age
	if (context.maxAge !== undefined) {
		const cutoff = Date.now() - context.maxAge
		filtered = filtered.filter((mem) => mem.timestamp >= cutoff)
	}

	return filtered
}
