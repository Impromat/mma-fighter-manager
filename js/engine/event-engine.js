/* ============================================
   MMA Fighter Manager — Event Engine
   Random events system with player choices
   ============================================ */

const EventEngine = {

  EVENTS: [
    // ─── HEALTH ───
    {
      id: 'training_injury',
      category: 'health',
      icon: '🏥',
      titleKey: 'event.trainingInjury.title',
      descKey: 'event.trainingInjury.desc',
      mandatory: true,
      condition(state) {
        const f = state.fighters.find(f => f.status === 'available' && f.trainingPlan);
        return f ? { valid: true, fighter: f } : { valid: false };
      },
      choices: [
        {
          labelKey: 'event.trainingInjury.rest',
          apply(fighter, state) {
            fighter.status = 'injured';
            fighter.injuryWeeksLeft = 2;
            return 'event.trainingInjury.restResult';
          }
        },
        {
          labelKey: 'event.trainingInjury.push',
          apply(fighter, state) {
            if (Math.random() < 0.4) {
              fighter.status = 'injured';
              fighter.injuryWeeksLeft = 5;
              return 'event.trainingInjury.pushBad';
            }
            return 'event.trainingInjury.pushOk';
          }
        }
      ]
    },
    {
      id: 'motivation_peak',
      category: 'health',
      icon: '🔥',
      titleKey: 'event.motivationPeak.title',
      descKey: 'event.motivationPeak.desc',
      mandatory: false,
      condition(state) {
        const f = state.fighters.find(f => f.status === 'available' && f.wins > 0 && f.lastFightWeek && (state.week - f.lastFightWeek) <= 3);
        return f ? { valid: true, fighter: f } : { valid: false };
      },
      choices: [
        {
          labelKey: 'event.motivationPeak.intensify',
          apply(fighter, state) {
            const stats = ['striking', 'grappling', 'wrestling', 'submission'];
            const stat = stats[Math.floor(Math.random() * stats.length)];
            fighter[stat] = Math.min(99, fighter[stat] + 2);
            fighter.morale = Math.max(10, (fighter.morale || 50) - 5);
            return 'event.motivationPeak.intensifyResult';
          }
        },
        {
          labelKey: 'event.motivationPeak.enjoy',
          apply(fighter, state) {
            fighter.morale = Math.min(100, (fighter.morale || 50) + 10);
            return 'event.motivationPeak.enjoyResult';
          }
        }
      ]
    },
    {
      id: 'personal_issue',
      category: 'health',
      icon: '😔',
      titleKey: 'event.personalIssue.title',
      descKey: 'event.personalIssue.desc',
      mandatory: true,
      condition(state) {
        const f = state.fighters.find(f => f.status === 'available');
        return f ? { valid: true, fighter: f } : { valid: false };
      },
      choices: [
        {
          labelKey: 'event.personalIssue.leave',
          apply(fighter, state) {
            fighter.morale = Math.min(100, (fighter.morale || 50) + 8);
            fighter._skipTraining = true;
            return 'event.personalIssue.leaveResult';
          }
        },
        {
          labelKey: 'event.personalIssue.force',
          apply(fighter, state) {
            fighter.morale = Math.max(10, (fighter.morale || 50) - 12);
            return 'event.personalIssue.forceResult';
          }
        }
      ]
    },

    // ─── MEDIA ───
    {
      id: 'viral_interview',
      category: 'media',
      icon: '🎙️',
      titleKey: 'event.viralInterview.title',
      descKey: 'event.viralInterview.desc',
      mandatory: false,
      condition(state) {
        const f = state.fighters.find(f => {
          const rank = LeagueEngine.getFighterRanking(f.id, state);
          return rank !== null && rank <= 15;
        });
        return f ? { valid: true, fighter: f } : { valid: false };
      },
      choices: [
        {
          labelKey: 'event.viralInterview.trash',
          apply(fighter, state) {
            fighter.morale = Math.min(100, (fighter.morale || 50) + 5);
            fighter._purseBonusNext = 0.25;
            return 'event.viralInterview.trashResult';
          }
        },
        {
          labelKey: 'event.viralInterview.humble',
          apply(fighter, state) {
            state.reputation = Math.min(100, (state.reputation || 50) + 3);
            return 'event.viralInterview.humbleResult';
          }
        }
      ]
    },
    {
      id: 'scandal',
      category: 'media',
      icon: '💥',
      titleKey: 'event.scandal.title',
      descKey: 'event.scandal.desc',
      mandatory: true,
      condition(state) {
        return state.fighters.length > 0 ? { valid: true, fighter: state.fighters[Math.floor(Math.random() * state.fighters.length)] } : { valid: false };
      },
      choices: [
        {
          labelKey: 'event.scandal.apologize',
          apply(fighter, state) {
            state.budget -= 3000;
            return 'event.scandal.apologizeResult';
          }
        },
        {
          labelKey: 'event.scandal.ignore',
          apply(fighter, state) {
            state.reputation = Math.max(0, (state.reputation || 50) - 8);
            fighter.morale = Math.max(10, (fighter.morale || 50) - 5);
            return 'event.scandal.ignoreResult';
          }
        }
      ]
    },

    // ─── BUSINESS ───
    {
      id: 'sponsor_offer',
      category: 'business',
      icon: '💼',
      titleKey: 'event.sponsorOffer.title',
      descKey: 'event.sponsorOffer.desc',
      mandatory: false,
      condition(state) {
        const f = state.fighters.find(f => {
          const rank = LeagueEngine.getFighterRanking(f.id, state);
          return rank !== null && rank <= 10;
        });
        return f ? { valid: true, fighter: f } : { valid: false };
      },
      choices: [
        {
          labelKey: 'event.sponsorOffer.accept',
          apply(fighter, state) {
            state.budget += 5000;
            return 'event.sponsorOffer.acceptResult';
          }
        },
        {
          labelKey: 'event.sponsorOffer.decline',
          apply(fighter, state) {
            return 'event.sponsorOffer.declineResult';
          }
        }
      ]
    },

    // ─── RIVALRY ───
    {
      id: 'callout',
      category: 'rivalry',
      icon: '🗣️',
      titleKey: 'event.callout.title',
      descKey: 'event.callout.desc',
      mandatory: true,
      condition(state) {
        const f = state.fighters.find(f => f.wins > 0 && f.status === 'available');
        return f ? { valid: true, fighter: f } : { valid: false };
      },
      choices: [
        {
          labelKey: 'event.callout.accept',
          apply(fighter, state) {
            fighter.morale = Math.min(100, (fighter.morale || 50) + 5);
            return 'event.callout.acceptResult';
          }
        },
        {
          labelKey: 'event.callout.ignore',
          apply(fighter, state) {
            state.reputation = Math.max(0, (state.reputation || 50) - 3);
            return 'event.callout.ignoreResult';
          }
        }
      ]
    },

    // ─── OPPORTUNITIES ───
    {
      id: 'short_notice',
      category: 'opportunity',
      icon: '⚡',
      titleKey: 'event.shortNotice.title',
      descKey: 'event.shortNotice.desc',
      mandatory: false,
      condition(state) {
        const f = state.fighters.find(f => 
          f.status === 'available' && 
          !LeagueEngine.isFighterOnCooldown(f, state) &&
          !state.schedule.some(s => !s.completed && s.playerFighterId === f.id)
        );
        return f ? { valid: true, fighter: f } : { valid: false };
      },
      choices: [
        {
          labelKey: 'event.shortNotice.accept',
          apply(fighter, state) {
            const opponent = LeagueEngine._findAdjustedOpponent(fighter, state);
            if (opponent) {
              state.schedule.push({
                id: `fight_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                week: state.week + 2,
                eventName: `AFC Fight Night ${Math.ceil((state.week + 2) / EVENT_INTERVAL)}`,
                playerFighterId: fighter.id,
                opponentId: opponent.id,
                fightCamp: null,
                isTitle: false,
                completed: false
              });
            }
            return 'event.shortNotice.acceptResult';
          }
        },
        {
          labelKey: 'event.shortNotice.decline',
          apply(fighter, state) {
            return 'event.shortNotice.declineResult';
          }
        }
      ]
    },
    {
      id: 'foreign_camp',
      category: 'opportunity',
      icon: '✈️',
      titleKey: 'event.foreignCamp.title',
      descKey: 'event.foreignCamp.desc',
      mandatory: false,
      condition(state) {
        const f = state.fighters.find(f => f.status === 'available');
        return f ? { valid: true, fighter: f } : { valid: false };
      },
      choices: [
        {
          labelKey: 'event.foreignCamp.send',
          apply(fighter, state) {
            state.budget -= 4000;
            const stats = ['striking', 'grappling', 'wrestling', 'submission', 'cardio'];
            const stat = stats[Math.floor(Math.random() * stats.length)];
            fighter[stat] = Math.min(99, fighter[stat] + 3);
            fighter._skipTraining = true;
            return 'event.foreignCamp.sendResult';
          }
        },
        {
          labelKey: 'event.foreignCamp.keep',
          apply(fighter, state) {
            return 'event.foreignCamp.keepResult';
          }
        }
      ]
    }
  ],

  rollEvent(state) {
    if (Math.random() > 0.30) return null;

    // Don't fire on fight weeks
    if (state.schedule.some(s => s.week === state.week && !s.completed)) return null;

    // Cooldown: no event 2 weeks in a row
    if (state.lastEventWeek && (state.week - state.lastEventWeek) < 2) return null;

    const shuffled = [...this.EVENTS].sort(() => Math.random() - 0.5);
    
    for (const event of shuffled) {
      if (event.id === 'scandal' && Math.random() > 0.15) continue;
      
      const check = event.condition(state);
      if (check.valid) {
        state.lastEventWeek = state.week;
        return {
          id: event.id,
          category: event.category,
          icon: event.icon,
          titleKey: event.titleKey,
          descKey: event.descKey,
          mandatory: event.mandatory,
          choices: event.choices,
          fighter: check.fighter,
          fighterId: check.fighter.id,
          fighterName: check.fighter.fullName
        };
      }
    }
    return null;
  },

  applyChoice(event, choiceIndex, state) {
    const choice = event.choices[choiceIndex];
    if (!choice) return null;
    const fighter = state.fighters.find(f => f.id === event.fighterId);
    if (!fighter) return null;
    const resultKey = choice.apply(fighter, state);
    GameState.save();
    return resultKey;
  }
};
