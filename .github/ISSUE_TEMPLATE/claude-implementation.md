---
name: 🤖 Claude Implementation Request
about: Request Claude Code to autonomously implement a feature or fix
title: "[CLAUDE] "
labels: ["claude-ready", "enhancement"]
assignees: []
---

# 🤖 Claude Code Implementation Request

## Summary

<!-- Brief, clear description of what needs to be implemented -->

## Requirements

<!-- Detailed requirements that Claude should implement -->

### Must Have

- [ ] <!-- Requirement 1 -->
- [ ] <!-- Requirement 2 -->

### Nice to Have

- [ ] <!-- Optional feature 1 -->
- [ ] <!-- Optional feature 2 -->

## Implementation Context

### Files Likely to Change

<!-- Help Claude understand the scope -->

- `src/` - <!-- Describe changes needed -->
- `webview-ui/` - <!-- Describe UI changes if any -->

### Related Code/Components

<!-- Mention related files, functions, or components Claude should be aware of -->

## Acceptance Criteria

<!-- Clear criteria to verify implementation is complete -->

- [ ] <!-- Criteria 1 -->
- [ ] <!-- Criteria 2 -->
- [ ] Tests pass
- [ ] Linting passes
- [ ] Type checking passes

## Design Considerations

<!-- Any specific design patterns, architecture decisions, or constraints -->

## Testing Strategy

<!-- How should this be tested? -->

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing steps:
    1. <!-- Step 1 -->
    2. <!-- Step 2 -->

---

## 🚀 Implementation Commands

**To start autonomous implementation:**

```
@claude implement
```

**For planning only (no code changes):**

```
@claude implement --plan-only
```

**For draft PR (requires human approval before merging):**

```
@claude implement --draft
```

---

## ⚠️ Implementation Guidelines

**Claude will automatically:**

- ✅ Analyze the issue and create implementation plan
- ✅ Create feature branch (`claude/issue-{number}-{description}`)
- ✅ Implement the solution following project conventions
- ✅ Run tests, linting, and type checking
- ✅ Create comprehensive pull request
- ✅ Perform self-review of the implementation
- ✅ Link PR to this issue

**Safety measures:**

- 🛡️ Maximum 50 files changed per implementation
- 🛡️ No changes to workflow or security-sensitive files
- 🛡️ All changes made in feature branches (never main)
- 🛡️ Human approval required before merging

**Best suited for:**

- 🎯 Well-defined features with clear requirements
- 🐛 Bug fixes with specific reproduction steps
- 📚 Documentation improvements
- 🧪 Test additions
- ♻️ Refactoring with clear scope

**May require human assistance:**

- 🤔 Complex architectural decisions
- 🔐 Security-sensitive changes
- 🎨 UI/UX design decisions
- 🔀 Large-scale refactoring
