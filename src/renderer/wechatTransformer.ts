/**
 * WeChat Code Block Transformer
 *
 * Transforms Shiki syntax-highlighted code into WeChat editor-compatible format.
 *
 * WeChat expects a specific DOM structure:
 * <section class="code-snippet__js">
 *   <pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="...">
 *     <code><span leaf="">...</span></code>
 *   </pre>
 * </section>
 *
 * With specific class names for syntax highlighting.
 */

interface Token {
  type: string;
  content: string;
  offset: number;
  length: number;
}

interface Line {
  tokens: Token[];
}

interface ShikiOutput {
  lines: Line[];
  lang: string;
}

/**
 * Map Shiki token types to WeChat class names
 * Based on WeChat editor's expected class names
 */
const TOKEN_CLASS_MAP: Record<string, string> = {
  // JavaScript/TypeScript
  'keyword': 'code-snippet__keyword',
  'string': 'code-snippet__string',
  'number': 'code-snippet__number',
  'comment': 'code-snippet__comment',
  'function': 'code-snippet__function',
  'class': 'code-snippet__class',
  'operator': 'code-snippet__operator',
  'property': 'code-snippet__property',
  'variable': 'code-snippet__variable',

  // HTML/XML
  'tag': 'code-snippet__tag',
  'attribute': 'code-snippet__attr-name',
  'attr-value': 'code-snippet__attr-value',
  'punctuation': 'code-snippet__punctuation',

  // CSS
  'selector': 'code-snippet__selector-tag',
  'selector-class': 'code-snippet__selector-class',
  'selector-id': 'code-snippet__selector-id',

  // Common
  'type': 'code-snippet__type',
  'param': 'code-snippet__parameter',
  'constant': 'code-snippet__constant',
  'regexp': 'code-snippet__regexp',
  'title': 'code-snippet__title',
};

/**
 * Get WeChat class name for a token type
 */
function getWeChatClass(tokenType: string): string {
  // Try exact match first
  if (TOKEN_CLASS_MAP[tokenType]) {
    return TOKEN_CLASS_MAP[tokenType];
  }

  // Try to match by prefix (e.g., 'js-function' -> 'function')
  const parts = tokenType.split('-');
  const baseType = parts[parts.length - 1];
  if (TOKEN_CLASS_MAP[baseType]) {
    return TOKEN_CLASS_MAP[baseType];
  }

  // Default: no special class
  return '';
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Transform a single line of code to WeChat format
 */
function transformLine(line: Line): string {
  if (line.tokens.length === 0) {
    return `<code><span leaf=""><br class="ProseMirror-trailingBreak"></span></code>`;
  }

  const parts: string[] = [];

  for (const token of line.tokens) {
    const className = getWeChatClass(token.type);
    const escapedContent = escapeHtml(token.content);

    if (className) {
      parts.push(`<span class="${className}">${escapedContent}</span>`);
    } else {
      parts.push(`<span>${escapedContent}</span>`);
    }
  }

  return `<code><span leaf="">${parts.join('')}</span></code>`;
}

/**
 * Transform Shiki-highlighted code to WeChat editor format
 *
 * @param html - Shiki-generated HTML (can be used to extract line info)
 * @param code - Original code text
 * @param lang - Language identifier
 * @returns WeChat-compatible HTML string
 */
export function transformToWeChatFormat(html: string, code: string, lang: string): string {
  // Split code into lines
  const lines = code.replace(/\n$/, '').split('\n');

  // For now, create a simple line-based structure
  // In a more sophisticated implementation, we would parse Shiki's HTML
  // to extract token information for proper syntax highlighting
  const codeLines = lines.map(line => {
    if (line === '') {
      return `<code><span leaf=""><br class="ProseMirror-trailingBreak"></span></code>`;
    }
    return `<code><span leaf="">${escapeHtml(line)}</span></code>`;
  }).join('');

  return `<section class="code-snippet__js"><pre class="code-snippet__js code-snippet code-snippet_nowrap" data-lang="${escapeHtml(lang)}">${codeLines}</pre></section>\n`;
}

/**
 * Parse Shiki HTML and extract token information
 * This is a placeholder for future enhancement where we parse Shiki's output
 * to get proper token-level syntax highlighting
 */
export function parseShikiHtml(html: string): { lines: Line[]; lang: string } {
  // TODO: Implement proper Shiki HTML parsing
  // For now, return empty structure
  return {
    lines: [],
    lang: '',
  };
}

/**
 * Normalize language name to WeChat's expected format
 */
export function normalizeLang(lang: string): string {
  const lower = lang.toLowerCase();
  const aliases: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'rs': 'rust',
    'sh': 'bash',
    'zsh': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'kt': 'kotlin',
    'objc': 'objectivec',
    'c++': 'cpp',
  };
  return aliases[lower] || lower;
}
