// Builds the HTML page served in the VS Code webview panel.
// Keeps HTML structure and panel-scoped CSS separate from panel logic.

export function buildWebviewHtml(content: string, nonce: string): string {
  return /* html */ `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src * data:;">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #fff; font-family: sans-serif; }
    #toolbar {
      position: sticky; top: 0; z-index: 10;
      background: #07C160; padding: 8px 16px;
      display: flex; align-items: center; gap: 8px;
    }
    #toolbar button {
      background: #fff; color: #07C160;
      border: none; border-radius: 4px;
      padding: 5px 12px; font-size: 13px;
      cursor: pointer; font-weight: bold;
    }
    #toolbar button:hover { background: #e8f8ef; }
    #toolbar button.secondary {
      background: transparent; color: rgba(255,255,255,0.85);
      border: 1px solid rgba(255,255,255,0.5);
      font-weight: normal;
    }
    #toolbar button.secondary:hover { background: rgba(255,255,255,0.15); }
    #toolbar span { color: #fff; font-size: 12px; flex: 1; }
    #preview { padding: 24px 16px; }
    /* Shiki code block card */
    .shiki.wmd-code-block {
      position: relative;
      background: #fff !important;
      border: 1px solid #e3e3e3;
      border-radius: 8px;
      margin: 1em 0;
      padding: 0;
      overflow: hidden;
      counter-reset: line;
    }
    .shiki.wmd-code-block::before {
      content: attr(data-lang-label);
      position: absolute;
      top: 8px; right: 12px;
      font-size: 11px;
      color: #e3e3e3;
      font-family: sans-serif;
    }
    .shiki.wmd-code-block code {
      display: block;
      padding: 8px 16px 8px 0;
      overflow-x: auto;
    }
    .shiki.wmd-code-block .line {
      display: block;
      padding-left: 0;
      line-height: 1.7;
    }
    .shiki.wmd-code-block .line::before {
      counter-increment: line;
      content: counter(line);
      display: inline-block;
      width: 2.5em;
      padding-right: 1em;
      text-align: right;
      color: #e3e3e3;
      border-right: 1px solid #e1e4e8;
      margin-right: 1em;
      font-size: 12px;
      user-select: none;
    }
    /* Rich-copy staging area: must be in DOM and selectable, but invisible */
    #rich-copy-stage {
      position: fixed; top: -9999px; left: -9999px;
      opacity: 0; pointer-events: none;
      white-space: normal;
    }
  </style>
</head>
<body>
  <div id="toolbar">
    <button id="copyRichBtn">✂️ 复制内容</button>
    <button id="themeBtn" class="secondary">🎨 自定义样式</button>
    <button id="refreshBtn" class="secondary">🔄 刷新</button>
    <span id="tip"></span>
  </div>
  <div id="preview">${content}</div>
  <!-- staging area for rich-text copy via execCommand -->
  <div id="rich-copy-stage" contenteditable="true"></div>
  <script nonce="${nonce}">
    const vscodeApi = window.acquireVsCodeApi();

    // Rich-text copy: send HTML to host for image base64 conversion,
    // then do execCommand('copy') on the resolved HTML when it comes back.
    document.getElementById('copyRichBtn').addEventListener('click', function() {
      var html = document.getElementById('preview').innerHTML;
      showTip('⏳ 处理中...');
      vscodeApi.postMessage({ command: 'copyRich', html: html });
    });

    document.getElementById('themeBtn').addEventListener('click', function() {
      vscodeApi.postMessage({ command: 'openTheme' });
    });

    document.getElementById('refreshBtn').addEventListener('click', function() {
      vscodeApi.postMessage({ command: 'refresh' });
    });

    window.addEventListener('message', function(event) {
      var msg = event.data;
      if (!msg) { return; }
      if (msg.command === 'doRichCopy') {
        var stage = document.getElementById('rich-copy-stage');
        stage.innerHTML = msg.html;
        var range = document.createRange();
        range.selectNodeContents(stage);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        var ok = document.execCommand('copy');
        sel.removeAllRanges();
        stage.innerHTML = '';
        showTip(ok ? '✅ 已复制，直接去公众号编辑器粘贴！' : '❌ 复制失败');
      }
    });

    function showTip(msg) {
      var tip = document.getElementById('tip');
      tip.textContent = msg;
      setTimeout(function() { tip.textContent = ''; }, 3000);
    }
  </script>
</body>
</html>`;
}
