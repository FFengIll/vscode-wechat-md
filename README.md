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

### 自定义样式

点击工具栏 **🎨 样式管理** 打开样式管理面板：切换主题预设、为每个元素类目选择装饰风格，或选中「自定义」用你自己写的 CSS。详见下方「样式管理」与「逐类目自定义样式」章节。

### 支持的 Markdown 元素

| 元素            | 说明                               |
| --------------- | ---------------------------------- |
| 标题 h1–h6      | 层级样式，默认简洁无装饰，可经样式预设加边框/背景等装饰 |
| 段落            | 适配微信正文排版                   |
| 行内代码        | 带背景色高亮                       |
| 代码块          | 围栏式与缩进式均支持               |
| 引用块          | 左边框 + 背景色样式                |
| 无序 / 有序列表 | 完整嵌套支持，标记与文字同行       |
| 粗体 / 斜体     |                                    |
| 链接            | 保留 href                          |
| 图片            | 自动居中，本地图片预览/复制均可用  |
| 表格            | 含表头，边框样式                   |
| 分割线          |                                    |

### 容器效果（卡片 / 提示框 / 居中）

用 `:::` 围栏语法包裹一段内容，即可套用内置的容器效果——内部仍是正常 markdown（**粗体**、链接、列表都能正常写），不需要写任何 CSS/HTML：

```markdown
::: tip
记得先看文档再动手。
:::

::: card
卡片内容，支持**加粗**、[链接](https://example.com)、列表等正常 markdown。
:::
```

| id        | 效果             |
| --------- | ---------------- |
| `card`    | 卡片容器（圆角、阴影、边框） |
| `tip`     | 绿色提示框（💡 提示）        |
| `info`    | 蓝色说明框（ℹ️ 说明）        |
| `warning` | 橙色注意框（⚠️ 注意）        |
| `center`  | 内容居中（常用于图片+说明文字） |

这是一份固定目录——不支持自定义 id 或自己写 HTML 结构，是为了保证每种效果都经过校验、粘贴到微信不会出问题；未识别的 `:::` 名称会原样保留为普通文本。

### Frontmatter `header` 字段

文档开头可以写一段 frontmatter，`header:` 字段会渲染成正文最前面的一段文字（默认跟普通段落样式一样，可用 `.wechat/custom/header.css` 定制外观），`---` 之间的内容本身不会出现在渲染结果里：

```markdown
---
header: 欢迎阅读本期内容
---

# 正文标题
```

目前只支持扁平的 `key: value` 字段，不支持嵌套/数组/多行值；完整说明见 [docs/custom-styles.md](docs/custom-styles.md) 第 8 节。

---

## 安装与使用

### 安装

在 VS Code 扩展市场搜索 `vscode-wechat-md` 并安装，或从 `.vsix` 文件本地安装。

### 打开预览

打开任意 `.md` 文件，通过以下任意方式触发预览：

- 编辑器标题栏点击预览图标
- 命令面板（`Cmd+Shift+P` / `Ctrl+Shift+P`）执行 `WeChat MD: Preview Markdown`

### 样式管理

命令面板执行 `WeChat MD: Open Style Management Panel`，可在面板中切换主题预设、调整各元素装饰风格，所有更改实时生效。

### 复制内容到公众号

1. 打开预览面板
2. 点击顶部工具栏 **✂️ 复制内容**
3. 打开微信公众号编辑器，直接粘贴

---

## 自定义主题

自定义主题分三个层次，**范围从全局到局部依次收窄，后一层只覆盖它涉及的部分，其余仍继承前一层**：

1. **`.wechat/theme.css`** —— 全局基础变量（强调色、字号、行高等），影响所有内置装饰
2. **`.wechat/presets/*.json`** —— 整套主题预设，一次性覆盖上面这些变量，还可以附带 `customCSS`
3. **样式管理面板逐类目选择** —— 在上面两层之上，为标题/引用块/列表等单个元素类目单独换一套装饰风格，见下方「样式管理」章节

### 方式零：全局 CSS 变量（`.wechat/theme.css`）

在工作区根目录创建 `.wechat/theme.css`（也可以从样式管理面板里打开），用标准 CSS 自定义属性覆盖强调色、字号、行高等基础变量：

```css
:root {
  --wechat-accent: #07C160;            /* 强调色（默认微信绿） */
  --wechat-font-size: 16px;            /* 正文字号 */
  --wechat-line-height: 1.8;           /* 行高 */
  --wechat-text-color: #333;           /* 正文颜色 */
  --wechat-code-bg: #f6f8fa;           /* 代码块背景 */
  --wechat-inline-code-color: #d63384; /* 行内代码颜色 */
  --wechat-blockquote-bg: #f9f9f9;     /* 引用块背景 */
  --wechat-max-width: 680px;           /* 内容最大宽度 */

  /* h1~h3 还各自支持 font-size / font-weight / color / bg / padding / border-radius，
     例如 --wechat-h1-color、--wechat-h1-bg；h4~h6 支持 font-size / font-weight / color */
}
```

保存后预览立即刷新，无需重启。这一层只是打底——如果同时选中了下面的 JSON 预设，预设里 `vars` 字段定义的同名变量会覆盖这里的值。

### 方式一：JSON 预设文件

在 `.wechat/presets/` 目录下创建 JSON 文件（如 `my-custom.json`）：

```json
{
  "id": "my-custom",
  "name": "My Custom Theme",
  "description": "我的自定义主题",
  "vars": {
    "accent": "#FF6B6B",
    "textColor": "#2C3E50",
    "fontSize": "16px",
    "lineHeight": "1.8",
    "h1Color": "#1A1A1A",
    "h2Color": "#FF6B6B",
    "codeBg": "#F8F9FA",
    "inlineCodeColor": "#E74C3C"
  },
  "preview": {
    "primary": "#FF6B6B",
    "background": "#FFFFFF",
    "accent": "#FF6B6B"
  }
}
```

### 方式二：高级 CSS 扩展

如需复杂渐变、自定义字体等 JSON 无法覆盖的场景，可在预设中添加 `customCSS` 字段：

```json
{
  "id": "advanced-theme",
  "name": "Advanced Theme",
  "vars": {
    "accent": "#667eea"
  },
  "customCSS": {
    "h1": "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff;",
    "blockquote": "font-family: 'Georgia', serif; font-style: italic;",
    "a": "text-decoration: underline;"
  }
}
```

**customCSS 说明**：
- 键名：元素类型（`h1`, `h2`, `h3`, `p`, `blockquote`, `a`, `img`, `hr`, `table`, `inlineCode` 等）
- 键值：原始 CSS 字符串，将追加到元素的内联样式中
- 注意：微信公众号编辑器可能不支持部分高级 CSS 属性（如复杂渐变、自定义字体）

---

## 样式管理

### 样式管理面板

通过命令面板打开 `WeChat MD: Open Style Management Panel`，在面板中可以：

- **主题预设**：切换内置颜色主题（WeChat Green / Elegant Classic / Modern Bold / Minimal Clean / Tech Developer / Claude / Pikachu / Corporate Blue）
- **逐元素样式**：为标题（H1/H2/H3）、引用块、列表、链接、图片、分割线、表格、行内代码、代码块等元素分别选择装饰风格
- **悬停实时预览**：鼠标悬停任意主题或样式选项，即可在浮层中看到真实渲染效果，无需逐个点击应用——预览经由真实渲染管线生成，所见即所得
- 所有调整实时生效，无需重启

### 主题预设

内置 8 种颜色主题：

| 预设名称 | 风格描述 | 特点 |
|---------|---------|------|
| **WeChat Green** (默认) | 专业简洁 | 经典微信绿，适合大部分内容类型 |
| **Elegant Classic** | 经典编辑 | 温暖色调，标题更醒目，适合深度阅读 |
| **Modern Bold** | 现代大胆 | 高对比度，蓝色主调，视觉冲击力强 |
| **Minimal Clean** | 极简干净 | 灰度配色，内容优先，减少视觉干扰 |
| **Tech Developer** | 技术风格 | 深色背景，紫色强调，优化代码可读性 |
| **Claude** | 陶土暖色 | Anthropic Claude 风格的陶土橙 + 暖调米白 |
| **Pikachu** | 活泼可爱 | 明黄 + 脸颊红，皮卡丘配色 |
| **Corporate Blue** | 商务蓝调 | 专业蓝色调 + H1/H2/H3 层级色阶，适合企业内容 |

### 逐元素样式预设

为每种元素提供多种装饰风格可选：

| 元素 | 可选风格示例 |
|------|------------|
| H1 标题 | 下划线、左竖条、背景色块、渐变背景、虚线框、阴影卡片、数字序号等 |
| H2 标题 | 下划线、左竖条、主题背景、边框框、波浪线、数字序号等 |
| H3 标题 | 下划线、左竖条、圆点、箭头、标签、花括号等 |
| 引用块 | 左竖线、卡片式、渐变背景、虚线框、引号装饰等 |
| 列表 | 箭头、星标、菱形、三角、勾选、括号数字等 |
| 链接 | 主题色、粗体、背景色、虚线、箭头后缀、按钮式等 |
| 图片 | 圆角、阴影、边框、拍立得、全宽、居中等 |
| 分割线 | 虚线、点线、渐变、波浪、双线、文字装饰等 |
| 表格 | 斑马纹、主题色表头、无边框、卡片式、现代等 |
| 行内代码 | 主题色、边框、卡片、高亮、深色、标签、虚线、渐变等 |
| 代码块 | 卡片标签、Mac 窗口、主题边框、简约左竖线等 |

每个类目的选项列表最后都有一项 **「自定义」**，选中后改用你自己写的 CSS，见下节。

> 还有一个 `header`（frontmatter `header:` 字段的样式）类目——目前面板里没有它的选项列表，只能通过手写 `.wechat/custom/header.css` 定制，默认跟随正文段落样式。

### 逐类目自定义样式

上面 11 个元素类目（H1/H2/H3、引用块、列表、链接、图片、分割线、表格、行内代码、代码块）除了内置风格，都可以选「自定义」，改用你自己写的样式；`header` 没有面板选项，但同样支持这套自定义机制。这里只讲基本用法，完整机制说明（叠加规则、变量替换范围、已知限制、涉及的源码）见 [docs/custom-styles.md](docs/custom-styles.md)：

1. 在样式管理面板对应类目的选项里点「自定义」
2. 点选项下方的 **✎ 编辑自定义样式** 链接，会自动创建并打开 `.wechat/custom/<类目>.css`（如 `.wechat/custom/h1.css`）
3. 文件是一条正常的 CSS 规则（选择器仅供参考、不影响渲染，只有花括号里的声明会被取出，**叠加**在该类目默认的字号/颜色/间距等基础样式之上——不是整个替换掉，所以选中「自定义」后标题依然是标题的字号字重，不会退化成正文）：

   ```css
   /* .wechat/custom/h1.css */
   .wmd-h1, h1 {
     display: table;       /* 收缩宽度到文字大小，配合 margin: auto 居中 */
     margin: 1.8em auto 1em;
     text-align: center;
     border-bottom: 4px solid var(--wechat-accent);
     padding-bottom: 12px;
   }
   ```

   （h1 默认是撑满容器的 block 元素，直接写 `border-bottom` 会是一条通栏长线；上面的 `display: table` 让下划线收缩成只有标题文字那么长。）

4. 保存后预览自动热重载。声明里可以用 `var(--wechat-accent)` 等主题色变量，会自动替换成当前主题的实际颜色

类目与文件名对应关系：`h1` `h2` `h3` `blockquote` `list` `link` `image` `divider` `table` `inlineCode` `codeBlock` `header`，即文件路径固定是 `.wechat/custom/<类目 key>.css`。

> 这套「逐类目自定义样式」是目前推荐的深度定制方式，比早期版本里全局的 `.wechat/theme.override.ts`（已移除）更细粒度、门槛也更低——不需要写 TypeScript 或了解内部 `Theme` 结构，纯 CSS 声明即可。

### 创建自定义主题预设

在 `.wechat/presets/` 目录下创建 JSON 文件（如 `my-custom.json`）——目前只能手写 JSON 文件，面板里没有「另存为新预设」按钮：

```json
{
  "id": "my-custom",
  "name": "My Custom Theme",
  "description": "我的自定义主题",
  "vars": {
    "accent": "#FF6B6B",
    "textColor": "#2C3E50",
    "fontSize": "16px",
    "lineHeight": "1.8",
    "h1Color": "#1A1A1A",
    "h2Color": "#FF6B6B",
    "codeBg": "#F8F9FA",
    "inlineCodeColor": "#E74C3C"
  },
  "preview": {
    "primary": "#FF6B6B",
    "background": "#FFFFFF",
    "accent": "#FF6B6B"
  }
}
```

> 新建/编辑 `.wechat/presets/*.json` 后需要重新加载窗口（命令面板执行 `Developer: Reload Window`）才会生效——预设文件目前只在插件启动时读取一次，不像 `.wechat/theme.css` 和 `.wechat/custom/*.css` 那样有热重载。

### 预设文件格式参考

完整可配置的样式变量（vars 字段）：

```json
{
  "id": "theme-id",
  "name": "主题名称",
  "description": "主题描述",
  "vars": {
    "accent": "#07C160",
    "fontSize": "16px",
    "lineHeight": "1.8",
    "textColor": "#333",
    "codeBg": "#f6f8fa",
    "inlineCodeColor": "#d63384",
    "blockquoteBg": "#f9f9f9",
    "maxWidth": "680px",
    "h1FontSize": "24px",
    "h1FontWeight": "bold",
    "h1Color": "#1a1a1a",
    "h1Bg": "transparent",
    "h1Padding": "0",
    "h1BorderRadius": "0",
    "h2FontSize": "20px",
    "h2FontWeight": "bold",
    "h2Color": "#1a1a1a",
    "h2Bg": "transparent",
    "h2Padding": "0",
    "h2BorderRadius": "0",
    "h3FontSize": "18px",
    "h3FontWeight": "bold",
    "h3Color": "#1a1a1a",
    "h3Bg": "transparent",
    "h3Padding": "0",
    "h3BorderRadius": "0",
    "h4FontSize": "16px",
    "h4FontWeight": "bold",
    "h4Color": "#333",
    "h5FontSize": "15px",
    "h5FontWeight": "bold",
    "h5Color": "#555",
    "h6FontSize": "14px",
    "h6FontWeight": "bold",
    "h6Color": "#666"
  },
  "preview": {
    "primary": "#07C160",
    "background": "#ffffff",
    "accent": "#07C160"
  }
}
```

---

### 优先级规则

当同时存在多个配置时，作用范围从全局到局部依次收窄，后一层覆盖前一层：

1. **系统默认值** — 内置默认样式变量
2. **`.wechat/theme.css`** — 覆盖第 1 层里同名的变量
3. **预设 `vars`** — 选中某个 JSON 主题预设时，覆盖第 2 层里同名的变量
4. **预设 `customCSS`** — 追加到对应元素的内联样式末尾（同一 CSS 属性后出现的生效）
5. **样式管理面板的逐类目预设 / 自定义 CSS** — 独立的一根轴，为单个元素类目（H1、引用块、列表……）整体切换到另一套装饰结构，或叠加你自己写的 CSS；详见下方「样式管理」与「逐类目自定义样式」章节

示例：基于预设修改 H1 标题背景并添加渐变

```json
{
  "vars": {
    "accent": "#07C160",
    "h1Bg": "#f0f9ff",
    "h1Padding": "12px 16px",
    "h1BorderRadius": "8px"
  },
  "customCSS": {
    "h1": "background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);"
  }
}
```

---

## 命令列表

| 命令 | ID | 说明 |
| ---------------- | ------------------- | ----------------- |
| Preview Markdown | `wechat-md.preview` | 打开/切换预览面板 |
| Open Style Management Panel | `wechat-md.openStylePanel` | 打开样式管理面板 |

---

## 注意事项

- 微信公众号编辑器不支持外部 CSS，本扩展所有样式均以**内联方式**注入，确保粘贴后格式完整保留。
- 本地图片在**富文本复制**时自动转为 Base64 编码，无需手动上传即可在公众号编辑器中正常显示。
- `.wechat/presets/` 目录建议加入版本控制，便于团队共享统一样式。
- `customCSS` 字段中的高级样式（如复杂渐变、自定义字体）可能在微信公众号编辑器中无法正常显示。
- `.wechat/custom/` 目录下的逐类目自定义样式同理，建议一并加入版本控制。

---

## 问题反馈

如有 Bug 或功能建议，请提交 Issue：[GitHub Issues](https://github.com/FFengIll/vscode-wechat-md/issues)


![](images/wechat.png)
