"use strict";

/**
 * Stub mínimo de DOM/Image/requestAnimationFrame para exercitar o ciclo
 * de vida REAL do game.js (init/destroy) sem abrir uma janela Electron.
 * Não é um DOM completo: implementa apenas o que o módulo utiliza.
 */

function createElement(id) {
  const listeners = new Map();
  return {
    id,
    tagName: "DIV",
    textContent: "",
    value: "",
    style: {},
    _attrs: {},
    classList: {
      _set: new Set(),
      add() {
        for (const c of arguments) this._set.add(c);
      },
      remove() {
        for (const c of arguments) this._set.delete(c);
      },
      toggle(c, force) {
        if (force === undefined) {
          if (this._set.has(c)) this._set.delete(c);
          else this._set.add(c);
        } else if (force) {
          this._set.add(c);
        } else {
          this._set.delete(c);
        }
      },
      contains(c) {
        return this._set.has(c);
      }
    },
    setAttribute(k, v) {
      this._attrs[k] = String(v);
    },
    getAttribute(k) {
      return Object.prototype.hasOwnProperty.call(this._attrs, k)
        ? this._attrs[k]
        : null;
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      if (listeners.has(type)) listeners.get(type).delete(fn);
    },
    focus() {},
    _listenerCount() {
      let n = 0;
      for (const set of listeners.values()) n += set.size;
      return n;
    }
  };
}

function createCanvas() {
  const el = createElement("gameCanvas");
  el.tagName = "CANVAS";
  el.width = 900;
  el.height = 400;
  el.getContext = function () {
    return {
      clearRect() {},
      drawImage() {},
      beginPath() {},
      arc() {},
      fill() {},
      stroke() {},
      fillText() {},
      fillRect() {},
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      font: "",
      textAlign: "",
      textBaseline: ""
    };
  };
  return el;
}

class ImageStub {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this._src = "";
    this.complete = false;
    this.naturalWidth = 0;
  }
  set src(value) {
    this._src = value;
    this.complete = true;
    this.naturalWidth = 100;
    if (typeof this.onload === "function") this.onload();
  }
  get src() {
    return this._src;
  }
}

/**
 * Instala os globais necessários e devolve utilidades de inspeção.
 */
function setupDom() {
  const elements = new Map();
  const docListeners = new Map();

  const canvas = createCanvas();
  elements.set("gameCanvas", canvas);

  const documentStub = {
    readyState: "complete",
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElement(id));
      return elements.get(id);
    },
    querySelector(selector) {
      if (selector === ".canvas-wrap") {
        if (!elements.has("__canvas-wrap")) {
          elements.set("__canvas-wrap", createElement("__canvas-wrap"));
        }
        return elements.get("__canvas-wrap");
      }
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener(type, fn) {
      if (!docListeners.has(type)) docListeners.set(type, new Set());
      docListeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      if (docListeners.has(type)) docListeners.get(type).delete(fn);
    },
    dispatch(type, event) {
      if (!docListeners.has(type)) return;
      for (const fn of docListeners.get(type)) fn(event);
    },
    createElement(tag) {
      return createElement("created-" + tag);
    },
    _docListenerCount() {
      let n = 0;
      for (const set of docListeners.values()) n += set.size;
      return n;
    }
  };

  const rafCallbacks = new Map();
  let rafCounter = 0;

  global.document = documentStub;
  global.Image = ImageStub;
  global.requestAnimationFrame = function (cb) {
    rafCounter += 1;
    rafCallbacks.set(rafCounter, cb);
    return rafCounter;
  };
  global.cancelAnimationFrame = function (id) {
    rafCallbacks.delete(id);
  };

  return {
    document: documentStub,
    canvas,
    elements,
    pendingRafCount() {
      return rafCallbacks.size;
    },
    /** Executa `count` frames do loop (cada frame agenda o próximo). */
    callPendingRafs(count) {
      for (let i = 0; i < count; i++) {
        const ids = Array.from(rafCallbacks.keys());
        if (!ids.length) return i;
        const id = ids[ids.length - 1];
        const cb = rafCallbacks.get(id);
        rafCallbacks.delete(id);
        cb();
      }
      return count;
    },
    totalElementListeners() {
      let n = 0;
      for (const el of elements.values()) n += el._listenerCount();
      return n;
    }
  };
}

module.exports = { setupDom, createElement, ImageStub };
