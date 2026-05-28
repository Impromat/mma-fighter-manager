/* ============================================
   MMA Fighter Manager — Fighter Generator
   ============================================ */

const FighterGenerator = {
  _nextId: 1,

  /**
   * Generate a unique fighter ID
   */
  _generateId(prefix) {
    return `${prefix}_${Date.now()}_${this._nextId++}`;
  },

  /**
   * Generate player roster
   */
  generatePlayerRoster(count) {
    const fighters = [];
    const existingNames = [];

    // Distribute across active weight classes only (ones with AI opponents)
    const activeWCs = WEIGHT_CLASSES.filter(wc => ACTIVE_WEIGHT_CLASSES.includes(wc.id));
    const selectedClasses = this._pickRandom(activeWCs, Math.min(activeWCs.length, Math.max(3, Math.ceil(count / 2))));
    const styles = Object.keys(STYLES);

    for (let i = 0; i < count; i++) {
      const weightClass = selectedClasses[i % selectedClasses.length];
      const style = styles[i % styles.length];
      const nationality = this._pickRandom(NATIONALITIES, 1)[0];
      const name = generateUniqueName(nationality.id, existingNames);
      existingNames.push(`${name.first} ${name.last}`);

      const fighter = this._createFighter({
        idPrefix: 'player',
        firstName: name.first,
        lastName: name.last,
        nationality,
        weightClass,
        style,
        minAge: 20,
        maxAge: 30,
        statRange: [35, 65],
        potentialRange: [65, 95],
        isPlayer: true
      });

      fighters.push(fighter);
    }

    return fighters;
  },

  /**
   * Generate a single AI fighter
   */
  generateAIFighter(weightClassId, statRange, existingNames) {
    const weightClass = WEIGHT_CLASSES.find(wc => wc.id === weightClassId);
    const styles = Object.keys(STYLES);
    const style = styles[Math.floor(Math.random() * styles.length)];
    const nationality = NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)];
    const name = generateUniqueName(nationality.id, existingNames || []);

    return this._createFighter({
      idPrefix: 'ai',
      firstName: name.first,
      lastName: name.last,
      nationality,
      weightClass,
      style,
      minAge: 22,
      maxAge: 35,
      statRange: statRange || [40, 75],
      potentialRange: [60, 90],
      isPlayer: false
    });
  },

  /**
   * Create a fighter object
   */
  _createFighter({ idPrefix, firstName, lastName, nationality, weightClass, style, minAge, maxAge, statRange, potentialRange, isPlayer }) {
    const age = minAge + Math.floor(Math.random() * (maxAge - minAge + 1));
    const styleData = STYLES[style];
    const stats = {};
    const potential = {};

    // Generate stats based on style
    STAT_NAMES.forEach(stat => {
      let base;
      const [minStat, maxStat] = statRange;

      if (styleData.primaryStats.includes(stat.id)) {
        base = minStat + Math.floor(Math.random() * (maxStat - minStat + 1)) + 10;
      } else if (styleData.secondaryStats.includes(stat.id)) {
        base = minStat + Math.floor(Math.random() * (maxStat - minStat + 1)) + 3;
      } else {
        base = minStat + Math.floor(Math.random() * (maxStat - minStat + 1)) - 5;
      }

      stats[stat.id] = Math.max(15, Math.min(99, base));

      // Potential ceiling
      const [minPot, maxPot] = potentialRange;
      potential[stat.id] = Math.max(stats[stat.id] + 5, minPot + Math.floor(Math.random() * (maxPot - minPot + 1)));
      potential[stat.id] = Math.min(99, potential[stat.id]);
    });

    // Generate a record for AI fighters (player fighters start 0-0)
    let wins = 0, losses = 0;
    if (!isPlayer) {
      wins = Math.floor(Math.random() * 15) + 3;
      losses = Math.floor(Math.random() * 6);
    }

    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const PERSONALITIES = isPlayer
      ? ['confident']
      : ['trashTalker', 'trashTalker', 'confident', 'confident', 'humble', 'quiet'];
    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];

    return {
      id: this._generateId(idPrefix),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      nickname: null,
      nationality: nationality,
      age,
      peakAge: AGING_CONFIG.peakAgeMin + Math.floor(Math.random() * (AGING_CONFIG.peakAgeMax - AGING_CONFIG.peakAgeMin + 1)),
      retireAge: AGING_CONFIG.retireAgeMin + Math.floor(Math.random() * (AGING_CONFIG.retireAgeMax - AGING_CONFIG.retireAgeMin + 1)),
      weightClass: weightClass.id,
      style,
      stats,
      potential,
      morale: 70 + Math.floor(Math.random() * 16), // 70-85
      status: 'available',
      injuryType: null,
      injuryWeeksLeft: 0,
      wins,
      losses,
      draws: 0,
      koLosses: 0,
      chinDamage: 0,
      currentTraining: 'general',
      targetProfile: style,
      isPlayer,
      avatarColor,
      fightCampBonus: null,
      ranking: null,
      feeMultiplier: 1.0,
      personality
    };
  },

  /**
   * Pick random items from array
   */
  _pickRandom(arr, count) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
};
