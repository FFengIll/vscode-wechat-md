// WeChat-compatibility assertions for rendered HTML.
//
// WeChat's official-account article editor strips <style> blocks, external
// CSS, and class-based styling on paste — it only honors an element's own
// `style="..."` attribute. Every renderer rule in this codebase exists to
// satisfy that constraint (see CLAUDE.md), so these checks encode it as
// something a test can assert instead of something a human has to notice by
// eyeballing a preview panel.
import { Parser } from 'htmlparser2';

export interface ValidationIssue {
  rule: string;
  detail: string;
}

// Void elements never get a closing tag; anything else must balance.
const VOID_ELEMENTS = new Set(['img', 'hr', 'br', 'input', 'meta', 'link']);

// Elements that must always carry a non-empty inline style="" per this
// project's rendering rules (see rules.ts / index.ts applyWeChatRules).
// `code` is deliberately excluded: inside the WeChat code-block structure
// (see ALLOWED_CLASS_PREFIX below) it relies on its ancestor's classes for
// syntax-highlight coloring instead of its own inline style.
const STYLED_ELEMENTS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote',
  'ul', 'ol', 'li', 'hr', 'a', 'img', 'table', 'th', 'td',
  'strong', 'em',
]);

// wechatTransformer.ts deliberately emits WeChat's own recognized code-block
// DOM structure — <section class="code-snippet__js">, <pre class="code-snippet
// ...">, token <span class="code-snippet__keyword"> etc. — because that's the
// literal markup WeChat's own editor produces internally; it is not
// user-authored CSS and is not something WeChat strips. Any *other* class
// attribute is still a violation of the inline-style-only rule.
const ALLOWED_CLASS_PREFIX = 'code-snippet';

export function validateWeChatHtml(html: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const stack: string[] = [];

  const parser = new Parser({
    onopentag(name, attribs) {
      if (name === 'style') {
        issues.push({ rule: 'no-style-tag', detail: '<style> block found — WeChat strips <style> tags on paste' });
      }
      if ('class' in attribs) {
        const classes = attribs.class.split(/\s+/).filter(Boolean);
        const disallowed = classes.filter(c => !c.startsWith(ALLOWED_CLASS_PREFIX));
        if (disallowed.length > 0) {
          issues.push({ rule: 'no-class-attr', detail: `<${name} class="${attribs.class}"> — class-based styling is stripped by WeChat, use inline style instead (unrecognized: ${disallowed.join(', ')})` });
        }
      }
      if (STYLED_ELEMENTS.has(name) && !attribs.style) {
        issues.push({ rule: 'missing-inline-style', detail: `<${name}> has no style="" attribute` });
      }
      // HTML has no escape for a literal `"` inside a double-quoted attribute
      // value — a font-family like `"PingFang SC"` embedded straight into
      // style="..." silently ends the attribute at that first quote, per the
      // HTML5 tokenizer spec (real browsers do this too, not just this
      // parser — confirmed empirically). Everything after is dropped and
      // reinterpreted as bogus attributes. The signature is a style value
      // that ends mid-declaration, right after a bare "property:" with no
      // value — this caught exactly that bug in theme.ts's container and
      // inlineCode styles (their font-family list was first in the array,
      // so it silently ate color/background/font-size for every element
      // using it). Fix: use single quotes for the nested font name instead.
      if (attribs.style && /[a-zA-Z-]\s*:\s*$/.test(attribs.style)) {
        issues.push({ rule: 'truncated-style-attr', detail: `<${name} style="${attribs.style}"> looks cut off mid-declaration — likely a literal '"' embedded in the style value (e.g. a double-quoted font-family name) that closed the HTML attribute early` });
      }
      // WeChat's own editor applies a default gray background to bare <code>
      // tags — omitting `background` doesn't mean "no background", it means
      // "whatever WeChat's default is". Any inline-styled <code> (i.e. not
      // the WeChat code-block structure's own <code>, which has no style="",
      // see STYLED_ELEMENTS) must declare it explicitly, even as `none`/
      // `transparent`. Caught a real bug in inline-code-border/-minimal
      // presets and the base theme — see theme.ts's inlineCode comment.
      if (name === 'code' && attribs.style && !/background/i.test(attribs.style)) {
        issues.push({ rule: 'code-missing-explicit-background', detail: `<code style="${attribs.style}"> has no background declaration — WeChat's default gray background will show through` });
      }
      if (!VOID_ELEMENTS.has(name)) {
        stack.push(name);
      }
    },
    onclosetag(name) {
      if (VOID_ELEMENTS.has(name)) return;
      const top = stack.pop();
      if (top !== name) {
        issues.push({ rule: 'unbalanced-tags', detail: `expected </${top ?? '(nothing open)'}> but got </${name}>` });
        // Resync: put back what we popped if it wasn't actually this close tag,
        // so a single mismatch doesn't cascade into spurious follow-on errors.
        if (top) stack.push(top);
      }
    },
  }, { decodeEntities: true });

  parser.write(html);
  parser.end();

  for (const remaining of stack) {
    issues.push({ rule: 'unclosed-tag', detail: `<${remaining}> was never closed` });
  }

  return issues;
}

// Convenience assertion for use in test bodies — throws with all issues
// listed so a failure is diagnosable from the test output alone.
export function assertWeChatCompatible(html: string): void {
  const issues = validateWeChatHtml(html);
  if (issues.length > 0) {
    const message = issues.map(i => `  [${i.rule}] ${i.detail}`).join('\n');
    throw new Error(`WeChat-compatibility check failed:\n${message}\n\nHTML:\n${html}`);
  }
}
