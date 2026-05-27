/* ============================================
   MMA Fighter Manager — AI Fighters
   ============================================ */

const AIFighters = {
  /**
   * Generate all AI fighters and rankings for the league
   */
  generateAll(playerFighters) {
    const fighters = [];
    const rankings = {};
    const existingNames = playerFighters.map(f => `${f.firstName} ${f.lastName}`);

    // Active weight classes from constants
    const activeClasses = ACTIVE_WEIGHT_CLASSES;

    activeClasses.forEach(wcId => {
      rankings[wcId] = {
        champion: null,
        ranked: [] // Array of fighter IDs, index 0 = #1
      };

      // Generate champion (high stats)
      const champion = FighterGenerator.generateAIFighter(wcId, [70, 90], existingNames);
      champion.wins = 15 + Math.floor(Math.random() * 10);
      champion.losses = Math.floor(Math.random() * 4);
      champion.ranking = 'champion';
      fighters.push(champion);
      existingNames.push(champion.fullName);
      rankings[wcId].champion = champion.id;

      // Generate ranked fighters (15)
      for (let rank = 0; rank < 15; rank++) {
        let statRange;
        if (rank < 3) {
          statRange = [60, 85]; // Top 3
        } else if (rank < 5) {
          statRange = [55, 80]; // #4-5
        } else if (rank < 10) {
          statRange = [48, 75]; // #6-10
        } else {
          statRange = [42, 70]; // #11-15
        }

        const aiFighter = FighterGenerator.generateAIFighter(wcId, statRange, existingNames);
        aiFighter.ranking = rank + 1;
        aiFighter.wins = (15 - rank) + Math.floor(Math.random() * 8);
        aiFighter.losses = Math.floor(Math.random() * 5) + 1;
        fighters.push(aiFighter);
        existingNames.push(aiFighter.fullName);
        rankings[wcId].ranked.push(aiFighter.id);
      }
    });

    // Also add some unranked fighters for matchmaking
    activeClasses.forEach(wcId => {
      for (let i = 0; i < 5; i++) {
        const aiFighter = FighterGenerator.generateAIFighter(wcId, [35, 65], existingNames);
        aiFighter.ranking = null;
        fighters.push(aiFighter);
        existingNames.push(aiFighter.fullName);
      }
    });

    return { fighters, rankings };
  },

  /**
   * Get fighters by weight class
   */
  getByWeightClass(wcId, state) {
    return state.aiFighters.filter(f => f.weightClass === wcId);
  },

  /**
   * Get champion for a weight class
   */
  getChampion(wcId, state) {
    const champId = state.rankings[wcId]?.champion;
    if (!champId) return null;

    // Check player fighters first
    let champ = state.fighters.find(f => f.id === champId);
    if (!champ) champ = state.aiFighters.find(f => f.id === champId);
    return champ;
  }
};
