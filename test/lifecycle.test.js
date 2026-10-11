"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { setupDom } = require("./helpers/dom-stub.js");
const LOGIC = require("../games/car-math/logic.js");

const GAME_PATH = path.resolve(__dirname, "../games/car-math/game.js");

function freshGame() {
  const dom = setupDom();
  global.window = global.window || {};
  global.window.CarMathLogic = LOGIC;
  global.window.GameStorage = {
    get: () => null,
    updateScore: () => 0,
    getPlayerName: () => "Teste"
  };
  global.window.jgWindow = undefined;

  delete require.cache[require.resolve(GAME_PATH)];
  require(GAME_PATH);
  return { dom, instance: global.window.carMath };
}

test("game.js expõe o contrato de ciclo de vida", () => {
  const { instance } = freshGame();
  assert.ok(instance, "window.carMath deve existir");
  assert.equal(typeof instance.init, "function");
  assert.equal(typeof instance.destroy, "function");
  assert.equal(typeof instance.focusCanvas, "function");
});

test("init inicia o loop e registra listeners", () => {
  const { dom, instance } = freshGame();
  instance.init();
  assert.ok(dom.pendingRafCount() >= 1, "deve haver requestAnimationFrame pendente");
  assert.ok(dom.document._docListenerCount() >= 1, "listeners de documento registrados");
  assert.ok(dom.totalElementListeners() >= 1, "listeners de elementos registrados");
  instance.destroy();
});

test("init é idempotente: não cria loops concorrentes", () => {
  const { dom, instance } = freshGame();
  instance.init();
  const afterFirst = dom.pendingRafCount();
  instance.init();
  instance.init();
  assert.equal(dom.pendingRafCount(), afterFirst, "não deve duplicar o loop");
  instance.destroy();
});

test("destroy cancela o RAF e remove todos os listeners", () => {
  const { dom, instance } = freshGame();
  instance.init();
  assert.ok(dom.pendingRafCount() >= 1);
  assert.ok(dom.document._docListenerCount() >= 1);

  instance.destroy();

  assert.equal(dom.pendingRafCount(), 0, "RAF cancelado");
  assert.equal(dom.document._docListenerCount(), 0, "listeners de documento removidos");
  assert.equal(dom.totalElementListeners(), 0, "listeners de elementos removidos");
});

test("destroy é idempotente", () => {
  const { instance } = freshGame();
  instance.init();
  assert.doesNotThrow(() => {
    instance.destroy();
    instance.destroy();
  });
});

test("reabrir o jogo repetidamente não acumula recursos", () => {
  for (let i = 0; i < 5; i++) {
    const { dom, instance } = freshGame();
    instance.init();
    assert.equal(dom.pendingRafCount(), 1, "apenas um loop por instância");
    instance.destroy();
    assert.equal(dom.pendingRafCount(), 0);
    assert.equal(dom.document._docListenerCount(), 0);
    assert.equal(dom.totalElementListeners(), 0);
  }
});

// ---------- Fim de partida e reinício (loop real) ----------

function keyEvent(key) {
  return { key, preventDefault() {}, target: null };
}

function moveCarLeftAndLetFall(dom) {
  dom.document.dispatch("keydown", keyEvent("ArrowLeft"));
  dom.callPendingRafs(90); // leva o carro até a borda esquerda
  dom.document.dispatch("keyup", keyEvent("ArrowLeft"));
  dom.callPendingRafs(700); // bolas caem e passam da base
}

test("a partida termina quando nenhuma bola é apanhada", () => {
  const { dom, instance } = freshGame();
  instance.init();
  moveCarLeftAndLetFall(dom);

  const overlay = dom.elements.get("gameOverlay");
  const status = dom.elements.get("gameStatus");
  assert.equal(overlay.classList.contains("hidden"), false, "overlay visível");
  assert.match(status.textContent, /Fim de jogo/);
  assert.match(dom.elements.get("overlayTitle").textContent, /Fim de jogo/);
});

test("após o fim de jogo é possível reiniciar a partida", () => {
  const { dom, instance } = freshGame();
  instance.init();
  moveCarLeftAndLetFall(dom);

  const overlayBtn = dom.elements.get("overlayBtn");
  assert.equal(typeof overlayBtn.onclick, "function");
  overlayBtn.onclick();

  assert.equal(dom.elements.get("gameOverlay").classList.contains("hidden"), true);
  assert.notEqual(dom.elements.get("questionText").textContent, "");
  assert.equal(String(dom.elements.get("score").textContent), "0");
  assert.equal(String(dom.elements.get("phaseValue").textContent), "1");
});

test("o estado não é atualizado após destroy (loop interrompido)", () => {
  const { dom, instance } = freshGame();
  instance.init();
  instance.destroy();
  const before = dom.pendingRafCount();
  const frames = dom.callPendingRafs(200);
  assert.equal(frames, 0, "nenhum frame executa após destroy");
  assert.equal(before, 0);
});
