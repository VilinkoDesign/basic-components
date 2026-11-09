# vina-context-menu.js

轻量、零依赖的自定义右键菜单库。支持容器限定、主题定制、图标、子菜单、快捷键与完整的客制化渲染钩子。

- 全页面接管右键，或仅在指定容器内接管
- 菜单项、快捷键声明式配置
- CSS 变量主题系统，可与现有设计系统融合
- 菜单项图标、子菜单、自定义类名与内联样式
- 完整渲染钩子：`renderItem` / `renderSeparator` / `renderHeader` / `renderFooter` / `onBeforeRender`
- 打开动画、位置策略可配置
- 自动关闭：点击外部 / Escape / 失焦 / 尺寸变化
- 快捷键自动跳过输入框

---

## 目录

- [引入](#引入)
- [快速开始](#快速开始)
- [构造选项](#构造选项)
- [菜单项](#菜单项)
- [快捷键](#快捷键)
- [主题系统](#主题系统)
- [客制化渲染](#客制化渲染)
- [子菜单](#子菜单)
- [位置策略](#位置策略)
- [实例方法](#实例方法)
- [回调 ctx](#回调-ctx)
- [完整示例](#完整示例)
- [常见问题](#常见问题)

---

## 引入

```html
<script src="vina-context-menu.js"></script>
```

引入后全局可用 `window.VinaContextMenu`，以 ES6 class 形式提供。

无需任何 CSS 文件；库会自动注入默认样式（可通过 `injectStyles: false` 关闭）。

---

## 快速开始

```javascript
const menu = new VinaContextMenu({
  container: document.getElementById('app'),
  items: [
    {
      label: '复制',
      shortcut: 'Ctrl+C',
      onClick: () => doCopy()
    },
    {
      label: '粘贴',
      shortcut: 'Ctrl+V',
      onClick: () => doPaste()
    }
  ]
});

menu.attach();
```

在 `#app` 区域内右键即可看到菜单；其它区域可保持浏览器原生菜单，也可被拦截（见 `preventDefaultGlobal`）。

---

## 构造选项

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `container` | `Element \| string \| null` | `null` | 右键限定区域；`null` 表示全页面 |
| `items` | `Array` | `[]` | 菜单项数组，见[菜单项](#菜单项) |
| `shortcuts` | `Array` | `[]` | 快捷键数组，见[快捷键](#快捷键) |
| `theme` | `Object` | `{}` | 主题覆盖，见[主题系统](#主题系统) |
| `className` | `string` | `''` | 附加到菜单根元素的自定义类名 |
| `injectStyles` | `boolean` | `true` | 是否注入默认样式 |
| `zIndex` | `number` | `99998` | 菜单层级 |
| `animation` | `'slide' \| 'fade' \| 'none'` | `'slide'` | 打开动画 |
| `animationDuration` | `number` | `120` | 动画时长（毫秒） |
| `positionStrategy` | `'auto' \| 'cursor' \| Function` | `'auto'` | 位置策略，见[位置策略](#位置策略) |
| `offsetX` / `offsetY` | `number` | `0` | 光标额外偏移（像素） |
| `viewportPadding` | `number` | `8` | 视口边缘安全距离（像素） |
| `preventDefaultGlobal` | `boolean` | `true` | 是否全页面禁用浏览器原生右键 |
| `renderItem` | `Function` | `null` | 完全接管菜单项渲染，见[客制化渲染](#客制化渲染) |
| `renderSeparator` | `Function` | `null` | 完全接管分隔线渲染 |
| `onBeforeRender` | `Function` | `null` | 渲染前触发 |
| `renderHeader` | `Function` | `null` | 菜单顶部区块 |
| `renderFooter` | `Function` | `null` | 菜单底部区块 |
| `onBeforeOpen` | `(ctx) => boolean \| void` | `null` | 打开前钩子；返回 `false` 阻止打开 |
| `onOpen` | `(ctx) => void` | `null` | 打开后触发 |
| `onClose` | `() => void` | `null` | 关闭后触发 |

---

## 菜单项

菜单项数组中的每一项可以是"可点击项"或"分隔线"。

### 可点击项

```javascript
{
  key: 'copy',                     // 唯一标识（可选）
  label: '复制',                   // 文本（必填）
  shortcut: 'Ctrl+C',              // 右侧快捷键提示（仅视觉）
  icon: '📋',                       // 图标，见下文
  className: 'item-danger',        // 附加类名
  style: { color: '#e14b4b' },     // 附加内联样式（对象或字符串）
  isDisabled: () => !hasSel(),     // 打开时实时求值
  onClick: (ctx) => doCopy()       // 点击回调
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `key` | `string` | 唯一标识 |
| `label` | `string` | 显示文本 |
| `shortcut` | `string` | 右侧快捷键提示，仅视觉展示 |
| `icon` | `string \| HTMLElement \| Function` | 图标，详见下方 |
| `className` | `string` | 附加类名 |
| `style` | `object \| string` | 附加内联样式 |
| `isDisabled` | `(ctx) => boolean` | 每次打开时调用，返回 `true` 则禁用 |
| `disabled` | `boolean` | 静态禁用（与 `isDisabled` 二选一） |
| `onClick` | `(ctx) => void` | 点击时触发 |
| `children` | `Array` | 子菜单项数组，见[子菜单](#子菜单) |

### 图标

`icon` 支持三种形式：

```javascript
// 1. 字符串（作为文本节点渲染）
{ icon: '📋', label: '复制' }

// 2. HTMLElement
{ icon: Object.assign(document.createElement('i'), { className: 'fa fa-copy' }), label: '复制' }

// 3. 函数（返回字符串或 HTMLElement）
{
  icon: (item, ctx) => isSelected() ? '✓' : '',
  label: '复制'
}
```

### 分隔线

```javascript
{ separator: true }
```

---

## 快捷键

快捷键与菜单项完全独立：菜单项负责点击，快捷键负责键盘。

```javascript
{
  key: 'c',
  ctrl: true,
  shift: false,
  alt: false,
  handler: (event) => {
    doCopy();
    // 返回 false 可阻止默认行为
  }
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `key` | `string` | 键名，如 `'c'`、`'Delete'`；不区分大小写 |
| `ctrl` / `shift` / `alt` | `boolean` | 必须与布尔值严格一致才触发 |
| `handler` | `(event) => boolean \| void` | 触发回调；返回 `false` 时不调用 `preventDefault` |

匹配规则：

- `{ key: 'c', ctrl: true }` → 触发 `Ctrl+C`，不触发 `Ctrl+Shift+C`
- `{ key: 'c' }` → 触发纯 `C`，不触发 `Ctrl+C`

自动跳过：

- `input` / `textarea` / `select`
- `contenteditable` 元素

---

## 主题系统

库使用 CSS 变量驱动样式，通过 `theme` 选项即可覆盖。

### 通过 `theme` 传入

```javascript
new VinaContextMenu({
  theme: {
    background: '#202837',
    borderColor: '#3a445a',
    itemColor: '#e6ecf5',
    itemHoverBackground: 'rgba(82,121,251,.2)',
    itemHoverColor: '#ffffff',
    itemDisabledColor: 'rgba(255,255,255,.3)',
    separatorColor: 'rgba(255,255,255,.1)'
  },
  items: [ /* ... */ ]
});
```

### 可用主题键

| 键 | CSS 变量 | 用途 |
|---|---|---|
| `background` | `--vcm-background` | 菜单背景 |
| `borderColor` | `--vcm-border-color` | 边框色 |
| `borderRadius` | `--vcm-border-radius` | 圆角（数字自动转 px） |
| `padding` | `--vcm-padding` | 菜单内边距 |
| `minWidth` | `--vcm-min-width` | 最小宽度 |
| `boxShadow` | `--vcm-box-shadow` | 阴影 |
| `fontFamily` | `--vcm-font-family` | 菜单字体 |
| `itemPadding` | `--vcm-item-padding` | 菜单项内边距 |
| `itemBorderRadius` | `--vcm-item-border-radius` | 菜单项圆角 |
| `itemColor` | `--vcm-item-color` | 菜单项文本色 |
| `itemFontSize` | `--vcm-item-font-size` | 菜单项字号 |
| `itemHoverBackground` | `--vcm-item-hover-bg` | 悬停背景 |
| `itemHoverColor` | `--vcm-item-hover-color` | 悬停文本色 |
| `itemDisabledColor` | `--vcm-item-disabled-color` | 禁用文本色 |
| `iconGap` | `--vcm-icon-gap` | 图标与文字间距 |
| `iconSize` | `--vcm-icon-size` | 图标尺寸 |
| `shortcutColor` | `--vcm-shortcut-color` | 快捷键提示色 |
| `shortcutFontSize` | `--vcm-shortcut-font-size` | 快捷键字号 |
| `shortcutMarginLeft` | `--vcm-shortcut-margin-left` | 快捷键左边距 |
| `shortcutFontFamily` | `--vcm-shortcut-font-family` | 快捷键字体 |
| `separatorColor` | `--vcm-separator-color` | 分隔线颜色 |
| `separatorMargin` | `--vcm-separator-margin` | 分隔线外边距 |

> 数字型键会自动补 `px`。其它色值请传字符串（`'rgba(...)'`、`'#ffffff'` 等）。

### 通过外部 CSS 覆盖

```css
.vina-ctx-menu {
  --vcm-background: #202837;
  --vcm-item-color: #e6ecf5;
}
```

或用 `className` 附加自定义类提升选择性：

```javascript
new VinaContextMenu({
  className: 'dark-menu',
  items: [ /* ... */ ]
});
```

```css
.vina-ctx-menu.dark-menu {
  --vcm-background: #202837;
  --vcm-item-color: #e6ecf5;
}
```

### 完全接管样式

```javascript
new VinaContextMenu({
  injectStyles: false,
  items: [ /* ... */ ]
});
```

库不注入任何样式，`.vina-ctx-menu` / `.vina-ctx-item` / `.vina-ctx-shortcut` / `.vina-ctx-sep` 等类名完全由你实现。

### 运行时修改

```javascript
menu.setTheme({ itemHoverColor: '#e14b4b' });
```

---

## 客制化渲染

### renderItem

完全接管单个菜单项的渲染：

```javascript
new VinaContextMenu({
  renderItem: (item, ctx, defaultEl) => {
    // 只接管 key 为 'dangerous' 的项
    if (item.key !== 'dangerous') return;  // 返回 undefined 使用 defaultEl

    const el = document.createElement('button');
    el.className = 'vina-ctx-item';
    el.style.color = '#e14b4b';
    el.textContent = item.label;
    el.addEventListener('click', () => item.onClick(ctx));
    return el;
  },
  items: [ /* ... */ ]
});
```

- 返回 `HTMLElement`：使用自定义元素
- 返回 `undefined` / 其它：回退到 `defaultEl`

### renderSeparator

```javascript
renderSeparator: () => {
  const hr = document.createElement('hr');
  hr.style.cssText = 'border:none;border-top:1px dashed #c2c2c2;margin:6px 4px;';
  return hr;
}
```

### renderHeader / renderFooter

分别插入菜单顶部与底部区块：

```javascript
new VinaContextMenu({
  renderHeader: (menuEl, ctx) => {
    return '命中：' + (ctx.target.nodeName || '');
  },
  renderFooter: () => {
    const el = document.createElement('div');
    el.textContent = 'v1.1';
    el.style.cssText = 'font-size:10px;color:#9a9a9a;padding:4px 8px;';
    return el;
  },
  items: [ /* ... */ ]
});
```

- 返回 `HTMLElement`：直接插入
- 返回 `string`：包装为 `.vina-ctx-header` / `.vina-ctx-footer` 文本块
- 返回空：不渲染

### onBeforeRender

在所有菜单项渲染前触发，可用于插入横幅或动态修改 `items`：

```javascript
onBeforeRender: (menuEl, items) => {
  const banner = document.createElement('div');
  banner.style.cssText = 'padding:6px 8px;font-size:10px;color:#9a9a9a;';
  banner.textContent = '画布操作';
  menuEl.appendChild(banner);
}
```

> 若在 `onBeforeRender` 里 `appendChild`，后续默认渲染会继续在其后追加菜单项。

---

## 子菜单

在菜单项上声明 `children` 数组即可生成子菜单：

```javascript
{
  label: '更多操作',
  icon: '⋯',
  children: [
    { label: '导出', onClick: () => doExport() },
    { label: '分享', onClick: () => doShare() },
    { separator: true },
    {
      label: '清空',
      onClick: () => doClear(),
      isDisabled: () => !hasContent()
    }
  ]
}
```

行为：

- 悬停父项约 80ms 后弹出子菜单
- 移出后约 160ms 自动隐藏
- 主菜单关闭时子菜单一并关闭
- 子菜单项支持与主菜单项相同的字段（`key` / `label` / `icon` / `isDisabled` / `onClick` / `separator` 等）
- **当前版本只支持一层子菜单**，暂不支持多级嵌套

---

## 位置策略

通过 `positionStrategy` 控制菜单出现位置：

| 值 | 行为 |
|---|---|
| `'auto'`（默认） | 光标位置 + 视口边缘避让 |
| `'cursor'` | 严格光标位置，不做避让 |
| `Function` | 自定义函数 `(clientX, clientY, menuRect, viewport) => { left, top }` |

### 示例

```javascript
// 始终放在光标右侧 24px
new VinaContextMenu({
  positionStrategy: (x, y) => ({ left: x + 24, top: y }),
  items: [ /* ... */ ]
});
```

### viewport 参数

```javascript
{
  width: window.innerWidth,
  height: window.innerHeight,
  padding: 8       // 对应 options.viewportPadding
}
```

### 偏移

`offsetX` / `offsetY` 会先叠加到光标坐标，再在 `'auto'` 模式做视口避让：

```javascript
new VinaContextMenu({
  offsetX: 8,
  offsetY: 8,
  items: [ /* ... */ ]
});
```

---

## 实例方法

| 方法 | 说明 |
|---|---|
| `.attach()` | 绑定事件，开始接管右键 |
| `.detach()` | 解绑事件并关闭菜单 |
| `.open(x, y, ctx?)` | 手动打开菜单 |
| `.close()` | 关闭菜单及子菜单 |
| `.isOpened()` | 当前是否打开 |
| `.setItems(items)` | 替换菜单项，已打开时立即重渲染 |
| `.setShortcuts(shortcuts)` | 替换快捷键 |
| `.setContainer(elOrSelector)` | 改变右键限定区域 |
| `.setTheme(theme)` | 合并主题 |

`attach()` 幂等：重复调用不会重复绑定。

---

## 回调 ctx

除 `onClose` 外，所有打开与交互相关的回调都收到一个 `ctx` 对象：

| 字段 | 类型 | 说明 |
|---|---|---|
| `x` | `number` | 右键时的 `clientX` |
| `y` | `number` | 右键时的 `clientY` |
| `target` | `Element` | 右键命中的原始元素 |
| `event` | `MouseEvent` | 原始 `contextmenu` 事件对象 |

如需把 `clientX/Y` 换算到某个容器的坐标系，请在 `onClick` 或 `onBeforeOpen` 中自行换算。

---

## 完整示例

```javascript
const menu = new VinaContextMenu({
  container: document.querySelector('#board'),

  // 主题
  theme: {
    background: '#ffffff',
    borderRadius: 12,
    itemHoverColor: '#5279FB'
  },

  // 动画
  animation: 'slide',
  animationDuration: 120,

  // 位置
  positionStrategy: 'auto',
  viewportPadding: 8,

  // 顶部提示
  renderHeader: () => '画布操作',

  // 菜单项
  items: [
    {
      label: '删除',
      shortcut: 'Del',
      icon: '🗑',
      isDisabled: () => !getSelected(),
      onClick: () => removeSelected()
    },
    {
      label: '复制',
      shortcut: 'Ctrl+C',
      icon: '📋',
      isDisabled: () => !getSelected(),
      onClick: copyItem
    },
    { separator: true },
    {
      label: '粘贴',
      shortcut: 'Ctrl+V',
      icon: '📥',
      isDisabled: () => !clipboard,
      onClick: (ctx) => {
        const pos = toBoardCoords(ctx.x, ctx.y);
        pasteItem(pos.x, pos.y);
      }
    },
    { separator: true },
    {
      label: '更多',
      icon: '⋯',
      children: [
        { label: '导出', onClick: () => doExport() },
        {
          label: '重置',
          isDisabled: () => elements.length === 0,
          onClick: () => doReset()
        }
      ]
    }
  ],

  // 快捷键
  shortcuts: [
    { key: 'c', ctrl: true, handler: () => { copyItem(); } },
    { key: 'v', ctrl: true, handler: () => { pasteItem(0, 0); } }
  ],

  // 打开前选中命中元素
  onBeforeOpen: (ctx) => {
    const hit = ctx.target.closest('.el');
    if (hit) selectById(hit.dataset.id);
    else deselect();
    return true;
  }
});

menu.attach();
```

---

## 常见问题

**Q1. 只想在容器内接管右键，容器外保持浏览器原生菜单？**

```javascript
new VinaContextMenu({
  container: myEl,
  preventDefaultGlobal: false,
  items: [ /* ... */ ]
});
```

**Q2. 全页面禁用原生右键，但只在容器内弹出菜单？**

保持默认 `preventDefaultGlobal: true` 即可。

**Q3. 多次实例化会重复注入样式吗？**

不会。`<style id="vina-ctx-menu-styles">` 只注入一次。

**Q4. 同一页面使用多个菜单实例？**

给每个实例不同 `container`，并在各自的 `onBeforeOpen` 里返回 `false` 让不属于自己的区域不弹：

```javascript
new VinaContextMenu({
  container: '#areaA',
  onBeforeOpen: (ctx) => ctx.target.closest('#areaA') != null,
  items: [ /* ... */ ]
});

new VinaContextMenu({
  container: '#areaB',
  onBeforeOpen: (ctx) => ctx.target.closest('#areaB') != null,
  items: [ /* ... */ ]
});
```

或者只用一个实例，在 `onBeforeOpen` 里 `setItems` 动态切换。

**Q5. 移动端长按触发了菜单，怎么禁用？**

在 `onBeforeOpen` 里检测 `ctx.event.pointerType === 'touch'` 后 `return false`；或在 `attach()` 前判断是否为桌面环境。

**Q6. 主题变量设置后没生效？**

- 检查键名是否在[可用主题键](#可用主题键)表格内
- 若外部 CSS 用了更高选择器权重，会覆盖内联 `style`；请改用同一权重或 `className` 方案

**Q7. 如何放分隔线？**

```javascript
{ separator: true }
```

**Q8. 子菜单能嵌套多层吗？**

当前版本仅支持一层。
