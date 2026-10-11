/**
 * app.js — Hub do JGames: identidade do jogador, registro de jogos,
 * carregamento/descarregamento com ciclo de vida e integração de tela cheia.
 */

(function () {
  "use strict";

  /**
   * Registro de jogos. Adicionar um novo jogo é incluir uma entrada aqui;
   * a estrutura de diretórios por jogo (view.html + scripts + assets) é o
   * contrato. Cada módulo deve expor `window[global].init()` e `.destroy()`.
   */
  const GAMES = {
    "car-math": {
      id: "car-math",
      title: "Matemática",
      html: "games/car-math/view.html",
      scripts: ["games/car-math/logic.js", "games/car-math/game.js"],
      global: "carMath"
    }
  };

  let activeGame = null; // { def, instance }
  let injectedScripts = [];
  let loading = false;

  function byId(id) {
    return document.getElementById(id);
  }

  // ---------------- Identidade do jogador ----------------
  function getPlayerName() {
    const stored =
      window.GameStorage && window.GameStorage.getPlayerName
        ? window.GameStorage.getPlayerName()
        : "";
    return stored || "Jogador";
  }

  function setPlayerName(name) {
    if (window.GameStorage && window.GameStorage.savePlayerName) {
      return window.GameStorage.savePlayerName(name) || "Jogador";
    }
    return "Jogador";
  }

  function initPlayerField() {
    const input = byId("playerName");
    if (!input) return;
    const current = getPlayerName();
    input.value = current === "Jogador" ? "" : current;
    input.placeholder = "Seu nome";
    input.addEventListener("change", () => {
      setPlayerName(input.value);
    });
  }

  // ---------------- Carregamento de scripts ----------------
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error("Falha ao carregar " + src));
      document.body.appendChild(script);
      injectedScripts.push(script);
    });
  }

  async function loadScripts(list) {
    for (const src of list) {
      await loadScript(src);
    }
  }

  // ---------------- Ciclo de vida ----------------
  function disposeActiveGame() {
    if (activeGame && activeGame.instance) {
      const instance = activeGame.instance;
      if (typeof instance.destroy === "function") {
        try {
          instance.destroy();
        } catch (e) {
          console.error("Erro ao encerrar o jogo:", e);
        }
      }
      const globalName = activeGame.def.global;
      if (window[globalName] === instance) {
        try {
          delete window[globalName];
        } catch (e) {
          window[globalName] = null;
        }
      }
    }
    activeGame = null;
    document.body.classList.remove("has-game");

    for (const script of injectedScripts) {
      if (script && script.parentNode) script.parentNode.removeChild(script);
    }
    injectedScripts = [];
  }

  function showMessage(html) {
    const content = byId("content-area");
    if (content) content.innerHTML = html;
  }

  function showLoading(title) {
    showMessage(
      '<div class="content-message" role="status">' +
        '<h2>' + title + "</h2>" +
        "<p>Carregando...</p>" +
        "</div>"
    );
  }

  function showLoadError() {
    showMessage(
      '<div class="content-message content-message--error" role="alert">' +
        "<h2>😕 Não foi possível abrir o jogo</h2>" +
        "<p>Verifique se os arquivos do jogo estão presentes e tente novamente.</p>" +
        "</div>"
    );
  }

  async function loadGame(gameId) {
    const def = GAMES[gameId];
    const content = byId("content-area");
    if (!content || loading) return;

    if (!def) {
      showMessage(
        '<div class="content-message" role="status">' +
          "<h2>🚧 Em breve</h2>" +
          "<p>Esse jogo ainda está sendo desenvolvido.</p>" +
          "</div>"
      );
      return;
    }

    loading = true;
    showLoading(def.title);

    try {
      disposeActiveGame();

      const response = await fetch(def.html);
      if (!response.ok) throw new Error("Jogo não encontrado: " + def.html);
      content.innerHTML = await response.text();

      await loadScripts(def.scripts);

      const game = window[def.global];
      if (!game || typeof game.init !== "function") {
        throw new Error("O jogo não expôs uma função init().");
      }
      game.init();
      activeGame = { def, instance: game };
      document.body.classList.add("has-game");

      if (typeof game.focusCanvas === "function") game.focusCanvas();
    } catch (err) {
      console.error("Falha ao carregar o jogo:", err);
      disposeActiveGame();
      showLoadError();
    } finally {
      loading = false;
    }
  }

  // ---------------- Tela cheia ----------------
  function initFullscreen() {
    const buttons = document.querySelectorAll("[data-action='fullscreen']");
    if (!buttons.length) return;

    const api = window.jgWindow;
    let isFullscreen = false;

    const render = () => {
      const text = isFullscreen ? "Sair da tela cheia" : "Tela cheia";
      buttons.forEach((btn) => {
        const label = btn.querySelector(".ft-label");
        const icon = btn.querySelector(".ft-icon");
        if (label) {
          label.textContent = text;
          if (icon) icon.textContent = isFullscreen ? "🗗" : "⛶";
        } else {
          btn.textContent = (isFullscreen ? "🗗 " : "⛶ ") + text;
        }
        btn.setAttribute("aria-pressed", String(isFullscreen));
      });
    };

    const toggle = async () => {
      if (!api || !api.toggleFullscreen) return;
      isFullscreen = await api.toggleFullscreen();
      render();
    };

    buttons.forEach((btn) => btn.addEventListener("click", toggle));

    if (api && api.onFullscreenChange) {
      api.onFullscreenChange((value) => {
        isFullscreen = Boolean(value);
        render();
      });
      if (api.isFullscreen) {
        api.isFullscreen().then((value) => {
          isFullscreen = Boolean(value);
          render();
        });
      }
    }
    render();
  }

  // ---------------- Seleção de jogo ----------------
  function initGameMenu() {
    const triggers = document.querySelectorAll("[data-game]");
    triggers.forEach((btn) => {
      btn.addEventListener("click", () => loadGame(btn.getAttribute("data-game")));
    });
  }

  // ---------------- Menu lateral minimizável ----------------
  const SIDEBAR_KEY = "jg.sidebarCollapsed";

  function applySidebarState(collapsed) {
    const toggle = byId("sidebarToggle");
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.setAttribute(
        "aria-label",
        collapsed ? "Expandir menu lateral" : "Minimizar menu lateral"
      );
      toggle.title = collapsed ? "Expandir menu" : "Minimizar menu";
    }
  }

  function initSidebarToggle() {
    const toggle = byId("sidebarToggle");
    if (!toggle) return;

    let collapsed = false;
    if (window.GameStorage && window.GameStorage.getPref) {
      collapsed = window.GameStorage.getPref(SIDEBAR_KEY) === "1";
    }
    applySidebarState(collapsed);

    toggle.addEventListener("click", () => {
      collapsed = !collapsed;
      applySidebarState(collapsed);
      if (window.GameStorage && window.GameStorage.setPref) {
        window.GameStorage.setPref(SIDEBAR_KEY, collapsed ? "1" : "0");
      }
    });
  }

  // ---------------- Boot ----------------
  function boot() {
    initPlayerField();
    initGameMenu();
    initFullscreen();
    initSidebarToggle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Exposto para navegação por teclado / futura extensão.
  window.JGames = { loadGame, getPlayerName, GAMES };
})();
