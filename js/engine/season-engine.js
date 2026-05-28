/* ============================================
   MMA Fighter Manager — Season Engine
   ============================================ */

const SEASON_LENGTH = 26; // weeks per season

const SEASON_OBJECTIVES_POOL = [
  {
    id: 'top5',
    get name() { return t('season.obj.top5'); },
    icon: '🏅',
    reward: 10000,
    check: (state) => {
      return state.fighters.some(f => {
        const rank = LeagueEngine.getFighterRanking(f.id, state);
        return rank !== null && rank <= 5;
      });
    }
  },
  {
    id: 'budget80k',
    get name() { return t('season.obj.budget', { n: '80 000' }); },
    icon: '💰',
    reward: 5000,
    check: (state) => state.budget >= 80000
  },
  {
    id: 'title',
    get name() { return t('season.obj.title'); },
    icon: '🏆',
    reward: 15000,
    check: (state) => {
      return state.fighters.some(f => {
        const rank = LeagueEngine.getFighterRanking(f.id, state);
        return rank === 0; // Champion
      });
    }
  },
  {
    id: 'winstreak3',
    get name() { return t('season.obj.winstreak', { n: 3 }); },
    icon: '🔥',
    reward: 8000,
    check: (state) => {
      return (state.seasonStats?.currentStreak || 0) >= 3;
    }
  },
  {
    id: 'winrate60',
    get name() { return t('season.obj.winrate', { n: 60 }); },
    icon: '📊',
    reward: 7000,
    check: (state) => {
      const s = state.seasonStats || {};
      const total = (s.wins || 0) + (s.losses || 0);
      if (total === 0) return false;
      return (s.wins / total) * 100 >= 60;
    }
  },
  {
    id: 'improve5',
    get name() { return t('season.obj.improve', { n: 5 }); },
    icon: '⭐',
    reward: 6000,
    check: (state) => {
      const baseOvrs = state.seasonStats?.baseOvrs || {};
      return state.fighters.some(f => {
        const current = TrainingEngine.calculateOverall(f);
        const base = baseOvrs[f.id] || current;
        return current - base >= 5;
      });
    }
  }
];

const SeasonEngine = {
  /**
   * Generate 3 random objectives for a new season
   */
  generateObjectives() {
    const pool = [...SEASON_OBJECTIVES_POOL];
    const selected = [];
    
    while (selected.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push({
        ...pool[idx],
        id: pool[idx].id,
        completed: false
      });
      pool.splice(idx, 1);
    }
    
    return selected;
  },

  /**
   * Check all objectives — pays rewards immediately on completion
   * Returns array of newly completed objectives
   */
  checkObjectives(state) {
    if (!state.seasonObjectives) return [];
    
    const pool = SEASON_OBJECTIVES_POOL;
    const newlyCompleted = [];
    
    state.seasonObjectives.forEach(obj => {
      if (obj.completed) return;
      
      const def = pool.find(p => p.id === obj.id);
      if (def && def.check(state)) {
        obj.completed = true;
        
        // Pay reward immediately
        const reward = obj.reward || def.reward || 0;
        if (reward > 0) {
          FinanceEngine.addTransaction(state, 'income', `🏆 ${def.name}`, reward);
        }
        
        newlyCompleted.push({ ...obj, reward, name: def.name, icon: def.icon });
      }
    });
    
    return newlyCompleted;
  },

  /**
   * Get season summary for end-of-season screen
   */
  getSeasonSummary(state) {
    const stats = state.seasonStats || {};
    const objectives = state.seasonObjectives || [];
    const completedCount = objectives.filter(o => o.completed).length;
    const totalReward = objectives
      .filter(o => o.completed)
      .reduce((sum, o) => sum + (o.reward || 0), 0);

    return {
      season: state.season || 1,
      wins: stats.wins || 0,
      losses: stats.losses || 0,
      kos: stats.kos || 0,
      submissions: stats.subs || 0,
      decisions: stats.decisions || 0,
      moneyEarned: stats.moneyEarned || 0,
      objectives,
      completedCount,
      totalReward,
      bestStreak: stats.bestStreak || 0
    };
  },

  /**
   * Initialize season state for a new game or new season
   */
  initSeason(state) {
    state.season = (state.season || 0) + 1;
    state.seasonWeek = 1;
    state.seasonObjectives = this.generateObjectives();
    state.seasonStats = {
      wins: 0,
      losses: 0,
      kos: 0,
      subs: 0,
      decisions: 0,
      currentStreak: 0,
      bestStreak: 0,
      moneyEarned: 0,
      baseOvrs: {}
    };

    // Snapshot current OVRs for the "improve" objective
    state.fighters.forEach(f => {
      state.seasonStats.baseOvrs[f.id] = TrainingEngine.calculateOverall(f);
    });
  },

  /**
   * Record a fight result in season stats
   */
  recordFight(state, result) {
    if (!state.seasonStats) return;
    
    const isWin = result.winner === 'fighter1';
    
    if (isWin) {
      state.seasonStats.wins++;
      state.seasonStats.currentStreak++;
      state.seasonStats.bestStreak = Math.max(state.seasonStats.bestStreak, state.seasonStats.currentStreak);
    } else {
      state.seasonStats.losses++;
      state.seasonStats.currentStreak = 0;
    }

    if (result.method === 'KO/TKO') {
      if (isWin) state.seasonStats.kos++;
    } else if (result.method?.includes('Submission')) {
      if (isWin) state.seasonStats.subs++;
    } else {
      if (isWin) state.seasonStats.decisions++;
    }
  }
};
