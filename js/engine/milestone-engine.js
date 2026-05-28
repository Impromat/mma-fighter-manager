/* ============================================
   MMA Fighter Manager — Milestone Engine
   Tracks achievements and triggers celebrations
   ============================================ */

const MilestoneEngine = {

  MILESTONES: [
    // --- Fight milestones ---
    { id: 'first_win', icon: '🥊', check: (s) => s.fighters.some(f => f.wins >= 1), once: true },
    { id: 'first_ko', icon: '💥', check: (s, r) => r?.fightResults?.some(f => f.winner === 'fighter1' && (f.method?.includes('KO') || f.method?.includes('TKO'))), once: true },
    { id: 'first_sub', icon: '🔒', check: (s, r) => r?.fightResults?.some(f => f.winner === 'fighter1' && f.method?.includes('Submission')), once: true },
    { id: 'win_streak_3', icon: '🔥', check: (s) => s.fighters.some(f => (f.winStreak || 0) >= 3), once: true },
    { id: 'win_streak_5', icon: '⚡', check: (s) => s.fighters.some(f => (f.winStreak || 0) >= 5), once: true },
    { id: 'win_streak_10', icon: '👑', check: (s) => s.fighters.some(f => (f.winStreak || 0) >= 10), once: true },
    { id: 'wins_10', icon: '🏅', check: (s) => s.fighters.reduce((t, f) => t + f.wins, 0) >= 10, once: true },
    { id: 'wins_25', icon: '🎖️', check: (s) => s.fighters.reduce((t, f) => t + f.wins, 0) >= 25, once: true },
    { id: 'wins_50', icon: '🏆', check: (s) => s.fighters.reduce((t, f) => t + f.wins, 0) >= 50, once: true },

    // --- Ranking milestones ---
    { id: 'first_ranked', icon: '📊', check: (s) => s.fighters.some(f => { const r = LeagueEngine.getFighterRanking(f.id, s); return r !== null && r <= 15; }), once: true },
    { id: 'top5', icon: '⭐', check: (s) => s.fighters.some(f => { const r = LeagueEngine.getFighterRanking(f.id, s); return r !== null && r <= 5; }), once: true },
    { id: 'top1', icon: '🥇', check: (s) => s.fighters.some(f => { const r = LeagueEngine.getFighterRanking(f.id, s); return r !== null && r === 1; }), once: true },
    { id: 'champion', icon: '🏆', check: (s) => s.fighters.some(f => f.isChampion), once: true },

    // --- Training milestones ---
    { id: 'stat_80', icon: '💪', check: (s) => s.fighters.some(f => STAT_NAMES.some(st => f.stats[st.id] >= 80)), once: true },
    { id: 'stat_90', icon: '🔥', check: (s) => s.fighters.some(f => STAT_NAMES.some(st => f.stats[st.id] >= 90)), once: true },
    { id: 'stat_99', icon: '💎', check: (s) => s.fighters.some(f => STAT_NAMES.some(st => f.stats[st.id] >= 99)), once: true },
    { id: 'ovr_80', icon: '📈', check: (s) => s.fighters.some(f => TrainingEngine.calculateOverall(f) >= 80), once: true },
    { id: 'ovr_90', icon: '🌟', check: (s) => s.fighters.some(f => TrainingEngine.calculateOverall(f) >= 90), once: true },

    // --- Business milestones ---
    { id: 'budget_100k', icon: '💰', check: (s) => s.budget >= 100000, once: true },
    { id: 'budget_500k', icon: '💎', check: (s) => s.budget >= 500000, once: true },
    { id: 'roster_3', icon: '👥', check: (s) => s.fighters.length >= 3, once: true },
    { id: 'roster_5', icon: '🏟️', check: (s) => s.fighters.length >= 5, once: true },
    { id: 'rep_80', icon: '⭐', check: (s) => (s.reputation || 50) >= 80, once: true },

    // --- Progression milestones ---
    { id: 'week_26', icon: '📅', check: (s) => s.week >= 26, once: true },
    { id: 'week_52', icon: '🗓️', check: (s) => s.week >= 52, once: true },
    { id: 'week_100', icon: '💯', check: (s) => s.week >= 100, once: true },
  ],

  /**
   * Check all milestones and return newly unlocked ones
   */
  check(state, report) {
    if (!state.milestones) state.milestones = [];

    const newMilestones = [];

    this.MILESTONES.forEach(m => {
      if (m.once && state.milestones.includes(m.id)) return;

      try {
        if (m.check(state, report)) {
          if (!state.milestones.includes(m.id)) {
            state.milestones.push(m.id);
            newMilestones.push(m);
          }
        }
      } catch (e) {
        // Silent fail — milestone check error
      }
    });

    return newMilestones;
  },

  /**
   * Get all unlocked milestones
   */
  getUnlocked(state) {
    return (state.milestones || []).map(id => this.MILESTONES.find(m => m.id === id)).filter(Boolean);
  },

  /**
   * Get progress stats
   */
  getProgress(state) {
    const total = this.MILESTONES.length;
    const unlocked = (state.milestones || []).length;
    return { total, unlocked, percent: Math.round((unlocked / total) * 100) };
  }
};
