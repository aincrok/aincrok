# Aincrok Template System

Aincrok's template system allows you to create reusable prompts, custom modes, and workflow patterns for common coding scenarios.

## Template Types

### 1. Prompt Templates

Pre-built prompts for common coding tasks

### 2. Mode Templates

Custom modes with specific behavior patterns

### 3. Workflow Templates

Multi-step processes for complex tasks

### 4. Context Templates

Structured ways to provide project context

## Prompt Templates

### Creating Basic Templates

Create templates in your workspace `.aincrok/templates/` directory:

```yaml
# .aincrok/templates/code-review.yaml
name: "Code Review"
description: "Comprehensive code review template"
category: "quality"
template: |
    Please review the following code for:

    1. **Code Quality**
       - Clean code principles
       - Readability and maintainability
       - Performance considerations

    2. **Security**
       - Common vulnerabilities  
       - Input validation
       - Authentication/authorization

    3. **Best Practices**
       - Language-specific conventions
       - Design patterns usage
       - Error handling

    4. **Testing**
       - Test coverage
       - Test quality
       - Missing test cases

    Focus on: {{focus_area}}
    Severity level: {{severity_level}}

    {{code_context}}
```

### Using Templates

```typescript
// Via command palette
// Aincrok: Use Template > Code Review

// Via API
await aincrok.useTemplate("code-review", {
	focus_area: "security",
	severity_level: "critical",
	code_context: "@currentFile",
})
```

### Template Variables

| Variable           | Description             | Example               |
| ------------------ | ----------------------- | --------------------- |
| `{{currentFile}}`  | Current active file     | `src/utils/api.ts`    |
| `{{selectedText}}` | Currently selected text | Selected code block   |
| `{{projectName}}`  | Workspace name          | `my-react-app`        |
| `{{language}}`     | Current file language   | `typescript`          |
| `{{timestamp}}`    | Current timestamp       | `2024-01-15 10:30:00` |
| `{{gitBranch}}`    | Current git branch      | `feature/user-auth`   |

### Dynamic Templates

```yaml
name: "Language-Specific Refactor"
description: "Refactoring based on file language"
conditions:
    - language: "typescript"
      template: |
          Refactor this TypeScript code to use:
          - Proper type definitions
          - Modern ES6+ features
          - Async/await patterns
    - language: "python"
      template: |
          Refactor this Python code to follow:
          - PEP 8 style guidelines
          - Type hints
          - Modern Python patterns
    - default:
      template: |
          Refactor this {{language}} code following best practices
```

## Mode Templates

### Creating Custom Modes

```yaml
# .aincrok/modes/architect.yaml
name: "System Architect"
description: "High-level system design and architecture"
systemPrompt: |
    You are a senior system architect. Focus on:
    - System design patterns
    - Scalability considerations  
    - Technology stack decisions
    - Integration patterns
    - Performance architecture

temperature: 0.3
maxTokens: 8192
tools:
    - readFile
    - writeFile
    - listFiles
    - executeCommand

contextRules:
    - includeProjectStructure: true
    - maxFiles: 20
    - prioritizeConfigFiles: true
```

### Mode Inheritance

```yaml
# .aincrok/modes/senior-developer.yaml
name: "Senior Developer"
extends: "code" # Inherit from base code mode
systemPrompt: |
    You are a senior developer with 10+ years of experience.
    {{parent.systemPrompt}}

    Additional focus areas:
    - Code architecture decisions
    - Performance optimizations
    - Security best practices

temperature: 0.2 # Override parent temperature
```

### Conditional Modes

```yaml
name: "Smart Debug"
description: "Context-aware debugging mode"
conditions:
    - hasErrors: true
      systemPrompt: |
          You're debugging code with active errors. Focus on:
          - Error analysis and root cause
          - Step-by-step debugging approach
          - Fix verification
    - hasTests: false
      systemPrompt: |
          No tests detected. Focus on:
          - Writing comprehensive tests
          - Test-driven debugging
          - Coverage improvement
    - default:
      systemPrompt: |
          General debugging assistance
```

## Workflow Templates

### Multi-Step Workflows

```yaml
# .aincrok/workflows/feature-development.yaml
name: "Feature Development Workflow"
description: "Complete feature development process"
steps:
    - name: "Planning"
      template: "feature-planning"
      autoAdvance: false

    - name: "Implementation"
      template: "feature-implementation"
      context:
          - requirementsDocs
          - existingCode
      autoAdvance: false

    - name: "Testing"
      template: "feature-testing"
      dependencies: ["Implementation"]

    - name: "Documentation"
      template: "feature-documentation"
      dependencies: ["Implementation", "Testing"]

    - name: "Review"
      template: "code-review"
      dependencies: ["Documentation"]
```

### Conditional Workflows

```yaml
name: "Bug Fix Workflow"
triggers:
    - issueLabels: ["bug"]
    - branchPrefix: "fix/"

steps:
    - name: "Reproduce"
      condition: "!hasReproductionSteps"
      template: |
          First, let's reproduce this bug:
          1. Analyze the reported issue
          2. Create minimal reproduction case
          3. Identify root cause

    - name: "Fix Implementation"
      template: |
          Implement the fix:
          1. Write failing test case
          2. Implement minimal fix
          3. Verify test passes

    - name: "Regression Testing"
      template: |
          Ensure no regressions:
          1. Run full test suite
          2. Check related functionality
          3. Manual testing if needed
```

## Context Templates

### Project Context Templates

```yaml
# .aincrok/context/react-project.yaml
name: "React Project Context"
description: "Standard context for React applications"
files:
    required:
        - "package.json"
        - "src/App.tsx"
        - "src/index.tsx"
    optional:
        - "README.md"
        - "tsconfig.json"
        - ".env*"

directories:
    include:
        - "src/"
        - "public/"
    exclude:
        - "node_modules/"
        - "build/"
        - "dist/"

patterns:
    components: "src/components/**/*.{tsx,ts}"
    hooks: "src/hooks/**/*.{tsx,ts}"
    utils: "src/utils/**/*.{tsx,ts}"
    tests: "src/**/*.{test,spec}.{tsx,ts}"

contextPrompt: |
    This is a React application with the following structure:

    **Tech Stack:**
    - React with TypeScript
    - {{detectedLibraries}}

    **Key Components:**
    {{componentsList}}

    **Current Focus Area:** {{focusArea}}
```

### Language-Specific Context

```yaml
# .aincrok/context/python-project.yaml
name: "Python Project Context"
files:
  required:
    - "requirements.txt or pyproject.toml"
  optional:
    - "README.md"
    - ".env"
    - "Dockerfile"

structure:
  mainModule: "src/" or "app/"
  tests: "tests/" or "test/"
  config: "config/" or "settings/"

contextPrompt: |
  This is a Python project following {{projectStructure}} structure.

  **Dependencies:** {{dependencies}}
  **Python Version:** {{pythonVersion}}
  **Framework:** {{detectedFramework}}
```

## Template Collections

### Built-in Collections

Aincrok includes several built-in template collections:

#### Code Quality Collection

- code-review
- refactoring
- performance-optimization
- security-audit

#### Testing Collection

- unit-test-generation
- integration-testing
- test-coverage-analysis
- test-refactoring

#### Documentation Collection

- api-documentation
- readme-generation
- code-comments
- architecture-docs

#### Debugging Collection

- error-analysis
- performance-debugging
- memory-profiling
- integration-debugging

### Custom Collections

```yaml
# .aincrok/collections/my-team-templates.yaml
name: "Team Templates"
description: "Company-specific templates"
templates:
    - name: "Company Code Review"
      template: |
          Review following our company standards:

          **Checklist:**
          - [ ] Follows company style guide
          - [ ] Has proper error handling
          - [ ] Includes appropriate logging
          - [ ] Security considerations addressed
          - [ ] Performance implications considered

          **Focus Areas:**
          {{focus_areas}}

    - name: "Feature Documentation"
      template: |
          Document this feature according to our template:

          ## Feature: {{feature_name}}

          ### Purpose
          {{purpose}}

          ### Technical Implementation
          {{implementation_details}}

          ### API Changes
          {{api_changes}}

          ### Testing Strategy
          {{testing_strategy}}
```

## Template Management

### Template Discovery

Aincrok searches for templates in:

1. `.aincrok/templates/` (project-specific)
2. `~/.aincrok/templates/` (user global)
3. Extension built-ins

### Template Validation

```bash
# Validate template syntax
aincrok validate-template my-template.yaml

# Test template with sample data
aincrok test-template my-template.yaml --data sample-data.json
```

### Template Sharing

```bash
# Export templates
aincrok export-templates --output team-templates.zip

# Import templates
aincrok import-templates team-templates.zip

# Publish to registry
aincrok publish-template my-template.yaml --registry company-registry
```

## Advanced Template Features

### Template Inheritance

```yaml
name: "Advanced React Component"
extends: "react-component"
additionalPrompts:
    - accessibility-check
    - performance-optimization

overrides:
    temperature: 0.1
    tools:
        - readFile
        - writeFile
        - executeCommand
        - browserAction
```

### Conditional Logic

```yaml
name: "Smart Code Generation"
conditions:
    - if: "{{language}} === 'typescript'"
      then:
          template: "typescript-specific-template"
          tools: ["tsCompiler"]
    - if: "{{hasTests}} === false"
      then:
          additionalPrompt: "Also generate comprehensive tests"
    - else:
          template: "default-template"
```

### Template Hooks

```yaml
name: "Full Stack Feature"
hooks:
    beforeExecution: |
        // Validate project structure
        if (!hasBackend || !hasFrontend) {
          throw new Error("Full stack template requires both backend and frontend");
        }

    afterExecution: |
        // Run tests and build
        await executeCommand("npm test");
        await executeCommand("npm run build");

    onError: |
        // Cleanup on failure
        await executeCommand("git checkout .");
```

## Best Practices

### Template Design

- Keep templates focused and specific
- Use clear variable names
- Include helpful descriptions
- Provide examples in documentation

### Performance

- Avoid overly complex conditional logic
- Cache frequently used templates
- Use appropriate context sizes

### Maintenance

- Version your templates
- Test templates regularly
- Update templates when tools change
- Document template dependencies

### Team Collaboration

- Use consistent naming conventions
- Share templates via version control
- Review template changes
- Maintain template documentation

---

For more examples, check the `examples/` directory in the Aincrok repository or visit our [Template Gallery](https://github.com/your-org/aincrok-templates).
