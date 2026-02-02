(function initCarMath() {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const highScoreNameEl = document.getElementById("highScoreName");
  const highScoreValueEl = document.getElementById("highScoreValue");

  canvas.width = 900;
  canvas.height = 400;

  const BASE_PATH = "games/car-math/";

  // ================== IMAGENS ==================
  const background = new Image();
  const carImg = new Image();

  background.src = `${BASE_PATH}assets/fundo.jpg`;
  carImg.src = `${BASE_PATH}assets/carro.png`;

  // ================== ESTADO ==================
  let score = 0;
  let paused = false;
  let gameOver = false;
  let gameOverHandled = false;
  let restartAllowed = false;
  let gameMode = "add";
  let correctAnswer = 0;
  let balls = [];
  let ballSpeed = 1.5;
  let lastHighScore = 0;
  let isNewRecord = false;

  // ================== CARRO ==================
  const car = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 60,
    width: 100,
    height: 50,
    speed: 10
  };

  // ================== CONTROLES ==================
  document.addEventListener("keydown", e => {
    if (paused || gameOver) return;

    if (e.key === "ArrowLeft" && car.x > 0) car.x -= car.speed;
    if (e.key === "ArrowRight" && car.x + car.width < canvas.width)
      car.x += car.speed;
  });

  canvas.addEventListener("click", () => {
    if (!gameOver || !restartAllowed) return;
    restartGame();
  });

  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) {
    pauseBtn.onclick = () => {
      paused = !paused;
      pauseBtn.innerText = paused ? "▶️ Continuar" : "⏸️ Pausar";
    };
  }

  function setSpeed(value) {
    ballSpeed = Number(value);
    restartGame();
  }
  // ================== NOVA PERGUNTA ==================
  function newQuestion() {
    balls = [];

    let a = Math.floor(Math.random() * 10);
    let b = Math.floor(Math.random() * 10);
    let questionText = "";

    if (gameMode === "add") {
      correctAnswer = a + b;
      questionText = `${a} + ${b} = ?`;
    }

    if (gameMode === "sub") {
      if (b > a) [a, b] = [b, a];
      correctAnswer = a - b;
      questionText = `${a} - ${b} = ?`;
    }

    if (gameMode === "mul") {
      correctAnswer = a * b;
      questionText = `${a} × ${b} = ?`;
    }

    if (gameMode === "div") {
      // resultado inteiro entre 1 e 10
      b = Math.floor(Math.random() * 9) + 1; // divisor (1–9)
      correctAnswer = Math.floor(Math.random() * 10) + 1; // resultado
      a = b * correctAnswer; // dividendo

      questionText = `${a} ÷ ${b} = ?`;
    }

    // if (gameMode === "free") {
    //   questionText = "Modo Livre";
    // }

    const title = document.getElementById("title");
    if (title) title.innerText = `Desafio: ${questionText}`;

    const answers =
      gameMode === "free" ? [1, 2, 3] : [correctAnswer];

    while (answers.length < 3) {
      const wrong = Math.floor(Math.random() * 20);
      if (!answers.includes(wrong)) answers.push(wrong);
    }

    answers.sort(() => Math.random() - 0.5);

    const spacing = canvas.width / (answers.length + 1);

    answers.forEach((value, index) => {
      balls.push({
        x: spacing * (index + 1) - 20,
        y: -50,
        value,
        speed: ballSpeed
      });
    });
  }

  // ================== UPDATE ==================
  function update() {
    if (paused || gameOver) return;

    for (let ball of balls) {
      ball.y += ball.speed;

      if (
        ball.y + 40 > car.y &&
        ball.x < car.x + car.width &&
        ball.x + 40 > car.x
      ) {
        // if (gameMode === "free" || ball.value === correctAnswer) {
        if (ball.value === correctAnswer) {
          score += 10;
          scoreEl.innerText = score;
          newQuestion();
          return;
        } else {
          gameOver = true;
        }
      }

      if (ball.y > canvas.height) {
        gameOver = true;
      }
    }

    if (gameOver && !gameOverHandled) {
      gameOverHandled = true;
      restartAllowed = true;

      const previous =
        GameStorage.get("car-math")?.highScore || 0;

      if (score > previous) {
        isNewRecord = true;
        paused = true;

        document
          .getElementById("recordModal")
          .classList.remove("hidden");
      } else {
        lastHighScore = previous;
      }
    }
  }

  // ================== DRAW ==================
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(carImg, car.x, car.y, car.width, car.height);

    balls.forEach(ball => {
      ctx.beginPath();
      ctx.arc(ball.x + 20, ball.y + 20, 20, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.stroke();

      ctx.fillStyle = "#000";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(ball.value, ball.x + 20, ball.y + 26);
    });

    if (paused && !gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "32px Arial";
      ctx.textAlign = "center";
      ctx.fillText("⏸️ Pausado", canvas.width / 2, canvas.height / 2);
    }

    if (gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#fff";
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

      ctx.font = "20px Arial";
      ctx.fillText(
        `Pontuação: ${score}`,
        canvas.width / 2,
        canvas.height / 2 + 10
      );

      if (isNewRecord) {
        ctx.fillStyle = "#FFD700";
        ctx.fillText(
          "🏆 NOVO RECORDE!",
          canvas.width / 2,
          canvas.height / 2 + 50
        );
      } else {
        ctx.fillStyle = "#ccc";
        ctx.fillText(
          `Recorde: ${lastHighScore}`,
          canvas.width / 2,
          canvas.height / 2 + 50
        );
      }

      ctx.fillStyle = "#fff";
      ctx.fillText(
        "Clique para jogar novamente",
        canvas.width / 2,
        canvas.height / 2 + 90
      );
    }
  }

  // ================== MODAL ==================
  function saveRecordName() {
    const input = document.getElementById("recordNameInput");
    let name = input.value.trim();

    if (!name || name.length < 2) name = "Jogador";

    localStorage.setItem("playerName", name);

    lastHighScore = GameStorage.updateScore(
      "car-math",
      name,
      score
    );

    updateHighScoreUI();

    document
      .getElementById("recordModal")
      .classList.add("hidden");

    paused = false;
  }

  // ================== CONTROLE ==================
  function setMode(mode) {
    gameMode = mode;
    restartGame();
  }

  function restartGame() {
    score = 0;
    scoreEl.innerText = score;
    balls = [];
    gameOver = false;
    gameOverHandled = false;
    restartAllowed = false;
    paused = false;
    isNewRecord = false;
    lastHighScore = 0;
    newQuestion();
    updateHighScoreUI();
  }

  function updateHighScoreUI() {
    const data = GameStorage.get("car-math");

    if (data && data.highScore) {
      highScoreNameEl.innerText = data.player || "Jogador";
      highScoreValueEl.innerText = data.highScore;
    } else {
      highScoreNameEl.innerText = "---";
      highScoreValueEl.innerText = "0";
    }
  }

  // ================== LOOP ==================
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // ================== START ==================
  let loaded = 0;
  function startWhenReady() {
    loaded++;
    if (loaded === 2) {
      updateHighScoreUI();
      newQuestion();
      loop();
    }
  }

  background.onload = startWhenReady;
  carImg.onload = startWhenReady;

  // ================== API ==================
  window.carMath = {
    setMode,
    restartGame,
    saveRecordName,
    setSpeed
  };

  console.log("🏁 Car Math carregado com sucesso!");
})();
