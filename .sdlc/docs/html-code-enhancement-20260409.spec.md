# HTML Block and Code Handling Enhancement Specification

**Created**: 2026-04-09
**Status**: Draft
**Related**: [wechat-analysis.md](../../example/wechat-analysis.md)

## Problem Statement

The current extension has two major limitations:

1. **HTML Block Support**: Raw HTML in markdown files is ignored (`html: false` in markdown-it config)
2. **Code Block Syntax Highlighting in Copy Mode**: Code blocks copied to WeChat editor lack syntax highlighting

## Requirements

### 1. HTML Block Support

**Goal**: Enable raw HTML in markdown while maintaining WeChat compatibility

**Functional Requirements**:
- Enable `html: true` in markdown-it configuration
- Allow users to insert custom HTML blocks for styling
- Support common HTML elements: `<span>`, `<div>`, `<section>`, `<p>`, etc.
- Maintain inline style requirement (WeChat strips `<style>` blocks)

**Non-Functional Requirements**:
- Security: Sanitize HTML to prevent XSS attacks
- Backward compatibility: Existing markdown files should work unchanged
- Performance: HTML parsing should not significantly impact rendering speed

**Acceptance Criteria**:
- [ ] HTML blocks in markdown are rendered in preview
- [ ] HTML blocks are preserved when copying to WeChat
- [ ] Inline styles are maintained
- [ ] Dangerous HTML (scripts, iframes, etc.) is sanitized

### 2. Code Block Syntax Highlighting for Copy Mode

**Goal**: Add syntax highlighting to code blocks when copying to WeChat editor

**Functional Requirements**:
- Generate syntax-highlighted HTML for copy mode
- Use WeChat-compatible class names (`code-snippet__selector-tag`, etc.)
- Support all languages that Shiki supports
- Preserve current line-based structure with `<span leaf="">`

**Technical Requirements**:
- Create custom Shiki transformer for WeChat output
- Generate class names that match WeChat's expected format
- Handle empty lines with `<br class="ProseMirror-trailingBreak">`

**Acceptance Criteria**:
- [ ] Code blocks have syntax highlighting when pasted in WeChat editor
- [ ] WeChat-compatible class structure is maintained
- [ ] All Shiki-supported languages work
- [ ] Empty lines are handled correctly

## Design

### HTML Block Support Design

```typescript
// In renderer/index.ts
const md = new MarkdownIt({
  html: true,  // ← Change from false to true
  linkify: true,
  typographer: true
});
```

**Security Considerations**:
- Use markdown-it's built-in HTML sanitization
- Consider adding `markdown-it-sanitizer` plugin for additional safety
- Whitelist allowed HTML tags and attributes

### Code Block Highlighting Design

Create a new WeChat-specific Shiki transformer:

```typescript
interface WeChatCodeHighlighter {
  // Transform Shiki output to WeChat-compatible HTML
  transform(shikiHtml: string, language: string): string;
}
```

**Output Format** (per analysis report):
```html
<section class="code-snippet__js">
  <pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="css">
    <code>
      <span leaf="">
        <span class="code-snippet__selector-tag">selector</span>
        <span class="code-snippet__property">property</span>
      </span>
    </code>
  </pre>
</section>
```

**Implementation Strategy**:
1. Use Shiki to generate syntax-highlighted HTML in preview mode
2. Create custom transformer that maps Shiki tokens to WeChat class names
3. Apply transformer only in copy mode (preview keeps existing Shiki output)

### WeChat Class Name Mapping

Map Shiki token types to WeChat class names:

| Shiki Token Type | WeChat Class |
|-----------------|--------------|
| Keyword | `code-snippet__keyword` |
| String | `code-snippet__string` |
| Number | `code-snippet__number` |
| Comment | `code-snippet__comment` |
| Function | `code-snippet__function` |
| Class/Type | `code-snippet__class` |
| Operator | `code-snippet__operator` |
| Tag (HTML/XML) | `code-snippet__tag` |
| Attribute | `code-snippet__attr-name` |
| Property (CSS) | `code-snippet__property` |
| Selector (CSS) | `code-snippet__selector-tag` |

## Implementation Plan

### Phase 1: HTML Block Support
1. Enable `html: true` in markdown-it config
2. Add HTML sanitization (markdown-it-sanitizer or custom)
3. Test with various HTML blocks

### Phase 2: Code Block Highlighting
1. Create WeChat code transformer
2. Implement token type to class name mapping
3. Apply transformer in copy mode only
4. Test with multiple languages

### Phase 3: Testing
1. Test HTML blocks with inline styles
2. Test code blocks in WeChat editor
3. Verify backward compatibility
4. Security testing for HTML sanitization

## Migration Path

**No Breaking Changes**:
- Existing markdown files work unchanged
- Existing theme system continues to work
- Preview mode keeps Shiki highlighting
- Copy mode gains syntax highlighting

**User Actions Required**:
- None (automatic upgrade)

## Open Questions

1. Should we add a configuration option to disable HTML support? (security consideration)
2. What's the complete list of WeChat code-snippet class names?
3. Should we preserve the current copy mode behavior as a fallback option?

## References

- [WeChat Editor Analysis](../../example/wechat-analysis.md)
- [Current Architecture](../arch/overview-20260409.arch.md)
- [Shiki Documentation](https://shiki.style/)
- [markdown-it Documentation](https://github.com/markdown-it/markdown-it)
