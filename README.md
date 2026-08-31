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

### 方式一：JSON 预设文件（推荐）

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

- **主题预设**：切换内置颜色主题（WeChat Green / Elegant Classic / Modern Bold / Minimal Clean / Tech Developer）
- **逐元素样式**：为标题（H1/H2/H3）、引用块、列表、链接、图片、分割线、表格、行内代码等元素分别选择装饰风格
- **悬停实时预览**：鼠标悬停任意主题或样式选项，即可在浮层中看到真实渲染效果，无需逐个点击应用——预览经由真实渲染管线生成，所见即所得
- 所有调整实时生效，无需重启

### 主题预设

内置 5 种颜色主题：

| 预设名称 | 风格描述 | 特点 |
|---------|---------|------|
| **WeChat Green** (默认) | 专业简洁 | 经典微信绿，适合大部分内容类型 |
| **Elegant Classic** | 经典编辑 | 温暖色调，标题更醒目，适合深度阅读 |
| **Modern Bold** | 现代大胆 | 高对比度，蓝色主调，视觉冲击力强 |
| **Minimal Clean** | 极简干净 | 灰度配色，内容优先，减少视觉干扰 |
| **Tech Developer** | 技术风格 | 深色背景，紫色强调，优化代码可读性 |

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

每个类目的选项列表最后都有一项 **「自定义」**，选中后改用你自己写的 CSS，见下节。

### 逐类目自定义样式

上面 10 个元素类目（H1/H2/H3、引用块、列表、链接、图片、分割线、表格、行内代码）除了内置风格，都可以选「自定义」，改用你自己写的样式。这里只讲基本用法，完整机制说明（叠加规则、变量替换范围、已知限制、涉及的源码）见 [docs/custom-styles.md](docs/custom-styles.md)：

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

类目与文件名对应关系：`h1` `h2` `h3` `blockquote` `list` `link` `image` `divider` `table` `inlineCode`，即文件路径固定是 `.wechat/custom/<类目 key>.css`。

> 这套「逐类目自定义样式」是目前推荐的深度定制方式，比早期版本里全局的 `.wechat/theme.override.ts`（已移除）更细粒度、门槛也更低——不需要写 TypeScript 或了解内部 `Theme` 结构，纯 CSS 声明即可。

### 创建自定义主题预设

创建自定义预设有两种方式：

#### 方式一：通过样式管理面板

1. 命令面板执行 `WeChat MD: Open Style Management Panel`
2. 在主题预设 Tab 中调整至满意效果
3. 预设文件可手动保存到 `.wechat/presets/` 目录

#### 方式二：手动创建预设文件

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

当同时存在多个配置时，优先级从高到低：

1. **customCSS** — 高级 CSS 扩展（追加到元素样式）
2. **vars** — 预设样式变量
3. **系统默认值** — 内置默认样式

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
