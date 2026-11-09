# vina-touch-drag.js

> 一个零依赖的通用触屏拖拽库。基于 Pointer Events 统一处理鼠标、触屏、手写笔，解决 HTML5 原生拖放在触屏设备上不触发的问题。

---

## 目录

1. [简介](#1-简介)
2. [引入方式](#2-引入方式)
3. [快速开始](#3-快速开始)
4. [声明式用法](#4-声明式用法)
5. [命令式用法](#5-命令式用法)
6. [全局配置](#6-全局配置)
7. [回调参数 `ctx` 详解](#7-回调参数-ctx-详解)
8. [样式定制](#8-样式定制)
9. [常见场景示例](#9-常见场景示例)
10. [注意事项](#10-注意事项)
11. [FAQ](#11-faq)

---

## 1. 简介

### 解决什么问题

| 痛点 | 原生 HTML5 DnD | `vina-touch-drag.js` |
|------|---------------|-----------------|
| 触屏设备能否拖拽 | ❌ 不触发 `dragstart` | ✅ Pointer Events |
| 鼠标 / 触屏 / 手写笔统一 | ❌ 需要两套逻辑 | ✅ 一套 |
| 触摸时页面滚动干扰 | ❌ 常触发滚动 | ✅ 自动 `touch-action:none` |
| 拖拽后误触发 `click` | ❌ 常见 | ✅ 自动拦截 300ms |
| 多指同时操作 | ❌ 状态错乱 | ✅ 锁定 `pointerId` |
| 幽灵元素视觉反馈 | ✅ 浏览器自带 | ✅ 自定义 `.td-ghost` |

### 核心特性

- **零依赖**：纯 JS，无框架要求
- **双模式**：声明式（HTML 属性）或命令式（JS 调用）
- **可定制**：类名、阈值、幽灵内容、命中高亮均可配置
- **安全隔离**：命令式绑定与声明式互不干扰
- **动态支持**：事件委托 + `closest()`，动态插入元素无需重绑

---

## 2. 引入方式

### 传统 `<script>` 标签

```html
<script src="vina-touch-drag.js"></script>
```

脚本会在 `DOMContentLoaded` 后自动初始化，无需手动调用。

### ES Module（可选）

```js
import 'vina-touch-drag.js';
```

库会挂载到 `window.TouchDrag`。

---

## 3. 快速开始

### 最简单示例

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <!-- 可拖拽元素 -->
  <div data-touch-drag="rect" style="padding:20px;background:#eef;">矩形</div>

  <!-- 放置区域 -->
  <div data-touch-dropzone style="width:300px;height:200px;border:1px solid #ccc;">
    放到这里
  </div>

  <script src="vina-touch-drag.js"></script>
  <script>
    TouchDrag.config({
      onDrop: function (ctx) {
        if (!ctx.dropzone) return;
        console.log('放下：', ctx.data, '→', ctx.dropzone);
      }
    });
  </script>
</body>
</html>
```

只需两步：
1. 元素上加 `data-touch-drag`
2. 放置区域加 `data-touch-dropzone`

---

## 4. 声明式用法

### 4.1 基础属性

| 属性 | 位置 | 说明 |
|------|------|------|
| `data-touch-drag` | 可拖拽元素 | 标记为可拖拽，属性值会传给 `ctx.data` |
| `data-touch-dropzone` | 放置区域 | 标记为可放置 |
| `data-touch-drag-ghost` | 可拖拽元素 | 自定义幽灵文本（可选） |

### 4.2 示例

```html
<!-- 拖拽源：data-touch-drag 的值会成为 ctx.data -->
<div data-touch-drag="rect">矩形</div>
<div data-touch-drag="text">文字</div>

<!-- 幽灵文字自定义 -->
<div data-touch-drag="icon" data-touch-drag-ghost="★ 图标">
  图标组件
</div>

<!-- 多个放置区域 -->
<div data-touch-dropzone>画布 A</div>
<div data-touch-dropzone>画布 B</div>
```

### 4.3 全局回调

声明式元素使用**全局配置**中的回调：

```js
TouchDrag.config({
  onStart: function (ctx) { /* 开始拖动 */ },
  onMove:  function (ctx) { /* 移动中 */ },
  onDrop:  function (ctx) { /* 松手 */ },
  onCancel: function (ctx) { /* 被系统手势打断 */ }
});
```

---

## 5. 命令式用法

当需要**精细化控制**（每个元素不同配置、不同回调）时，使用 JS API。

### 5.1 `makeDraggable`

```js
var handle = TouchDrag.makeDraggable(element, {
  threshold: 8,
  ghostContent: '拖动中',
  onDrop: function (ctx) {
    if (!ctx.dropzone) return;
    // 创建新元素放到 dropzone 中
  }
});

// 销毁
handle.destroy();
```

### 5.2 `makeDropZone`

```js
var handle = TouchDrag.makeDropZone(zone, {
  onDrop: function (ctx) {
    // 这个 dropzone 被放下时触发
  }
});

handle.destroy();
```

### 5.3 完整命令式示例

```html
<div id="palette">
  <div class="btn" data-type="rect">矩形</div>
  <div class="btn" data-type="text">文字</div>
</div>
<div id="canvas" style="width:400px;height:300px;border:1px solid #ccc;"></div>

<script src="vina-touch-drag.js"></script>
<script>
  var canvas = document.getElementById('canvas');

  TouchDrag.makeDropZone(canvas, {
    onDrop: function (ctx) {
      var r = canvas.getBoundingClientRect();
      var x = ctx.clientX - r.left;
      var y = ctx.clientY - r.top;

      var el = document.createElement('div');
      el.style.cssText =
        'position:absolute;left:' + x + 'px;top:' + y + 'px;' +
        'width:80px;height:40px;background:#5279FB;color:#fff;' +
        'display:flex;align-items:center;justify-content:center;';
      el.textContent = ctx.data;
      canvas.appendChild(el);
    }
  });

  document.querySelectorAll('#palette .btn').forEach(function (btn) {
    TouchDrag.makeDraggable(btn, {
      ghostContent: btn.textContent,
      onDrop: function (ctx) {
        if (!ctx.dropzone) return;
        // dropzone 自身回调也会触发，此处可做额外逻辑
      }
    });
  });
</script>
```

> **注意**：命令式绑定的元素会打上内部标记，**声明式事件委托会跳过它们**，所以不会重复触发。可以安全地混合使用两种模式。

---

## 6. 全局配置

### 6.1 配置项一览

```js
TouchDrag.config({
  threshold: 6,                          // 拖拽激活阈值（px）
  dragClass: 'td-dragging',              // 拖拽时源元素类名
  ghostClass: 'td-ghost',                // 幽灵元素基类名
  highlightClass: 'td-dropzone-active',  // 悬停 dropzone 的类名
  dragAttr: 'data-touch-drag',           // 拖拽源属性名
  dropzoneAttr: 'data-touch-dropzone',   // 放置区属性名
  ghostContent: null,                    // 字符串 / 函数 (el) => string | Node
  disable: null,                         // true 或 (el, event) => boolean
  injectStyles: true,                    // 是否自动注入样式
  autoInit: true,                        // 是否自动初始化
  onStart: null,
  onMove: null,
  onDrop: null,
  onCancel: null
});
```

### 6.2 配置优先级

单个元素的配置覆盖顺序：

```
makeDraggable(el, options) 传的 options
    > TouchDrag.config(options) 全局配置
    > DEFAULTS 默认值
```

### 6.3 `disable` 示例

```js
// 布尔值：完全禁用
TouchDrag.config({ disable: true });

// 函数：条件禁用
TouchDrag.makeDraggable(el, {
  disable: function (source, event) {
    return document.body.classList.contains('running');
  }
});
```

---

## 7. 回调参数 `ctx` 详解

### 7.1 字段

| 字段 | 类型 | 出现于 | 说明 |
|------|------|--------|------|
| `source` | `HTMLElement` | 所有回调 | 拖拽源元素 |
| `dropzone` | `HTMLElement \| null` | `onMove` / `onDrop` / `onCancel` | 当前命中的放置区 |
| `data` | `string` | 所有回调 | `data-touch-drag` 的值 |
| `ghost` | `HTMLElement \| null` | 所有回调 | 幽灵元素（可能已移除） |
| `clientX` | `number` | 所有回调 | 视口 X 坐标 |
| `clientY` | `number` | 所有回调 | 视口 Y 坐标 |
| `event` | `PointerEvent` | 所有回调 | 原始事件 |

> ⚠️ `onStart` 触发时尚未进入任何 dropzone，因此 `ctx.dropzone` **不包含**（值为 `undefined`）。

### 7.2 生命周期

```
pointerdown（未达阈值）
     │
     ├── 位移 < threshold ──▶ 松手 → 视为点击，不创建幽灵
     │
     └── 位移 ≥ threshold
              │
              ▼
         onStart（激活）
              │
              ▼
         onMove（持续）
              │
        ┌─────┴─────┐
        ▼           ▼
     onDrop      onCancel
   （正常松手）  （系统打断）
```

### 7.3 示例

```js
TouchDrag.config({
  onStart: function (ctx) {
    console.log('开始拖动:', ctx.data);
  },
  onMove: function (ctx) {
    if (ctx.dropzone) {
      console.log('悬停在:', ctx.dropzone.id);
    }
  },
  onDrop: function (ctx) {
    if (!ctx.dropzone) {
      console.log('落在空白处，取消');
      return;
    }
    console.log('成功放下到:', ctx.dropzone.id);
  },
  onCancel: function (ctx) {
    console.log('拖拽被系统打断');
  }
});
```

---

## 8. 样式定制

### 8.1 默认注入的样式

库会自动注入 `#td-styles`，包含：

```css
[data-touch-drag] {
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  cursor: grab;
}

[data-touch-drag].td-dragging { cursor: grabbing; }

.td-ghost {
  position: fixed;
  left: 0; top: 0;
  pointer-events: none;
  z-index: 2147483647;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  will-change: transform, left, top;
}

.td-ghost-default {
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(82, 121, 251, 0.95);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
}

.td-dropzone-active {
  outline: 2px dashed rgba(82, 121, 251, 0.7);
  outline-offset: -4px;
}
```

### 8.2 关闭自动注入

```js
TouchDrag.config({ injectStyles: false });
```

然后自己写样式（推荐复制上面代码）。**不要省略 `touch-action: none;`**，否则触屏拖拽时页面会滚动。

### 8.3 自定义幽灵外观

```css
.td-ghost-default {
  background: #ff5722;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 15px;
  box-shadow: 0 4px 16px rgba(255, 87, 34, 0.4);
}
```

或使用自定义类名：

```js
TouchDrag.config({ ghostClass: 'my-ghost' });
```

```css
.my-ghost {
  padding: 8px 16px;
  background: #333;
  color: #fff;
  border-radius: 6px;
}
```

### 8.4 自定义 dropzone 高亮

```js
TouchDrag.config({ highlightClass: 'is-target' });
```

```css
.is-target {
  border-color: #5279FB;
  background: rgba(82, 121, 251, 0.08);
  box-shadow: inset 0 0 0 2px #5279FB;
}
```

---

## 9. 常见场景示例

### 9.1 从组件库拖入画布

```html
<div id="palette">
  <div data-touch-drag="rect">矩形</div>
  <div data-touch-drag="text">文字</div>
</div>
<div id="canvas" data-touch-dropzone></div>

<script>
  var canvas = document.getElementById('canvas');

  TouchDrag.config({
    onDrop: function (ctx) {
      if (!ctx.dropzone) return;

      var rect = canvas.getBoundingClientRect();
      var x = ctx.clientX - rect.left;
      var y = ctx.clientY - rect.top;

      var el = document.createElement('div');
      el.style.cssText =
        'position:absolute;left:' + x + 'px;top:' + y + 'px;' +
        'width:100px;height:60px;background:#5279FB;color:#fff;';
      el.textContent = ctx.data;
      canvas.appendChild(el);
    }
  });
</script>
```

### 9.2 文件夹间移动文件

```html
<div class="folder" data-touch-dropzone data-folder="A">
  <div data-touch-drag="file-1.txt">file-1.txt</div>
  <div data-touch-drag="file-2.txt">file-2.txt</div>
</div>
<div class="folder" data-touch-dropzone data-folder="B"></div>

<script>
  TouchDrag.config({
    onDrop: function (ctx) {
      if (!ctx.dropzone) return;

      var target = ctx.dropzone.dataset.folder;
      var source = ctx.source.parentElement.dataset.folder;
      if (target === source) return;

      ctx.dropzone.appendChild(ctx.source);
      console.log(ctx.data + ' 从 ' + source + ' 移到 ' + target);
    }
  });
</script>
```

### 9.3 拖拽排序（简单版）

```html
<ul id="list" data-touch-dropzone>
  <li data-touch-drag="1">条目 1</li>
  <li data-touch-drag="2">条目 2</li>
  <li data-touch-drag="3">条目 3</li>
</ul>

<script>
  var list = document.getElementById('list');

  TouchDrag.config({
    onDrop: function (ctx) {
      if (!ctx.dropzone) return;

      var target = document.elementFromPoint(ctx.clientX, ctx.clientY);
      var li = target && target.closest('li');

      if (li && li !== ctx.source) {
        list.insertBefore(ctx.source, li);
      } else if (!li && ctx.dropzone === list) {
        list.appendChild(ctx.source);
      }
    }
  });
</script>
```

### 9.4 运行时动态禁用

```js
var running = false;

TouchDrag.config({
  disable: function () {
    return running;
  }
});

// 切换到运行模式
function setRunning(v) {
  running = v;
}
```

### 9.5 与缩放画布配合

如果放置区有 `transform: scale()`，用 `getBoundingClientRect()` 换算即可：

```js
onDrop: function (ctx) {
  if (!ctx.dropzone) return;

  var r = ctx.dropzone.getBoundingClientRect();
  var scale = 0.5; // 与 CSS transform 的 scale 值一致
  var x = (ctx.clientX - r.left) / scale;
  var y = (ctx.clientY - r.top) / scale;

  // 使用 x, y 放置元素
}
```

### 9.6 动态插入的可拖拽元素

声明式无需任何操作，事件委托自动生效：

```js
var newEl = document.createElement('div');
newEl.setAttribute('data-touch-drag', 'new-item');
newEl.textContent = '动态元素';
palette.appendChild(newEl);  // 立即可拖拽
```

---

## 10. 注意事项

### 10.1 必须保留的 CSS 属性

声明式元素由库自动添加 `touch-action: none;`。命令式绑定的元素也会通过 `data-touch-drag` 属性获得同样样式。**不要在你的 CSS 中覆盖它**，否则触屏拖拽会触发页面滚动。

### 10.2 事件冲突

- 拖拽激活后，库会在 `document` 上**捕获一次 `click`** 并拦截，防止拖拽结束后误触发点击。
- 如需自定义 `click` 行为，在 `onDrop` 中手动处理即可，不会冲突。

### 10.3 与 `<a>` / `<button>` 元素

拖拽激活后会阻止默认行为，`<a>` 的链接、`<button>` 的提交不会触发。这是预期行为。

### 10.4 多指操作

拖拽进行中，其他指针的 `pointerdown` 会被忽略。拖拽的 `pointerId` 由第一次激活的指针决定。

### 10.5 嵌套 dropzone

命中检测使用 `closest('[data-touch-dropzone]')`，会返回**最内层**的 dropzone。如果希望外层也能感知，在 `onDrop` 里手动向上遍历即可：

```js
onDrop: function (ctx) {
  var node = ctx.dropzone;
  while (node) {
    if (node.matches('[data-touch-dropzone]')) {
      // 处理
    }
    node = node.parentElement;
  }
}
```

### 10.6 性能

- 使用 `document` 事件委托，动态元素无需重新绑定。
- `pointermove` 监听 `{ passive: false }` 以便 `preventDefault()`，只处理拖拽中的指针。
- 幽灵元素 `will-change: transform, left, top` 提示合成层，帧率稳定。

### 10.7 浏览器兼容

需要支持 **Pointer Events**：

| 浏览器 | 版本 |
|--------|------|
| Chrome | 55+ |
| Edge | 12+ |
| Firefox | 59+ |
| Safari | 13+ |
| iOS Safari | 13+ |
| Android Chrome | 55+ |

IE11 不支持（Pointer Events 有前缀且行为不同）。

---

## 11. FAQ

### Q1: 元素仍然无法拖动？

检查：
1. 元素或其祖先是否被 `disable: true` 或 `disable()` 返回 `true` 拦截。
2. 元素是否在 `document` 之外（如 Shadow DOM，需手动 `makeDraggable`）。
3. 是否有其他脚本对 `pointerdown` 调用了 `stopPropagation()`——库的全局监听在**捕获阶段**（`true`），一般不受影响。

### Q2: 触屏拖动时页面跟着滚动？

可能原因：
1. `injectStyles: false` 后没手动加 `touch-action: none;`。
2. 元素的 CSS 中 `touch-action` 被覆盖为 `auto`。

修复：

```css
[data-touch-drag] { touch-action: none !important; }
```

### Q3: 幽灵元素位置不跟随手指？

幽灵元素用 `position: fixed`，跟随 `clientX / clientY`。如果被放入有 `transform` 的祖先元素中会偏移——**库已将幽灵挂到 `document.body`**，一般无此问题。若仍偏移，检查是否 `body` 上有 `transform` 或 `filter`。

### Q4: 拖拽完成后触发了元素的 `click`？

库会在拖拽激活后拦截一次 `click`。如果仍触发，可能是因为：
- 有其他脚本重新派发了 `click` 事件；
- `setTimeout(300ms)` 后再次点击——这是正常行为。

如需彻底关闭，在 `onDrop` 中返回 `false` 并手动 `event.stopPropagation()`。

### Q5: 如何让 dropzone 只在某些拖拽源下高亮？

用 `onMove` 手动控制：

```js
TouchDrag.config({
  onMove: function (ctx) {
    var allowed = ctx.source.dataset.accept;
    if (ctx.dropzone) {
      var accepts = ctx.dropzone.dataset.accept;
      ctx.dropzone.classList.toggle(
        'is-target',
        !accepts || accepts === allowed
      );
    }
  }
});
```

### Q6: 能否在拖拽时隐藏源元素？

在 `onStart` 里手动设置：

```js
onStart: function (ctx) {
  ctx.source.style.opacity = '0.4';
},
onDrop: function (ctx) {
  ctx.source.style.opacity = '';
}
```

注意：`onCancel` 里也要恢复，否则打断后元素会一直半透明。

### Q7: 能否从 dropzone 中移除元素？

在 `onDrop` 里根据业务判断：

```js
onDrop: function (ctx) {
  if (!ctx.dropzone) {
    // 落在空白处 = 删除
    ctx.source.remove();
  }
}
```

---

## 附录：API 速查表

| API | 说明 |
|-----|------|
| `TouchDrag.version` | 版本号字符串 |
| `TouchDrag.init(options?)` | 手动初始化（自动初始化已启用时无需调用） |
| `TouchDrag.config(options)` | 更新全局配置 |
| `TouchDrag.makeDraggable(el, options?)` | 让元素可拖拽，返回 `{ destroy }` |
| `TouchDrag.makeDropZone(el, options?)` | 让元素接收拖放，返回 `{ destroy }` |
| `TouchDrag.isDragging()` | 当前是否正在拖拽 |

| 属性 | 说明 |
|------|------|
| `data-touch-drag="value"` | 标记拖拽源，值作为 `ctx.data` |
| `data-touch-drag-ghost="text"` | 自定义幽灵文本 |
| `data-touch-dropzone` | 标记放置区域 |
