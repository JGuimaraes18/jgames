"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../games/car-math/logic.js");

const OPS = ["add", "sub", "mul", "div"];

test("pontuação por acerto é fixa e consistente", () => {
  assert.equal(L.pointsForCorrect(), 10);
  assert.equal(L.POINTS_PER_CORRECT, 10);
});

test("generateQuestion corrige a resposta para todas as modalidades", () => {
  for (const mode of OPS) {
    for (let phase = 1; phase <= L.maxPhase(); phase++) {
      const rng = L.createSeededRng(phase * 1000 + OPS.indexOf(mode));
      for (let i = 0; i < 200; i++) {
        const q = L.generateQuestion(mode, phase, rng);
        assert.equal(q.mode, mode);
        if (mode === "add") assert.equal(q.answer, q.a + q.b);
        if (mode === "sub") {
          assert.equal(q.answer, q.a - q.b);
          assert.ok(q.answer >= 0, "subtração nunca negativa");
        }
        if (mode === "mul") assert.equal(q.answer, q.a * q.b);
        if (mode === "div") {
          assert.notEqual(q.b, 0, "nunca divide por zero");
          assert.equal(q.a, q.b * q.answer, "divisão exata");
          assert.equal(q.a % q.b, 0);
        }
      }
    }
  }
});

test("operandos respeitam a faixa (factor) da fase", () => {
  for (const mode of OPS) {
    for (let phase = 1; phase <= L.maxPhase(); phase++) {
      const factor = L.getPhaseConfig(phase).factor;
      const rng = L.createSeededRng(777 + phase);
      for (let i = 0; i < 100; i++) {
        const q = L.generateQuestion(mode, phase, rng);
        assert.ok(q.a <= factor * factor, "operando dentro do esperado");
        if (mode === "div") {
          assert.ok(q.b >= 1 && q.b <= factor);
          assert.ok(q.answer >= 1 && q.answer <= factor);
        } else {
          assert.ok(q.a >= 0 && q.a <= factor);
          assert.ok(q.b >= 0 && q.b <= factor);
        }
      }
    }
  }
});

test("modalidade inválida cai em soma (sem lançar exceção)", () => {
  const q = L.generateQuestion("inexistente", 1, L.createSeededRng(1));
  assert.equal(q.mode, "add");
  assert.equal(q.answer, q.a + q.b);
});

test("texto da questão usa o símbolo correto", () => {
  const rng = L.createSeededRng(5);
  assert.match(L.generateQuestion("add", 1, rng).text, /\+/);
  assert.match(L.generateQuestion("sub", 1, rng).text, /\u2212/);
  assert.match(L.generateQuestion("mul", 1, rng).text, /\u00d7/);
  assert.match(L.generateQuestion("div", 1, rng).text, /\u00f7/);
});

test("distratores são únicos, não negativos e diferentes da resposta", () => {
  const answers = [0, 1, 2, 5, 9, 12, 20, 49, 81, 144, 400];
  for (const answer of answers) {
    const rng = L.createSeededRng(answer + 1);
    const distractors = L.generateDistractors(answer, L.OPTION_COUNT - 1, rng);
    assert.equal(distractors.length, L.OPTION_COUNT - 1);
    assert.equal(new Set(distractors).size, distractors.length, "sem duplicatas");
    for (const d of distractors) {
      assert.notEqual(d, answer, "distrator difere da resposta");
      assert.ok(d >= 0, "distrator não negativo");
      assert.ok(Number.isInteger(d));
    }
  }
});

test("generateDistractors não entra em loop infinito para resposta 0", () => {
  const rng = L.createSeededRng(42);
  const distractors = L.generateDistractors(0, 2, rng);
  assert.equal(distractors.length, 2);
  assert.ok(!distractors.includes(0));
});

test("regressão R-04: distratores de multiplicação acompanham respostas grandes", () => {
  // answer = 81 (9x9). Antes os distratores ficavam presos em 0..19.
  const rng = L.createSeededRng(123);
  const distractors = L.generateDistractors(81, 2, rng);
  for (const d of distractors) {
    assert.ok(d > 19, `distrator ${d} deve estar próximo de 81, não em 0..19`);
  }
  assert.ok(L.distractorWindow(81) >= 16);
});

test("options sempre contém a resposta correta exatamente uma vez", () => {
  const rng = L.createSeededRng(2024);
  for (const mode of OPS) {
    for (let i = 0; i < 300; i++) {
      const q = L.generateQuestion(mode, 3, rng);
      const { options, correctIndex } = L.generateOptions(q, rng);
      assert.equal(options.length, L.OPTION_COUNT);
      assert.equal(new Set(options).size, L.OPTION_COUNT, "alternativas únicas");
      assert.equal(options.filter((v) => v === q.answer).length, 1);
      assert.equal(options[correctIndex], q.answer);
    }
  }
});

test("posição da resposta correta varia entre as alternativas", () => {
  const seen = new Set();
  const rng = L.createSeededRng(99);
  for (let i = 0; i < 400; i++) {
    const q = L.generateQuestion("add", 3, rng);
    const { correctIndex } = L.generateOptions(q, rng);
    seen.add(correctIndex);
  }
  assert.deepEqual([...seen].sort(), [0, 1, 2]);
});

test("checkAnswer compara respostas corretamente", () => {
  assert.equal(L.checkAnswer(10, 10), true);
  assert.equal(L.checkAnswer(10, 11), false);
  assert.equal(L.checkAnswer("10", 10), true, "converte strings numéricas");
  assert.equal(L.checkAnswer(0, 0), true);
});

test("clampPhase limita fases válidas", () => {
  assert.equal(L.clampPhase(0), 1);
  assert.equal(L.clampPhase(-5), 1);
  assert.equal(L.clampPhase(999), L.maxPhase());
  assert.equal(L.clampPhase("3"), 3);
  assert.equal(L.clampPhase("abc"), 1);
});

test("configuração de fase é monotônica (velocidade nunca diminui)", () => {
  let lastSpeed = -Infinity;
  let lastFactor = -Infinity;
  for (let phase = 1; phase <= L.maxPhase(); phase++) {
    const c = L.getPhaseConfig(phase);
    assert.ok(c.factor >= lastFactor, "fator não regride");
    assert.ok(c.speed >= lastSpeed, "velocidade não regride");
    lastFactor = c.factor;
    lastSpeed = c.speed;
  }
});

test("createSeededRng é determinístico", () => {
  const a = L.createSeededRng(123);
  const b = L.createSeededRng(123);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
});

// ------------------- Progressão -------------------

test("progressão: estado inicial", () => {
  const p = L.createProgression(1);
  assert.equal(p.phase, 1);
  assert.equal(p.correctInPhase, 0);
  assert.equal(p.required, L.QUESTIONS_PER_PHASE);
  assert.equal(p.remaining, L.QUESTIONS_PER_PHASE);
  assert.equal(p.config.factor, L.getPhaseConfig(1).factor);
});

test("progressão: avança exatamente ao atingir o limite de acertos", () => {
  const p = L.createProgression(1);
  for (let i = 1; i < L.QUESTIONS_PER_PHASE; i++) {
    assert.equal(p.recordCorrect(), false);
    assert.equal(p.phase, 1);
  }
  assert.equal(p.recordCorrect(), true, "avança no último acerto");
  assert.equal(p.phase, 2);
  assert.equal(p.correctInPhase, 0, "zera contagem na nova fase");
});

test("progressão: não avança duas vezes no mesmo acerto", () => {
  const p = L.createProgression(1);
  for (let i = 0; i < L.QUESTIONS_PER_PHASE; i++) p.recordCorrect();
  assert.equal(p.phase, 2);
  // O próximo acerto NÃO deve ser tratado como avanço.
  assert.equal(p.recordCorrect(), false);
  assert.equal(p.phase, 2);
});

test("progressão: dificuldade aumenta gradualmente com a fase", () => {
  const p = L.createProgression(1);
  const factors = [p.config.factor];
  while (p.phase < L.maxPhase()) {
    for (let i = 0; i < L.QUESTIONS_PER_PHASE; i++) p.recordCorrect();
    factors.push(p.config.factor);
  }
  for (let i = 1; i < factors.length; i++) {
    assert.ok(factors[i] >= factors[i - 1]);
  }
  assert.ok(factors[factors.length - 1] > factors[0], "última fase é mais difícil");
});

test("progressão: satura na última fase sem ultrapassar", () => {
  const p = L.createProgression(L.maxPhase());
  for (let i = 0; i < L.QUESTIONS_PER_PHASE; i++) p.recordCorrect();
  assert.equal(p.phase, L.maxPhase());
  assert.equal(p.isMaxPhase(), true);
  assert.equal(p.completedAll, true);
  p.recordCorrect();
  assert.equal(p.phase, L.maxPhase());
});

test("progressão: reinício volta ao estado inicial", () => {
  const p = L.createProgression(4);
  p.recordCorrect();
  p.reset(1);
  assert.equal(p.phase, 1);
  assert.equal(p.correctInPhase, 0);
  assert.equal(p.completedAll, false);
});

test("progressão: consistência entre fase e parâmetros matemáticos", () => {
  const p = L.createProgression(2);
  const rng = L.createSeededRng(11);
  const factor = p.config.factor;
  const q = L.generateQuestion("mul", p.phase, rng);
  assert.ok(q.a <= factor && q.b <= factor);
});
