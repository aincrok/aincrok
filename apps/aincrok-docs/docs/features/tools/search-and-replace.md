# search_and_replace

The `search_and_replace` tool is a powerful text replacement utility that allows you to find and replace text patterns within files. It supports both literal string matching and regular expressions, with precise control over the replacement scope.

## Purpose

Find and replace text patterns in files with support for literal strings, regular expressions, and targeted line ranges. All changes are previewed before application.

## Parameters

| Parameter        | Type    | Required | Description                                                       |
| ---------------- | ------- | -------- | ----------------------------------------------------------------- |
| `path`           | string  | Yes      | Path to the target file                                           |
| `old_str`        | string  | Yes      | Text pattern to search for                                        |
| `new_str`        | string  | Yes      | Replacement text                                                  |
| `case_sensitive` | boolean | No       | Whether search should be case-sensitive (default: true)           |
| `is_regex`       | boolean | No       | Whether to treat old_str as a regular expression (default: false) |
| `line_start`     | integer | No       | Starting line number for targeted replacement (1-based)           |
| `line_end`       | integer | No       | Ending line number for targeted replacement (1-based)             |

## How It Works

1. **File Reading**: Loads the target file content
2. **Parameter Validation**: Verifies search parameters and line ranges
3. **Pattern Construction**: Creates search pattern (literal or regex)
4. **Search Execution**: Finds all matching occurrences
5. **Replacement Generation**: Applies replacements to matched text
6. **Diff Preview**: Shows before/after comparison
7. **User Approval**: Requires explicit approval before saving changes

## Usage Examples

### Simple Text Replacement

Replace all occurrences of a variable name:

```
- Path: src/calculator.js
- Old String: "oldVariableName"
- New String: "newVariableName"
- Case Sensitive: true
```

### Case-Insensitive Replacement

Update text regardless of case:

```
- Path: README.md
- Old String: "old project name"
- New String: "New Project Name"
- Case Sensitive: false
```

### Regular Expression Replacement

Update function call patterns:

```
- Path: src/api.js
- Old String: "fetch\('([^']+)'\)"
- New String: "apiClient.get('$1')"
- Is Regex: true
```

### Targeted Line Range Replacement

Replace text only within specific lines:

```
- Path: config/settings.py
- Old String: "DEBUG = False"
- New String: "DEBUG = True"
- Line Start: 10
- Line End: 30
```

## Advanced Features

### Regular Expression Support

**Capture Groups**: Use parentheses to capture parts of the match

```javascript
// Replace: function (\w+)\(
// With: const $1 = (
// Result: function myFunc( → const myFunc = (
```

**Character Classes**: Match specific character types

```javascript
// Replace: \d{4}-\d{2}-\d{2}
// With: new Date('$&')
// Result: 2023-12-25 → new Date('2023-12-25')
```

**Quantifiers**: Control matching behavior

```javascript
// Replace: /\*\*(.+?)\*\*/
// With: <strong>$1</strong>
// Result: **bold text** → <strong>bold text</strong>
```

### Line Range Targeting

**Specific Function**: Target only lines within a function

```python
# Lines 45-60: Replace only within calculate_total function
- Line Start: 45
- Line End: 60
- Old String: "price"
- New String: "cost"
```

**Configuration Section**: Update only part of a config file

```yaml
# Lines 15-25: Update only the database configuration
- Line Start: 15
- Line End: 25
- Old String: "localhost"
- New String: "db.example.com"
```

## Interactive Features

### Diff Preview

Before applying changes, you'll see:

- **Match Count**: Number of occurrences found
- **Context Lines**: Surrounding code for each match
- **Before/After**: Exact changes that will be made
- **Line Numbers**: Precise location of each change

### Approval Process

- **Review Required**: All changes must be explicitly approved
- **Selective Changes**: Can reject specific replacements
- **Modification Options**: Can adjust parameters and retry

## Common Use Cases

### Code Refactoring

- **Variable Renaming**: Update variable names across a file
- **Function Updates**: Change function calls or signatures
- **Import Changes**: Update import statements or module names
- **API Migration**: Convert old API calls to new formats

### Documentation Updates

- **Brand Changes**: Update product names or company references
- **URL Updates**: Change links or references to new locations
- **Version Numbers**: Update version references in documentation
- **Terminology**: Standardize language and terminology

### Configuration Management

- **Environment Variables**: Update configuration values
- **Feature Flags**: Enable or disable feature flags
- **Database Settings**: Update connection strings or settings
- **Path Updates**: Change file paths or directory references

## Best Practices

### Pattern Design

- **Test Regex**: Validate regular expressions before using
- **Escape Special Characters**: Use proper escaping in regex patterns
- **Be Specific**: Create patterns that match exactly what you want
- **Consider Edge Cases**: Think about variations in the text

### Replacement Strategy

- **Backup Important Files**: Consider version control before major changes
- **Start Small**: Test on a small section first when possible
- **Review Carefully**: Always review the diff before approving
- **Test After Changes**: Verify functionality after replacements

### Performance Considerations

- **Large Files**: Be cautious with very large files
- **Complex Regex**: Complex patterns may be slower
- **Line Ranges**: Use line ranges to limit scope when possible
- **Multiple Operations**: Consider breaking large operations into smaller ones

## Error Handling

### Common Errors

- **File Not Found**: Target file doesn't exist
- **Invalid Regex**: Malformed regular expression pattern
- **Permission Denied**: Cannot write to target file
- **Line Range Error**: Invalid or out-of-bounds line numbers

### Troubleshooting

- **Verify File Path**: Ensure the file exists and is accessible
- **Test Regex Patterns**: Use online regex testers to validate patterns
- **Check Permissions**: Ensure write access to the target file
- **Validate Line Numbers**: Use `read_file` to check file length

## Integration with Other Tools

### Workflow Combinations

1. **Search Then Replace**: Use `search_files` to find candidates, then replace
2. **Read and Replace**: Use `read_file` to understand structure, then replace
3. **Verify Changes**: Use `read_file` after replacement to confirm success

### Complementary Tools

- **`search_files`**: Find files containing the text to replace
- **`read_file`**: Examine file content before making changes
- **`apply_diff`**: For more complex structural changes
- **`codebase_search`**: Search across entire codebase for patterns

## Limitations

### Scope Restrictions

- Works on one file at a time
- Cannot create new files
- Requires existing file to be readable/writable

### Pattern Limitations

- Regular expressions follow JavaScript regex syntax
- Some advanced regex features may not be available
- Very complex patterns may impact performance

### Safety Features

- All changes require manual approval
- Cannot be automated or batched
- Original content is preserved until approval

The `search_and_replace` tool provides powerful, precise text replacement capabilities with comprehensive safety features. It's essential for refactoring, updating, and maintaining code files while ensuring you maintain full control over the changes being made.
