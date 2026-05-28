/* ============================================
   MMA Fighter Manager — Game State
   ============================================ */

const GameState = {
  _state: null,
  _listeners: [],
  STORAGE_KEY: 'mma_fighter_manager_save',

  /**
   * Get the current state
   */
  get() {
    return this._state;
  },

  /**
   * Initialize a new game
   */
  newGame(gymName, selectedFighters) {
    this._state = {
      gymName: gymName || 'Iron Forge MMA',
      week: 1,
      budget: 50000,
      budgetHistory: [50000],
      negativeBudgetWeeks: 0,
      gameOver: false,
      fighters: [],
      aiFighters: [],
      rankings: {},
      schedule: [],
      fightHistory: [],
      transactions: [],
      fightOffers: [],
      declineHistory: {},
      freeAgents: [],
      lastMarketRefresh: 0,
      nextEventWeek: EVENT_INTERVAL,
      lastOfferWeek: 0,
      reputation: REPUTATION_CONFIG.initial,
      rivalries: [],
      createdAt: Date.now()
    };

    // Use selected fighters or generate random ones
    this._state.fighters = selectedFighters || FighterGenerator.generatePlayerRoster(3);

    // Generate AI fighters and initialize rankings
    const aiData = AIFighters.generateAll(this._state.fighters);
    this._state.aiFighters = aiData.fighters;
    this._state.rankings = aiData.rankings;

    // Generate initial fight offers instead of auto-scheduling
    LeagueEngine.generateOffers(this._state);

    // Generate initial free agent pool
    LeagueEngine.generateFreeAgents(this._state);

    // Initialize first season
    SeasonEngine.initSeason(this._state);

    this.save();
    this._notify('newGame');
    return this._state;
  },

  /**
   * Schedule the next event
   */
  _scheduleNextEvent() {
    const state = this._state;
    const eventWeek = state.nextEventWeek;

    // Match player fighters for event
    const availableFighters = state.fighters.filter(f =>
      f.status === 'available' && !state.schedule.some(s => s.week === eventWeek && s.playerFighterId === f.id)
    );

    if (availableFighters.length === 0) {
      state.nextEventWeek = eventWeek + EVENT_INTERVAL;
      return;
    }

    // Book 1-3 fighters for the event
    const numFights = Math.min(availableFighters.length, Math.floor(Math.random() * 3) + 1);
    const shuffled = [...availableFighters].sort(() => Math.random() - 0.5);
    let bookedCount = 0;

    for (let i = 0; i < shuffled.length && bookedCount < numFights; i++) {
      const fighter = shuffled[i];
      const opponent = LeagueEngine.findOpponent(fighter, state);

      if (opponent) {
        state.schedule.push({
          id: `fight_${Date.now()}_${bookedCount}`,
          week: eventWeek,
          eventName: `AFC Fight Night ${Math.ceil(eventWeek / EVENT_INTERVAL)}`,
          playerFighterId: fighter.id,
          opponentId: opponent.id,
          fightCamp: null,
          isTitle: LeagueEngine.isTitleShot(fighter, state),
          completed: false
        });
        bookedCount++;
      }
    }

    state.nextEventWeek = eventWeek + EVENT_INTERVAL;
  },

  /**
   * Advance one week — returns detailed report
   * @param {Array|null} preSimulatedFights - Fight results from interactive simulation
   */
  advanceWeek(preSimulatedFights) {
    const state = this._state;
    if (state.gameOver) return { fightResults: [] };

    const report = {
      week: state.week,
      budgetBefore: state.budget,
      fightResults: [],
      trainingReport: [],
      recoveries: [],
      injuries: [],
      salaries: 0
    };

    // Snapshot stats before training
    const statsBefore = {};
    const moraleBefore = {};
    state.fighters.forEach(f => {
      statsBefore[f.id] = { ...f.stats };
      moraleBefore[f.id] = f.morale;
    });

    // 1. Apply training
    state.fighters.forEach(fighter => {
      if (fighter.status === 'available' && !fighter._skipTraining) {
        const origStats = { ...fighter.stats };
        TrainingEngine.applyWeeklyTraining(fighter);

        if (state._tempGlobalBoost && state._tempGlobalBoost.weeksLeft > 0) {
          Object.keys(fighter.stats).forEach(stat => {
            fighter.stats[stat] = Math.min(fighter.potential[stat], fighter.stats[stat] + state._tempGlobalBoost.value);
          });
        }
        if (state._tempGlobalPenalty && state._tempGlobalPenalty.weeksLeft > 0) {
          Object.keys(fighter.stats).forEach(stat => {
            fighter.stats[stat] = Math.max(10, fighter.stats[stat] - state._tempGlobalPenalty.value);
          });
        }
      }
      if (fighter._skipTraining) {
        delete fighter._skipTraining;
      }
    });

    // Decrement temporary boost/penalty
    if (state._tempGlobalBoost) {
      state._tempGlobalBoost.weeksLeft--;
      if (state._tempGlobalBoost.weeksLeft <= 0) delete state._tempGlobalBoost;
    }
    if (state._tempGlobalPenalty) {
      state._tempGlobalPenalty.weeksLeft--;
      if (state._tempGlobalPenalty.weeksLeft <= 0) delete state._tempGlobalPenalty;
    }

    // 2. Handle injuries recovery
    state.fighters.forEach(fighter => {
      if (fighter.status === 'injured') {
        fighter.injuryWeeksLeft--;
        if (fighter.injuryWeeksLeft <= 0) {
          fighter.status = 'available';
          fighter.injuryWeeksLeft = 0;
          fighter.injuryType = null;
          report.recoveries.push(fighter.fullName);
          this._notify('recovery', { fighter });
        }
      }
    });

    // 3. Check for fights this week
    const thisWeekFights = state.schedule.filter(s => s.week === state.week && !s.completed);

    if (preSimulatedFights && preSimulatedFights.length > 0) {
      // Use pre-simulated results from interactive fight UI
      preSimulatedFights.forEach(result => {
        const scheduledFight = state.schedule.find(s => s.id === result.scheduleId);
        const playerFighter = state.fighters.find(f => f.id === result.fighter1.id);
        const opponent = state.aiFighters.find(f => f.id === result.fighter2.id);

        if (playerFighter && opponent && scheduledFight) {
          this._applyFightResult(result, playerFighter, opponent, scheduledFight);
          report.fightResults.push(result);
          scheduledFight.completed = true;
        }
      });
    } else {
      // Auto-simulate fights (AI vs player, no corner instructions)
      thisWeekFights.forEach(scheduledFight => {
        const playerFighter = state.fighters.find(f => f.id === scheduledFight.playerFighterId);
        const opponent = state.aiFighters.find(f => f.id === scheduledFight.opponentId);

        if (playerFighter && opponent && playerFighter.status === 'available') {
          let campBonuses = null;
          if (scheduledFight.fightCamp) {
            campBonuses = FIGHT_CAMP_TYPES[scheduledFight.fightCamp].bonuses;
          }

          const result = CombatEngine.simulate(playerFighter, opponent, scheduledFight.isTitle, campBonuses);
          result.eventName = scheduledFight.eventName;
          result.week = state.week;
          result.scheduleId = scheduledFight.id;

          this._applyFightResult(result, playerFighter, opponent, scheduledFight);
          report.fightResults.push(result);
          scheduledFight.completed = true;
        }
      });
    }

    // 4. Simulate AI vs AI fights on event weeks
    if (thisWeekFights.length > 0) {
      LeagueEngine.simulateAIFights(state);
    }

    // 5. Collect fighter training fees + pay gym costs
    const weeklyFinances = FinanceEngine.calculateWeeklyFinances(state);
    if (weeklyFinances.fees > 0) {
      FinanceEngine.addTransaction(state, 'income', t('finance.trainingFees'), weeklyFinances.fees);
    }
    FinanceEngine.addTransaction(state, 'expense', t('finance.gymCosts'), weeklyFinances.costs);
    report.gymFees = weeklyFinances.fees;
    report.gymCosts = weeklyFinances.costs;

    // 6. Check for natural morale drift
    state.fighters.forEach(fighter => {
      if (fighter.status === 'available') {
        if (fighter.morale > 65) {
          fighter.morale = Math.max(65, fighter.morale - 1);
        } else if (fighter.morale < 65) {
          fighter.morale = Math.min(65, fighter.morale + 1);
        }
      }
    });

    // 7. Check bankruptcy
    if (state.budget < 0) {
      state.negativeBudgetWeeks++;
      if (state.negativeBudgetWeeks >= 4) {
        state.gameOver = true;
        this._notify('gameOver');
      }
    } else {
      state.negativeBudgetWeeks = 0;
    }

    // 8. Track budget history
    state.budgetHistory.push(state.budget);

    // 9. Generate fight offers if needed + clean expired
    report.expiredOffers = LeagueEngine.cleanExpiredOffers(state);
    if (state.week - (state.lastOfferWeek || 0) >= OFFER_CONFIG.offerFrequency) {
      const newOffers = LeagueEngine.generateOffers(state);
      if (newOffers.length > 0) {
        state.lastOfferWeek = state.week;
      }
    }

    // 10. Refresh free agent market
    if (state.week - (state.lastMarketRefresh || 0) >= MARKET_CONFIG.refreshInterval) {
      LeagueEngine.generateFreeAgents(state);
    }

    // 11. Build training report (stat deltas) + collect breakthroughs
    report.breakthroughs = [];
    state.fighters.forEach(fighter => {
      const before = statsBefore[fighter.id];
      if (!before) return;
      const deltas = {};
      let hasChange = false;
      STAT_NAMES.forEach(s => {
        const diff = Math.round(fighter.stats[s.id]) - Math.round(before[s.id]);
        if (diff !== 0) {
          deltas[s.id] = diff;
          hasChange = true;
        }
      });
      const moraleDelta = fighter.morale - moraleBefore[fighter.id];

      // Collect breakthroughs
      if (fighter._breakthroughs) {
        fighter._breakthroughs.forEach(bt => {
          report.breakthroughs.push({
            fighterName: fighter.fullName,
            fighterId: fighter.id,
            stat: bt.stat,
            gain: bt.gain
          });
        });
        delete fighter._breakthroughs;
      }

      report.trainingReport.push({
        id: fighter.id,
        name: fighter.fullName,
        initials: fighter.firstName[0] + fighter.lastName[0],
        avatarColor: fighter.avatarColor,
        status: fighter.status,
        training: fighter.currentTraining,
        deltas,
        hasChange,
        moraleDelta,
        morale: fighter.morale
      });
    });

    report.budgetAfter = state.budget;
    report.budgetDelta = state.budget - report.budgetBefore;

    // 12. Track lastFightWeek for cooldown
    report.fightResults.forEach(result => {
      const pf = state.fighters.find(f => f.id === result.fighter1?.id);
      if (pf) pf.lastFightWeek = state.week;
    });

    // 13. Season tracking
    report.fightResults.forEach(result => {
      SeasonEngine.recordFight(state, result);
    });
    report.completedObjectives = SeasonEngine.checkObjectives(state);
    state.seasonWeek = (state.seasonWeek || 1) + 1;

    // Check for end of season
    if (state.seasonWeek > SEASON_LENGTH) {
      // Generate end-of-season summary BEFORE resetting
      report.seasonEnd = SeasonEngine.getSeasonSummary(state);

      // Process aging at season end (1 season = 1 year)
      report.aging = AgingEngine.processAging(state);

      // Start new season (resets stats, generates new objectives)
      SeasonEngine.initSeason(state);
      report.newSeason = state.season;
    }

    // 14. Process outgoing challenges
    report.challengeResults = LeagueEngine.processOutgoingChallenges(state);

    // 15. Roll for random event
    report.event = EventEngine.rollEvent(state);

    // 16. (Aging now handled in season transition above)

    // 17. Reputation: inactivity penalty
    const lastFightWeekAll = state.fighters.reduce((max, f) => Math.max(max, f.lastFightWeek || 0), 0);
    if (state.week - lastFightWeekAll >= REPUTATION_CONFIG.inactivityThreshold) {
      state.reputation = Math.max(0, (state.reputation || 50) + REPUTATION_CONFIG.weeklyInactivityPenalty);
    }

    // 18. Rivalries: increase intensity each season
    if (state.week > 0 && state.week % AGING_CONFIG.weeksPerYear === 0) {
      (state.rivalries || []).forEach(r => {
        if (!r.resolved) r.intensity = (r.intensity || 1) + 1;
      });
    }

    // 20. Check milestones
    report.milestones = MilestoneEngine.check(state, report);

    // 21. Advance week counter
    state.week++;

    this.save();
    this._notify('weekAdvanced', { week: state.week, fightResults: report.fightResults });
    return report;
  },

  /**
   * Apply the result of a fight
   */
  _applyFightResult(result, playerFighter, opponent, scheduledFight) {
    const state = this._state;

    // Update records
    if (result.winner === 'fighter1') {
      playerFighter.wins++;
      opponent.losses++;

      // Revenue — gym takes its cut
      const purse = scheduledFight.purse || FinanceEngine.calculatePurse(playerFighter, state, scheduledFight.isTitle);
      const gymCut = FinanceEngine.getGymCut(purse, true, playerFighter);
      FinanceEngine.addTransaction(state, 'income', `${t('finance.commission')}: ${playerFighter.fullName} (${t('finance.win')})`, gymCut.total);

      // Track fighter earnings for season stats
      if (state.seasonStats) {
        state.seasonStats.moneyEarned = (state.seasonStats.moneyEarned || 0) + gymCut.total;
      }

      // PERFORMANCE BONUSES
      if (result.method === 'KO/TKO') {
        FinanceEngine.addTransaction(state, 'income', `🥊 Bonus KO: ${playerFighter.fullName}`, PERFORMANCE_BONUS.koFinish);
        result.performanceBonus = PERFORMANCE_BONUS.koFinish;
      } else if (result.method === 'Submission') {
        FinanceEngine.addTransaction(state, 'income', `🤼 Bonus Submission: ${playerFighter.fullName}`, PERFORMANCE_BONUS.submissionFinish);
        result.performanceBonus = PERFORMANCE_BONUS.submissionFinish;
      }

      // Win streak tracking + bonuses
      playerFighter.winStreak = (playerFighter.winStreak || 0) + 1;
      playerFighter.bestStreak = Math.max(playerFighter.bestStreak || 0, playerFighter.winStreak);
      playerFighter.lossStreak = 0; // Reset loss streak
      
      if (playerFighter.winStreak === 5) {
        FinanceEngine.addTransaction(state, 'income', `🔥 5 Win Streak: ${playerFighter.fullName}`, PERFORMANCE_BONUS.winStreak5);
        result.streakBonus = PERFORMANCE_BONUS.winStreak5;
      } else if (playerFighter.winStreak === 10) {
        FinanceEngine.addTransaction(state, 'income', `🔥🔥 10 Win Streak: ${playerFighter.fullName}`, PERFORMANCE_BONUS.winStreak10);
        result.streakBonus = PERFORMANCE_BONUS.winStreak10;
      }

      // Morale boost — fighter + global team boost
      playerFighter.morale = Math.min(100, playerFighter.morale + 15);
      state.fighters.forEach(f => {
        if (f.id !== playerFighter.id) {
          f.morale = Math.min(100, f.morale + 3);
        }
      });

      // Update rankings
      LeagueEngine.updateRankingsAfterFight(playerFighter, opponent, true, state);

      // Title check — celebration bonus
      if (scheduledFight.isTitle) {
        LeagueEngine.awardTitle(playerFighter, state);
        FinanceEngine.addTransaction(state, 'income', `🏆 TITLE WON: ${playerFighter.fullName}`, 20000);
        result.titleBonus = 20000;
        // Massive morale boost for everyone
        state.fighters.forEach(f => {
          f.morale = Math.min(100, f.morale + 10);
        });
      }
    } else {
      playerFighter.losses++;
      opponent.wins++;

      // Show money commission only (15% of show)
      const purse = scheduledFight.purse || FinanceEngine.calculatePurse(playerFighter, state, scheduledFight.isTitle);
      const gymCut = FinanceEngine.getGymCut(purse, false, playerFighter);
      FinanceEngine.addTransaction(state, 'income', `${t('finance.commission')}: ${playerFighter.fullName}`, gymCut.total);

      // Morale drop — fighter + global team impact
      playerFighter.morale = Math.max(15, playerFighter.morale - 15);
      state.fighters.forEach(f => {
        if (f.id !== playerFighter.id) {
          f.morale = Math.max(15, f.morale - 3);
        }
      });

      // Reset win streak, track loss streak
      playerFighter.winStreak = 0;
      playerFighter.lossStreak = (playerFighter.lossStreak || 0) + 1;

      // 3+ consecutive losses = severe morale hit
      if (playerFighter.lossStreak >= 3) {
        playerFighter.morale = Math.max(10, playerFighter.morale - 10);
        result.lossStreakWarning = playerFighter.lossStreak;
      }

      // Update rankings
      LeagueEngine.updateRankingsAfterFight(playerFighter, opponent, false, state);

      // Post-fight injury chance (higher after KO/TKO loss)
      if (result.method === 'KO/TKO') {
        const injuryRoll = Math.random();
        if (injuryRoll < 0.4) {
          const severity = injuryRoll < 0.15 ? 'severe' : 'moderate';
          this._applyInjury(playerFighter, severity);
        }
        // Permanent chin damage from KO loss
        playerFighter.koLosses = (playerFighter.koLosses || 0) + 1;
        const [minDmg, maxDmg] = AGING_CONFIG.chinDamagePerKO;
        playerFighter.chinDamage = (playerFighter.chinDamage || 0) + minDmg + Math.floor(Math.random() * (maxDmg - minDmg + 1));
      }
    }

    // Reputation: +3 for fighting
    state.reputation = Math.min(100, (state.reputation || 50) + REPUTATION_CONFIG.fightAccepted);

    // Reputation: +8 for title win
    if (result.winner === 'fighter1' && scheduledFight.isTitle) {
      state.reputation = Math.min(100, (state.reputation || 50) + REPUTATION_CONFIG.titleWin);
    }

    // Rivalry: chance after KO or title fight
    if (result.method === 'KO/TKO' || scheduledFight.isTitle) {
      if (Math.random() < 0.6) {
        if (!state.rivalries) state.rivalries = [];
        // Don't duplicate
        const exists = state.rivalries.some(r => 
          (r.playerId === playerFighter.id && r.opponentId === opponent.id) ||
          (r.playerId === opponent.id && r.opponentId === playerFighter.id)
        );
        if (!exists) {
          state.rivalries.push({
            playerId: result.winner === 'fighter1' ? playerFighter.id : opponent.id,
            opponentId: result.winner === 'fighter1' ? opponent.id : playerFighter.id,
            createdWeek: state.week,
            origin: result.method === 'KO/TKO' ? 'ko' : 'title',
            intensity: 1,
            resolved: false
          });
        }
      }
    }

    // Remove fight camp bonuses
    if (scheduledFight.fightCamp) {
      // Bonuses were only temporary for the simulation
    }

    // Store fight in history
    state.fightHistory.push(result);
  },

  /**
   * Apply injury to a fighter
   */
  _applyInjury(fighter, severity) {
    const injuryInfo = INJURY_DURATIONS[severity];
    fighter.status = 'injured';
    fighter.injuryType = injuryInfo.label;
    fighter.injuryWeeksLeft = injuryInfo.min + Math.floor(Math.random() * (injuryInfo.max - injuryInfo.min + 1));
    this._notify('injury', { fighter, severity });
  },

  /**
   * Set training for a fighter
   */
  setTraining(fighterId, trainingType) {
    const fighter = this._state.fighters.find(f => f.id === fighterId);
    if (fighter) {
      fighter.currentTraining = trainingType;
      this.save();
      this._notify('trainingChanged', { fighter, trainingType });
    }
  },

  /**
   * Accept a fight offer — creates a scheduled fight
   */
  acceptOffer(offerId) {
    const state = this._state;
    const offer = state.fightOffers.find(o => o.id === offerId);
    if (!offer || offer.status !== 'pending') return null;

    const fighter = state.fighters.find(f => f.id === offer.fighterId);
    const opponent = state.aiFighters.find(f => f.id === offer.opponentId);
    if (!fighter || !opponent) return null;

    // Create scheduled fight
    const scheduledFight = {
      id: `fight_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      week: offer.fightWeek,
      eventName: offer.eventName,
      playerFighterId: fighter.id,
      opponentId: opponent.id,
      fightCamp: null,
      isTitle: offer.isTitle,
      purse: offer.purse,
      completed: false
    };

    state.schedule.push(scheduledFight);
    offer.status = 'accepted';

    // Reset decline history on acceptance
    LeagueEngine.resetDeclineHistory(fighter.id, state);

    this.save();
    this._notify('offerAccepted', { offer, fighter, opponent });
    return { fighter, opponent, scheduledFight };
  },

  /**
   * Decline a fight offer with a reason
   */
  declineOffer(offerId, reasonId) {
    const state = this._state;
    const offer = state.fightOffers.find(o => o.id === offerId);
    if (!offer || offer.status !== 'pending') return null;

    const fighter = state.fighters.find(f => f.id === offer.fighterId);
    if (!fighter) return null;

    offer.status = 'declined';
    offer.declineReason = reasonId;

    // Apply consequences
    LeagueEngine.applyDeclineEffects(fighter, reasonId, state);

    this.save();
    this._notify('offerDeclined', { offer, fighter, reasonId });
    return { fighter, reasonId };
  },

  /**
   * Withdraw from a scheduled fight (forfeit)
   */
  withdrawFight(fightId) {
    const state = this._state;
    const fightIdx = state.schedule.findIndex(s => s.id === fightId && !s.completed);
    if (fightIdx === -1) return null;

    const fight = state.schedule[fightIdx];
    const fighter = state.fighters.find(f => f.id === fight.playerFighterId);
    if (!fighter) return null;

    // Remove from schedule
    state.schedule.splice(fightIdx, 1);

    // Consequences: reputation hit (-5), morale hit (-10), financial penalty
    state.reputation = Math.max(0, (state.reputation || 50) - 5);
    fighter.morale = Math.max(0, (fighter.morale || 50) - 10);

    // Forfeit penalty: lose the show money as compensation
    if (fight.purse && fight.purse.show) {
      FinanceEngine.addTransaction(state, 'expense', `Forfait: ${fighter.fullName}`, fight.purse.show);
    }

    // Record as decline for matchmaking consequences
    LeagueEngine.applyDeclineEffects(fighter, 'withdrawal', state);

    this.save();
    this._notify('fightWithdrawn', { fight, fighter });
    return { fight, fighter };
  },

  /**
   * Sign a free agent
   */
  signFreeAgent(agentId) {
    const state = this._state;
    if (state.fighters.length >= ROSTER_MAX) return { error: 'rosterFull' };

    const agentIdx = state.freeAgents.findIndex(a => a.id === agentId);
    if (agentIdx === -1) return null;

    const agent = state.freeAgents[agentIdx];
    const cost = agent.signingBonus;

    if (state.budget < cost) return { error: 'cantAfford' };

    // Pay signing bonus
    FinanceEngine.addTransaction(state, 'expense', `Signing bonus: ${agent.fullName}`, cost);

    // Convert to player fighter
    agent.isPlayer = true;
    agent.id = FighterGenerator._generateId('player');
    agent.currentTraining = 'general';
    agent.targetProfile = agent.style;
    agent.morale = 75;
    agent.status = 'available';
    delete agent.signingBonus;
    delete agent.weeklyFee;

    state.fighters.push(agent);
    state.freeAgents.splice(agentIdx, 1);

    this.save();
    this._notify('fighterSigned', { fighter: agent });
    return { fighter: agent, cost };
  },

  /**
   * Cut a fighter from the roster
   */
  cutFighter(fighterId) {
    const state = this._state;
    const fighterIdx = state.fighters.findIndex(f => f.id === fighterId);
    if (fighterIdx === -1) return null;

    const fighter = state.fighters[fighterIdx];

    // Can't cut if fighter has a scheduled fight
    const hasFight = state.schedule.some(s => !s.completed && s.playerFighterId === fighterId);
    if (hasFight) return { error: 'hasFight' };

    // Pay severance
    const severance = LeagueEngine.calculateSeverancePay(fighter, state);
    FinanceEngine.addTransaction(state, 'expense', `Severance: ${fighter.fullName}`, severance);

    // Remove from roster
    state.fighters.splice(fighterIdx, 1);

    // Clean up any pending offers for this fighter
    state.fightOffers = state.fightOffers.filter(o => o.fighterId !== fighterId);

    this.save();
    this._notify('fighterCut', { fighter, severance });
    return { fighter, severance };
  },

  /**
   * Adjust fighter training fee (direction: 'up' or 'down')
   * Higher fee = more revenue but fighter loses morale
   */
  adjustFee(fighterId, direction) {
    const fighter = this._state.fighters.find(f => f.id === fighterId);
    if (!fighter) return;

    const step = 0.25;
    const oldMultiplier = fighter.feeMultiplier || 1.0;
    let newMultiplier;

    if (direction === 'up') {
      newMultiplier = Math.min(2.0, oldMultiplier + step);
    } else {
      newMultiplier = Math.max(0.5, oldMultiplier - step);
    }

    if (newMultiplier === oldMultiplier) return;

    fighter.feeMultiplier = newMultiplier;

    // Morale impact: discount = +4, surcharge = -6 (asymmetric)
    const moraleChange = direction === 'up' ? -6 : 4;
    fighter.morale = Math.max(10, Math.min(100, fighter.morale + moraleChange));

    this.save();
    this._notify('feeChanged', { fighter, oldMultiplier, newMultiplier, moraleChange });
    return { fighter, moraleChange };
  },

  /**
   * Adjust gym's commission rate on a fighter's purses
   */
  adjustCommission(fighterId, direction) {
    const fighter = this._state.fighters.find(f => f.id === fighterId);
    if (!fighter) return;

    const step = COMMISSION_STEPS.step;
    const oldMultiplier = fighter.commissionMultiplier || COMMISSION_STEPS.default;
    let newMultiplier;

    if (direction === 'up') {
      newMultiplier = Math.min(COMMISSION_STEPS.max, +(oldMultiplier + step).toFixed(2));
    } else {
      newMultiplier = Math.max(COMMISSION_STEPS.min, +(oldMultiplier - step).toFixed(2));
    }

    if (newMultiplier === oldMultiplier) return;

    fighter.commissionMultiplier = newMultiplier;

    // Morale impact: lower commission = happy, higher = unhappy
    const moraleChange = direction === 'up' ? -COMMISSION_STEPS.moralePerStep : COMMISSION_STEPS.moralePerStep;
    fighter.morale = Math.max(10, Math.min(100, fighter.morale + moraleChange));

    this.save();
    this._notify('commissionChanged', { fighter, oldMultiplier, newMultiplier, moraleChange });
    return { fighter, moraleChange };
  },

  /**
   * Set target profile for a fighter
   */
  setTargetProfile(fighterId, styleId) {
    const fighter = this._state.fighters.find(f => f.id === fighterId);
    if (fighter) {
      fighter.targetProfile = styleId;
      this.save();
      this._notify('profileChanged', { fighter, styleId });
    }
  },

  /**
   * Set fight camp for a scheduled fight
   */
  setFightCamp(scheduleId, campType) {
    const state = this._state;
    const scheduled = state.schedule.find(s => s.id === scheduleId);
    if (scheduled) {
      // Remove old camp cost if any
      if (scheduled.fightCamp) {
        // Refund not implemented — keep it simple
      }

      scheduled.fightCamp = campType;

      if (campType) {
        const camp = FIGHT_CAMP_TYPES[campType];
        FinanceEngine.addTransaction(state, 'expense', `Fight Camp: ${camp.name}`, camp.cost);
      }

      this.save();
      this._notify('fightCampSet', { scheduleId, campType });
    }
  },

  /**
   * Save state to localStorage
   */
  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._state));
    } catch (e) {
      console.error('Failed to save game state:', e);
    }
  },

  /**
   * Load state from localStorage
   */
  load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this._state = JSON.parse(saved);
        // Migration: add new fields for fight offer system
        if (!this._state.fightOffers) this._state.fightOffers = [];
        if (!this._state.declineHistory) this._state.declineHistory = {};
        if (!this._state.lastOfferWeek) this._state.lastOfferWeek = 0;
        // Migration: add new fields for market system
        if (!this._state.freeAgents) this._state.freeAgents = [];
        if (!this._state.lastMarketRefresh) this._state.lastMarketRefresh = 0;
        // Generate free agents if pool is empty (migration from old save)
        if (this._state.freeAgents.length === 0 && this._state.fighters.length > 0) {
          LeagueEngine.generateFreeAgents(this._state);
        }
        // Migration: add season system
        if (!this._state.season) {
          SeasonEngine.initSeason(this._state);
        }
        // Migration: add reputation and rivalries
        if (this._state.reputation === undefined) this._state.reputation = REPUTATION_CONFIG.initial;
        if (!this._state.rivalries) this._state.rivalries = [];
        // Migration: add aging and chin props to all fighters
        const allFighters = [...(this._state.fighters || []), ...(this._state.aiFighters || [])];
        allFighters.forEach(f => {
          if (f.peakAge === undefined) f.peakAge = AGING_CONFIG.peakAgeMin + Math.floor(Math.random() * (AGING_CONFIG.peakAgeMax - AGING_CONFIG.peakAgeMin + 1));
          if (f.retireAge === undefined) f.retireAge = AGING_CONFIG.retireAgeMin + Math.floor(Math.random() * (AGING_CONFIG.retireAgeMax - AGING_CONFIG.retireAgeMin + 1));
          if (f.koLosses === undefined) f.koLosses = 0;
          if (f.chinDamage === undefined) f.chinDamage = 0;
        });
        this._notify('loaded');
        return true;
      }
    } catch (e) {
      console.error('Failed to load game state:', e);
    }
    return false;
  },

  /**
   * Check if a save exists
   */
  hasSave() {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  },

  /**
   * Reset the game
   */
  reset() {
    localStorage.removeItem(this.STORAGE_KEY);
    this._state = null;
    this._notify('reset');
  },

  /**
   * Subscribe to state changes
   */
  on(event, callback) {
    this._listeners.push({ event, callback });
    return () => {
      this._listeners = this._listeners.filter(l => l.callback !== callback);
    };
  },

  /**
   * Notify listeners
   */
  _notify(event, data) {
    this._listeners.forEach(l => {
      if (l.event === event || l.event === '*') {
        l.callback(event, data);
      }
    });
  }
};
