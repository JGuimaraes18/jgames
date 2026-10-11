/**
 * car-math — Regras matemáticas puras, progressão e pontuação.
 *
 * Este módulo não depende de DOM, canvas ou Electron. Ele é carregado
 * como <script> no renderer (expõe window.CarMathLogic) e também é
 * importável via require() no Node para os testes automatizados.
 *
 * Toda aleatoriedade passa por uma função `rng` injetável
 * (por padrão Math.random), permitindo testes determinísticos.
 *
 * ------------------------------------------------------------------
 * REGRAS MATEMÁTICAS POR MODALIDADE
 * ------------------------------------------------------------------
 * add (soma):        a + b, com a,b inteiros em [0, f].
 * sub (subtração):   a - b, com a,b em [0, f] e a >= b  -> nunca negativo.
 * mul (multiplicação):a × b, com a,b inteiros em [0, f].
 * div (divisão):     a ÷ b, com divisor b em [1, f] e quociente q em [1, f];
 *                    dividendo a = b*q -> divisão sempre exata, sem ÷0.
 *
 * `f` (fator máximo) cresce conforme a fase, elevando gradualmente a
 * dificuldade. Nenhuma modalidade produz frações, decimais ou negativos.
 * ------------------------------------------------------------------
 */

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.CarMathLogic = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const OPERATIONS = ["add", "sub", "mul", "div"];

  const OPERATION_SYMBOLS = {
    add: "+",
    sub: "\u2212",
    mul: "\u00d7",
    div: "\u00f7"
  };

  const OPERATION_LABELS = {
    add: "Soma",
    sub: "Subtra\u00e7\u00e3o",
    mul: "Multiplica\u00e7\u00e3o",
    div: "Divis\u00e3o"
  };

  const POINTS_PER_CORRECT = 10;
  const QUESTIONS_PER_PHASE = 5;
  const OPTION_COUNT = 3;

  /**
   * Tabela de fases. `factor` é o teto dos operandos; `speed` é a
   * velocidade base das bolas. A dificuldade sobe de forma gradual:
   * a faixa numérica e a velocidade aumentam, mas nunca de forma abrupta.
   */
  const PHASES = [
    { phase: 1, label: "Iniciante", factor: 5, speed: 1.0 },
    { phase: 2, label: "Aprendiz", factor: 6, speed: 1.1 },
    { phase: 3, label: "Praticante", factor: 9, speed: 1.2 },
    { phase: 4, label: "Agil", factor: 9, speed: 1.4 },
    { phase: 5, label: "Avancado", factor: 12, speed: 1.5 },
    { phase: 6, label: "Expert", factor: 12, speed: 1.7 },
    { phase: 7, label: "Mestre", factor: 15, speed: 1.8 },
    { phase: 8, label: "Lenda", factor: 20, speed: 2.0 }
  ];

  const DIFFICULTIES = {
    easy: { label: "F\u00e1cil", startPhase: 1 },
    normal: { label: "Normal", startPhase: 3 },
    hard: { label: "Dif\u00edcil", startPhase: 6 }
  };

  function clampPhase(phase) {
    const n = Number(phase);
    if (!Number.isFinite(n)) return 1;
    const floored = Math.floor(n);
    if (floored < 1) return 1;
    if (floored > PHASES.length) return PHASES.length;
    return floored;
  }

  function getPhaseConfig(phase) {
    return PHASES[clampPhase(phase) - 1];
  }

  function maxPhase() {
    return PHASES.length;
  }

  function isValidOperation(op) {
    return OPERATIONS.indexOf(op) !== -1;
  }

  /** Inteiro em [min, max] usando rng injetável. */
  function randomInt(rng, min, max) {
    const r = rng();
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return lo + Math.floor(r * (hi - lo + 1));
  }

  /** Embaralha (Fisher-Yates) usando rng injetável; não altera o original. */
  function shuffle(array, rng) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = randomInt(rng, 0, i);
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  /** RNG determinístico (mulberry32) útil em testes e depuração. */
  function createSeededRng(seed) {
    let a = (Number(seed) >>> 0) || 1;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Gera a questão matemática.
   * @returns {{mode:string, phase:number, a:number, b:number, answer:number, text:string}}
   */
  function generateQuestion(mode, phase, rng) {
    const random = typeof rng === "function" ? rng : Math.random;
    const op = isValidOperation(mode) ? mode : "add";
    const config = getPhaseConfig(phase);
    const f = config.factor;

    let a = 0;
    let b = 0;
    let answer = 0;

    if (op === "add") {
      a = randomInt(random, 0, f);
      b = randomInt(random, 0, f);
      answer = a + b;
    } else if (op === "sub") {
      a = randomInt(random, 0, f);
      b = randomInt(random, 0, f);
      if (b > a) {
        const tmp = a;
        a = b;
        b = tmp;
      }
      answer = a - b;
    } else if (op === "mul") {
      a = randomInt(random, 0, f);
      b = randomInt(random, 0, f);
      answer = a * b;
    } else if (op === "div") {
      b = randomInt(random, 1, f); // divisor nunca zero
      answer = randomInt(random, 1, f); // quociente
      a = b * answer; // dividendo
    }

    const text = `${a} ${OPERATION_SYMBOLS[op]} ${b} = ?`;

    return { mode: op, phase: clampPhase(phase), a, b, answer, text };
  }

  /**
   * Teto para as alternativas incorretas. Cresce com a magnitude da
   * resposta para que distratores de multiplicação (respostas grandes)
   * não fiquem presos a uma faixa pequena — corrige o bug pedagógico
   * em que a resposta correta era o único número > 19.
   */
  function distractorWindow(answer) {
    const magnitude = Math.abs(answer);
    const spread = Math.round(magnitude * 0.2);
    let window = 2 + spread;
    if (window < 2) window = 2;
    if (window > 20) window = 20;
    return window;
  }

  /**
   * Gera alternativas incorretas únicas, não negativas e diferentes da
   * resposta. Nunca entra em loop infinito: após `maxAttempts` aleatórios,
   * expande de forma determinística em torno da resposta.
   */
  function generateDistractors(answer, count, rng) {
    const random = typeof rng === "function" ? rng : Math.random;
    const target = Number.isFinite(answer) ? Math.round(answer) : 0;
    const needed = Math.max(0, Math.floor(count));
    const chosen = [];
    const seen = { [target]: true };

    const window = distractorWindow(target);
    const min = Math.max(0, target - window);
    const max = target + window;

    let attempts = 0;
    while (chosen.length < needed && attempts < 200) {
      attempts++;
      const candidate = randomInt(random, min, max);
      if (!seen[candidate]) {
        seen[candidate] = true;
        chosen.push(candidate);
      }
    }

    // Fallback determinístico garante término mesmo com janela estreita.
    let delta = 1;
    const hardLimit = needed + window + 5;
    while (chosen.length < needed && delta <= hardLimit) {
      const up = target + delta;
      const down = target - delta;
      if (!seen[up]) {
        seen[up] = true;
        chosen.push(up);
      }
      if (chosen.length < needed && down >= 0 && !seen[down]) {
        seen[down] = true;
        chosen.push(down);
      }
      delta++;
    }

    return chosen.slice(0, needed);
  }

  /**
   * Monta o conjunto de alternativas: a resposta correta + distratores,
   * embaralhadas para variar a posição correta.
   * @returns {{options:number[], correctIndex:number}}
   */
  function generateOptions(question, rng) {
    const random = typeof rng === "function" ? rng : Math.random;
    const answer = question.answer;
    const distractors = generateDistractors(
      answer,
      OPTION_COUNT - 1,
      random
    );
    const options = shuffle([answer].concat(distractors), random);
    return {
      options,
      correctIndex: options.indexOf(answer)
    };
  }

  /** Valida a resposta escolhida. */
  function checkAnswer(value, answer) {
    return Number(value) === Number(answer);
  }

  /** Pontuação por acerto (regra fixa e consistente). */
  function pointsForCorrect() {
    return POINTS_PER_CORRECT;
  }

  /**
   * Estado de progressão por fases, independente da renderização.
   * Avança de fase a cada QUESTIONS_PER_PHASE acertos, até a última fase.
   */
  function createProgression(startPhase) {
    let phase = clampPhase(startPhase);
    let correctInPhase = 0;
    let completed = false;

    return {
      get phase() {
        return phase;
      },
      get correctInPhase() {
        return correctInPhase;
      },
      get required() {
        return QUESTIONS_PER_PHASE;
      },
      get remaining() {
        return Math.max(0, QUESTIONS_PER_PHASE - correctInPhase);
      },
      get config() {
        return getPhaseConfig(phase);
      },
      isMaxPhase() {
        return phase >= PHASES.length;
      },
      get completedAll() {
        return completed;
      },
      /** Registra um acerto; retorna true quando houve avanço de fase. */
      recordCorrect() {
        correctInPhase++;
        if (correctInPhase >= QUESTIONS_PER_PHASE) {
          if (phase < PHASES.length) {
            phase++;
            correctInPhase = 0;
            return true;
          }
          correctInPhase = QUESTIONS_PER_PHASE;
          completed = true;
        }
        return false;
      },
      /** Reinicia a contagem da fase atual (ex.: nova partida na fase X). */
      reset(nextPhase) {
        phase = clampPhase(
          nextPhase === undefined ? 1 : nextPhase
        );
        correctInPhase = 0;
        completed = false;
      }
    };
  }

  return {
    OPERATIONS,
    OPERATION_SYMBOLS,
    OPERATION_LABELS,
    DIFFICULTIES,
    POINTS_PER_CORRECT,
    QUESTIONS_PER_PHASE,
    OPTION_COUNT,
    PHASES,
    clampPhase,
    getPhaseConfig,
    maxPhase,
    isValidOperation,
    randomInt,
    shuffle,
    createSeededRng,
    distractorWindow,
    generateQuestion,
    generateDistractors,
    generateOptions,
    checkAnswer,
    pointsForCorrect,
    createProgression
  };
});
