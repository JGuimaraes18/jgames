let currentGameScript = null;

(function initPlayer() {
  let playerName = localStorage.getItem("playerName");

  if (!playerName) {
    playerName = prompt("👋 Qual é o nome da criança?");

    // fallback seguro
    if (!playerName || !playerName.trim()) {
      playerName = "Jogador";
    }

    localStorage.setItem("playerName", playerName);
  }

  console.log("Jogador ativo:", playerName);
})();


async function loadGame(game) {
  const content = document.getElementById("content-area");
  if (!content) return;

  try {
    const response = await fetch(`games/${game}/view.html`);
    if (!response.ok) throw new Error("Jogo não encontrado");

    // limpa conteúdo
    content.innerHTML = await response.text();

    // remove script antigo (se existir)
    if (currentGameScript) {
      currentGameScript.remove();
      currentGameScript = null;
    }

    // carrega JS do jogo
    const script = document.createElement("script");
    script.src = `games/${game}/game.js`;
    script.defer = true;

    document.body.appendChild(script);
    currentGameScript = script;

  } catch (err) {
    console.error(err);
    content.innerHTML = `
      <div class="text-center mt-5">
        <h2>🚧 Em breve</h2>
        <p>Esse jogo ainda está sendo desenvolvido.</p>
      </div>
    `;
  }
}
