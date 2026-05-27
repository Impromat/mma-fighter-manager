/* ============================================
   MMA Fighter Manager — Finance Engine
   ============================================ */

const FinanceEngine = {
  /**
   * Calculate weekly salaries for all fighters
   */
  calculateWeeklySalaries(state) {
    let total = 0;
    state.fighters.forEach(fighter => {
      const salary = this.getFighterSalary(fighter, state);
      total += salary;
    });
    return total;
  },

  /**
   * Get base salary for a fighter (before multiplier)
   */
  getBaseSalary(fighter, state) {
    const ranking = LeagueEngine.getFighterRanking(fighter.id, state);

    if (ranking === 0) return SALARY_BY_RANK.champion;
    if (ranking === null) return SALARY_BY_RANK.unranked;
    if (ranking <= 3) return SALARY_BY_RANK.ranked3_1;
    if (ranking <= 5) return SALARY_BY_RANK.ranked5_4;
    if (ranking <= 10) return SALARY_BY_RANK.ranked10_6;
    return SALARY_BY_RANK.ranked15_11;
  },

  /**
   * Get individual fighter salary (base × multiplier)
   */
  getFighterSalary(fighter, state) {
    const base = this.getBaseSalary(fighter, state);
    const multiplier = fighter.salaryMultiplier || 1.0;
    return Math.round(base * multiplier);
  },

  /**
   * Calculate fight purse
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
   * Format currency
   */
  formatMoney(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
};
