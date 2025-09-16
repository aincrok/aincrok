# Semantic Code Understanding

Aincrok provides advanced semantic code analysis capabilities through its LSP-powered tools. These tools go beyond text-based analysis to understand your code's structure, symbols, and relationships at a deep semantic level.

## Overview

Semantic code understanding uses the Language Server Protocol (LSP) to provide:

- **Symbol-aware analysis**: Understands classes, functions, variables, and their relationships
- **Real-time code comprehension**: No external setup or indexing required
- **Multi-language support**: Works with TypeScript, JavaScript, Python, Java, Go, Rust, and C++
- **Intelligent fallback**: Gracefully degrades to text-based analysis when needed

## Core Tools

### semantic_read_file

Analyzes individual files with semantic understanding, providing detailed symbol information and hierarchical relationships.

**Best for:**

- Understanding class structures and method signatures
- Analyzing file-level architecture
- Finding specific symbols within a file
- Understanding code relationships and dependencies

### semantic_symbol_search

Searches for symbols across your entire workspace using LSP's symbol provider capabilities.

**Best for:**

- Finding classes, functions, or variables by name across the project
- Locating all implementations of interfaces or base classes
- Understanding symbol distribution across files
- Analyzing workspace-wide code patterns

## Practical Usage Patterns

### Understanding New Codebases

When working with unfamiliar code, use semantic tools to quickly understand structure:

```
1. semantic_read_file on main entry points
2. semantic_symbol_search for key concepts
3. semantic_read_file on discovered important files
```

**Example workflow:**

- Analyze `main.ts` or `index.js` to understand application structure
- Search for "Service" or "Controller" to find architectural patterns
- Examine key service classes for business logic understanding

### Refactoring Assistance

Before making large changes, use semantic analysis to understand impact:

```
1. semantic_symbol_search to find all usages of a symbol
2. semantic_read_file to understand implementation details
3. Plan refactoring based on semantic relationships
```

**Example workflow:**

- Search for all classes implementing a specific interface
- Analyze each implementation's structure and dependencies
- Plan breaking changes with full context of usage patterns

### Code Architecture Analysis

Understand project architecture through semantic exploration:

```
1. semantic_symbol_search for architectural patterns
2. semantic_read_file on key architectural files
3. Map relationships between major components
```

**Example workflow:**

- Search for "Repository", "Service", "Controller" patterns
- Analyze base classes and interfaces
- Understand dependency injection patterns

## Advanced Filtering Techniques

### Symbol Kind Filtering

Use LSP symbol kinds for precise filtering:

```xml
<!-- Classes only -->
<semantic_symbol_search>
<query>User</query>
<symbol_kinds>["5"]</symbol_kinds>
</semantic_symbol_search>

<!-- Functions and methods -->
<semantic_read_file>
<path>services/UserService.ts</path>
<symbol_kinds>["6", "12"]</symbol_kinds>
</semantic_read_file>

<!-- Interfaces and types -->
<semantic_symbol_search>
<query>Config</query>
<symbol_kinds>["11"]</symbol_kinds>
</semantic_symbol_search>
```

### Name Pattern Matching

Filter symbols by name patterns:

```xml
<!-- Find all authentication-related symbols -->
<semantic_symbol_search>
<query>auth</query>
</semantic_symbol_search>

<!-- Find user-related interfaces in a file -->
<semantic_read_file>
<path>types/index.ts</path>
<symbol_query>user</symbol_query>
</semantic_read_file>
```

### File Pattern Restrictions

Limit searches to specific file patterns:

```xml
<!-- Search only in service files -->
<semantic_symbol_search>
<query>create</query>
<file_pattern>service</file_pattern>
</semantic_symbol_search>
```

## Best Practices

### 1. Start Broad, Then Narrow

Begin with general searches and progressively narrow down:

```
semantic_symbol_search("User") → identify key files
semantic_read_file(key_files) → understand structure
semantic_symbol_search("User", specific_kinds) → find specific types
```

### 2. Use Appropriate Tools

- **File-level analysis**: Use `semantic_read_file`
- **Workspace-wide search**: Use `semantic_symbol_search`
- **Specific symbol finding**: Combine both tools

### 3. Leverage Symbol Hierarchies

Use hierarchical analysis for complex structures:

```xml
<semantic_read_file>
<path>services/PaymentService.ts</path>
<max_depth>2</max_depth>
</semantic_read_file>
```

### 4. Handle Language Differences

Different languages provide different levels of semantic information:

- **TypeScript/JavaScript**: Full symbol analysis, type information
- **Python**: Class and function analysis, limited type information
- **Java**: Complete OOP analysis, inheritance relationships
- **Go**: Package and function analysis, interface implementations
- **Rust**: Module and trait analysis, ownership patterns
- **C++**: Class hierarchy analysis, template information

## Language-Specific Tips

### TypeScript/JavaScript

- Use symbol filtering to distinguish between interfaces and classes
- Look for method signatures and parameter types
- Analyze import/export relationships

### Python

- Focus on class and function definitions
- Pay attention to docstring information in symbol details
- Use name filtering for method discovery (e.g., "test\_", "**init**")

### Java

- Leverage interface and abstract class analysis
- Use package-level symbol searches
- Analyze inheritance hierarchies with depth settings

### Go

- Search for interface implementations
- Analyze package structure and exported symbols
- Use file pattern matching for package-specific searches

## Troubleshooting

### LSP Not Working

If semantic analysis fails:

1. **Check language server**: Ensure LSP is running for the file type
2. **Verify file syntax**: Syntax errors can prevent LSP analysis
3. **Restart language server**: Use VS Code command palette to restart
4. **Use fallback**: Tools automatically fall back to text-based analysis

### Performance Optimization

For large files or workspaces:

1. **Limit symbol kinds**: Filter to only needed symbol types
2. **Use file patterns**: Restrict searches to relevant files
3. **Control max results**: Reduce result count for faster processing
4. **Progressive analysis**: Analyze files incrementally

### Common Issues

**Empty Results:**

- File may not contain analyzable symbols
- Language server might not be initialized
- Symbol query might be too specific

**Slow Performance:**

- Large workspace requires patience for initial LSP startup
- Complex files take longer to analyze
- Network issues can affect remote language servers

## Integration with Other Tools

Semantic tools work best when combined with other Aincrok capabilities:

### With Codebase Search

- Use semantic tools for precise symbol analysis
- Use codebase search for conceptual code discovery
- Combine for comprehensive code understanding

### With File Operations

- Semantic analysis before code modifications
- Structure-aware editing based on symbol relationships
- Validation of changes against semantic context

### With Task Management

- Use semantic analysis to break down complex tasks
- Create subtasks based on symbol-level understanding
- Track progress through architectural components

## Future Enhancements

Planned improvements for semantic code understanding:

- **Enhanced relationship analysis**: Deeper symbol dependency tracking
- **Cross-file symbol resolution**: Better understanding of imports and references
- **Semantic refactoring suggestions**: AI-powered code improvement recommendations
- **Custom symbol definitions**: User-defined symbol types and patterns
- **Performance optimizations**: Faster analysis for large codebases
