/* ============================================
   MMA Fighter Manager — Trash Talk Engine
   Calls the Cloudflare Worker to generate
   AI trash talk and judge exchanges.
   ============================================ */

const TrashTalkEngine = {

  WORKER_URL: 'https://mma-trashtalk.lhoste-mathieu.workers.dev',

  _fallbackProvoke: {
    fr: [
      "{name} parle beaucoup, mais son record parle encore plus fort.",
      "On se retrouve dans la cage samedi. J'espère qu'il est prêt.",
      "Je respecte {name}, mais dimanche soir c'est moi qui lève la main."
    ],
    en: [
      "{name} talks a lot, but his record speaks louder.",
      "See you in the cage on Saturday. Hope he's ready.",
      "I respect {name}, but Sunday night I'll be the one raising my hand."
    ]
  },

  /**
   * Get fighter summary for API context
   */
  _getFighterContext(fighter, state) {
    const stats = fighter.stats || {};
    const statNames = {
      striking: 'striking', grappling: 'grappling',
      submission: 'submission', wrestling: 'wrestling',
      cardio: 'cardio', chin: 'chin'
    };

    // Find top 2 strengths and main weakness
    const sorted = Object.entries(statNames)
      .map(([key]) => ({ key, val: stats[key] || 50 }))
      .sort((a, b) => b.val - a.val);

    const strengths = sorted.slice(0, 2).map(s => `${s.key} (${s.val})`).join(', ');
    const weakness = sorted[sorted.length - 1];

    const rank = LeagueEngine.getFighterRanking(fighter.id, state);

    return {
      name: fighter.fullName || fighter.firstName + ' ' + fighter.lastName,
      wins: fighter.wins || 0,
      losses: fighter.losses || 0,
      rank: rank,
      style: fighter.targetProfile || 'balanced',
      personality: fighter.personality || 'confident',
      strengths,
      weakness: `${weakness.key} (${weakness.val})`,
      winStreak: fighter.winStreak || 0,
      lossStreak: fighter.lossStreak || 0,
      koWins: fighter.koWins || 0,
      isChampion: fighter.isChampion || false
    };
  },

  /**
   * Get fight context for API
   */
  _getFightContext(playerFighter, opponent, scheduledFight, state) {
    const rivalry = (state.rivalries || []).find(r =>
      (r.playerId === playerFighter.id && r.opponentId === opponent.id) ||
      (r.playerId === opponent.id && r.opponentId === playerFighter.id)
    );

    const history = (state.schedule || [])
      .filter(s => s.completed && (
        (s.playerFighterId === playerFighter.id && s.opponentId === opponent.id) ||
        (s.playerFighterId === opponent.id && s.opponentId === playerFighter.id)
      ));

    let historyStr = null;
    if (history.length > 0) {
      const wins = history.filter(s => s.result?.winner === 'fighter1').length;
      historyStr = `${wins}W-${history.length - wins}L en ${history.length} combat(s)`;
    }

    return {
      isTitle: scheduledFight?.isTitle || false,
      rivalry: rivalry ? rivalry.intensity : null,
      history: historyStr
    };
  },

  /**
   * Generate AI fighter provocation (Cloudflare Worker → OpenAI)
   */
  async generateProvocation(playerFighter, opponentFighter, scheduledFight, state) {
    const lang = (state.lang || 'fr');
    const fighter = this._getFighterContext(playerFighter, state);
    const opponent = this._getFighterContext(opponentFighter, state);
    const context = this._getFightContext(playerFighter, opponentFighter, scheduledFight, state);

    try {
      const res = await fetch(`${this.WORKER_URL}/provoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fighter, opponent, context, lang })
      });

      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      return { text: data.trashtalk, source: 'llm' };

    } catch (e) {
      console.warn('TrashTalk API unavailable, using fallback:', e.message);
      const phrases = this._fallbackProvoke[lang] || this._fallbackProvoke.fr;
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      return {
        text: phrase.replace('{name}', fighter.name),
        source: 'fallback'
      };
    }
  },

  /**
   * Apply trash talk effects to game state
   */
  applyEffects(effects, playerFighter, opponentFighter, scheduledFight, state) {
    if (effects.playerMorale !== 0) {
      playerFighter.morale = Math.min(100, Math.max(10, playerFighter.morale + effects.playerMorale));
    }
    if (effects.opponentMorale !== 0 && opponentFighter) {
      opponentFighter.morale = Math.min(100, Math.max(10, (opponentFighter.morale || 70) + effects.opponentMorale));
    }

    // Hype: can now be < 1.0 (bad performance lowers hype)
    if (scheduledFight && effects.hypeMultiplier !== 1.0) {
      scheduledFight.hypeMultiplier = effects.hypeMultiplier;
    }

    // Mental bonus: can now be negative (mentalMalus from defeat)
    if (effects.mentalBonus !== 0) {
      playerFighter._mentalBonus = effects.mentalBonus;
    }

    if (effects.winner === 'fighter' || effects.score >= 7) {
      const rivalry = (state.rivalries || []).find(r =>
        (r.playerId === playerFighter.id && r.opponentId === opponentFighter?.id) ||
        (r.playerId === opponentFighter?.id && r.opponentId === playerFighter.id)
      );
      if (rivalry) rivalry.intensity = Math.min(5, (rivalry.intensity || 1) + 1);
    }

    return effects;
  }
};
