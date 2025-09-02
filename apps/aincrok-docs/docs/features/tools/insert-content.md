# insert_content

The `insert_content` tool allows you to add new content to existing files at specific line numbers without modifying the original content. This tool is particularly useful for adding import statements, inserting new functions, or appending configuration blocks.

## Purpose

Insert new content into an existing file at a precise location while preserving all existing content.

## Parameters

| Parameter | Type    | Required | Description                                                                  |
| --------- | ------- | -------- | ---------------------------------------------------------------------------- |
| `path`    | string  | Yes      | The path to the target file                                                  |
| `line`    | integer | Yes      | Line number for insertion (1-based indexing). Use 0 to append to end of file |
| `content` | string  | Yes      | The text content to insert                                                   |

## How It Works

1. **File Validation**: Verifies the target file exists and is readable
2. **Content Preparation**: Formats the content for insertion
3. **Line Positioning**: Calculates the exact insertion point
4. **Preview Generation**: Shows a diff of the proposed changes
5. **User Approval**: Requires explicit approval before making changes
6. **Content Insertion**: Inserts the content at the specified location

## Usage Examples

### Adding Import Statements

```
Insert a new import statement at the top of a JavaScript file:
- Path: src/utils/helpers.js
- Line: 2 (after existing imports)
- Content: import { validateEmail } from './validation';
```

### Inserting New Functions

```
Add a new function to an existing Python module:
- Path: src/calculations.py
- Line: 45 (after the existing calculate_total function)
- Content:
def calculate_average(numbers):
    """Calculate the average of a list of numbers."""
    return sum(numbers) / len(numbers) if numbers else 0
```

### Appending Configuration

```
Add a new configuration block to the end of a file:
- Path: config/settings.json
- Line: 0 (append to end)
- Content: ,
  "debug": {
    "enabled": true,
    "level": "info"
  }
```

## Interactive Features

### Diff Preview

Before making changes, Aincrok shows you:

- The exact location where content will be inserted
- A before/after view of the affected lines
- Context lines around the insertion point

### Approval Process

- You must explicitly approve the changes
- You can reject and modify the request
- The file remains unchanged until approval

## Common Use Cases

### Code Development

- **Import Management**: Add new import statements at the top of files
- **Function Addition**: Insert new functions or methods in appropriate locations
- **Configuration Updates**: Add new configuration sections or variables

### File Maintenance

- **Documentation**: Insert new sections in documentation files
- **Logging**: Add logging statements at specific points
- **Comments**: Insert explanatory comments or TODO items

### Project Setup

- **Dependencies**: Add new dependencies to package files
- **Environment Variables**: Insert new environment variable definitions
- **Script Commands**: Add new script commands to package.json or similar files

## Line Number Guidelines

### Understanding Line Numbers

- **Line 1**: First line of the file
- **Line N**: Content is inserted BEFORE the specified line
- **Line 0**: Special case - appends content to the end of file

### Best Practices

- **Check Current Content**: Use `read_file` first to understand the file structure
- **Count Carefully**: Ensure line numbers are accurate
- **Consider Context**: Insert content in logical locations

## Limitations

### File Requirements

- Target file must exist (cannot create new files)
- File must be readable and writable
- Binary files are not supported

### Content Constraints

- Cannot replace or delete existing content
- Cannot modify existing lines
- Must specify exact insertion point

### Process Requirements

- Interactive approval is mandatory
- Cannot be automated or batched
- Each insertion requires separate tool call

## Error Handling

### Common Errors

- **File Not Found**: Specified file doesn't exist
- **Permission Denied**: Cannot write to the target file
- **Invalid Line Number**: Line number exceeds file length
- **Encoding Issues**: File contains incompatible character encoding

### Recovery Strategies

- Verify file paths before insertion
- Check file permissions and ownership
- Use `read_file` to confirm file structure
- Handle encoding issues by specifying file encoding

## Integration with Other Tools

### Workflow Combinations

1. **Plan Then Insert**: Use `read_file` to understand structure, then `insert_content`
2. **Search and Add**: Use `search_files` to find insertion points, then add content
3. **Verify Changes**: Use `read_file` again to confirm insertion success

### Complementary Tools

- **`read_file`**: Understand file content before insertion
- **`search_files`**: Find appropriate insertion locations
- **`apply_diff`**: For more complex edits involving replacements
- **`write_to_file`**: For complete file rewrites

## Best Practices

### Planning Insertions

- Always read the target file first
- Identify the logical insertion point
- Consider the impact on surrounding code
- Plan for proper indentation and formatting

### Content Formatting

- Match existing code style and indentation
- Include appropriate line breaks
- Consider syntax requirements (semicolons, commas, etc.)
- Add necessary spacing for readability

### Approval Strategy

- Review the diff carefully before approving
- Ensure the insertion won't break existing functionality
- Verify proper formatting and syntax
- Consider running tests after insertion

The `insert_content` tool provides precise, controlled content insertion capabilities that complement Aincrok's broader file editing toolkit. Use it when you need to add new content without disrupting existing file structure.
