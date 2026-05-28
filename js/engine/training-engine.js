/* ============================================
   MMA Fighter Manager — Training Engine
   ============================================ */

const TrainingEngine = {
  /**
   * Apply weekly training to a fighter
   */
  applyWeeklyTraining(fighter) {
    const trainingType = TRAINING_TYPES[fighter.currentTraining] || TRAINING_TYPES.general;
    const targetStyle = STYLES[fighter.targetProfile] || STYLES.wellRounded;

    // Age-based training efficiency from AgingEngine
    const ageFactor = AgingEngine.getTrainingEfficiency(fighter);

    // Apply stat gains from training
    const breakthroughs = [];
    STAT_NAMES.forEach(stat => {
      const baseGain = trainingType.statGains[stat.id] || 0;
      if (baseGain <= 0) return;

      // Target profile bonus
      let profileMultiplier = 1.0;
      if (targetStyle.primaryStats.includes(stat.id)) {
        profileMultiplier = 1.4;
      } else if (targetStyle.secondaryStats.includes(stat.id)) {
        profileMultiplier = 1.1;
      } else if (targetStyle.weakStats.includes(stat.id)) {
        profileMultiplier = 0.7;
      }

      // Morale affects training quality
      const moraleFactor = fighter.morale >= 80 ? 1.15 :
                           fighter.morale >= 60 ? 1.0 :
                           fighter.morale >= 40 ? 0.85 : 0.65;

      // POTENTIAL GAP BONUS: fighters far from their ceiling grow faster
      const maxStat = fighter.potential[stat.id] || 99;
      const currentStat = fighter.stats[stat.id] || 50;
      const gap = maxStat - currentStat;
      const potentialFactor = gap > 20 ? 1.8 :
                              gap > 15 ? 1.5 :
                              gap > 10 ? 1.3 :
                              gap > 5  ? 1.1 : 1.0;

      // YOUTH BONUS: young fighters (< 25) learn faster
      const age = fighter.age || 25;
      const youthFactor = age < 23 ? 1.5 :
                          age < 25 ? 1.3 :
                          age < 27 ? 1.1 : 1.0;

      // Calculate final gain with some randomness
      let gain = baseGain * ageFactor * profileMultiplier * moraleFactor * potentialFactor * youthFactor;
      gain = gain * (0.8 + Math.random() * 0.4); // ±20% variance

      // Round to apply
      const actualGain = Math.max(0, Math.round(gain * 10) / 10);

      // Track breakthrough (gain >= 3 in one stat)
      if (actualGain >= 3) {
        breakthroughs.push({ stat: stat.id, gain: actualGain });
      }

      // Apply gain, capped by potential
      fighter.stats[stat.id] = Math.min(maxStat, fighter.stats[stat.id] + actualGain);
      fighter.stats[stat.id] = Math.round(fighter.stats[stat.id]); // Keep as integers
    });

    // Store breakthroughs for notification
    if (breakthroughs.length > 0) {
      fighter._breakthroughs = breakthroughs;
    }

    // Apply morale effect
    fighter.morale = Math.max(10, Math.min(100, fighter.morale + trainingType.moralEffect));

    // Check for training injury
    if (Math.random() < trainingType.injuryRisk) {
      this._applyTrainingInjury(fighter);
    }


  },

  /**
   * Apply a training injury
   */
  _applyTrainingInjury(fighter) {
    const severity = Math.random() < 0.7 ? 'minor' : 'moderate';
    const injuryInfo = INJURY_DURATIONS[severity];
    fighter.status = 'injured';
    fighter.injuryType = injuryInfo.label;
    fighter.injuryWeeksLeft = injuryInfo.min + Math.floor(Math.random() * (injuryInfo.max - injuryInfo.min + 1));
  },

  /**
   * Get suggested training based on target profile
   */
  getSuggestedTraining(fighter) {
    const style = fighter.targetProfile;
    const suggestions = [];

    switch (style) {
      case 'striker':
        suggestions.push({ type: 'campStriking', reason: 'Develops core striking skills' });
        suggestions.push({ type: 'general', reason: 'Builds well-rounded foundation' });
        break;
      case 'grappler':
        suggestions.push({ type: 'campGrappling', reason: 'Develops ground game expertise' });
        suggestions.push({ type: 'general', reason: 'Builds well-rounded foundation' });
        break;
      case 'wrestler':
        suggestions.push({ type: 'campWrestling', reason: 'Develops wrestling dominance' });
        suggestions.push({ type: 'general', reason: 'Builds well-rounded foundation' });
        break;
      case 'wellRounded':
        suggestions.push({ type: 'general', reason: 'Best for balanced development' });
        suggestions.push({ type: 'sparring', reason: 'Fast all-around improvement' });
        break;
    }

    // Check morale
    if (fighter.morale < 50) {
      suggestions.unshift({ type: 'recovery', reason: '⚠️ Low morale — recovery recommended' });
    }

    return suggestions;
  },

  /**
   * Calculate overall rating for a fighter
   */
  calculateOverall(fighter) {
    const stats = fighter.stats;
    const weights = {
      striking: 1.2,
      grappling: 1.1,
      submission: 1.0,
      wrestling: 1.1,
      cardio: 1.0,
      chin: 0.9,
      athleticism: 1.0,
      mental: 0.8
    };

    let weighted = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([stat, weight]) => {
      weighted += (stats[stat] || 0) * weight;
      totalWeight += weight;
    });

    return Math.round(weighted / totalWeight);
  },

  /**
   * Get stat level label
   */
  getStatLevel(value) {
    if (value >= 85) return 'elite';
    if (value >= 70) return 'high';
    if (value >= 50) return 'mid';
    return 'low';
  }
};
