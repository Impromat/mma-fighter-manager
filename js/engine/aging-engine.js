/* ============================================
   MMA Fighter Manager — Aging Engine
   Handles aging, stat decline, training efficiency
   ============================================ */

const AgingEngine = {

  /**
   * Process aging for all fighters (called every season = 26 weeks)
   */
  processAging(state) {
    const report = [];
    const allFighters = [...state.fighters, ...state.aiFighters];

    allFighters.forEach(fighter => {
      fighter.age = (fighter.age || 25) + 1;
      const peakAge = fighter.peakAge || 29;
      const retireAge = fighter.retireAge || 36;

      // Past peak → stat regression
      if (fighter.age > peakAge) {
        const yearsPastPeak = fighter.age - peakAge;
        const numStats = Math.min(AGING_CONFIG.declineStatsPerYear + Math.floor(yearsPastPeak / 3), 5);
        const statKeys = Object.keys(fighter.stats);
        const shuffled = statKeys.sort(() => Math.random() - 0.5).slice(0, numStats);
        const declines = [];

        shuffled.forEach(stat => {
          const amount = AGING_CONFIG.declineAmountMin + 
            Math.floor(Math.random() * (AGING_CONFIG.declineAmountMax - AGING_CONFIG.declineAmountMin + 1));
          const scaledAmount = Math.min(amount + Math.floor(yearsPastPeak / 2), 5);
          fighter.stats[stat] = Math.max(20, fighter.stats[stat] - scaledAmount);
          declines.push({ stat, amount: scaledAmount });
        });

        if (fighter.isPlayer) {
          report.push({
            type: 'decline',
            fighterName: fighter.fullName,
            fighterId: fighter.id,
            age: fighter.age,
            declines
          });
        }
      }

      // Potential also decreases for old fighters
      if (fighter.age > peakAge + 2) {
        Object.keys(fighter.potential).forEach(stat => {
          fighter.potential[stat] = Math.max(
            fighter.stats[stat],
            fighter.potential[stat] - 1
          );
        });
      }
    });

    return report;
  },

  /**
   * Check for retirement candidates (player fighters only)
   * Returns fighter who should consider retiring, or null
   */
  checkRetirement(state) {
    for (const fighter of state.fighters) {
      const retireAge = fighter.retireAge || 36;
      if (fighter.age >= retireAge && Math.random() < AGING_CONFIG.retireChancePerYear) {
        return fighter;
      }
    }
    return null;
  },

  /**
   * Get training efficiency based on age
   * Returns 0.4 to 1.0
   */
  getTrainingEfficiency(fighter) {
    const age = fighter.age || 25;
    const peakAge = fighter.peakAge || 29;

    if (age <= peakAge) return AGING_CONFIG.trainingEfficiencyPeak;

    const yearsPastPeak = age - peakAge;
    const decay = yearsPastPeak * 0.1; // -10% per year past peak
    return Math.max(AGING_CONFIG.trainingEfficiencyMin, 1.0 - decay);
  },

  /**
   * Get age category label for display
   */
  getAgeCategory(fighter) {
    const age = fighter.age || 25;
    const peakAge = fighter.peakAge || 29;
    
    if (age < peakAge - 2) return { key: 'rising', icon: '📈', color: 'var(--color-success)' };
    if (age <= peakAge + 1) return { key: 'prime', icon: '⭐', color: 'var(--accent-orange)' };
    if (age <= (fighter.retireAge || 36) - 2) return { key: 'veteran', icon: '📉', color: 'var(--text-muted)' };
    return { key: 'twilight', icon: '🌅', color: 'var(--accent-red)' };
  }
};
