/**
 * storage.js — Persistência local resiliente.
 *
 * Não depende diretamente de `window`: recebe um backend compatível com
 * a API Storage (getItem/setItem). No navegador/Electron o backend padrão
 * é o localStorage; nos testes é possível injetar um mock.
 *
 * Todas as entradas são validadas: JSON corrompido, tipos inesperados,
 * pontuação inválida e nomes vazios/longos são tratados sem derrubar a
 * aplicação e sem apagar registros válidos.
 */

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    const backend = (function () {
      try {
        return root.localStorage;
      } catch (e) {
        return null;
      }
    })();
    root.GameStorage = api.createGameStorage(backend);
  }
  // eslint-disable-next-line no-undef
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const KEY_PREFIX = "jogo:";
  const PLAYER_KEY = "playerName";
  const MAX_NAME_LENGTH = 30;
  const DEFAULT_PLAYER = "Jogador";

  function sanitizeName(raw) {
    if (typeof raw !== "string") return "";
    const collapsed = raw.replace(/\s+/g, " ").trim();
    return collapsed.slice(0, MAX_NAME_LENGTH);
  }

  function sanitizeScore(raw) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
  }

  function readRaw(backend, key) {
    try {
      if (!backend) return null;
      return backend.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function writeRaw(backend, key, value) {
    try {
      if (!backend) return false;
      backend.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Cria uma instância de armazenamento ligada a um backend.
   * @param {{getItem:Function,setItem:Function}} backend
   */
  function createGameStorage(backend) {
    return {
      /** Lê e valida o registro do jogo. Retorna null se ausente/inválido. */
      get(gameId) {
        if (!gameId) return null;
        const raw = readRaw(backend, KEY_PREFIX + gameId);
        if (raw == null) return null;
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          // Não apaga: apenas ignora a entrada corrompida.
          return null;
        }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return null;
        }
        return {
          player: sanitizeName(parsed.player),
          highScore: sanitizeScore(parsed.highScore),
          lastScore: sanitizeScore(parsed.lastScore),
          playedAt: typeof parsed.playedAt === "string" ? parsed.playedAt : null
        };
      },

      /** Grava um registro saneado. Retorna true em caso de sucesso. */
      save(gameId, data) {
        if (!gameId) return false;
        const source = data && typeof data === "object" ? data : {};
        const safe = {
          player: sanitizeName(source.player) || DEFAULT_PLAYER,
          highScore: sanitizeScore(source.highScore),
          lastScore: sanitizeScore(source.lastScore),
          playedAt:
            typeof source.playedAt === "string"
              ? source.playedAt
              : new Date().toISOString()
        };
        return writeRaw(backend, KEY_PREFIX + gameId, JSON.stringify(safe));
      },

      /**
       * Atualiza pontuação preservando o maior recorde. Nunca reduz o
       * recorde existente nem perde o nome válido anterior.
       * @returns {number} o recorde resultante
       */
      updateScore(gameId, player, score) {
        const current = this.get(gameId);
        const safeScore = sanitizeScore(score);
        const previousHigh = current ? current.highScore : 0;
        const highScore = Math.max(safeScore, previousHigh);
        const name =
          sanitizeName(player) ||
          (current && current.player) ||
          DEFAULT_PLAYER;
        this.save(gameId, {
          player: name,
          highScore,
          lastScore: safeScore
        });
        return highScore;
      },

      getPlayerName() {
        return sanitizeName(readRaw(backend, PLAYER_KEY));
      },

      savePlayerName(name) {
        const safe = sanitizeName(name);
        if (!safe) return "";
        writeRaw(backend, PLAYER_KEY, safe);
        return safe;
      },

      /** Lê uma preferência da interface (ex.: '"0"' ou '"1"'). */
      getPref(key) {
        if (typeof key !== "string" || !key) return null;
        return readRaw(backend, key);
      },

      /** Grava uma preferência da interface. Retorna true em caso de sucesso. */
      setPref(key, value) {
        if (typeof key !== "string" || !key) return false;
        return writeRaw(backend, key, String(value));
      }
    };
  }

  return {
    createGameStorage,
    sanitizeName,
    sanitizeScore,
    KEY_PREFIX,
    PLAYER_KEY,
    MAX_NAME_LENGTH,
    DEFAULT_PLAYER
  };
});
