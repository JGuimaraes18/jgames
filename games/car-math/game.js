/**
 * game.js — Módulo do jogo Car Math.
 *
 * Separa renderização/controle (aqui) das regras matemáticas (logic.js).
 * Expõe em window.carMath um contrato de ciclo de vida:
 *   init()    -> prepara imagens, listeners e inicia o loop
 *   destroy() -> cancela RAF, remove listeners, limpa timers e estado
 *   focusCanvas() -> dá foco ao canvas para uso por teclado
 */

(function () {
  "use strict";

  function getStoredPlayerName() {
    try {
      const name =
        window.GameStorage && window.GameStorage.getPlayerName
          ? window.GameStorage.getPlayerName()
          : "";
      return name || "Jogador";
    } catch (e) {
      return "Jogador";
    }
  }

  function createInstance() {
    const L = window.CarMathLogic;
    const canvas = document.getElementById("gameCanvas");
    if (!L || !canvas) return null;

    const ctx = canvas.getContext("2d");
    const BASE_PATH = "games/car-math/";

    const CAR_WIDTH = 110;
    const CAR_BOTTOM_OFFSET = 90;
    const BG_SCALE = 1.1;
    const BALL_SIZE = 40;
    const BALL_RADIUS = BALL_SIZE / 2;

    const el = {
      question: document.getElementById("questionText"),
      score: document.getElementById("score"),
      highScoreValue: document.getElementById("highScoreValue"),
      highScoreName: document.getElementById("highScoreName"),
      phaseValue: document.getElementById("phaseValue"),
      phaseLabel: document.getElementById("phaseLabel"),
      phaseProgress: document.getElementById("phaseProgress"),
      phaseProgressBar: document.getElementById("phaseProgressBar"),
      phaseProgressText: document.getElementById("phaseProgressText"),
      pauseBtn: document.getElementById("pauseBtn"),
      restartBtn: document.getElementById("restartBtn"),
      overlay: document.getElementById("gameOverlay"),
      overlayTitle: document.getElementById("overlayTitle"),
      overlayText: document.getElementById("overlayText"),
      overlayBtn: document.getElementById("overlayBtn"),
      status: document.getElementById("gameStatus"),
      touchLeft: document.getElementById("touchLeft"),
      touchRight: document.getElementById("touchRight"),
      canvasWrap: document.querySelector(".canvas-wrap"),
      modeBtns: Array.prototype.slice.call(document.querySelectorAll("[data-mode]")),
      diffBtns: Array.prototype.slice.call(document.querySelectorAll("[data-difficulty]")),
      fsBtns: Array.prototype.slice.call(document.querySelectorAll("[data-action='fullscreen']")),
      confirm: document.getElementById("confirmModal"),
      confirmText: document.getElementById("confirmText"),
      confirmOk: document.getElementById("confirmOk"),
      confirmCancel: document.getElementById("confirmCancel")
    };

    // ---- Estado ----
    const state = {
      mode: "add",
      startPhase: L.DIFFICULTIES.easy.startPhase,
      score: 0,
      gameOver: false,
      paused: false,
      restartAllowed: false,
      isNewRecord: false,
      correctAnswer: 0,
      lastWrong: null,
      balls: []
    };

    const car = {
      x: canvas.width / 2 - CAR_WIDTH / 2,
      y: canvas.height - 50 - 10,
      width: CAR_WIDTH,
      height: 50,
      speed: 8
    };

    const carTrim = { sx: 0, sy: 0, sw: 0, sh: 0 };

    const input = { left: false, right: false };

    const progression = L.createProgression(state.startPhase);

    const background = new Image();
    const carImg = new Image();

    let rafId = null;
    let running = false;
    let initialized = false;
    let imagesLoaded = 0;
    let levelUpTimer = null;
    let feedbackTimer = null;
    let confirmAction = null;
    const disposers = [];

    function on(target, type, handler, options) {
      if (!target || !target.addEventListener) return;
      target.addEventListener(type, handler, options);
      disposers.push(function () {
        target.removeEventListener(type, handler, options);
      });
    }

    function announce(message) {
      if (el.status) el.status.textContent = message;
    }

    // ---- HUD ----
    function updateHud() {
      if (el.score) el.score.textContent = state.score;
      if (el.phaseValue) el.phaseValue.textContent = progression.phase;
      if (el.phaseLabel) el.phaseLabel.textContent = progression.config.label;
      const correct = progression.correctInPhase;
      const required = progression.required;
      const pct = Math.min(100, Math.round((correct / required) * 100));
      if (el.phaseProgress) el.phaseProgress.style.width = pct + "%";
      if (el.phaseProgressText) {
        el.phaseProgressText.textContent =
          progression.isMaxPhase() && progression.completedAll
            ? "Fase máxima!"
            : correct + " / " + required + " acertos";
      }
      if (el.phaseProgressBar) {
        el.phaseProgressBar.setAttribute("aria-valuemax", String(required));
        el.phaseProgressBar.setAttribute("aria-valuenow", String(correct));
      }
    }

    function updateRecordUI() {
      let record = { player: "", highScore: 0 };
      try {
        if (window.GameStorage && window.GameStorage.get) {
          record = window.GameStorage.get("car-math") || record;
        }
      } catch (e) {
        /* mantém padrão */
      }
      if (el.highScoreValue) el.highScoreValue.textContent = record.highScore || 0;
      if (el.highScoreName) {
        el.highScoreName.textContent = record.highScore
          ? record.player || "Jogador"
          : "---";
      }
    }

    // ---- Overlay ----
    function showOverlay(title, text, btnLabel, onBtn) {
      if (!el.overlay) return;
      el.overlayTitle.textContent = title;
      el.overlayText.textContent = text || "";
      if (btnLabel) {
        el.overlayBtn.textContent = btnLabel;
        el.overlayBtn.classList.remove("hidden");
        el.overlayBtn.onclick = onBtn;
      } else {
        el.overlayBtn.classList.add("hidden");
        el.overlayBtn.onclick = null;
      }
      el.overlay.classList.remove("hidden");
    }

    function hideOverlay() {
      if (el.overlay) el.overlay.classList.add("hidden");
      if (el.overlayBtn) el.overlayBtn.onclick = null;
    }

    function askConfirm(text, onOk) {
      confirmAction = onOk;
      if (el.confirmText) el.confirmText.textContent = text;
      if (el.confirm) el.confirm.classList.remove("hidden");
      if (el.confirmOk) el.confirmOk.focus();
    }

    function closeConfirm() {
      if (el.confirm) el.confirm.classList.add("hidden");
      confirmAction = null;
    }

    // ---- Feedback visual ----
    function flash(type) {
      const wrap = el.canvasWrap;
      if (!wrap) return;
      wrap.classList.remove("flash-correct", "flash-wrong");
      // força reflow para reiniciar a animação
      void wrap.offsetWidth;
      wrap.classList.add(type === "wrong" ? "flash-wrong" : "flash-correct");
      clearTimeout(feedbackTimer);
      feedbackTimer = setTimeout(function () {
        wrap.classList.remove("flash-correct", "flash-wrong");
      }, 450);
    }

    // ---- Questão ----
    function newQuestion() {
      const question = L.generateQuestion(state.mode, progression.phase, Math.random);
      const options = L.generateOptions(question, Math.random);

      state.correctAnswer = question.answer;
      if (el.question) el.question.textContent = question.text;

      const spacing = canvas.width / (options.options.length + 1);
      state.balls = options.options.map(function (value, index) {
        return {
          x: spacing * (index + 1) - BALL_RADIUS,
          y: -BALL_SIZE,
          value: value,
          speed: progression.config.speed
        };
      });
    }

    // ---- Loop ----
    function loop() {
      if (!running) return;
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    function update() {
      if (state.paused || state.gameOver) return;

      if (input.left) car.x -= car.speed;
      if (input.right) car.x += car.speed;
      if (car.x < 0) car.x = 0;
      if (car.x + car.width > canvas.width) car.x = canvas.width - car.width;

      for (let i = 0; i < state.balls.length; i++) {
        const ball = state.balls[i];
        ball.y += ball.speed;

        const hitCar =
          ball.y + BALL_SIZE > car.y &&
          ball.x < car.x + car.width &&
          ball.x + BALL_SIZE > car.x;

        if (hitCar) {
          if (L.checkAnswer(ball.value, state.correctAnswer)) {
            handleCorrect();
            return;
          }
          state.lastWrong = ball.value;
          endGame("wrong");
          break;
        }

        if (ball.y > canvas.height) {
          endGame("lost");
          break;
        }
      }
    }

    function handleCorrect() {
      state.score += L.pointsForCorrect();
      const advanced = progression.recordCorrect();
      updateHud();
      flash("correct");
      announce("Resposta correta! +" + L.pointsForCorrect() + " pontos.");

      newQuestion();

      if (advanced) {
        state.paused = true;
        updateHud();
        showOverlay(
          "🎉 Fase " + progression.phase + "!",
          progression.config.label + " — as bolas vieram mais rápidas!",
          null,
          null
        );
        announce("Você avançou para a fase " + progression.phase + ".");
        clearTimeout(levelUpTimer);
        levelUpTimer = setTimeout(function () {
          hideOverlay();
          state.paused = false;
        }, 1400);
      }
    }

    function endGame(reason) {
      if (state.gameOver) return;
      state.gameOver = true;
      state.paused = false;
      state.restartAllowed = true;
      input.left = false;
      input.right = false;

      let previous = 0;
      try {
        if (window.GameStorage && window.GameStorage.get) {
          const data = window.GameStorage.get("car-math");
          previous = data ? data.highScore : 0;
        }
      } catch (e) {
        previous = 0;
      }

      if (state.score > previous) {
        state.isNewRecord = true;
        try {
          if (window.GameStorage && window.GameStorage.updateScore) {
            window.GameStorage.updateScore("car-math", getStoredPlayerName(), state.score);
          }
        } catch (e) {
          /* não interrompe o fim de jogo por falha de persistência */
        }
      }

      updateHud();
      updateRecordUI();
      flash("wrong");

      let text;
      if (reason === "wrong") {
        text =
          "Você escolheu " + state.lastWrong + ". A resposta certa era " +
          state.correctAnswer + ".";
      } else {
        text =
          "A bola passou! A resposta certa era " + state.correctAnswer + ".";
      }
      text += " Você fez " + state.score + " pontos.";
      if (state.isNewRecord) text += " 🏆 Novo recorde!";

      showOverlay("Fim de jogo", text, "Jogar novamente", restart);
      announce("Fim de jogo. " + text);
    }

    // ---- Imagens ----
    function computeCarTrim() {
      if (!carImg.complete || !carImg.naturalWidth) return;
      const w = carImg.naturalWidth;
      const h = carImg.naturalHeight;
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const cx = c.getContext ? c.getContext("2d") : null;
      if (!cx) return;
      cx.drawImage(carImg, 0, 0);
      let data;
      try {
        data = cx.getImageData(0, 0, w, h).data;
      } catch (e) {
        return;
      }
      let minX = w, minY = h, maxX = -1, maxY = -1;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4 + 3] > 10) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) return;
      carTrim.sx = minX;
      carTrim.sy = minY;
      carTrim.sw = maxX - minX + 1;
      carTrim.sh = maxY - minY + 1;
    }

    // Redimensiona o carro usando a parte visível da imagem (sem o padding transparente)
    // e o mantém mais acima do canto inferior do canvas.
    function applyCarGeometry() {
      if (!carTrim.sw || !carTrim.sh) return;
      const aspect = carTrim.sw / carTrim.sh;
      car.width = CAR_WIDTH;
      car.height = Math.max(20, Math.round(car.width / aspect));
      car.y = canvas.height - car.height - CAR_BOTTOM_OFFSET;
      if (car.y < 0) car.y = 0;
      car.x = canvas.width / 2 - car.width / 2;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (background.complete && background.naturalWidth) {
        const iw = background.naturalWidth;
        const ih = background.naturalHeight;
        const scale = Math.max(canvas.width / iw, canvas.height / ih) * BG_SCALE;
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (canvas.width - dw) / 2;
        const dy = canvas.height - dh;
        ctx.drawImage(background, dx, dy, dw, dh);
      } else {
        ctx.fillStyle = "#cde7c5";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (carImg.complete && carImg.naturalWidth) {
        const src =
          carTrim.sw && carTrim.sh
            ? carTrim
            : { sx: 0, sy: 0, sw: carImg.naturalWidth, sh: carImg.naturalHeight };
        ctx.drawImage(
          carImg,
          src.sx,
          src.sy,
          src.sw,
          src.sh,
          car.x,
          car.y,
          car.width,
          car.height
        );
      } else {
        ctx.fillStyle = "#2563eb";
        ctx.fillRect(car.x, car.y, car.width, car.height);
      }

      for (let i = 0; i < state.balls.length; i++) {
        const ball = state.balls[i];
        ctx.beginPath();
        ctx.arc(ball.x + BALL_RADIUS, ball.y + BALL_RADIUS, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#1f2937";
        ctx.stroke();

        ctx.fillStyle = "#111827";
        ctx.font = "bold 18px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(ball.value), ball.x + BALL_RADIUS, ball.y + BALL_RADIUS + 1);
      }
    }

    // ---- Controles ----
    function isTypingTarget(target) {
      if (!target) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    }

    function handleKeyDown(event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        input.left = true;
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        input.right = true;
        return;
      }
      if (isTypingTarget(event.target)) return;
      if (event.target && event.target.tagName === "BUTTON") return;

      if (event.key === " " || event.key === "p" || event.key === "P") {
        event.preventDefault();
        togglePause();
      } else if (event.key === "r" || event.key === "R") {
        restart();
      } else if (event.key === "Enter" && state.gameOver) {
        restart();
      }
    }

    function handleKeyUp(event) {
      if (event.key === "ArrowLeft") input.left = false;
      if (event.key === "ArrowRight") input.right = false;
    }

    function bindHold(button, prop) {
      if (!button) return;
      on(button, "pointerdown", function (event) {
        event.preventDefault();
        input[prop] = true;
        try {
          button.setPointerCapture(event.pointerId);
        } catch (e) {
          /* ignore */
        }
      });
      const release = function () {
        input[prop] = false;
      };
      on(button, "pointerup", release);
      on(button, "pointercancel", release);
      on(button, "lostpointercapture", release);
      on(button, "contextmenu", function (e) {
        e.preventDefault();
      });
    }

    function togglePause() {
      if (state.gameOver) return;
      state.paused = !state.paused;
      input.left = false;
      input.right = false;
      if (el.pauseBtn) {
        el.pauseBtn.textContent = state.paused ? "▶️ Continuar" : "⏸️ Pausar";
        el.pauseBtn.setAttribute("aria-pressed", String(state.paused));
      }
      if (state.paused) {
        showOverlay("⏸️ Pausado", "Respire e continue quando quiser.", "Continuar", togglePause);
      } else {
        hideOverlay();
      }
      announce(state.paused ? "Jogo pausado." : "Jogo retomado.");
    }

    function syncModeButtons() {
      el.modeBtns.forEach(function (btn) {
        const selected = btn.getAttribute("data-mode") === state.mode;
        btn.classList.toggle("is-selected", selected);
        btn.setAttribute("aria-pressed", String(selected));
      });
    }

    function syncDiffButtons() {
      const current = Object.keys(L.DIFFICULTIES).find(function (key) {
        return L.DIFFICULTIES[key].startPhase === state.startPhase;
      });
      el.diffBtns.forEach(function (btn) {
        const selected = btn.getAttribute("data-difficulty") === current;
        btn.classList.toggle("is-selected", selected);
        btn.setAttribute("aria-pressed", String(selected));
      });
    }

    function gameInProgress() {
      return initialized && !state.gameOver && state.score > 0;
    }

    function applyMode(mode) {
      if (!L.isValidOperation(mode) || mode === state.mode) return;
      state.mode = mode;
      syncModeButtons();
      restart();
    }

    function requestModeChange(mode) {
      if (mode === state.mode) return;
      if (gameInProgress()) {
        askConfirm(
          "Trocar de operação vai reiniciar a partida e zerar os pontos.",
          function () {
            closeConfirm();
            applyMode(mode);
          }
        );
      } else {
        applyMode(mode);
      }
    }

    function applyDifficulty(key) {
      const diff = L.DIFFICULTIES[key];
      if (!diff || diff.startPhase === state.startPhase) return;
      state.startPhase = diff.startPhase;
      syncDiffButtons();
      restart();
    }

    function requestDifficultyChange(key) {
      const diff = L.DIFFICULTIES[key];
      if (!diff || diff.startPhase === state.startPhase) return;
      if (gameInProgress()) {
        askConfirm(
          "Trocar a dificuldade vai reiniciar a partida e zerar os pontos.",
          function () {
            closeConfirm();
            applyDifficulty(key);
          }
        );
      } else {
        applyDifficulty(key);
      }
    }

    // ---- Partida ----
    function restart() {
      clearTimeout(levelUpTimer);
      hideOverlay();
      closeConfirm();

      progression.reset(state.startPhase);
      state.score = 0;
      state.gameOver = false;
      state.paused = false;
      state.restartAllowed = false;
      state.isNewRecord = false;
      state.lastWrong = null;
      input.left = false;
      input.right = false;

      car.x = canvas.width / 2 - CAR_WIDTH / 2;

      if (el.pauseBtn) {
        el.pauseBtn.textContent = "⏸️ Pausar";
        el.pauseBtn.setAttribute("aria-pressed", "false");
      }

      newQuestion();
      updateHud();
      updateRecordUI();
      announce("Nova partida. Fase " + progression.phase + ".");
    }

    // ---- Tela cheia ----
    function bindFullscreen() {
      const api = window.jgWindow;
      if (!api || !api.toggleFullscreen) return;
      el.fsBtns.forEach(function (btn) {
        on(btn, "click", function () {
          api.toggleFullscreen().then(function (value) {
            el.fsBtns.forEach(function (b) {
              b.textContent = value ? "🗗 Sair da tela cheia" : "⛶ Tela cheia";
              b.setAttribute("aria-pressed", String(Boolean(value)));
            });
          });
        });
      });
    }

    // ---- Ciclo de vida ----
    function startGame() {
      if (initialized) return;
      initialized = true;
      bindFullscreen();
      syncModeButtons();
      syncDiffButtons();
      applyCarGeometry();
      restart();
      running = true;
      loop();
    }

    function init() {
      if (initialized) return;

      on(document, "keydown", handleKeyDown);
      on(document, "keyup", handleKeyUp);
      on(canvas, "click", function () {
        if (state.gameOver && state.restartAllowed) restart();
      });

      if (el.pauseBtn) on(el.pauseBtn, "click", togglePause);
      if (el.restartBtn) on(el.restartBtn, "click", restart);
      if (el.confirmOk) {
        on(el.confirmOk, "click", function () {
          if (typeof confirmAction === "function") confirmAction();
        });
      }
      if (el.confirmCancel) on(el.confirmCancel, "click", closeConfirm);

      bindHold(el.touchLeft, "left");
      bindHold(el.touchRight, "right");

      el.modeBtns.forEach(function (btn) {
        on(btn, "click", function () {
          requestModeChange(btn.getAttribute("data-mode"));
        });
      });
      el.diffBtns.forEach(function (btn) {
        on(btn, "click", function () {
          requestDifficultyChange(btn.getAttribute("data-difficulty"));
        });
      });

      background.onload = background.onerror = onImageLoaded;
      carImg.onload = carImg.onerror = onImageLoaded;
      background.src = BASE_PATH + "assets/fundo.jpg";
      carImg.src = BASE_PATH + "assets/carro.png";
    }

    function onImageLoaded() {
      imagesLoaded++;
      if (carImg.complete && carImg.naturalWidth) computeCarTrim();
      if (imagesLoaded >= 2) startGame();
    }

    function destroy() {
      running = false;
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      clearTimeout(levelUpTimer);
      clearTimeout(feedbackTimer);
      levelUpTimer = null;
      feedbackTimer = null;

      for (let i = 0; i < disposers.length; i++) {
        try {
          disposers[i]();
        } catch (e) {
          /* ignore */
        }
      }
      disposers.length = 0;

      input.left = false;
      input.right = false;
      initialized = false;
      state.gameOver = true;
    }

    return {
      init: init,
      destroy: destroy,
      focusCanvas: function () {
        try {
          canvas.focus();
        } catch (e) {
          /* ignore */
        }
      }
    };
  }

  window.carMath = createInstance();
})();
