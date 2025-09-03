# semantic_symbol_search

The `semantic_symbol_search` tool searches for code symbols (classes, functions, methods, etc.) across the workspace using Language Server Protocol (LSP) for intelligent, symbol-aware searching instead of text-based pattern matching.

## Parameters

The tool accepts these parameters:

- `query` (required): The symbol name or pattern to search for
- `file_pattern` (optional): Limit search to files matching this pattern
- `symbol_kinds` (optional): Array of LSP symbol kinds to include (e.g., ["5", "12"] for classes and functions)
- `include_references` (optional): Whether to find references to matched symbols (true/false)
- `include_usages` (optional): Whether to include usage examples of found symbols (true/false)
- `max_results` (optional): Maximum number of results to return (default: 50, max: 100)

## What It Does

This tool uses VS Code's workspace symbol provider to search for symbols by name across the entire workspace. It understands code structure and can find symbols based on their semantic meaning, not just text patterns. When LSP analysis fails, it falls back to regex-based text searching.

## When is it used?

- When looking for specific classes, functions, or methods by name
- When exploring unfamiliar codebases to understand symbol distribution
- When finding all implementations or definitions of a particular symbol
- When analyzing code relationships and dependencies
- When traditional text search isn't precise enough for symbol-level queries

## Key Features

- **LSP-Powered Search**: Uses workspace symbol providers for accurate symbol matching
- **Multi-Language Support**: Works with TypeScript, JavaScript, Python, Java, Go, Rust, C++
- **Symbol Type Filtering**: Search specifically for classes, functions, interfaces, etc.
- **File Pattern Filtering**: Limit searches to specific files or directories
- **Reference Analysis**: Find where symbols are used throughout the codebase
- **Context Preservation**: Shows symbol context and surrounding code
- **Graceful Fallback**: Falls back to regex search when LSP is unavailable
- **Performance Optimized**: Efficient workspace-wide symbol indexing

## Supported Symbol Types

The tool can search for these LSP symbol kinds:

- `5`: Class - Object-oriented class definitions
- `6`: Method - Class methods and member functions
- `11`: Interface - Interface definitions
- `12`: Function - Standalone functions
- `13`: Variable - Variable declarations
- `14`: Constant - Constant definitions
- `10`: Enum - Enumeration types
- `2`: Module - Module definitions
- `3`: Namespace - Namespace declarations

## Limitations

- Requires LSP support for the target programming language
- Performance depends on workspace size and LSP indexing
- Reference analysis limited to first 10 matched symbols for performance
- Some languages may have limited symbol relationship support

## How It Works

When the `semantic_symbol_search` tool is invoked:

1. **LSP Initialization**: Ensures the symbolic analysis system is ready
2. **Workspace Search**: Uses VS Code's `executeWorkspaceSymbolProvider` command
3. **Result Filtering**: Applies file patterns and symbol kind filters
4. **Reference Analysis**: Optionally finds references for matched symbols
5. **Context Extraction**: Gathers surrounding code context for each match
6. **Fallback Handling**: Switches to regex search if LSP fails
7. **Result Formatting**: Returns structured symbol information with metadata

## Usage Examples

### Basic Symbol Search

To find all symbols named "UserService":

**Input:**

```xml
<semantic_symbol_search>
<query>UserService</query>
</semantic_symbol_search>
```

**Simulated Output:**

```xml
<semantic_search query="UserService" semantic_analysis success="true" result_count="3">
<symbols count="3">
<symbol name="UserService" kind="Class" file="src/services/UserService.ts" start_line="5" end_line="42">
<documentation>Main service class for user operations</documentation>
<context>
3: import { Database } from './Database'
4:
5: export class UserService {
6:   private db: Database
7:
8:   constructor(database: Database) {
</context>
</symbol>
<symbol name="UserServiceInterface" kind="Interface" file="src/types/services.ts" start_line="15" end_line="25">
<context>
13: export interface DatabaseConfig {
14:
15: export interface UserServiceInterface {
16:   createUser(userData: UserData): Promise<User>
17:   findUser(id: string): Promise<User | null>
</context>
</symbol>
</symbols>
</semantic_search>
```

### Search with Symbol Type Filter

To find only classes containing "Service":

**Input:**

```xml
<semantic_symbol_search>
<query>Service</query>
<symbol_kinds>["5"]</symbol_kinds>
</semantic_symbol_search>
```

### Search with File Pattern

To find "Config" symbols only in configuration files:

**Input:**

```xml
<semantic_symbol_search>
<query>Config</query>
<file_pattern>config</file_pattern>
</semantic_symbol_search>
```

### Search with References

To find a symbol and see where it's used:

**Input:**

```xml
<semantic_symbol_search>
<query>AuthService</query>
<include_references>true</include_references>
</semantic_symbol_search>
```

**Additional Output:**

```xml
<relationships count="5">
<relationship type="references" file="src/controllers/UserController.ts" line="8" />
<relationship type="references" file="src/middleware/auth.ts" line="12" />
<relationship type="references" file="src/routes/api.ts" line="25" />
</relationships>
```

### Fallback Search

When LSP is unavailable, the tool falls back to regex search:

**Simulated Output:**

```xml
<semantic_search query="UserService" semantic_analysis success="false" fallback="regex_based">
<error>LSP search failed</error>
<symbols count="2">
<match file="src/services/UserService.ts" line="5">
<content>export class UserService {</content>
</match>
<match file="src/types/index.ts" line="23">
<content>interface UserService {</content>
</match>
</symbols>
</semantic_search>
```

### No Results Found

When no symbols match the query:

**Simulated Output:**

```xml
<semantic_search query="NonExistentSymbol" semantic_analysis success="false">
<error>No symbols found matching the query</error>
<symbols count="0"></symbols>
</semantic_search>
```

## Comparison with Other Search Tools

| Feature            | `search_files`   | `codebase_search`   | `semantic_symbol_search` |
| ------------------ | ---------------- | ------------------- | ------------------------ |
| **Search Type**    | Text/Regex       | Semantic similarity | Symbol-based             |
| **Understanding**  | Pattern matching | Conceptual          | Structural               |
| **Language Aware** | No               | Partially           | Yes (via LSP)            |
| **Symbol Types**   | No               | No                  | Yes                      |
| **References**     | No               | No                  | Yes                      |
| **Performance**    | Very Fast        | Fast                | Moderate                 |
| **Precision**      | Low-Medium       | Medium-High         | High                     |

## When to Use Each Tool

- **`semantic_symbol_search`**: When you need to find specific code symbols (classes, functions) by name and understand their structure
- **`codebase_search`**: When you need to find code that conceptually does something (e.g., "authentication logic")
- **`search_files`**: When you need fast text/regex pattern matching across files

## Advanced Features

### Symbol Kind Reference

Common combinations for `symbol_kinds` parameter:

```xml
<!-- Classes and interfaces only -->
<symbol_kinds>["5", "11"]</symbol_kinds>

<!-- Functions and methods -->
<symbol_kinds>["6", "12"]</symbol_kinds>

<!-- All types (classes, interfaces, enums) -->
<symbol_kinds>["5", "10", "11"]</symbol_kinds>

<!-- Variables and constants -->
<symbol_kinds>["13", "14"]</symbol_kinds>
```

### Performance Considerations

- Searches are limited to 100 results maximum for performance
- Reference analysis is limited to the first 10 symbols found
- Large workspaces may have slower initial LSP indexing
- File pattern filtering can significantly improve search speed

## Integration with Development Workflow

The `semantic_symbol_search` tool integrates seamlessly with other Aincrok tools:

1. **Discovery Phase**: Use `semantic_symbol_search` to find relevant symbols
2. **Analysis Phase**: Use `semantic_read_file` to understand found symbols in detail
3. **Modification Phase**: Use editing tools to make changes to the identified code
4. **Validation Phase**: Use `search_files` or `codebase_search` to verify changes don't break anything
