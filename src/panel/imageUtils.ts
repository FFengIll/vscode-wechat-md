import * as fs from 'fs';
import * as path from 'path';

// Replace vscode-webview-resource: and local file URIs in img src with base64 data URIs.
// This is necessary because WeChat editor cannot load vscode-internal or file:// URLs.
// docDir is the directory of the markdown file, used to resolve relative image paths.
export async function resolveImagesAsBase64(html: string, docDir: string): Promise<string> {
  const pattern = /(<img[^>]+src=")([^"]+)(")/g;
  const matches: { full: string; pre: string; src: string; post: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(html)) !== null) {
    matches.push({ full: m[0], pre: m[1], src: m[2], post: m[3] });
  }

  for (const match of matches) {
    const src = match.src;
    // Skip already-base64
    if (/^data:/i.test(src)) { continue; }

    try {
      let filePath: string;
      // Actual format: https://file+.vscode-resource.vscode-cdn.net/abs/path/to/file
      if (/vscode-resource\.vscode-cdn\.net/i.test(src)) {
        const pathPart = src.replace(/^https?:\/\/[^/]+/, '');
        filePath = decodeURIComponent(pathPart);
      } else if (src.startsWith('vscode-webview-resource:')) {
        const withoutScheme = src.replace(/^vscode-webview-resource:\/\/[^/]*/, '');
        filePath = decodeURIComponent(withoutScheme);
      } else if (src.startsWith('file://')) {
        filePath = decodeURIComponent(src.replace(/^file:\/\//, ''));
      } else if (/^https?:\/\//i.test(src)) {
        // Plain remote URL — leave as-is
        continue;
      } else {
        // Handle relative paths (e.g., demo.png, ../images/icon.svg)
        // Decode HTML entities first, then resolve against document directory
        const decoded = src.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        filePath = path.isAbsolute(decoded)
          ? decoded
          : docDir ? path.resolve(docDir, decoded) : decoded;
      }

      const data = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase().replace('.', '');
      const mime = ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext;
      const dataUri = `data:image/${mime};base64,${data.toString('base64')}`;
      html = html.replace(match.full, match.pre + dataUri + match.post);
    } catch {
      // If we can't read the file, leave it as-is
    }
  }
  return html;
}
