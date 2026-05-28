/* ============================================
   MMA Fighter Manager — Trash Talk Engine
   Calls the Cloudflare Worker to generate
   AI trash talk and judge exchanges.
   ============================================ */

const TRASHTALK_WORKER_URL = 'https://mma-trashtalk.lhoste-mathieu.workers.dev';

// Fallback templates if API unavailable
const FALLBACK_PROVOKE = {
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
};

const TrashTalkEngine = {

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

    // Get fight history between these two
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
   * Returns provocation text
   */
  async generateProvocation(playerFighter, opponentFighter, scheduledFight, state) {
    const lang = (state.lang || 'fr');
    const fighter = this._getFighterContext(playerFighter, state);
    const opponent = this._getFighterContext(opponentFighter, state);
    const context = this._getFightContext(playerFighter, opponentFighter, scheduledFight, state);

    try {
      const res = await fetch(`${TRASHTALK_WORKER_URL}/provoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fighter, opponent, context, lang })
      });

      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      return { text: data.trashtalk, source: 'llm' };

    } catch (e) {
      console.warn('TrashTalk API unavailable, using fallback:', e.message);
      const phrases = FALLBACK_PROVOKE[lang] || FALLBACK_PROVOKE.fr;
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      return {
        text: phrase.replace('{name}', fighter.name),
        source: 'fallback'
      };
    }
  },

  /**
   * Judge a trash talk exchange (Cloudflare Worker → OpenAI)
   * Returns effects object: { winner, score, analysis, playerMorale, opponentMorale, hypeMultiplier, mentalBonus }
   */
  async judgeExchange(provocation, playerResponse, playerFighter, opponentFighter, scheduledFight, state) {
    const lang = (state.lang || 'fr');
    const fighter = this._getFighterContext(playerFighter, state);
    const opponent = this._getFighterContext(opponentFighter, state);
    const context = this._getFightContext(playerFighter, opponentFighter, scheduledFight, state);

    try {
      const res = await fetch(`${TRASHTALK_WORKER_URL}/judge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provocation, response: playerResponse, fighter, opponent, context, lang })
      });

      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();

      // Validate and clamp values
      return {
        winner: data.winner === 'fighter' ? 'fighter' : 'opponent',
        score: Math.min(10, Math.max(1, data.score || 5)),
        analysis: data.analysis || '',
        playerMorale: Math.min(5, Math.max(-5, data.playerMorale || 0)),
        opponentMorale: Math.min(3, Math.max(-3, data.opponentMorale || 0)),
        hypeMultiplier: Math.min(1.5, Math.max(1.0, data.hypeMultiplier || 1.0)),
        mentalBonus: Math.min(3, Math.max(0, data.mentalBonus || 0))
      };

    } catch (e) {
      console.warn('Judge API unavailable, using neutral result:', e.message);
      return {
        winner: 'draw',
        score: 5,
        analysis: '',
        playerMorale: 0,
        opponentMorale: 0,
        hypeMultiplier: 1.0,
        mentalBonus: 0
      };
    }
  },

  /**
   * Apply trash talk effects to game state
   */
  applyEffects(effects, playerFighter, opponentFighter, scheduledFight, state) {
    // Morale effects
    if (effects.playerMorale !== 0) {
      playerFighter.morale = Math.min(100, Math.max(10, playerFighter.morale + effects.playerMorale));
    }
    if (effects.opponentMorale !== 0 && opponentFighter) {
      opponentFighter.morale = Math.min(100, Math.max(10, (opponentFighter.morale || 70) + effects.opponentMorale));
    }

    // Hype multiplier: applies a bonus to the fight purse
    if (scheduledFight && effects.hypeMultiplier > 1.0) {
      scheduledFight.hypeMultiplier = effects.hypeMultiplier;
    }

    // Mental bonus: temporary combat advantage stored on fighter
    if (effects.mentalBonus > 0) {
      playerFighter._mentalBonus = effects.mentalBonus;
    }

    // Increase rivalry intensity
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
