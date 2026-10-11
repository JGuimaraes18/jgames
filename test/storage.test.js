"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createGameStorage, sanitizeName, sanitizeScore } = require("../js/storage.js");

function createMockBackend(initial) {
  const map = new Map(Object.entries(initial || {}));
  return {
    map,
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    }
  };
}

test("chave inexistente retorna null", () => {
  const s = createGameStorage(createMockBackend());
  assert.equal(s.get("car-math"), null);
});

test("roundtrip de save/get", () => {
  const s = createGameStorage(createMockBackend());
  s.save("car-math", { player: "Ana", highScore: 120, lastScore: 30 });
  const data = s.get("car-math");
  assert.equal(data.player, "Ana");
  assert.equal(data.highScore, 120);
  assert.equal(data.lastScore, 30);
  assert.ok(typeof data.playedAt === "string");
});

test("JSON corrompido não derruba e não apaga o dado", () => {
  const backend = createMockBackend({ "jogo:car-math": "{ isso não é json" });
  const s = createGameStorage(backend);
  assert.doesNotThrow(() => s.get("car-math"));
  assert.equal(s.get("car-math"), null);
  assert.equal(backend.getItem("jogo:car-math"), "{ isso não é json", "preserva o valor");
});

test("JSON válido mas não-objeto retorna null", () => {
  const s = createGameStorage(createMockBackend({ "jogo:car-math": "42" }));
  assert.equal(s.get("car-math"), null);
  const s2 = createGameStorage(createMockBackend({ "jogo:car-math": "[1,2]" }));
  assert.equal(s2.get("car-math"), null);
});

test("dados incompletos recebem valores padrão", () => {
  const s = createGameStorage(
    createMockBackend({ "jogo:car-math": JSON.stringify({ highScore: 50 }) })
  );
  const data = s.get("car-math");
  assert.equal(data.highScore, 50);
  assert.equal(data.player, "");
  assert.equal(data.lastScore, 0);
});

test("valores numéricos inválidos são saneados", () => {
  assert.equal(sanitizeScore(-10), 0);
  assert.equal(sanitizeScore(NaN), 0);
  assert.equal(sanitizeScore(Infinity), 0);
  assert.equal(sanitizeScore("abc"), 0);
  assert.equal(sanitizeScore("12.9"), 12);
  assert.equal(sanitizeScore(7), 7);
});

test("nomes vazios ou longos são tratados", () => {
  assert.equal(sanitizeName("   "), "");
  assert.equal(sanitizeName(null), "");
  assert.equal(sanitizeName(123), "");
  const long = "x".repeat(100);
  assert.equal(sanitizeName(long).length, 30);
  assert.equal(sanitizeName("  Ana   Maria "), "Ana Maria");
});

test("falha de leitura do backend não lança", () => {
  const backend = {
    getItem() {
      throw new Error("boom");
    },
    setItem() {}
  };
  const s = createGameStorage(backend);
  assert.doesNotThrow(() => s.get("car-math"));
  assert.equal(s.get("car-math"), null);
});

test("falha de escrita do backend não lança", () => {
  const backend = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("quota");
    }
  };
  const s = createGameStorage(backend);
  assert.doesNotThrow(() => s.save("car-math", { player: "Ana", highScore: 10 }));
  assert.equal(s.save("car-math", { player: "Ana", highScore: 10 }), false);
});

test("updateScore mantém o maior recorde", () => {
  const s = createGameStorage(createMockBackend());
  assert.equal(s.updateScore("car-math", "Ana", 30), 30);
  assert.equal(s.updateScore("car-math", "Ana", 10), 30, "não reduz o recorde");
  assert.equal(s.updateScore("car-math", "Ana", 80), 80);
  assert.equal(s.get("car-math").highScore, 80);
  assert.equal(s.get("car-math").lastScore, 80);
});

test("updateScore preserva nome anterior se novo nome for inválido", () => {
  const s = createGameStorage(createMockBackend());
  s.updateScore("car-math", "Beatriz", 50);
  s.updateScore("car-math", "   ", 60);
  assert.equal(s.get("car-math").player, "Beatriz");
});

test("updateScore aceita pontuação inválida como zero sem apagar recorde", () => {
  const s = createGameStorage(createMockBackend());
  s.updateScore("car-math", "Ana", 100);
  assert.equal(s.updateScore("car-math", "Ana", -5), 100);
  assert.equal(s.get("car-math").highScore, 100);
});

test("compatibilidade com registros anteriores (formato antigo)", () => {
  const old = {
    player: "Carlos",
    highScore: 240,
    lastScore: 40,
    playedAt: "2026-01-01T00:00:00.000Z"
  };
  const s = createGameStorage(
    createMockBackend({ "jogo:car-math": JSON.stringify(old) })
  );
  const data = s.get("car-math");
  assert.equal(data.player, "Carlos");
  assert.equal(data.highScore, 240);
  assert.equal(data.playedAt, "2026-01-01T00:00:00.000Z");
});

test("nome do jogador é salvo, lido e saneado", () => {
  const s = createGameStorage(createMockBackend());
  assert.equal(s.getPlayerName(), "");
  assert.equal(s.savePlayerName("  Maria  "), "Maria");
  assert.equal(s.getPlayerName(), "Maria");
  assert.equal(s.savePlayerName("   "), "");
  assert.equal(s.getPlayerName(), "Maria", "não apaga nome válido");
});

test("preferências da interface são salvas e lidas", () => {
  const backend = createMockBackend();
  const s = createGameStorage(backend);
  assert.equal(s.getPref("jg.sidebarCollapsed"), null);
  assert.equal(s.setPref("jg.sidebarCollapsed", "1"), true);
  assert.equal(s.getPref("jg.sidebarCollapsed"), "1");
  assert.equal(s.setPref("jg.sidebarCollapsed", "0"), true);
  assert.equal(s.getPref("jg.sidebarCollapsed"), "0");
});

test("preferências ignoram chaves inválidas e não derrubam a aplicação", () => {
  const s = createGameStorage(createMockBackend());
  assert.equal(s.getPref(""), null);
  assert.equal(s.getPref(null), null);
  assert.equal(s.setPref("", "1"), false);
  assert.equal(s.setPref(null, "1"), false);
});

test("preferências sobrevivem a falha de escrita", () => {
  const s = createGameStorage({
    getItem: () => "1",
    setItem: () => {
      throw new Error("quota");
    }
  });
  assert.equal(s.getPref("jg.sidebarCollapsed"), "1");
  assert.equal(s.setPref("jg.sidebarCollapsed", "1"), false);
});
