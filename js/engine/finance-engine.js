/* ============================================
   MMA Fighter Manager — Finance Engine
   Realistic MMA gym model:
   - Revenue: fighter training fees + % of purses
   - Costs: rent + staff per fighter
   ============================================ */

const FinanceEngine = {
  /**
   * Calculate weekly gym finances
   * Returns { fees, costs, net }
   */
  calculateWeeklyFinances(state) {
    let totalFees = 0;
    state.fighters.forEach(fighter => {
      totalFees += this.getFighterFee(fighter);
    });

    const totalCosts = this.getGymCosts(state);

    return {
      fees: totalFees,
      costs: totalCosts,
      net: totalFees - totalCosts
    };
  },

  /**
   * Get weekly training fee a fighter pays to the gym
   */
  getFighterFee(fighter) {
    const ovr = TrainingEngine.calculateOverall(fighter);
    const multiplier = fighter.feeMultiplier || 1.0;

    let baseFee;
    if (ovr >= 90) baseFee = GYM_FEES.champion;
    else if (ovr >= 80) baseFee = GYM_FEES.elite;
    else if (ovr >= 70) baseFee = GYM_FEES.contender;
    else if (ovr >= 60) baseFee = GYM_FEES.prospect;
    else baseFee = GYM_FEES.rookie;

    return Math.round(baseFee * multiplier);
  },

  /**
   * Get base fee before multiplier (for UI display)
   */
  getBaseFee(fighter) {
    const ovr = TrainingEngine.calculateOverall(fighter);
    if (ovr >= 90) return GYM_FEES.champion;
    if (ovr >= 80) return GYM_FEES.elite;
    if (ovr >= 70) return GYM_FEES.contender;
    if (ovr >= 60) return GYM_FEES.prospect;
    return GYM_FEES.rookie;
  },

  /**
   * Get weekly gym running costs
   */
  getGymCosts(state) {
    return GYM_COSTS.rent + (GYM_COSTS.staffPerFighter * state.fighters.length);
  },

  /**
   * Calculate gym's cut from a fight purse
   */
  getGymCut(purse, isWin) {
    const showCut = Math.round(purse.show * GYM_CUT.pursePercent);
    const winCut = isWin ? Math.round(purse.win * GYM_CUT.winBonusPercent) : 0;
    return { showCut, winCut, total: showCut + winCut };
  },

  /**
   * Calculate fight purse (paid by the promotion to the fighter)
   */
  calculatePurse(fighter, state, isTitle) {
    if (isTitle) return FIGHT_PURSES.titleFight;

    const ranking = LeagueEngine.getFighterRanking(fighter.id, state);
    if (ranking === null) return FIGHT_PURSES.unranked;
    if (ranking <= 3) return FIGHT_PURSES.ranked3_1;
    if (ranking <= 5) return FIGHT_PURSES.ranked5_4;
    if (ranking <= 10) return FIGHT_PURSES.ranked10_6;
    return FIGHT_PURSES.ranked15_11;
  },

  /**
   * Add a financial transaction
   */
  addTransaction(state, type, description, amount) {
    const transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type, // 'income' or 'expense'
      description,
      amount,
      week: state.week,
      balanceBefore: state.budget,
      timestamp: Date.now()
    };

    if (type === 'income') {
      state.budget += amount;
    } else {
      state.budget -= amount;
    }

    transaction.balanceAfter = state.budget;
    state.transactions.push(transaction);
    return transaction;
  },

  /**
   * Get recent transactions
   */
  getRecentTransactions(state, count) {
    return state.transactions.slice(-count).reverse();
  },

  /**
   * Get transactions for a specific week
   */
  getWeekTransactions(state, week) {
    return state.transactions.filter(t => t.week === week);
  },

  /**
   * Calculate weekly summary
   */
  getWeeklySummary(state) {
    const currentWeek = state.week;
    const weekTx = this.getWeekTransactions(state, currentWeek - 1);

    const income = weekTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = weekTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      net: income - expenses,
      balance: state.budget
    };
  },

  /**
   * Format currency (USD)
   */
  formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
};
