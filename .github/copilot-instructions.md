# Aincrok Change Marking Guidelines

We are a fork of Kilocode. We regularly merge in the Kilocode codebase. To enable us to merge more easily, we mark all
our own changes with `aincrok_change` comments.

## Basic Usage

### Single Line Changes

For single line changes, add the comment at the end of the line:

```typescript
let i = 2 // aincrok_change
```

### Multi-line Changes

For multiple consecutive lines, wrap them with start/end comments:

```typescript
// aincrok_change start
let i = 2
let j = 3
// aincrok_change end
```

## Language-Specific Examples

### HTML/JSX/TSX

```html
{/* aincrok_change start */}
<CustomAincrokComponent />
{/* aincrok_change end */}
```

### CSS/SCSS

```css
/* aincrok_change */
.aincrok-specific-class {
	color: blue;
}

/* aincrok_change start */
.another-class {
	background: red;
}
/* aincrok_change end */
```

## Special Cases

### Aincrok specific file

if the filename or directory name contains aincrok no marking with comments is required

### New Files

If you're creating a completely new file that doesn't exist in Kilocode, add this comment at the top:

```
// aincrok_change - new file
```
