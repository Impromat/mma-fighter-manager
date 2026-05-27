/* ============================================
   MMA Fighter Manager — Combat Engine
   ============================================ */

const CombatEngine = {
  /**
   * Simulate a complete fight (AI vs AI, no corner instructions)
   */
  simulate(fighter1, fighter2, isTitle, campBonuses) {
    const totalRounds = isTitle ? 5 : 3;
    const rounds = [];
    let winner = null;
    let method = null;
    let finishRound = null;
    let f1Damage = 0;
    let f2Damage = 0;

    for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
      if (winner) break;

      const roundResult = this._simulateRound(
        fighter1, fighter2, roundNum, totalRounds,
        campBonuses, null, null, f1Damage, f2Damage
      );

      rounds.push(roundResult);
      f1Damage += roundResult.f1DamageTaken;
      f2Damage += roundResult.f2DamageTaken;

      if (roundResult.finish) {
        winner = roundResult.finish.winner;
        method = roundResult.finish.method;
        finishRound = roundNum;
      }
    }

    return this._buildResult(fighter1, fighter2, rounds, winner, method, finishRound, isTitle);
  },

  /**
   * Simulate one round (public API for interactive fights)
   * AI gets random corner instructions for balance
   */
  simulateOneRound(f1, f2, roundNum, totalRounds, campBonuses, cornerInstruction, prevF1Damage, prevF2Damage) {
    // AI picks a corner instruction based on situation
    const aiCorner = this._pickAICorner(f2, f1, prevF2Damage, prevF1Damage, roundNum);
    const oppEffects = aiCorner ? aiCorner.effects : null;
    return this._simulateRound(f1, f2, roundNum, totalRounds, campBonuses, cornerInstruction, oppEffects, prevF1Damage, prevF2Damage);
  },

  /**
   * Build a final fight result from accumulated rounds
   */
  buildResult(fighter1, fighter2, rounds, isTitle) {
    let winner = null;
    let method = null;
    let finishRound = null;

    // Check if any round had a finish
    for (const round of rounds) {
      if (round.finish) {
        winner = round.finish.winner;
        method = round.finish.method;
        finishRound = round.roundNumber;
        break;
      }
    }

    return this._buildResult(fighter1, fighter2, rounds, winner, method, finishRound, isTitle);
  },

  /**
   * Internal: build result object
   */
  _buildResult(fighter1, fighter2, rounds, winner, method, finishRound, isTitle) {
    if (!winner) {
      const decision = this._scoreDecision(rounds, fighter1, fighter2);
      winner = decision.winner;
      method = decision.method;

      const lastRound = rounds[rounds.length - 1];
      const decisionNarration = this._pickRandom(NARRATION.decision);
      lastRound.events.push({ text: decisionNarration, type: 'decision' });

      if (decision.scores) {
        lastRound.events.push({
          text: t('narr.scorecards', { scores: decision.scores.join(', '), name: winner === 'fighter1' ? fighter1.fullName : fighter2.fullName, method }),
          type: 'finish'
        });
      }
    }

    return {
      id: `fight_result_${Date.now()}`,
      fighter1: {
        id: fighter1.id,
        name: fighter1.fullName,
        record: `${fighter1.wins}-${fighter1.losses}`,
        style: fighter1.style,
        weightClass: fighter1.weightClass
      },
      fighter2: {
        id: fighter2.id,
        name: fighter2.fullName,
        record: `${fighter2.wins}-${fighter2.losses}`,
        style: fighter2.style,
        weightClass: fighter2.weightClass
      },
      winner,
      method,
      finishRound,
      totalRounds: isTitle ? 5 : 3,
      isTitle,
      rounds,
      timestamp: Date.now()
    };
  },

  /**
   * Simulate a single round
   */
  _simulateRound(f1, f2, roundNum, totalRounds, campBonuses, cornerInstruction, opponentCornerEffects, prevF1Damage, prevF2Damage) {
    const events = [];
    let f1DamageTaken = 0;
    let f2DamageTaken = 0;
    let f1Control = 0;
    let f2Control = 0;
    let finish = null;
    // Phase tracking for analysis
    let strikingExchanges = 0;
    let wrestlingExchanges = 0;
    let groundExchanges = 0;
    let clinchExchanges = 0;
    let f1StrikesLanded = 0;
    let f2StrikesLanded = 0;
    let f1Takedowns = 0;
    let f2Takedowns = 0;

    // Calculate effective stats with corner instruction bonuses
    const cornerEffects = cornerInstruction ? cornerInstruction.effects : null;
    const cornerPhaseWeights = cornerInstruction ? cornerInstruction.phaseWeights : null;
    const oppEffects = cornerInstruction?.opponentEffects || null;

    const f1Stats = this._getEffectiveStats(f1, roundNum, campBonuses, prevF1Damage, cornerEffects);
    const f2Stats = this._getEffectiveStats(f2, roundNum, null, prevF2Damage, oppEffects);

    // Round start narration
    const roundStart = this._narrate(NARRATION.roundStart, { n: roundNum });
    events.push({ text: roundStart, type: 'start' });

    // Generate 4-6 events per round
    const numExchanges = 4 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numExchanges; i++) {
      if (finish) break;

      // Determine phase of exchange
      const phase = this._determinePhase(f1Stats, f2Stats, cornerPhaseWeights);

      switch (phase) {
        case 'striking': {
          const result = this._resolveStriking(f1, f2, f1Stats, f2Stats);
          events.push({ text: result.narration, type: result.highlight ? 'highlight' : 'normal' });
          f1DamageTaken += result.f1Damage;
          f2DamageTaken += result.f2Damage;
          f1Control += result.f1Control;
          f2Control += result.f2Control;
          strikingExchanges++;
          if (result.f2Damage > 0) f1StrikesLanded++;
          if (result.f1Damage > 0) f2StrikesLanded++;

          // KO check
          if (result.f2Damage > 0) {
            const koCheck = this._checkKO(f2Stats, prevF2Damage + f2DamageTaken, roundNum);
            if (koCheck) {
              const koNarration = Math.random() < 0.5 ?
                this._narrate(NARRATION.koFinish, { a: f1.fullName, d: f2.fullName }) :
                this._narrate(NARRATION.tkoFinish, { a: f1.fullName, d: f2.fullName });
              events.push({ text: koNarration, type: 'finish' });
              finish = { winner: 'fighter1', method: 'KO/TKO' };
            }
          }
          if (!finish && result.f1Damage > 0) {
            const koCheck = this._checkKO(f1Stats, prevF1Damage + f1DamageTaken, roundNum);
            if (koCheck) {
              const koNarration = Math.random() < 0.5 ?
                this._narrate(NARRATION.koFinish, { a: f2.fullName, d: f1.fullName }) :
                this._narrate(NARRATION.tkoFinish, { a: f2.fullName, d: f1.fullName });
              events.push({ text: koNarration, type: 'finish' });
              finish = { winner: 'fighter2', method: 'KO/TKO' };
            }
          }
          break;
        }

        case 'wrestling': {
          const result = this._resolveWrestling(f1, f2, f1Stats, f2Stats);
          events.push({ text: result.narration, type: result.highlight ? 'highlight' : 'normal' });
          f1Control += result.f1Control;
          f2Control += result.f2Control;
          f1DamageTaken += result.f1Damage;
          f2DamageTaken += result.f2Damage;
          wrestlingExchanges++;
          if (result.f1Control > result.f2Control) f1Takedowns++;
          else if (result.f2Control > result.f1Control) f2Takedowns++;
          break;
        }

        case 'ground': {
          const result = this._resolveGround(f1, f2, f1Stats, f2Stats);
          events.push({ text: result.narration, type: result.highlight ? 'highlight' : 'normal' });
          f1Control += result.f1Control;
          f2Control += result.f2Control;
          f1DamageTaken += result.f1Damage;
          f2DamageTaken += result.f2Damage;
          groundExchanges++;
          // Submission check
          if (result.subAttempt) {
            const subCheck = this._checkSubmission(
              result.attacker === 'f1' ? f1Stats : f2Stats,
              result.attacker === 'f1' ? f2Stats : f1Stats
            );
            if (subCheck) {
              const attacker = result.attacker === 'f1' ? f1 : f2;
              const defender = result.attacker === 'f1' ? f2 : f1;
              const subNarration = this._narrate(NARRATION.subFinish, { a: attacker.fullName, d: defender.fullName });
              events.push({ text: subNarration, type: 'finish' });
              finish = {
                winner: result.attacker === 'f1' ? 'fighter1' : 'fighter2',
                method: 'Submission'
              };
            } else {
              const defender = result.attacker === 'f1' ? f2 : f1;
              const defNarration = this._narrate(NARRATION.submissionDefense, {
                a: result.attacker === 'f1' ? f1.fullName : f2.fullName,
                d: defender.fullName
              });
              events.push({ text: defNarration, type: 'normal' });
            }
          }
          break;
        }

        case 'clinch': {
          const clinchNarration = this._narrate(NARRATION.clinch, { a: f1.fullName, d: f2.fullName });
          events.push({ text: clinchNarration, type: 'normal' });
          clinchExchanges++;
          // Clinch can lead to takedown or separation
          if (Math.random() < 0.3) {
            const tdResult = this._resolveWrestling(f1, f2, f1Stats, f2Stats);
            events.push({ text: tdResult.narration, type: 'normal' });
            f1Control += tdResult.f1Control;
            f2Control += tdResult.f2Control;
          }
          break;
        }
      }

      // Momentum / fatigue narration
      if (i === numExchanges - 2 && !finish) {
        if (f2DamageTaken > f1DamageTaken + 5) {
          events.push({ text: this._narrate(NARRATION.momentum, { a: f1.fullName, d: f2.fullName }), type: 'highlight' });
        } else if (f1DamageTaken > f2DamageTaken + 5) {
          events.push({ text: this._narrate(NARRATION.momentum, { a: f2.fullName, d: f1.fullName }), type: 'highlight' });
        }

        // Fatigue narration in later rounds
        if (roundNum >= 2) {
          const fatigued = f1Stats.cardio < f2Stats.cardio ? f1 : f2;
          if (Math.random() < 0.4) {
            events.push({ text: this._narrate(NARRATION.fatigue, { d: fatigued.fullName }), type: 'normal' });
          }
        }
      }
    }

    return {
      roundNumber: roundNum,
      events,
      f1DamageTaken,
      f2DamageTaken,
      f1Control,
      f2Control,
      finish,
      // Phase analysis
      phases: { strikingExchanges, wrestlingExchanges, groundExchanges, clinchExchanges },
      strikes: { f1: f1StrikesLanded, f2: f2StrikesLanded },
      takedowns: { f1: f1Takedowns, f2: f2Takedowns },
      // Effective stats snapshot (for condition display)
      f1EffectiveStats: { ...f1Stats },
      f2EffectiveStats: { ...f2Stats }
    };
  },

  /**
   * Get effective stats with cardio drain and bonuses
   */
  _getEffectiveStats(fighter, roundNum, campBonuses, accDamage, extraEffects) {
    const stats = { ...fighter.stats };

    const baseDrain = (100 - stats.cardio) / 100;
    const roundDrain = (roundNum - 1) * (5 + baseDrain * 12);

    Object.keys(stats).forEach(key => {
      if (key !== 'cardio' && key !== 'chin') {
        stats[key] = Math.max(10, stats[key] - roundDrain);
      }
    });

    stats.cardio = Math.max(10, stats.cardio - (roundNum - 1) * 3);

    const damageImpact = accDamage * 0.3;
    stats.chin = Math.max(10, stats.chin - damageImpact);
    stats.mental = Math.max(10, stats.mental - damageImpact * 0.5);

    // Apply fight camp bonuses
    if (campBonuses) {
      Object.entries(campBonuses).forEach(([stat, bonus]) => {
        if (stats[stat] !== undefined) {
          stats[stat] = Math.min(99, stats[stat] + bonus);
        }
      });
    }

    // Apply corner instruction / extra effects
    if (extraEffects) {
      Object.entries(extraEffects).forEach(([stat, bonus]) => {
        if (stats[stat] !== undefined) {
          stats[stat] = Math.max(10, Math.min(99, stats[stat] + bonus));
        }
      });
    }

    return stats;
  },

  /**
   * Determine which phase the exchange happens in
   */
  _determinePhase(f1Stats, f2Stats, phaseWeights) {
    const totalWrestling = f1Stats.wrestling + f2Stats.wrestling;
    const totalStriking = f1Stats.striking + f2Stats.striking;
    const totalGrappling = f1Stats.grappling + f2Stats.grappling;

    const phases = [
      { phase: 'striking', weight: totalStriking * 1.3 * (phaseWeights?.striking || 1) },
      { phase: 'wrestling', weight: totalWrestling * 0.8 * (phaseWeights?.wrestling || 1) },
      { phase: 'ground', weight: totalGrappling * 0.6 * (phaseWeights?.ground || 1) },
      { phase: 'clinch', weight: 30 * (phaseWeights?.clinch || 1) }
    ];

    const total = phases.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * total;

    for (const p of phases) {
      roll -= p.weight;
      if (roll <= 0) return p.phase;
    }

    return 'striking';
  },

  /**
   * Resolve a striking exchange
   */
  _resolveStriking(f1, f2, f1Stats, f2Stats) {
    const f1Advantage = (f1Stats.striking + f1Stats.athleticism * 0.3 + f1Stats.mental * 0.2) -
                        (f2Stats.striking + f2Stats.athleticism * 0.3 + f2Stats.mental * 0.2);

    const roll = (Math.random() - 0.5) * 40 + f1Advantage;

    if (roll > 5) {
      // Fighter 1 lands
      const damage = 2 + Math.random() * 4 + Math.max(0, roll * 0.15);
      return {
        narration: this._narrate(NARRATION.strikingExchange, { a: f1.fullName, d: f2.fullName }),
        f1Damage: 0,
        f2Damage: damage,
        f1Control: 2,
        f2Control: 0,
        highlight: roll > 15
      };
    } else if (roll < -5) {
      // Fighter 2 lands
      const damage = 2 + Math.random() * 4 + Math.max(0, -roll * 0.15);
      return {
        narration: this._narrate(NARRATION.strikingExchange, { a: f2.fullName, d: f1.fullName }),
        f1Damage: damage,
        f2Damage: 0,
        f1Control: 0,
        f2Control: 2,
        highlight: roll < -15
      };
    } else {
      // Defensive exchange
      const attacker = Math.random() < 0.5 ? f1 : f2;
      const defender = attacker === f1 ? f2 : f1;
      return {
        narration: this._narrate(NARRATION.strikingDefense, { a: attacker.fullName, d: defender.fullName }),
        f1Damage: 0,
        f2Damage: 0,
        f1Control: 0,
        f2Control: 0,
        highlight: false
      };
    }
  },

  /**
   * Resolve a wrestling exchange
   */
  _resolveWrestling(f1, f2, f1Stats, f2Stats) {
    const f1WrestlingPower = f1Stats.wrestling + f1Stats.athleticism * 0.4;
    const f2WrestlingPower = f2Stats.wrestling + f2Stats.athleticism * 0.4;

    const roll = (Math.random() - 0.5) * 30 + (f1WrestlingPower - f2WrestlingPower);

    if (roll > 0) {
      return {
        narration: this._narrate(NARRATION.takedown, { a: f1.fullName, d: f2.fullName }),
        f1Control: 4,
        f2Control: 0,
        f1Damage: 0,
        f2Damage: 1,
        highlight: roll > 15
      };
    } else {
      return {
        narration: this._narrate(NARRATION.takedownDefense, { a: f1.fullName, d: f2.fullName }),
        f1Control: 0,
        f2Control: 2,
        f1Damage: 0,
        f2Damage: 0,
        highlight: false
      };
    }
  },

  /**
   * Resolve a ground exchange
   */
  _resolveGround(f1, f2, f1Stats, f2Stats) {
    const f1GroundPower = f1Stats.grappling + f1Stats.submission * 0.5 + f1Stats.wrestling * 0.3;
    const f2GroundPower = f2Stats.grappling + f2Stats.submission * 0.5 + f2Stats.wrestling * 0.3;

    const advantage = (Math.random() - 0.5) * 30 + (f1GroundPower - f2GroundPower);
    const subAttempt = Math.random() < 0.35;

    if (advantage > 0) {
      if (subAttempt) {
        return {
          narration: this._narrate(NARRATION.submissionAttempt, { a: f1.fullName, d: f2.fullName }),
          f1Control: 3,
          f2Control: 0,
          f1Damage: 0,
          f2Damage: 1,
          subAttempt: true,
          attacker: 'f1',
          highlight: true
        };
      }
      return {
        narration: this._narrate(NARRATION.groundControl, { a: f1.fullName, d: f2.fullName }),
        f1Control: 4,
        f2Control: 0,
        f1Damage: 0,
        f2Damage: 2,
        subAttempt: false,
        highlight: false
      };
    } else {
      if (subAttempt) {
        return {
          narration: this._narrate(NARRATION.submissionAttempt, { a: f2.fullName, d: f1.fullName }),
          f1Control: 0,
          f2Control: 3,
          f1Damage: 1,
          f2Damage: 0,
          subAttempt: true,
          attacker: 'f2',
          highlight: true
        };
      }
      return {
        narration: this._narrate(NARRATION.groundControl, { a: f2.fullName, d: f1.fullName }),
        f1Control: 0,
        f2Control: 4,
        f1Damage: 2,
        f2Damage: 0,
        subAttempt: false,
        highlight: false
      };
    }
  },

  /**
   * Check for KO/TKO
   */
  _checkKO(defenderStats, totalDamage, roundNum) {
    const chinFactor = (100 - defenderStats.chin) / 100;
    const mentalFactor = (100 - defenderStats.mental) / 150;
    const damageFactor = totalDamage / 25;
    const roundFactor = roundNum * 0.06;

    const koChance = (chinFactor * 0.4 + damageFactor * 0.35 + mentalFactor * 0.15 + roundFactor) * 0.35;
    return Math.random() < koChance;
  },

  /**
   * Check for submission finish
   */
  _checkSubmission(attackerStats, defenderStats) {
    const attackPower = attackerStats.submission + attackerStats.grappling * 0.3;
    const defensePower = defenderStats.submission * 0.5 + defenderStats.grappling * 0.3 + defenderStats.mental * 0.3;

    const advantage = (attackPower - defensePower) / 100;
    const subChance = 0.15 + advantage * 0.35;
    return Math.random() < Math.max(0.05, Math.min(0.40, subChance));
  },

  /**
   * AI picks a corner instruction based on situation
   */
  _pickAICorner(aiFighter, opponent, aiDamage, oppDamage, roundNum) {
    if (roundNum === 1) return null; // No corner for round 1

    const instructions = Object.values(CORNER_INSTRUCTIONS);
    
    // AI is hurt — recover
    if (aiDamage > 12) {
      return instructions.find(i => i.id === 'recover') || null;
    }
    
    // Opponent is hurt — go for finish
    if (oppDamage > 12) {
      return instructions.find(i => i.id === 'goForFinish') || null;
    }
    
    // Based on fighter style
    const styleChoices = {
      striker: ['stayStanding', 'workTheBody', 'goForFinish'],
      grappler: ['takedown', 'stayPatient'],
      wrestler: ['takedown', 'workTheBody'],
      wellRounded: ['stayStanding', 'takedown', 'stayPatient', 'workTheBody']
    };
    
    const choices = styleChoices[aiFighter.style] || styleChoices.wellRounded;
    const choiceId = choices[Math.floor(Math.random() * choices.length)];
    return instructions.find(i => i.id === choiceId) || null;
  },

  /**
   * Score a decision
   */
  _scoreDecision(rounds, f1, f2) {
    let f1RoundsWon = 0;
    let f2RoundsWon = 0;
    const scores = [];

    // Score each round
    rounds.forEach(round => {
      const f1Score = round.f1Control + (round.f2DamageTaken * 1.5);
      const f2Score = round.f2Control + (round.f1DamageTaken * 1.5);

      if (f1Score > f2Score) f1RoundsWon++;
      else if (f2Score > f1Score) f2RoundsWon++;
      else {
        // Tie-breaker: random with slight mental advantage
        if (Math.random() < 0.5 + (f1.stats.mental - f2.stats.mental) / 200) {
          f1RoundsWon++;
        } else {
          f2RoundsWon++;
        }
      }
    });

    const totalRounds = rounds.length;
    const winner = f1RoundsWon > f2RoundsWon ? 'fighter1' : 'fighter2';

    // Generate judge scorecards
    for (let j = 0; j < 3; j++) {
      let f1Rounds = f1RoundsWon;
      let f2Rounds = f2RoundsWon;

      // Small chance of judge variance
      if (Math.random() < 0.2 && Math.abs(f1RoundsWon - f2RoundsWon) <= 1) {
        if (Math.random() < 0.5) { f1Rounds++; f2Rounds--; }
        else { f1Rounds--; f2Rounds++; }
      }

      const f1Total = f1Rounds * 10 + (totalRounds - f1Rounds) * 9;
      const f2Total = f2Rounds * 10 + (totalRounds - f2Rounds) * 9;
      scores.push(`${Math.max(f1Total, f2Total)}-${Math.min(f1Total, f2Total)}`);
    }

    // Determine decision type
    const allSame = scores.every(s => s === scores[0]);
    const methodType = allSame ? t('narr.unanimousDecision') : t('narr.splitDecision');

    return {
      winner,
      method: methodType,
      scores,
      f1RoundsWon,
      f2RoundsWon
    };
  },

  /**
   * Pick a random narration template and fill in names
   */
  _narrate(templates, vars) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    return this._fillTemplate(template, vars);
  },

  /**
   * Fill template variables
   */
  _fillTemplate(template, vars) {
    let result = template;
    Object.entries(vars).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return result;
  },

  /**
   * Pick random from array
   */
  _pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
};
