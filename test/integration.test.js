"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../games/car-math/logic.js");
const { createGameStorage } = require("../js/storage.js");

function mockBackend() {
  const map = new Map();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k)
  };
}

/**
 * Reproduz o pipeline real do jogo (logic + progressão + storage),
 * o mesmo consumido por game.js, sem depender de canvas/DOM.
 */
function answerRound(progression, mode, rng, pickCorrect) {
  const question = L.generateQuestion(mode, progression.phase, rng);
  const { options, correctIndex } = L.generateOptions(question, rng);
  const correctOption = options[correctIndex];
  const wrongOption = options.find((v) => v !== question.answer);
  const choice = pickCorrect ? correctOption : wrongOption;
  const isCorrect = L.checkAnswer(choice, question.answer);
  let scored = 0;
  let advanced = false;
  if (isCorrect) {
    scored = L.pointsForCorrect();
    advanced = progression.recordCorrect();
  }
  return { question, options, isCorrect, scored, advanced };
}

test("integração: pipeline gera questão com a resposta entre as alternativas", () => {
  const rng = L.createSeededRng(1);
  const progression = L.createProgression(1);
  for (let i = 0; i < 50; i++) {
    const round = answerRound(progression, "mul", rng, true);
    assert.ok(round.options.includes(round.question.answer));
    assert.equal(round.isCorrect, true);
  }
});

test("integração: 5 acertos avançam de fase e somam 50 pontos", () => {
  const rng = L.createSeededRng(7);
  const progression = L.createProgression(1);
  let score = 0;
  for (let i = 0; i < L.QUESTIONS_PER_PHASE; i++) {
    const round = answerRound(progression, "add", rng, true);
    score += round.scored;
  }
  assert.equal(score, 50);
  assert.equal(progression.phase, 2);
});

test("integração: resposta incorreta não pontua e encerra a partida", () => {
  const rng = L.createSeededRng(2);
  const progression = L.createProgression(1);
  let score = 0;
  let gameOver = false;

  // acerta uma vez
  let round = answerRound(progression, "sub", rng, true);
  score += round.scored;
  assert.equal(score, 10);

  // erra
  round = answerRound(progression, "sub", rng, false);
  if (!round.isCorrect) gameOver = true;

  assert.equal(gameOver, true);
  assert.equal(score, 10);
  assert.equal(progression.phase, 1);
});

test("integração: recorde é persistido e sobrevive a nova sessão", () => {
  const backend = mockBackend();
  const storage = createGameStorage(backend);
  const rng = L.createSeededRng(3);

  // sessão 1
  const p1 = L.createProgression(1);
  let score1 = 0;
  for (let i = 0; i < 3; i++) score1 += answerRound(p1, "add", rng, true).scored;
  const high1 = storage.updateScore("car-math", "Ana", score1);
  assert.equal(high1, 30);

  // sessão 2 com pontuação menor: recorde preservado
  const p2 = L.createProgression(1);
  let score2 = 0;
  for (let i = 0; i < 1; i++) score2 += answerRound(p2, "add", rng, true).scored;
  const high2 = storage.updateScore("car-math", "Ana", score2);
  assert.equal(high2, 30);
  assert.equal(storage.get("car-math").highScore, 30);
});

test("integração: distratores de multiplicação não revelam a resposta", () => {
  const rng = L.createSeededRng(404);
  const progression = L.createProgression(L.maxPhase());
  for (let i = 0; i < 40; i++) {
    const question = L.generateQuestion("mul", progression.phase, rng);
    const { options } = L.generateOptions(question, rng);
    const distractors = options.filter((v) => v !== question.answer);
    // A resposta não deve ser o único número "grande" na tela.
    const allSmall = distractors.every((v) => v <= 19);
    if (question.answer > 19) {
      assert.equal(allSmall, false, "resposta grande precisa de distratores grandes");
    }
  }
});

test("integração: pontuação não é contada duas vezes por uma única resposta", () => {
  const progression = L.createProgression(1);
  let score = 0;
  // Simula um único acerto válido.
  score += L.pointsForCorrect();
  const advanced = progression.recordCorrect();
  // Repetir o registro da MESMA resposta não deve somar de novo no pipeline:
  // o controle é do jogo (break/return), mas garantimos que a API apenas
  // incrementa quando chamada explicitamente.
  assert.equal(score, 10);
  assert.equal(advanced, false);
  assert.equal(progression.correctInPhase, 1);
});
