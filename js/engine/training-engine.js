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

    // Calculate age factor (younger = faster progression)
    const ageFactor = fighter.age <= 24 ? 1.3 :
                      fighter.age <= 27 ? 1.1 :
                      fighter.age <= 30 ? 0.9 :
                      fighter.age <= 33 ? 0.7 : 0.5;

    // Apply stat gains from training
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

      // Calculate final gain with some randomness
      let gain = baseGain * ageFactor * profileMultiplier * moraleFactor;
      gain = gain * (0.8 + Math.random() * 0.4); // ±20% variance

      // Round to apply
      const actualGain = Math.max(0, Math.round(gain * 10) / 10);

      // Apply gain, capped by potential
      const maxStat = fighter.potential[stat.id];
      fighter.stats[stat.id] = Math.min(maxStat, fighter.stats[stat.id] + actualGain);
      fighter.stats[stat.id] = Math.round(fighter.stats[stat.id]); // Keep as integers
    });

    // Apply morale effect
    fighter.morale = Math.max(10, Math.min(100, fighter.morale + trainingType.moralEffect));

    // Check for training injury
    if (Math.random() < trainingType.injuryRisk) {
      this._applyTrainingInjury(fighter);
    }

    // Age-related stat decline for older fighters (small chance per week)
    if (fighter.age >= 33 && Math.random() < 0.1) {
      const statToDecline = STAT_NAMES[Math.floor(Math.random() * STAT_NAMES.length)];
      fighter.stats[statToDecline.id] = Math.max(15, fighter.stats[statToDecline.id] - 1);
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
