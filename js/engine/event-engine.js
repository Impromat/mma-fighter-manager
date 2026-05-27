/* ============================================
   MMA Fighter Manager — Event Engine
   ============================================ */

const EventEngine = {
  /**
   * Roll for a random event this week
   * Returns null or an event object with selected fighter
   */
  rollForEvent(state) {
    // Shuffle events to avoid bias
    const shuffled = [...RANDOM_EVENTS].sort(() => Math.random() - 0.5);

    for (const template of shuffled) {
      if (Math.random() > template.probability) continue;

      let selectedFighter = null;

      if (template.requiresFighter) {
        // Find eligible fighters
        let candidates = state.fighters.filter(f => f.status === 'available');
        if (template.filterFighter) {
          candidates = candidates.filter(template.filterFighter);
        }
        if (candidates.length === 0) continue;
        selectedFighter = candidates[Math.floor(Math.random() * candidates.length)];
      }

      return {
        ...template,
        selectedFighter,
        text: template.getText(selectedFighter)
      };
    }

    return null;
  },

  /**
   * Apply the effects of a chosen event option
   */
  applyChoice(state, event, choiceIndex) {
    const choice = event.choices[choiceIndex];
    const effects = choice.effects;
    const fighter = event.selectedFighter;
    const applied = [];

    // Budget change
    if (effects.budget) {
      if (effects.budget > 0) {
        FinanceEngine.addTransaction(state, 'income', `Événement: ${event.title}`, effects.budget);
        applied.push(`+${FinanceEngine.formatMoney(effects.budget)}`);
      } else {
        FinanceEngine.addTransaction(state, 'expense', `Événement: ${event.title}`, Math.abs(effects.budget));
        applied.push(`${FinanceEngine.formatMoney(effects.budget)}`);
      }
    }

    // Morale change (individual fighter)
    if (effects.morale && fighter) {
      fighter.morale = Math.max(10, Math.min(100, fighter.morale + effects.morale));
      applied.push(`Moral ${effects.morale > 0 ? '+' : ''}${effects.morale} (${fighter.fullName})`);
    }

    // Global morale change
    if (effects.globalMorale) {
      state.fighters.forEach(f => {
        f.morale = Math.max(10, Math.min(100, f.morale + effects.globalMorale));
      });
      applied.push(`Moral ${effects.globalMorale > 0 ? '+' : ''}${effects.globalMorale} (toute l'équipe)`);
    }

    // Stat boost (individual fighter)
    if (effects.statBoost && fighter) {
      const statKeys = Object.keys(fighter.stats);
      statKeys.forEach(stat => {
        fighter.stats[stat] = Math.min(fighter.potential[stat], fighter.stats[stat] + effects.statBoost);
      });
      applied.push(`+${effects.statBoost} stats (${fighter.fullName})`);
    }

    // Global stat boost (temporary via state flag)
    if (effects.globalStatBoost) {
      state._tempGlobalBoost = {
        value: effects.globalStatBoost,
        weeksLeft: effects.boostWeeks || 1
      };
      applied.push(`Boost entraînement +${effects.globalStatBoost} pour ${effects.boostWeeks || 1} semaines`);
    }

    // Global stat penalty
    if (effects.globalStatPenalty) {
      state._tempGlobalPenalty = {
        value: effects.globalStatPenalty,
        weeksLeft: 1
      };
      applied.push(`Pénalité entraînement -${effects.globalStatPenalty} cette semaine`);
    }

    // Skip training for this fighter
    if (effects.skipTraining && fighter) {
      fighter._skipTraining = true;
      applied.push(`${fighter.fullName} se repose cette semaine`);
    }

    // Injury risk roll
    if (effects.injuryRisk && fighter) {
      if (Math.random() < effects.injuryRisk) {
        const severity = effects.injuryRisk >= 0.3 ? 'moderate' : 'minor';
        const injuryInfo = INJURY_DURATIONS[severity];
        fighter.status = 'injured';
        fighter.injuryType = injuryInfo.label;
        fighter.injuryWeeksLeft = injuryInfo.min + Math.floor(Math.random() * (injuryInfo.max - injuryInfo.min + 1));
        applied.push(`🤕 ${fighter.fullName} s'est blessé ! (${fighter.injuryWeeksLeft} semaines)`);
      } else {
        applied.push(`✅ Pas de blessure, ouf !`);
      }
    }

    // Force minor injury
    if (effects.forceInjury && fighter) {
      const injuryInfo = INJURY_DURATIONS[effects.forceInjury];
      fighter.status = 'injured';
      fighter.injuryType = injuryInfo.label;
      fighter.injuryWeeksLeft = injuryInfo.min;
      applied.push(`🏥 ${fighter.fullName} au repos (${fighter.injuryWeeksLeft} semaine)`);
    }

    // Gamble (sponsor negotiation etc.)
    if (effects.gamble) {
      const won = Math.random() < effects.gamble.chance;
      if (won) {
        FinanceEngine.addTransaction(state, 'income', `Événement: ${event.title} (négociation réussie)`, effects.gamble.win);
        applied.push(`🎉 Négociation réussie ! +${FinanceEngine.formatMoney(effects.gamble.win)}`);
        choice._dynamicToast = `🎉 Négociation réussie ! +${FinanceEngine.formatMoney(effects.gamble.win)}`;
      } else {
        applied.push(`😞 La négociation a échoué. Le deal est perdu.`);
        choice._dynamicToast = `😞 La négociation a échoué. Le sponsor est parti.`;
      }
    }

    return {
      applied,
      toast: choice._dynamicToast || choice.toast
    };
  }
};
