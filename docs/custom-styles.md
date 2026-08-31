# 逐类目自定义样式（Per-Category Custom Style）

本文档说明 `.wechat/custom/<category>.css` 这套自定义样式机制的完整设计和用法，供以后需要深度定制、或者要改这部分源码的人查阅。用户向导性质的简介见 [README.md](../README.md) 里的「逐类目自定义样式」一节；本文档更完整、更偏机制解释。

## 1. 这是什么

样式管理面板（`WeChat MD: Open Style Management Panel`）里，每个元素类目除了内置的装饰预设，列表最后都有一项 **「自定义」**。选中它之后，该类目改用你自己写的 CSS，而不是内置预设。

一共 10 个类目：

| 类目 key | 对应内容 | 自定义文件路径 | 默认结构选择器 |
|---|---|---|---|
| `h1` | 一级标题 | `.wechat/custom/h1.css` | `.wmd-h1, h1` |
| `h2` | 二级标题 | `.wechat/custom/h2.css` | `.wmd-h2, h2` |
| `h3` | 三级标题 | `.wechat/custom/h3.css` | `.wmd-h3, h3` |
| `blockquote` | 引用块 | `.wechat/custom/blockquote.css` | `.wmd-blockquote, blockquote` |
| `list` | 无序列表 | `.wechat/custom/list.css` | `.wmd-ul, ul, .wmd-ol, ol` |
| `link` | 链接 | `.wechat/custom/link.css` | `.wmd-a, a` |
| `image` | 图片 | `.wechat/custom/image.css` | `.wmd-img, img` |
| `divider` | 分割线 | `.wechat/custom/divider.css` | `.wmd-hr, hr` |
| `table` | 表格 | `.wechat/custom/table.css` | `.wmd-table, table` |
| `inlineCode` | 行内代码 | `.wechat/custom/inlineCode.css` | `.wmd-code, code` |

文件名固定就是「类目 key + `.css`」，不是预设 id（预设 id 各类目前缀不一样，比如 blockquote 类目的预设 id 是 `quote-xxx`，但文件永远叫 `blockquote.css`）。

## 2. 为什么要有这套机制

在这之前，深度定制只能靠一个全局的 `.wechat/theme.override.ts`：一个要写 TypeScript、需要了解内部 `Theme` 类型结构的覆盖函数，一次改就是整个主题对象，门槛高、粒度粗。这套机制已经被移除，替换成了现在这套：

- **纯 CSS**，不需要懂 TypeScript / 内部数据结构
- **逐类目**，只改你想改的那一个元素，不影响别的
- 和内置预设走同一套选择机制（样式面板选中即可），学习成本低

## 3. 文件格式：正常的 CSS 规则

文件内容写成一条**正常的、合法的 CSS 规则**——选择器 + `{ 声明... }`：

```css
/* .wechat/custom/h1.css */
.wmd-h1, h1 {
  display: table;
  margin: 1.8em auto 1em;
  text-align: center;
  border-bottom: 4px solid var(--wechat-accent);
  padding-bottom: 12px;
}
```

**关键点：选择器本身只是给人看的、不参与渲染。** 渲染时只会从文件里取花括号 `{ }` 内部的声明文本，直接拼进目标元素的 `style="..."` 属性里，选择器写什么、甚至删掉选择器只留声明都不影响结果（后一种是历史遗留的兼容写法，见下）。之所以还是要求写选择器，是因为这样文件本身是一份合法 CSS，VSCode 能正常语法高亮、报错提示、颜色色块预览，而不是一份"看起来像坏掉的 CSS"的裸声明列表。

### 兼容写法

如果文件里完全没有 `{` `}`（比如手滑只写了声明，没套花括号），会退化成把整个文件内容当声明处理，不会报错——但不建议这样写，纯粹是历史兼容，新文件请按上面的标准写法来。

### 注释

支持标准 CSS 的 `/* ... */` 块注释，读取时会被去掉，不会出现在最终样式里。

## 4. 叠加机制：自定义 ≠ 完全替换

**自定义 CSS 是叠加在该类目的「主题基础样式」之上的，不是把整个 style 属性换成你写的这几行。**

具体规则：最终 `style="..."` 属性 = `主题基础样式; 你写的自定义声明`。CSS 里同一个属性出现两次，**后出现的生效**，所以：

- 你没提到的属性（比如没写 `font-size`），保留主题默认值（标题该多大还是多大）
- 你写了的属性（比如 `border-bottom`、`margin`），覆盖主题默认值

**这一点非常重要**，因为：

1. 本地预览用的是真实的 `<h1>` 标签，浏览器自带的默认样式表会让它看起来"像标题"（粗体、大字号），哪怕 `style` 属性里什么都没写，所以看不出问题。
2. 微信公众号编辑器粘贴时**只认 `style="..."` 里写了什么**，不认标签语义。如果自定义 CSS 完全替换掉了 style 属性、没带上字号字重，粘贴过去标题会退化成正文大小——这是这套机制早期版本真实出现过的 bug（见 `src/renderer/index.ts` 的 `CATEGORY_THEME_KEY` 相关注释和 git log）。

主题基础样式具体是哪个，由 `src/renderer/index.ts` 里的 `CATEGORY_THEME_KEY` 决定：

```ts
const CATEGORY_THEME_KEY: Partial<Record<string, keyof Theme>> = {
  h1: 'h1', h2: 'h2', h3: 'h3',
  blockquote: 'blockquote',
  list: 'ul',
  link: 'a',
  image: 'img',
  divider: 'hr',
  inlineCode: 'inlineCode',
};
```

`table` 不在这个表里——`table` 的自定义分支是手写的骨架（`border/padding` 之类直接写死在 `_applyStylePresetOverrides()` 里），本身已经做了等价的"骨架 + 自定义"叠加，不需要再走这套通用机制。

## 5. 支持主题色变量

声明里可以用 `var(--wechat-accent)`，保存后会自动替换成当前主题预设的实际强调色（不是浏览器原生 CSS 变量机制——微信最终只吃纯 inline style，没有 `:root` 声明，所以这是纯字符串替换，不是真正的 CSS 变量）。目前支持替换的变量：

| 变量 | 对应值 |
|---|---|
| `--wechat-accent` | 当前主题强调色 |
| `--wechat-text-color` | 正文颜色 |
| `--wechat-code-bg` | 代码块背景色 |
| `--wechat-inline-code-color` | 行内代码颜色 |
| `--wechat-blockquote-bg` | 引用块背景色 |
| `--wechat-h1-color` / `--wechat-h2-color` / `--wechat-h3-color` | 各级标题颜色 |

替换逻辑在 `StylePresetManager.replaceCSSVariables()`，内置预设和自定义 CSS 走的是同一份替换代码。

## 6. 怎么用

1. 打开命令面板执行 `WeChat MD: Open Style Management Panel`
2. 找到对应类目的选项（比如"标题"tab 里的 H1 样式），点选项列表里的「自定义」chip
3. 点 chip 网格下方的 **✎ 编辑自定义样式** 链接——会自动创建（如果还没有）并在编辑器里打开对应的 `.wechat/custom/<category>.css`
4. 写好保存，预览面板会自动热重载（文件监听在 `PreviewPanel.watchCustomTheme()` 里，watch 的是 `.wechat/custom/*.css`）
5. 复制内容到公众号编辑器时用的是同一份渲染结果，不需要额外操作

## 7. 已知限制

- **`list` 的自定义只影响 `<ul>` 的 style**，`<li>` 沿用 markdown-it 默认输出，不会跟着变。如果要改列表项的样式（比如去掉默认圆点、换成别的标记），目前只能选内置的列表预设（`list-arrow`/`list-check` 等），自定义模式做不到——这是既有的功能缺口，`list` 类目在整个预设系统里本来就没有真正意义上的"通用 CSS 骨架"可以复用。
- **`table` 的自定义只作用于 `<table>`/`<th>`/`<td>` 三个标签各自的 style**，无法单独定制某一列/某一行（比如斑马纹隔行变色这种效果，需要按行 index 算样式，自定义 CSS 做不到，只能选内置的 `table-striped` 预设）。
- 微信编辑器最终只认 inline style，**不支持** `:hover`、`::before`/`::after` 伪元素、媒体查询等任何需要"选择器语法"才能表达的效果——这也是为什么文件里的选择器不参与渲染，只取声明。凡是内置预设里出现的"伪元素装饰"（比如 `hr-text` 的 ●●● 文字分割线），都是手写 HTML 结构实现的，自定义 CSS 做不到。
- `var()` 变量替换是纯文本替换，只支持上表列出的几个变量名，不认识的 `var(--xxx)` 会原样保留在最终 style 里（浏览器里显示为无效值，等同于没设置）。

## 8. 涉及的源码（给以后要改这块逻辑的人）

| 文件 | 职责 |
|---|---|
| `src/renderer/stylePresets.ts` | 每个类目预设数组末尾的 `-custom` 哨兵项定义；`getCustomPresetId`/`isCustomPresetId`；类目→选择器映射 `getCategorySelector` |
| `src/renderer/customStyles.ts` | 纯文件系统读写：`loadCustomCSS`/`loadAllCustomCSS`/`ensureCustomStyleFile`/`getCustomStylePath`；CSS 规则花括号提取逻辑 `extractDeclarations` |
| `src/renderer/StylePresetManager.ts` | `replaceCSSVariables()`（供内置预设和自定义 CSS 共用）；面板选中状态的读写（存在 `workspaceState['selectedStylePresets']`，不是文件） |
| `src/renderer/index.ts` | `_applyStylePresetOverrides()` 里的 `getCSS()` 辅助函数——命中 `-custom` 时读自定义 CSS、做变量替换、叠加 `CATEGORY_THEME_KEY` 对应的主题基础样式；`list-custom`/`table-custom` 分支 |
| `src/panel/PreviewPanel.ts` | `applyCustomStylesToRenderer()` 汇总所有类目的自定义 CSS 传给渲染器；`.wechat/custom/*.css` 的文件监听 |
| `src/panel/StylePanel.ts` | 「✎ 编辑自定义样式」链接的消息处理 `openCustomStyleFile`；hover 预览时读取自定义文件内容 |

## 9. 示例

仓库里 `example/.wechat/custom/` 下有可以直接参考的示例文件（居中 + 主题色下划线的 H1、固定长度的分割线）。
