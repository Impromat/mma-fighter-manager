/* ============================================
   MMA Fighter Manager — League Engine
   ============================================ */

const LeagueEngine = {
  /**
   * Find a suitable opponent for a fighter
   */
  findOpponent(fighter, state) {
    const wcId = fighter.weightClass;
    const rankings = state.rankings[wcId];
    if (!rankings) return null;

    const playerRanking = this.getFighterRanking(fighter.id, state);

    // Get AI fighters in the same weight class
    const candidates = state.aiFighters.filter(ai =>
      ai.weightClass === wcId &&
      ai.status === 'available' &&
      !state.schedule.some(s => !s.completed && s.opponentId === ai.id)
    );

    if (candidates.length === 0) return null;

    if (playerRanking === null) {
      // Unranked: fight unranked or low-ranked opponents
      const unrankedOrLow = candidates.filter(c => {
        const r = this.getFighterRanking(c.id, state);
        return r === null || r >= 12;
      });
      if (unrankedOrLow.length > 0) {
        return unrankedOrLow[Math.floor(Math.random() * unrankedOrLow.length)];
      }
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Ranked: fight within ±3 positions
    const suitable = candidates.filter(c => {
      const r = this.getFighterRanking(c.id, state);
      if (r === null) return playerRanking >= 12;
      return Math.abs(r - playerRanking) <= 4;
    });

    if (suitable.length > 0) {
      return suitable[Math.floor(Math.random() * suitable.length)];
    }

    // Fallback: anyone in the division
    return candidates[Math.floor(Math.random() * candidates.length)];
  },

  /**
   * Get fighter's ranking (null if unranked)
   */
  getFighterRanking(fighterId, state) {
    for (const wcId in state.rankings) {
      const rankings = state.rankings[wcId];
      if (rankings.champion === fighterId) return 0; // Champion
      const idx = rankings.ranked.indexOf(fighterId);
      if (idx >= 0) return idx + 1;
    }
    return null;
  },

  /**
   * Check if fighter is eligible for a title shot
   */
  isTitleShot(fighter, state) {
    const ranking = this.getFighterRanking(fighter.id, state);
    return ranking !== null && ranking >= 1 && ranking <= 3;
  },

  /**
   * Update rankings after a fight
   */
  updateRankingsAfterFight(playerFighter, opponent, playerWon, state) {
    const wcId = playerFighter.weightClass;
    const rankings = state.rankings[wcId];
    if (!rankings) return;

    const playerRank = this.getFighterRanking(playerFighter.id, state);
    const opponentRank = this.getFighterRanking(opponent.id, state);

    if (playerWon) {
      if (playerRank === null && opponentRank === null) {
        // Both unranked: winner enters bottom of rankings
        rankings.ranked.push(playerFighter.id);
        if (rankings.ranked.length > 15) {
          // Remove last ranked if too many
          const removed = rankings.ranked.pop();
          // Actually push player in at 15, so pop the one before
          rankings.ranked.splice(rankings.ranked.length - 1, 0, playerFighter.id);
          rankings.ranked.pop(); // Remove the duplicate
        }
      } else if (playerRank === null && opponentRank !== null) {
        // Player unranked, beat a ranked fighter: take their spot
        const idx = rankings.ranked.indexOf(opponent.id);
        rankings.ranked.splice(idx, 0, playerFighter.id);
        // Push opponent down, trim to 15
        if (rankings.ranked.length > 15) {
          rankings.ranked = rankings.ranked.slice(0, 15);
        }
      } else if (playerRank !== null && opponentRank !== null) {
        // Both ranked: winner moves up
        const playerIdx = rankings.ranked.indexOf(playerFighter.id);
        const opponentIdx = rankings.ranked.indexOf(opponent.id);

        if (opponentIdx < playerIdx) {
          // Beat someone ranked higher: take their position
          rankings.ranked.splice(playerIdx, 1);
          rankings.ranked.splice(opponentIdx, 0, playerFighter.id);
        }
        // If beat someone ranked lower: no change (already higher)
      } else if (playerRank !== null && opponentRank === null) {
        // Beat unranked: small bump if not already high
        const playerIdx = rankings.ranked.indexOf(playerFighter.id);
        if (playerIdx > 0) {
          // Move up 1 spot
          rankings.ranked.splice(playerIdx, 1);
          rankings.ranked.splice(playerIdx - 1, 0, playerFighter.id);
        }
      }
    } else {
      // Player lost
      if (playerRank !== null) {
        const playerIdx = rankings.ranked.indexOf(playerFighter.id);
        // Drop 2-3 spots
        const drop = 2 + Math.floor(Math.random() * 2);
        rankings.ranked.splice(playerIdx, 1);
        const newIdx = Math.min(rankings.ranked.length, playerIdx + drop);
        rankings.ranked.splice(newIdx, 0, playerFighter.id);

        // Trim to 15
        if (rankings.ranked.length > 15) {
          // Check if player dropped out
          if (rankings.ranked.indexOf(playerFighter.id) >= 15) {
            rankings.ranked = rankings.ranked.slice(0, 15);
          }
        }
      }
    }
  },

  /**
   * Award title to a fighter
   */
  awardTitle(fighter, state) {
    const wcId = fighter.weightClass;
    const rankings = state.rankings[wcId];
    if (!rankings) return;

    const oldChampion = rankings.champion;
    rankings.champion = fighter.id;

    // Remove fighter from ranked list
    const idx = rankings.ranked.indexOf(fighter.id);
    if (idx >= 0) {
      rankings.ranked.splice(idx, 1);
    }

    // Old champion becomes #1 ranked
    if (oldChampion) {
      rankings.ranked.unshift(oldChampion);
      // Update old champion's ranking
      const oldChamp = state.aiFighters.find(f => f.id === oldChampion);
      if (oldChamp) oldChamp.ranking = 1;
    }

    // Trim rankings
    if (rankings.ranked.length > 15) {
      rankings.ranked = rankings.ranked.slice(0, 15);
    }
  },

  /**
   * Simulate AI vs AI fights (background)
   */
  simulateAIFights(state) {
    // Simulate 2-4 AI fights per event for ranking movement
    const numFights = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numFights; i++) {
      const wcIds = Object.keys(state.rankings);
      const wcId = wcIds[Math.floor(Math.random() * wcIds.length)];
      const rankings = state.rankings[wcId];

      if (rankings.ranked.length < 2) continue;

      // Pick two adjacent ranked fighters
      const idx1 = Math.floor(Math.random() * (rankings.ranked.length - 1));
      const idx2 = idx1 + 1;

      const fighter1Id = rankings.ranked[idx1];
      const fighter2Id = rankings.ranked[idx2];

      const f1 = state.aiFighters.find(f => f.id === fighter1Id);
      const f2 = state.aiFighters.find(f => f.id === fighter2Id);

      if (!f1 || !f2) continue;

      // Simple outcome based on overall rating
      const f1Rating = TrainingEngine.calculateOverall(f1);
      const f2Rating = TrainingEngine.calculateOverall(f2);
      const f1Chance = 0.5 + (f1Rating - f2Rating) / 100;
      const f1Wins = Math.random() < f1Chance;

      if (f1Wins) {
        f1.wins++;
        f2.losses++;
      } else {
        f2.wins++;
        f1.losses++;
        // Lower ranked fighter beat higher ranked: swap
        rankings.ranked[idx1] = fighter2Id;
        rankings.ranked[idx2] = fighter1Id;
      }
    }
  },

  /**
   * Get full rankings for a weight class
   */
  getFullRankings(wcId, state) {
    const rankings = state.rankings[wcId];
    if (!rankings) return null;

    const findFighter = (id) => {
      return state.fighters.find(f => f.id === id) || state.aiFighters.find(f => f.id === id);
    };

    const champion = rankings.champion ? findFighter(rankings.champion) : null;
    const ranked = rankings.ranked.map((id, idx) => {
      const fighter = findFighter(id);
      return fighter ? { ...fighter, displayRank: idx + 1 } : null;
    }).filter(Boolean);

    return { champion, ranked };
  },

  // ==============================
  // Fight Offer System
  // ==============================

  /**
   * Generate fight offers for available fighters
   */
  generateOffers(state) {
    const newOffers = [];

    state.fighters.forEach(fighter => {
      // Skip if injured, already has a pending offer, or already has a scheduled fight
      if (fighter.status !== 'available') return;
      if (this.isFighterOnCooldown(fighter, state)) return;
      if (state.fightOffers.some(o => o.fighterId === fighter.id && o.status === 'pending')) return;
      if (state.schedule.some(s => !s.completed && s.playerFighterId === fighter.id)) return;
      if ((state.outgoingChallenges || []).some(c => c.status === 'pending' && c.fighterId === fighter.id)) return;

      // Find opponent adjusted by decline history
      const opponent = this._findAdjustedOpponent(fighter, state);
      if (!opponent) return;

      const isTitle = this.isTitleShot(fighter, state);
      const prepWeeks = isTitle ? OFFER_CONFIG.prepWeeksTitle : OFFER_CONFIG.prepWeeksNormal;
      const fightWeek = Math.max(
        state.week + OFFER_CONFIG.decisionWindow + prepWeeks,
        (fighter.lastFightWeek || 0) + OFFER_CONFIG.fightCooldown + prepWeeks
      );
      const expiresWeek = state.week + OFFER_CONFIG.decisionWindow;

      // Calculate purse adjusted by decline history
      const basePurse = FinanceEngine.calculatePurse(fighter, state, isTitle);
      const purse = this._adjustPurse(basePurse, fighter.id, state);

      const opponentRank = this.getFighterRanking(opponent.id, state);

      // Determine reason for context
      let reason = 'ranking';
      if (isTitle) reason = 'title';
      else if (fighter.wins + fighter.losses === 0) reason = 'debut';
      else if (fightWeek - state.week <= OFFER_CONFIG.prepWeeksShort + 1) reason = 'shortNotice';

      newOffers.push({
        id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        fighterId: fighter.id,
        opponentId: opponent.id,
        fightWeek,
        prepWeeks,
        eventName: `AFC Fight Night ${Math.ceil(fightWeek / EVENT_INTERVAL)}`,
        purse,
        isTitle,
        opponentRank,
        expiresWeek,
        status: 'pending',
        declineReason: null,
        createdWeek: state.week,
        reason,
      });
    });

    state.fightOffers.push(...newOffers);
    return newOffers;
  },

  /**
   * Find an opponent adjusted by previous decline reasons
   */
  _findAdjustedOpponent(fighter, state) {
    const history = state.declineHistory[fighter.id];
    const lastReason = history?.lastReason;

    const wcId = fighter.weightClass;
    const rankings = state.rankings[wcId];
    if (!rankings) return null;

    const playerRanking = this.getFighterRanking(fighter.id, state);

    // Get AI fighters in the same weight class
    const candidates = state.aiFighters.filter(ai =>
      ai.weightClass === wcId &&
      ai.status === 'available' &&
      !state.schedule.some(s => !s.completed && s.opponentId === ai.id) &&
      !state.fightOffers.some(o => o.status === 'pending' && o.opponentId === ai.id)
    );

    if (candidates.length === 0) return null;

    // Adjust ranking range based on decline history
    let rankOffset = 0;
    if (lastReason === 'tooWeak') {
      rankOffset = -(2 + Math.floor(Math.random() * 2)); // harder: rank -2 to -3
    } else if (lastReason === 'tooStrong') {
      rankOffset = 2 + Math.floor(Math.random() * 2); // easier: rank +2 to +3
    }

    if (playerRanking === null) {
      // Unranked: fight unranked or low-ranked
      const targetMaxRank = lastReason === 'tooWeak' ? 10 : 15;
      const suitable = candidates.filter(c => {
        const r = this.getFighterRanking(c.id, state);
        return r === null || r >= targetMaxRank;
      });
      if (suitable.length > 0) return suitable[Math.floor(Math.random() * suitable.length)];
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Ranked: find within adjusted range
    const targetRank = playerRanking + rankOffset;
    const suitable = candidates.filter(c => {
      const r = this.getFighterRanking(c.id, state);
      if (r === null) return playerRanking >= 10;
      return Math.abs(r - targetRank) <= 3;
    });

    if (suitable.length > 0) return suitable[Math.floor(Math.random() * suitable.length)];

    // Fallback
    const fallback = candidates.filter(c => {
      const r = this.getFighterRanking(c.id, state);
      if (r === null) return true;
      return Math.abs(r - playerRanking) <= 5;
    });
    if (fallback.length > 0) return fallback[Math.floor(Math.random() * fallback.length)];
    return candidates[Math.floor(Math.random() * candidates.length)];
  },

  /**
   * Adjust purse based on decline history
   */
  _adjustPurse(basePurse, fighterId, state) {
    const history = state.declineHistory[fighterId];
    if (!history) return { ...basePurse };

    let showMult = 1;
    let winMult = 1;

    if (history.lastReason === 'lowPurse') {
      showMult += OFFER_CONFIG.purseBoostOnDecline * (history.lowPurseCount || 1);
      winMult += OFFER_CONFIG.purseBoostOnDecline * (history.lowPurseCount || 1);
    } else if (history.lastReason === 'tooStrong') {
      showMult -= OFFER_CONFIG.pursePenaltyOnWeak;
      winMult -= OFFER_CONFIG.pursePenaltyOnWeak;
    }

    return {
      show: Math.round(basePurse.show * showMult),
      win: Math.round(basePurse.win * winMult),
    };
  },

  /**
   * Apply decline effects on a fighter
   */
  applyDeclineEffects(fighter, reasonId, state) {
    const reason = DECLINE_REASONS[reasonId];
    if (!reason) return;

    // Init history
    if (!state.declineHistory[fighter.id]) {
      state.declineHistory[fighter.id] = { consecutive: 0, lastReason: null, lowPurseCount: 0, notReadyCount: 0 };
    }
    const history = state.declineHistory[fighter.id];

    // Track consecutive declines
    history.consecutive++;
    history.lastReason = reasonId;

    // Apply morale
    let moraleDelta = reason.moraleEffect;

    // Special: notReady is neutral first time, -5 after
    if (reasonId === 'notReady') {
      history.notReadyCount++;
      if (history.notReadyCount > 1) {
        moraleDelta = -5;
      }
    }

    if (reasonId === 'lowPurse') {
      history.lowPurseCount++;
    }

    fighter.morale = Math.max(10, Math.min(100, fighter.morale + moraleDelta));

    // Rank penalty for 3+ consecutive notInterested
    if (reasonId === 'notInterested' && history.consecutive >= OFFER_CONFIG.maxConsecutiveDeclines) {
      // Drop 1-2 ranking spots
      const ranking = this.getFighterRanking(fighter.id, state);
      if (ranking !== null && ranking > 0) {
        const wcId = fighter.weightClass;
        const rankings = state.rankings[wcId];
        const idx = rankings.ranked.indexOf(fighter.id);
        if (idx >= 0) {
          const drop = 1 + Math.floor(Math.random() * 2);
          rankings.ranked.splice(idx, 1);
          const newIdx = Math.min(rankings.ranked.length, idx + drop);
          rankings.ranked.splice(newIdx, 0, fighter.id);
        }
      }
      history.consecutive = 0; // Reset after penalty
    }

    // Force a fight after 2 lowPurse declines
    if (reasonId === 'lowPurse' && history.lowPurseCount >= 2) {
      history.forceFight = true;
      history.lowPurseCount = 0;
    }
  },

  /**
   * Clean up expired offers
   */
  cleanExpiredOffers(state) {
    state.fightOffers.forEach(offer => {
      if (offer.status === 'pending' && state.week > offer.expiresWeek) {
        offer.status = 'expired';
        // Penalty for ignoring: morale -5
        const fighter = state.fighters.find(f => f.id === offer.fighterId);
        if (fighter) {
          fighter.morale = Math.max(10, fighter.morale - 5);
        }
      }
    });
  },

  /**
   * Reset decline streak when a fight is accepted
   */
  resetDeclineHistory(fighterId, state) {
    if (state.declineHistory[fighterId]) {
      state.declineHistory[fighterId].consecutive = 0;
      state.declineHistory[fighterId].lastReason = null;
      state.declineHistory[fighterId].lowPurseCount = 0;
      state.declineHistory[fighterId].notReadyCount = 0;
      state.declineHistory[fighterId].forceFight = false;
    }
  },

  // ==============================
  // Free Agent Market
  // ==============================

  /**
   * Calculate the gym's attractiveness score (0-15)
   */
  calculateGymAttractiveness(state) {
    let score = 0;

    // Budget: +1 per 10k, max 4
    score += Math.min(4, Math.floor(Math.max(0, state.budget) / 10000));

    // Champions: +3 per title held
    const champions = state.fighters.filter(f => {
      const wc = f.weightClass;
      const rankings = state.rankings[wc];
      return rankings && rankings.champion === f.id;
    });
    score += champions.length * 3;

    // Recent wins (last 10 fights): +1 per win, max 5
    const recentFights = (state.fightHistory || []).slice(-10);
    const recentWins = recentFights.filter(fh => fh.winner === 'fighter1').length;
    score += Math.min(5, recentWins);

    // Average morale: +1 if above 70, +2 if above 80
    if (state.fighters.length > 0) {
      const avgMorale = state.fighters.reduce((sum, f) => sum + f.morale, 0) / state.fighters.length;
      if (avgMorale >= 80) score += 2;
      else if (avgMorale >= 70) score += 1;
    }

    return Math.min(15, score);
  },

  /**
   * Calculate signing bonus for a fighter based on OVR
   */
  calculateSigningBonus(fighter) {
    const ovr = TrainingEngine.calculateOverall(fighter);
    const tier = MARKET_CONFIG.signingBonusTiers.find(t => ovr >= t.minOvr && ovr <= t.maxOvr)
      || MARKET_CONFIG.signingBonusTiers[0];
    return tier.minBonus + Math.floor(Math.random() * (tier.maxBonus - tier.minBonus + 1));
  },

  /**
   * Calculate severance pay for cutting a fighter
   */
  calculateSeverancePay(fighter, state) {
    const weeklySalary = FinanceEngine.getFighterSalary(fighter, state);
    return Math.round(weeklySalary * MARKET_CONFIG.severancePay);
  },

  /**
   * Generate a pool of free agents based on gym attractiveness
   */
  generateFreeAgents(state) {
    const score = this.calculateGymAttractiveness(state);

    // Find the stat range based on score
    let statRange = [30, 50];
    for (const threshold of MARKET_CONFIG.attractivenessThresholds) {
      if (score >= threshold.minScore) {
        statRange = threshold.statRange;
      }
    }

    // Collect existing names to avoid duplicates
    const existingNames = [
      ...state.fighters.map(f => f.fullName),
      ...state.aiFighters.map(f => f.fullName),
      ...(state.freeAgents || []).map(f => f.fullName)
    ];

    const agents = [];
    const activeWCs = WEIGHT_CLASSES.filter(wc => ACTIVE_WEIGHT_CLASSES.includes(wc.id));

    for (let i = 0; i < MARKET_CONFIG.poolSize; i++) {
      // Vary stat range a bit per agent for diversity
      const variance = Math.floor(Math.random() * 10) - 5;
      const agentStatRange = [
        Math.max(20, statRange[0] + variance),
        Math.min(90, statRange[1] + variance)
      ];

      const wc = activeWCs[Math.floor(Math.random() * activeWCs.length)];
      const fighter = FighterGenerator.generateAIFighter(wc.id, agentStatRange, existingNames);

      // Override to make them "free agents" — fresh record, young-ish
      fighter.id = FighterGenerator._generateId('free');
      fighter.isPlayer = false;
      fighter.wins = Math.floor(Math.random() * 8);
      fighter.losses = Math.floor(Math.random() * 4);

      // Calculate and attach signing bonus
      fighter.signingBonus = this.calculateSigningBonus(fighter);
      fighter.weeklySalary = SALARY_BY_RANK.unranked; // Free agents are unranked

      existingNames.push(fighter.fullName);
      agents.push(fighter);
    }

    state.freeAgents = agents;
    state.lastMarketRefresh = state.week;
    return agents;
  },

  /**
   * Check if a fighter is on cooldown (too soon since last fight)
   */
  isFighterOnCooldown(fighter, state) {
    if (fighter.status === 'injured') return true;
    const lastFight = fighter.lastFightWeek || 0;
    return (state.week - lastFight) < OFFER_CONFIG.fightCooldown;
  },

  /**
   * Get earliest week a fighter can fight
   */
  getEarliestFightWeek(fighter, state) {
    const lastFight = fighter.lastFightWeek || 0;
    const cooldownEnd = lastFight + OFFER_CONFIG.fightCooldown;
    // Also account for prep time
    const earliest = Math.max(state.week + OFFER_CONFIG.prepWeeksNormal + 1, cooldownEnd + OFFER_CONFIG.prepWeeksNormal);
    return earliest;
  },

  /**
   * Check if a fighter can be proposed for a fight
   */
  canProposeFight(fighter, state) {
    if (fighter.status !== 'available') return { ok: false, reason: 'injured' };
    if (this.isFighterOnCooldown(fighter, state)) {
      const earliest = this.getEarliestFightWeek(fighter, state);
      return { ok: false, reason: 'cooldown', earliestWeek: earliest };
    }
    if (state.schedule.some(s => !s.completed && s.playerFighterId === fighter.id)) {
      return { ok: false, reason: 'booked' };
    }
    if ((state.outgoingChallenges || []).some(c => c.status === 'pending' && c.fighterId === fighter.id)) {
      return { ok: false, reason: 'pendingChallenge' };
    }
    return { ok: true };
  },

  /**
   * Calculate acceptance chance for a challenge
   */
  getAcceptanceChance(fighter, opponent, state) {
    const playerRank = this.getFighterRanking(fighter.id, state);
    const opponentRank = this.getFighterRanking(opponent.id, state);

    // Both unranked
    if (playerRank === null && opponentRank === null) return 85;

    // Player unranked challenging ranked
    if (playerRank === null && opponentRank !== null) {
      if (opponentRank <= 5) return 15; // Top 5 won't fight unranked
      if (opponentRank <= 10) return 40;
      return 70;
    }

    // Player ranked challenging unranked
    if (playerRank !== null && opponentRank === null) return 80;

    // Both ranked — based on gap
    const gap = Math.abs(playerRank - opponentRank);
    if (gap <= 2) return 90;
    if (gap <= 4) return 75;
    if (gap <= 6) return 50;
    if (gap <= 8) return 30;
    return 15;
  },

  /**
   * Create an outgoing challenge
   */
  createChallenge(fighterId, opponentId, state) {
    if (!state.outgoingChallenges) state.outgoingChallenges = [];

    const fighter = state.fighters.find(f => f.id === fighterId);
    const opponent = state.aiFighters.find(f => f.id === opponentId);
    if (!fighter || !opponent) return null;

    const isTitle = this.isTitleShot(fighter, state);
    const prepWeeks = isTitle ? OFFER_CONFIG.prepWeeksTitle : OFFER_CONFIG.prepWeeksNormal;
    const fightWeek = Math.max(
      state.week + prepWeeks + 1,
      (fighter.lastFightWeek || 0) + OFFER_CONFIG.fightCooldown + prepWeeks
    );

    const purse = FinanceEngine.calculatePurse(fighter, state, isTitle);
    const acceptChance = this.getAcceptanceChance(fighter, opponent, state);

    const challenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      fighterId: fighter.id,
      fighterName: fighter.fullName,
      opponentId: opponent.id,
      opponentName: opponent.fullName,
      fightWeek,
      purse,
      isTitle,
      acceptChance,
      status: 'pending', // pending → accepted / refused
      createdWeek: state.week
    };

    state.outgoingChallenges.push(challenge);
    GameState.save();
    return challenge;
  },

  /**
   * Process outgoing challenges (called in advanceWeek)
   * Returns array of results for weekly summary
   */
  processOutgoingChallenges(state) {
    if (!state.outgoingChallenges) return [];

    const results = [];
    const pending = state.outgoingChallenges.filter(c => c.status === 'pending');

    pending.forEach(challenge => {
      const fighter = state.fighters.find(f => f.id === challenge.fighterId);
      const opponent = state.aiFighters.find(f => f.id === challenge.opponentId);

      if (!fighter || !opponent) {
        challenge.status = 'refused';
        results.push({ ...challenge, reason: 'unavailable' });
        return;
      }

      // Roll for acceptance
      const roll = Math.random() * 100;
      if (roll < challenge.acceptChance) {
        // Accepted — schedule the fight
        challenge.status = 'accepted';

        state.schedule.push({
          id: `fight_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          week: challenge.fightWeek,
          eventName: `AFC Fight Night ${Math.ceil(challenge.fightWeek / EVENT_INTERVAL)}`,
          playerFighterId: fighter.id,
          opponentId: opponent.id,
          fightCamp: null,
          isTitle: challenge.isTitle,
          completed: false
        });

        results.push({ ...challenge, accepted: true });
      } else {
        // Refused
        challenge.status = 'refused';
        const playerRank = LeagueEngine.getFighterRanking(fighter.id, state);
        const opponentRank = LeagueEngine.getFighterRanking(opponent.id, state);
        const gap = (playerRank === null || opponentRank === null) ? 99 : Math.abs(playerRank - opponentRank);
        const reason = gap > 5 ? 'rank' : 'busy';
        results.push({ ...challenge, accepted: false, reason });
      }
    });

    // Clean up old challenges (keep last 10)
    state.outgoingChallenges = state.outgoingChallenges.slice(-10);
    return results;
  }
};
