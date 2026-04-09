# Debug: Images Disappear After Copy-Paste

**Date**: 2026-04-09
**Status**: Root Cause Found
**Priority**: High

---

## Bug Description
Images that appear correctly in the preview panel disappear when the user copies the content and pastes it into the WeChat editor.

---

## Reproduction Steps
1. Create a markdown file with a local image reference: `![](demo.png)`
2. Open the WeChat preview panel
3. Verify the image displays correctly in preview
4. Click **✂️ 复制内容** button
5. Paste into WeChat editor
6. **Expected**: Image appears in WeChat editor
7. **Actual**: Image is missing/broken

---

## Environment
- **Extension**: vscode-wechat-md v0.0.3
- **Platform**: macOS / Windows / Linux
- **All users**: Affects all users using local images

---

## Investigation

### Root Cause Identified

**File**: [PreviewPanel.ts:81-84](src/panel/PreviewPanel.ts#L81-L84)
**Function**: `onDidReceiveMessage` handler for `copyRich` command

```typescript
if (message.command === 'copyRich') {
  const markdown = this.lastMarkdownEditor?.document.getText() ?? '';
  const copyHtml = this.renderer.render(markdown, 'copy');  // ← Re-renders from markdown
  const resolved = await resolveImagesAsBase64(copyHtml);   // ← Expects webview URIs!
```

**The Issue**: The code re-renders the markdown in `'copy'` mode, which outputs raw relative image paths like `<img src="demo.png">`. However, `resolveImagesAsBase64()` only handles webview URIs or absolute paths, not relative paths.

### Code Flow Analysis

1. **Preview Mode** (line 107):
   - Calls `resolveLocalImages()` which converts `demo.png` → `https://file+.vscode-resource.vscode-cdn.net/...`
   - Images display correctly in webview

2. **Copy Mode** (line 83):
   - Re-renders markdown with `render(markdown, 'copy')`
   - Output contains raw paths: `<img src="demo.png">`
   - Never calls `resolveLocalImages()` to convert to webview URIs

3. **Base64 Conversion** (line 338-349 in `resolveImagesAsBase64`):
   ```typescript
   if (/vscode-resource\.vscode-cdn\.net/i.test(src)) { /* ... */ }
   else if (src.startsWith('vscode-webview-resource:')) { /* ... */ }
   else if (src.startsWith('file://')) { /* ... */ }
   else {
     continue;  // ← Relative paths skipped here!
   }
   ```

### Why This Breaks

| Scenario | Image src | Result |
|----------|-----------|--------|
| Preview | `vscode-webview-resource://...` | ✅ Displayed |
| After copy render | `demo.png` | ❌ Not converted to base64 |
| Pasted in WeChat | `demo.png` | ❌ Browser can't resolve |

---

## Root Cause

`resolveImagesAsBase64()` does not handle relative image paths. When markdown is re-rendered in copy mode, it outputs relative paths that are then ignored during base64 conversion because they don't match any of the expected URI patterns (webview URIs, `file://`, or remote URLs).

---

## Proposed Fix

### Option 1: Pass the document directory to `resolveImagesAsBase64()`
Modify the function to accept `docDir` and resolve relative paths before converting to base64:

```typescript
async function resolveImagesAsBase64(html: string, docDir: string): Promise<string> {
  // ... existing code ...
  else {
    // NEW: Handle relative paths
    const absolute = path.resolve(docDir, src);
    filePath = absolute;
  }
}
```

### Option 2: Use the preview HTML instead of re-rendering
Capture the HTML from the preview (which already has webview URIs) and convert it to copy mode styles.

### Recommended: Option 1
Simpler and more robust. Uses the existing document directory context that's already available in `PreviewPanel`.

---

## Implementation Plan

1. Modify `resolveImagesAsBase64()` signature to accept `docDir: string`
2. Add logic to resolve relative paths to absolute paths
3. Update the call site at line 84 to pass `docDir`
4. Test with various image path formats:
   - Relative: `demo.png`, `../images/icon.svg`
   - Absolute: `/Users/.../demo.png`
   - Remote: `https://example.com/image.png`

---

## Status
- [x] Bug reproduced
- [x] Root cause identified
- [x] Fix implemented
- [x] Tests passing (compilation successful)
- [ ] Ready for commit

---

## Fix Applied

### Changes Made

**File**: [src/panel/PreviewPanel.ts:84-86](src/panel/PreviewPanel.ts#L84-L86)

Modified the `copyRich` handler to pass the document directory:
```typescript
const docDir = this.lastMarkdownEditor ? path.dirname(this.lastMarkdownEditor.document.uri.fsPath) : '';
const resolved = await resolveImagesAsBase64(copyHtml, docDir);
```

**File**: [src/panel/PreviewPanel.ts:323-363](src/panel/PreviewPanel.ts#L323-L363)

Modified `resolveImagesAsBase64()` function:
1. Added `docDir: string` parameter
2. Reordered URL type checking to handle `http(s)://` before relative paths
3. Added relative path resolution logic that:
   - Decodes HTML entities (`&amp;` → `&`, etc.)
   - Resolves relative paths against the document directory using `path.resolve()`
   - Handles absolute paths as-is

### How The Fix Works

| Image src type | Before | After |
|----------------|--------|-------|
| `demo.png` | ❌ Skipped | ✅ Resolved to `/abs/path/demo.png` → base64 |
| `../images/icon.svg` | ❌ Skipped | ✅ Resolved to `/abs/path/../images/icon.svg` → base64 |
| `/Users/.../demo.png` | ❌ Skipped | ✅ Handled as absolute path → base64 |
| `https://...` | ✅ Left as-is | ✅ Left as-is |
| `data:image/...` | ✅ Left as-is | ✅ Left as-is |

### Testing

- Compilation: ✅ No TypeScript errors
- Manual testing required to verify images appear correctly after paste

---

## References
- Issue: Images disappear after copy-paste
- File: [src/panel/PreviewPanel.ts:81-84](src/panel/PreviewPanel.ts#L81-L84)
- File: [src/panel/PreviewPanel.ts:322-361](src/panel/PreviewPanel.ts#L322-L361)
