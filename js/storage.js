window.GameStorage = {
  get(gameId) {
    const raw = localStorage.getItem(`jogo:${gameId}`);
    return raw ? JSON.parse(raw) : null;
  },

  save(gameId, data) {
    localStorage.setItem(`jogo:${gameId}`, JSON.stringify(data));
  },

  updateScore(gameId, player, score) {
    const current = this.get(gameId) || {};

    const highScore = Math.max(score, current.highScore || 0);

    this.save(gameId, {
      player,
      highScore,
      lastScore: score,
      playedAt: new Date().toISOString()
    });

    return highScore;
  }
};
