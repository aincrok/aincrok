// aincrok_change - new file
import { ToolArgs } from "./types"

export function getSemanticReadFileDescription(args?: ToolArgs): string {
	return `## semantic_read_file

Analyzes files using Language Server Protocol (LSP) to provide semantic understanding of code structure, symbols, and relationships instead of just raw text. This tool enhances traditional file reading with intelligent code analysis.

**Parameters:**
- \`path\` (required): The path of the file to analyze relative to the current working directory
- \`symbol_query\` (optional): Filter symbols by name (case-insensitive substring matching)
- \`symbol_kinds\` (optional): Array of LSP symbol kinds to include (e.g., ["5", "6"] for classes and methods)
- \`include_relationships\` (optional): Whether to analyze symbol relationships and references (true/false)
- \`max_depth\` (optional): Maximum depth for symbol hierarchy analysis (1-3, default: 1)

**Key Features:**
- **LSP-Powered Analysis**: Uses Language Server Protocol for accurate semantic understanding
- **Symbol Filtering**: Filter results by symbol names or types (classes, methods, interfaces, etc.)
- **Hierarchical Analysis**: Understands nested structures and parent-child relationships
- **Multi-Language Support**: Works with TypeScript, JavaScript, Python, Java, Go, Rust, C++
- **Graceful Fallback**: Automatically falls back to text-based reading when LSP fails
- **Relationship Mapping**: Analyzes how symbols relate to and reference each other
- **Context-Aware**: Provides symbol context including documentation and signatures

**Supported Symbol Types:**
- Classes (5), Methods (6), Interfaces (11), Functions (12)
- Variables (13), Constants (14), Enums (10)
- Modules (2), Namespaces (3)

**When to Use:**
- Understanding code architecture and symbol relationships
- Analyzing class hierarchies and method signatures
- Searching for specific types of code symbols
- Understanding complex codebases with interconnected components
- When traditional text-based analysis isn't sufficient for code comprehension

**Output Format:**
Returns structured XML containing:
- File metadata and semantic analysis status
- Symbol information with names, kinds, locations, and documentation
- Hierarchical symbol relationships (parent-child structures)
- Context snippets showing symbol definitions
- Fallback to text content when LSP is unavailable

**Usage Examples:**
\`\`\`xml
<semantic_read_file>
<path>src/services/UserService.ts</path>
</semantic_read_file>
\`\`\`

\`\`\`xml
<semantic_read_file>
<path>src/models/index.ts</path>
<symbol_kinds>["5"]</symbol_kinds>
</semantic_read_file>
\`\`\`

\`\`\`xml
<semantic_read_file>
<path>src/types.ts</path>
<symbol_query>User</symbol_query>
</semantic_read_file>
\`\`\`

**Important Notes:**
- Requires VS Code Language Server Protocol support for the target language
- May fall back to text-based reading for files with syntax errors
- Performance depends on LSP initialization and file complexity
- Symbol relationships analysis may be limited for some languages`
}
