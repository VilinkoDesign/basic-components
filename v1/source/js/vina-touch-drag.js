(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  var DEFAULTS = {
    threshold: 6,
    dragClass: 'td-dragging',
    ghostClass: 'td-ghost',
    highlightClass: 'td-dropzone-active',
    dragAttr: 'data-touch-drag',
    dropzoneAttr: 'data-touch-dropzone',
    ghostContent: null,
    disable: null,
    injectStyles: true,
    autoInit: true,
    onStart: null,
    onMove: null,
    onDrop: null,
    onCancel: null
  };

  var config = Object.assign({}, DEFAULTS);
  var initialized = false;
  var activeDrag = null;
  var stylesInjected = false;

  var elementConfigs = new WeakMap();
  var registeredDraggables = new WeakSet();
  var registeredDropzones = new WeakSet();

  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    if (document.getElementById('td-styles')) return;

    var style = document.createElement('style');
    style.id = 'td-styles';
    style.textContent =
      '[data-touch-drag]{' +
        'touch-action:none;' +
        '-webkit-user-select:none;user-select:none;' +
        '-webkit-touch-callout:none;' +
        'cursor:grab;' +
      '}' +
      '[data-touch-drag].td-dragging{cursor:grabbing}' +
      '.td-ghost{' +
        'position:fixed;left:0;top:0;' +
        'pointer-events:none;' +
        'z-index:2147483647;' +
        'transform:translate(-50%,-50%);' +
        'white-space:nowrap;' +
        'will-change:transform,left,top;' +
      '}' +
      '.td-ghost-default{' +
        'padding:6px 12px;' +
        'border-radius:8px;' +
        'background:rgba(82,121,251,0.95);' +
        'color:#fff;' +
        'font-size:13px;font-weight:500;' +
        'box-shadow:0 8px 24px rgba(0,0,0,0.22);' +
      '}' +
      '.td-dropzone-active{' +
        'outline:2px dashed rgba(82,121,251,0.7);' +
        'outline-offset:-4px;' +
      '}';

    document.head.appendChild(style);
  }

  function getGhostContent(el, cfg) {
    if (typeof cfg.ghostContent === 'function') {
      return cfg.ghostContent(el);
    }
    if (typeof cfg.ghostContent === 'string') {
      return cfg.ghostContent;
    }
    var attr = el.getAttribute('data-touch-drag-ghost');
    if (attr) return attr;
    var text = (el.textContent || '').trim();
    return text || '拖动中';
  }

  function createGhost(el, cfg) {
    var ghost = document.createElement('div');
    ghost.className = (cfg.ghostClass || 'td-ghost') + ' td-ghost-default';
    ghost.setAttribute('aria-hidden', 'true');

    var content = getGhostContent(el, cfg);
    if (content instanceof Node) {
      ghost.appendChild(content);
    } else {
      ghost.textContent = String(content);
    }

    ghost.style.left = '0px';
    ghost.style.top = '0px';
    document.body.appendChild(ghost);
    return ghost;
  }

  function getDropzoneAt(x, y, cfg) {
    var el = document.elementFromPoint(x, y);
    if (!el) return null;

    var found = el.closest('[' + cfg.dropzoneAttr + ']');
    if (found) return found;

    var node = el;
    while (node) {
      if (registeredDropzones.has(node)) return node;
      node = node.parentElement;
    }
    return null;
  }

  function startDrag(source, ev, userCfg) {
    if (activeDrag) return;

    var cfg = Object.assign(
      {},
      config,
      elementConfigs.get(source) || {},
      userCfg || {}
    );

    if (typeof cfg.disable === 'function' && cfg.disable(source, ev)) return;
    if (cfg.disable === true) return;

    var pointerId = ev.pointerId;
    var startX = ev.clientX;
    var startY = ev.clientY;

    var drag = {
      source: source,
      pointerId: pointerId,
      startX: startX,
      startY: startY,
      cfg: cfg,
      ghost: null,
      activated: false,
      currentDropzone: null,
      data: source.getAttribute(cfg.dragAttr) || ''
    };

    function cleanup() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);

      if (drag.currentDropzone) {
        drag.currentDropzone.classList.remove(cfg.highlightClass);
        drag.currentDropzone = null;
      }
      if (drag.ghost && drag.ghost.parentNode) {
        drag.ghost.remove();
      }
      drag.ghost = null;
      source.classList.remove(cfg.dragClass);

      if (activeDrag === drag) activeDrag = null;
    }

    function suppressClickOnce() {
      function handler(e) {
        e.stopPropagation();
        e.preventDefault();
        document.removeEventListener('click', handler, true);
      }
      document.addEventListener('click', handler, true);
      setTimeout(function () {
        document.removeEventListener('click', handler, true);
      }, 300);
    }

    function onPointerMove(e) {
      if (e.pointerId !== pointerId) return;

      if (!drag.activated) {
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        if (Math.sqrt(dx * dx + dy * dy) < cfg.threshold) return;

        drag.activated = true;
        source.classList.add(cfg.dragClass);

        try {
          drag.ghost = createGhost(source, cfg);
        } catch (err) {
          drag.ghost = null;
        }

        if (typeof cfg.onStart === 'function') {
          cfg.onStart({
            source: source,
            data: drag.data,
            ghost: drag.ghost,
            clientX: e.clientX,
            clientY: e.clientY,
            event: e
          });
        }
      }

      if (drag.ghost) {
        drag.ghost.style.left = e.clientX + 'px';
        drag.ghost.style.top = e.clientY + 'px';
      }

      var dz = getDropzoneAt(e.clientX, e.clientY, cfg);
      if (dz !== drag.currentDropzone) {
        if (drag.currentDropzone) {
          drag.currentDropzone.classList.remove(cfg.highlightClass);
        }
        drag.currentDropzone = dz;
        if (dz) dz.classList.add(cfg.highlightClass);
      }

      var ctx = {
        source: source,
        dropzone: dz,
        data: drag.data,
        ghost: drag.ghost,
        clientX: e.clientX,
        clientY: e.clientY,
        event: e
      };

      if (typeof cfg.onMove === 'function') {
        cfg.onMove(ctx);
      }

      e.preventDefault();
    }

    function onPointerUp(e) {
      if (e.pointerId !== pointerId) return;

      var activated = drag.activated;
      var dropzone = drag.currentDropzone;
      var ghost = drag.ghost;
      var data = drag.data;

      cleanup();

      if (!activated) return;

      suppressClickOnce();

      var ctx = {
        source: source,
        dropzone: dropzone,
        data: data,
        ghost: ghost,
        clientX: e.clientX,
        clientY: e.clientY,
        event: e
      };

      if (typeof cfg.onDrop === 'function') {
        cfg.onDrop(ctx);
      }

      if (dropzone) {
        var dzCfg = elementConfigs.get(dropzone) || {};
        if (typeof dzCfg.onDrop === 'function') {
          dzCfg.onDrop(ctx);
        }
      }
    }

    function onPointerCancel(e) {
      if (e.pointerId !== pointerId) return;

      var activated = drag.activated;
      var ctx = {
        source: source,
        dropzone: drag.currentDropzone,
        data: drag.data,
        ghost: drag.ghost,
        clientX: e.clientX,
        clientY: e.clientY,
        event: e
      };

      cleanup();

      if (!activated) return;
      if (typeof cfg.onCancel === 'function') {
        cfg.onCancel(ctx);
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);

    activeDrag = drag;
  }

  function installGlobalListeners() {
    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      var source = e.target.closest('[' + config.dragAttr + ']');
      if (!source) return;
      if (registeredDraggables.has(source)) return;
      if (activeDrag) return;

      startDrag(source, e, null);
    }, true);
  }

  function setConfig(options) {
    Object.assign(config, options || {});
  }

  function init(options) {
    if (initialized) return;
    initialized = true;

    if (options) setConfig(options);
    if (config.injectStyles) injectStyles();
    installGlobalListeners();
  }

  function makeDraggable(el, options) {
    if (!el) throw new Error('TouchDrag.makeDraggable: invalid element');
    if (!initialized) init();

    var cfg = Object.assign(
      {},
      config,
      elementConfigs.get(el) || {},
      options || {}
    );
    elementConfigs.set(el, cfg);
    registeredDraggables.add(el);

    if (!el.hasAttribute(config.dragAttr)) {
      el.setAttribute(config.dragAttr, '');
    }

    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (activeDrag) return;
      startDrag(el, e, cfg);
    }, { passive: true });

    return {
      destroy: function () {
        registeredDraggables.delete(el);
        elementConfigs.delete(el);
      }
    };
  }

  function makeDropZone(el, options) {
    if (!el) throw new Error('TouchDrag.makeDropZone: invalid element');
    if (!initialized) init();

    var cfg = Object.assign(
      {},
      elementConfigs.get(el) || {},
      options || {}
    );
    elementConfigs.set(el, cfg);
    registeredDropzones.add(el);

    if (!el.hasAttribute(config.dropzoneAttr)) {
      el.setAttribute(config.dropzoneAttr, '');
    }

    return {
      destroy: function () {
        registeredDropzones.delete(el);
        elementConfigs.delete(el);
      }
    };
  }

  function isDragging() {
    return !!activeDrag && activeDrag.activated;
  }

  var TouchDrag = {
    version: VERSION,
    init: init,
    config: setConfig,
    makeDraggable: makeDraggable,
    makeDropZone: makeDropZone,
    isDragging: isDragging
  };

  global.TouchDrag = TouchDrag;

  if (config.autoInit) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { init(); }, { once: true });
    } else {
      setTimeout(init, 0);
    }
  }

})(typeof window !== 'undefined' ? window : this);
