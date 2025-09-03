# semantic_read_file

The `semantic_read_file` tool analyzes files using Language Server Protocol (LSP) to provide semantic understanding of code structure, symbols, and relationships instead of just raw text. It enhances traditional file reading with intelligent code analysis.

## Parameters

The tool accepts these parameters:

- `path` (required): The path of the file to analyze relative to the current working directory
- `symbol_query` (optional): Filter symbols by name (case-insensitive substring matching)
- `symbol_kinds` (optional): Array of LSP symbol kinds to include (e.g., ["5", "6"] for classes and methods)
- `include_relationships` (optional): Whether to analyze symbol relationships and references (true/false)
- `max_depth` (optional): Maximum depth for symbol hierarchy analysis (1-3, default: 1)

## What It Does

This tool uses LSP to understand the semantic structure of code files, providing symbol-level analysis including classes, methods, interfaces, variables, and their relationships. When LSP analysis fails, it gracefully falls back to traditional text-based reading.

## When is it used?

- When Aincrok needs to understand code architecture and symbol relationships
- When analyzing class hierarchies and method signatures
- When searching for specific types of code symbols (classes, functions, etc.)
- When understanding complex codebases with multiple interconnected components
- When traditional text-based analysis isn't sufficient for code comprehension

## Key Features

- **LSP-Powered Analysis**: Uses Language Server Protocol for accurate semantic understanding
- **Symbol Filtering**: Filter results by symbol names or types (classes, methods, interfaces, etc.)
- **Hierarchical Analysis**: Understands nested structures and parent-child relationships
- **Multi-Language Support**: Works with TypeScript, JavaScript, Python, Java, Go, Rust, C++
- **Graceful Fallback**: Automatically falls back to text-based reading when LSP fails
- **Relationship Mapping**: Analyzes how symbols relate to and reference each other
- **Context-Aware**: Provides symbol context including documentation and signatures

## Supported Languages

The semantic analysis works best with these languages:

- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx)
- Python (.py)
- Java (.java)
- Go (.go)
- Rust (.rs)
- C++ (.cpp, .hpp, .cc)

For unsupported file types, the tool automatically falls back to traditional text-based reading.

## Limitations

- Requires VS Code Language Server Protocol support for the target language
- May fall back to text-based reading for files with syntax errors
- Performance depends on LSP initialization and file complexity
- Symbol relationships analysis may be limited for some languages

## How It Works

When the `semantic_read_file` tool is invoked, it follows this process:

1. **LSP Initialization**: Initializes the internal symbolic LSP system
2. **Language Detection**: Determines if the file type supports semantic analysis
3. **Symbol Analysis**: Uses VS Code's document symbol provider to extract code structure
4. **Filtering & Processing**: Applies any symbol filters and processes hierarchical relationships
5. **Fallback Handling**: If LSP fails, automatically switches to text-based reading
6. **Result Formatting**: Returns structured symbol information with metadata

## Symbol Kinds Reference

LSP defines standard symbol kinds that can be filtered:

- `1`: File
- `2`: Module
- `3`: Namespace
- `4`: Package
- `5`: Class
- `6`: Method
- `7`: Property
- `8`: Field
- `9`: Constructor
- `10`: Enum
- `11`: Interface
- `12`: Function
- `13`: Variable
- `14`: Constant

## Usage Examples

### Basic Semantic Analysis

To analyze a TypeScript file's structure:

**Input:**

```xml
<semantic_read_file>
<path>src/services/UserService.ts</path>
</semantic_read_file>
```

**Simulated Output:**

```xml
<semantic_read_file path="src/services/UserService.ts" semantic_analysis success="true" language="typescript" symbol_count="8">
<symbols count="8">
<symbol name="UserService" kind="Class" start_line="5" end_line="45">
<documentation>Service class for user management operations</documentation>
<content>
export class UserService {
  private database: Database
  // ... rest of class
}
</content>
<children count="4">
<symbol name="constructor" kind="Constructor" start_line="8" end_line="10" />
<symbol name="createUser" kind="Method" start_line="12" end_line="18" />
<symbol name="findUser" kind="Method" start_line="20" end_line="25" />
<symbol name="deleteUser" kind="Method" start_line="27" end_line="32" />
</children>
</symbol>
</symbols>
</semantic_read_file>
```

### Filtering by Symbol Type

To find only classes in a file:

**Input:**

```xml
<semantic_read_file>
<path>src/models/index.ts</path>
<symbol_kinds>["5"]</symbol_kinds>
</semantic_read_file>
```

This returns only symbols of kind "5" (classes).

### Symbol Name Filtering

To find symbols containing "User" in their name:

**Input:**

```xml
<semantic_read_file>
<path>src/types.ts</path>
<symbol_query>User</symbol_query>
</semantic_read_file>
```

### Including Relationships

To analyze symbol relationships and references:

**Input:**

```xml
<semantic_read_file>
<path>src/components/UserComponent.tsx</path>
<include_relationships>true</include_relationships>
</semantic_read_file>
```

**Additional Output:**

```xml
<relationships>
<!-- Relationship analysis not yet fully implemented -->
</relationships>
```

### Fallback to Text-Based Reading

When analyzing an unsupported file or when LSP fails:

**Input:**

```xml
<semantic_read_file>
<path>config.toml</path>
</semantic_read_file>
```

**Simulated Output:**

```xml
<semantic_read_file path="config.toml" semantic_analysis success="false" fallback="text_based">
<error>No symbols found in file</error>
<content>
[database]
host = "localhost"
port = 5432
</content>
</semantic_read_file>
```

## Comparison with read_file

| Feature             | `read_file`        | `semantic_read_file`     |
| ------------------- | ------------------ | ------------------------ |
| **Purpose**         | Raw text reading   | Semantic code analysis   |
| **Output**          | Line-numbered text | Structured symbol data   |
| **Language Aware**  | No                 | Yes (via LSP)            |
| **Symbol Analysis** | No                 | Yes                      |
| **Relationships**   | No                 | Yes (planned)            |
| **Fallback**        | N/A                | Yes, to text-based       |
| **Performance**     | Fast               | Moderate (LSP dependent) |

## When to Use Each Tool

- Use `semantic_read_file` when you need to understand code structure, find specific symbols, or analyze relationships
- Use `read_file` when you need raw file content, specific line ranges, or working with non-code files
- `semantic_read_file` automatically falls back to `read_file` behavior when semantic analysis isn't possible
