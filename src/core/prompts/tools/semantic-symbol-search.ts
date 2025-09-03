// aincrok_change - new file
import { ToolArgs } from "./types"

export function getSemanticSymbolSearchDescription(args?: ToolArgs): string {
	return `## semantic_symbol_search

Searches for code symbols (classes, functions, methods, etc.) across the workspace using Language Server Protocol (LSP) for intelligent, symbol-aware searching instead of text-based pattern matching.

**Parameters:**
- \`query\` (required): The symbol name or pattern to search for
- \`file_pattern\` (optional): Limit search to files matching this pattern
- \`symbol_kinds\` (optional): Array of LSP symbol kinds to include (e.g., ["5", "12"] for classes and functions)
- \`include_references\` (optional): Whether to find references to matched symbols (true/false)
- \`include_usages\` (optional): Whether to include usage examples of found symbols (true/false)
- \`max_results\` (optional): Maximum number of results to return (default: 50, max: 100)

**Key Features:**
- **LSP-Powered Search**: Uses workspace symbol providers for accurate symbol matching
- **Multi-Language Support**: Works with TypeScript, JavaScript, Python, Java, Go, Rust, C++
- **Symbol Type Filtering**: Search specifically for classes, functions, interfaces, etc.
- **File Pattern Filtering**: Limit searches to specific files or directories
- **Reference Analysis**: Find where symbols are used throughout the codebase
- **Context Preservation**: Shows symbol context and surrounding code
- **Graceful Fallback**: Falls back to regex search when LSP is unavailable
- **Performance Optimized**: Efficient workspace-wide symbol indexing

**Supported Symbol Types:**
- \`5\`: Class - Object-oriented class definitions
- \`6\`: Method - Class methods and member functions
- \`11\`: Interface - Interface definitions
- \`12\`: Function - Standalone functions
- \`13\`: Variable - Variable declarations
- \`14\`: Constant - Constant definitions
- \`10\`: Enum - Enumeration types
- \`2\`: Module - Module definitions
- \`3\`: Namespace - Namespace declarations

**When to Use:**
- Looking for specific classes, functions, or methods by name
- Exploring unfamiliar codebases to understand symbol distribution
- Finding all implementations or definitions of a particular symbol
- Analyzing code relationships and dependencies
- When traditional text search isn't precise enough for symbol-level queries

**Output Format:**
Returns structured XML containing:
- Search metadata and semantic analysis status
- Symbol information with names, kinds, file locations, and line numbers
- Context snippets showing symbol definitions and usage
- Reference relationships when requested
- Fallback search results when LSP is unavailable

**Usage Examples:**

Basic symbol search:
\`\`\`xml
<semantic_symbol_search>
<query>UserService</query>
</semantic_symbol_search>
\`\`\`

Search with symbol type filter (classes only):
\`\`\`xml
<semantic_symbol_search>
<query>Service</query>
<symbol_kinds>["5"]</symbol_kinds>
</semantic_symbol_search>
\`\`\`

Search with file pattern:
\`\`\`xml
<semantic_symbol_search>
<query>Config</query>
<file_pattern>config</file_pattern>
</semantic_symbol_search>
\`\`\`

Search with references:
\`\`\`xml
<semantic_symbol_search>
<query>AuthService</query>
<include_references>true</include_references>
</semantic_symbol_search>
\`\`\`

**Symbol Kind Combinations:**
\`\`\`xml
<!-- Classes and interfaces only -->
<symbol_kinds>["5", "11"]</symbol_kinds>

<!-- Functions and methods -->
<symbol_kinds>["6", "12"]</symbol_kinds>

<!-- All types (classes, interfaces, enums) -->
<symbol_kinds>["5", "10", "11"]</symbol_kinds>

<!-- Variables and constants -->
<symbol_kinds>["13", "14"]</symbol_kinds>
\`\`\`

**Performance Considerations:**
- Searches are limited to 100 results maximum for performance
- Reference analysis is limited to the first 10 symbols found
- Large workspaces may have slower initial LSP indexing
- File pattern filtering can significantly improve search speed

**Important Notes:**
- Requires LSP support for the target programming language
- Performance depends on workspace size and LSP indexing
- Reference analysis limited to first 10 matched symbols for performance
- Some languages may have limited symbol relationship support`
}
