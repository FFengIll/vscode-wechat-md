# wechat-md / vscode-wechat-md

微信公众号 Markdown 渲染器 —— 本地预览、一键复制、精确适配、快速发布。

> 英文文档请见 [README.en.md](README.en.md)

---

> 仓库：https://github.com/FFengIll/vscode-wechat-md
> 
> 插件：https://marketplace.visualstudio.com/items?itemName=FFengIll.vscode-wechat-md
>
> VSCode：插件搜索 wechat-md

---

## 功能特性

### 实时预览

在编辑 Markdown 时，右侧面板同步渲染微信公众号样式效果。切换文件、修改内容时预览自动刷新，无需手动操作。

### 一键复制（富文本）

点击工具栏 **✂️ 复制内容**，将带完整内联样式的富文本内容写入剪贴板（本地图片自动转换为 Base64），直接粘贴至微信公众号编辑器即可，无需任何手动调整。

### 代码高亮

预览面板使用 [Shiki](https://shiki.style/) 渲染代码块，支持行号显示、卡片样式与语言标签。复制时自动转换为微信公众号兼容的格式。

### 自定义主题

点击工具栏 **🎨 自定义样式**，自动在工作区创建并打开 `.wechat/theme.css`。通过修改 CSS 变量即可控制配色、字号、行高等样式，保存后预览实时生效。

### 支持的 Markdown 元素

| 元素            | 说明                               |
| --------------- | ---------------------------------- |
| 标题 h1–h6      | 层级样式，h1/h2 带微信绿色边框装饰 |
| 段落            | 适配微信正文排版                   |
| 行内代码        | 带背景色高亮                       |
| 代码块          | 围栏式与缩进式均支持               |
| 引用块          | 左边框 + 背景色样式                |
| 无序 / 有序列表 | 完整嵌套支持                       |
| 粗体 / 斜体     |                                    |
| 链接            | 保留 href                          |
| 图片            | 自动居中，本地图片预览/复制均可用  |
| 表格            | 含表头，边框样式                   |
| 分割线          |                                    |

---

## 安装与使用

### 安装

在 VS Code 扩展市场搜索 `vscode-wechat-md` 并安装，或从 `.vsix` 文件本地安装。

### 打开预览

打开任意 `.md` 文件，通过以下任意方式触发预览：

- 编辑器标题栏点击预览图标
- 命令面板（`Cmd+Shift+P` / `Ctrl+Shift+P`）执行 `WeChat MD: Preview Markdown`

### 复制内容到公众号

1. 打开预览面板
2. 点击顶部工具栏 **✂️ 复制内容**
3. 打开微信公众号编辑器，直接粘贴

---

## 自定义主题

点击预览面板工具栏的 **🎨 自定义样式**，会在项目根目录生成 `.wechat/theme.css`，内含以下可配置变量：

```css
:root {
  --wechat-accent: #07C160;        /* 主色调（微信绿） */
  --wechat-font-size: 16px;        /* 正文字号 */
  --wechat-line-height: 1.8;       /* 行高 */
  --wechat-text-color: #333;       /* 正文颜色 */
  --wechat-code-bg: #f6f8fa;       /* 代码块背景 */
  --wechat-inline-code-color: #d63384; /* 行内代码颜色 */
  --wechat-blockquote-bg: #f9f9f9; /* 引用块背景 */
  --wechat-max-width: 680px;       /* 内容最大宽度 */

  /* 各级标题独立配置（字号 / 字重 / 颜色） */
  --wechat-h1-font-size: 24px;    --wechat-h1-font-weight: bold;  --wechat-h1-color: #1a1a1a;
  --wechat-h2-font-size: 20px;    --wechat-h2-font-weight: bold;  --wechat-h2-color: #1a1a1a;
  --wechat-h3-font-size: 18px;    --wechat-h3-font-weight: bold;  --wechat-h3-color: #1a1a1a;
  --wechat-h4-font-size: 16px;    --wechat-h4-font-weight: bold;  --wechat-h4-color: #333;
  --wechat-h5-font-size: 15px;    --wechat-h5-font-weight: bold;  --wechat-h5-color: #555;
  --wechat-h6-font-size: 14px;    --wechat-h6-font-weight: bold;  --wechat-h6-color: #666;
}
```

修改后保存，预览面板即时更新，无需重启扩展。

---

## 命令列表

| 命令             | ID                  | 说明              |
| ---------------- | ------------------- | ----------------- |
| Preview Markdown | `wechat-md.preview` | 打开/切换预览面板 |

---

## 注意事项

- 微信公众号编辑器不支持外部 CSS，本扩展所有样式均以**内联方式**注入，确保粘贴后格式完整保留。
- 本地图片在**富文本复制**时自动转为 Base64 编码，无需手动上传即可在公众号编辑器中正常显示。
- `.wechat/theme.css` 建议加入版本控制，便于团队共享统一样式。

---

## 问题反馈

如有 Bug 或功能建议，请提交 Issue：[GitHub Issues](https://github.com/FFengIll/vscode-wechat-md/issues)


<img src="images/wechat.png" width="400" alt="微信打赏二维码" />
