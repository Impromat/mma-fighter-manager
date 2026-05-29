/* ============================================
   MMA Fighter Manager — Press Conference View
   Multi-turn trash talk exchange via LLM.
   Context-aware judging based on rivalry level.
   ============================================ */

const PressConferenceView = {

  MAX_ROUNDS: 4,

  getFightDueForPressConference(state) {
    return state.schedule.find(fight =>
      !fight.completed &&
      !fight.pressConferenceDone &&
      fight.week - state.week === 1
    ) || null;
  },

  async show(fight, state, onClose) {
    const fighter = state.fighters.find(f => f.id === fight.playerFighterId);
    const opponent = state.aiFighters.find(f => f.id === fight.opponentId);
    if (!fighter || !opponent) { onClose(); return; }

    const modalRoot = document.getElementById('modal-root');
    const lang = state.lang || 'fr';

    const exchangeState = {
      history: [],
      roundNumber: 1,
      intensityPeak: 0,
      fighter, opponent, fight, state, lang, onClose
    };

    this._renderShell(modalRoot, fighter, opponent, fight);

    this._setInputState(false, 'Chargement...');
    let firstProvocation;
    try {
      const result = await TrashTalkEngine.generateProvocation(fighter, opponent, fight, state);
      firstProvocation = result.text;
    } catch {
      firstProvocation = `Prépare-toi bien, ${fighter.firstName}. Ça va être long.`;
    }

    exchangeState.history.push({ role: 'opponent', text: firstProvocation });
    this._appendMessage('opponent', firstProvocation, opponent);
    this._setInputState(true, '');
    this._bindInputEvents(exchangeState, modalRoot);
  },

  _renderShell(modalRoot, fighter, opponent, fight) {
    const state = GameState.get();
    const fRank = LeagueEngine.getFighterRanking(fighter.id, state);
    const oRank = LeagueEngine.getFighterRanking(opponent.id, state);
    const personalityIcon = { trashTalker: '🗣️', confident: '😤', humble: '🤝', quiet: '🤫' }[opponent.personality || 'confident'] || '🗣️';

    modalRoot.innerHTML = `
      <div class="modal-overlay" id="pressconf-overlay">
        <div class="modal modal-lg animate-scale-in" style="max-width:640px; display:flex; flex-direction:column; max-height:85vh;">

          <div class="modal-header" style="background:linear-gradient(135deg,#1a1a2e,#16213e); border-bottom:1px solid rgba(255,100,50,0.3); flex-shrink:0;">
            <div>
              <div class="modal-title">🎙️ Conférence de presse</div>
              <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">
                ${fight.eventName} — Dans 1 semaine ${fight.isTitle ? '🏆' : ''}
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; font-size:0.75rem; color:var(--text-secondary);">
              🌡️ <span id="intensity-label">Calme</span>
              <div style="width:60px; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                <div id="intensity-fill" style="height:100%; width:0%; background:var(--accent); border-radius:3px; transition:width 0.5s;"></div>
              </div>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:12px; padding:14px 24px; background:rgba(255,255,255,0.03); border-bottom:1px solid var(--border); flex-shrink:0;">
            <div style="flex:1; text-align:center;">
              <div class="fighter-mini-avatar" style="background:${fighter.avatarColor}; margin:0 auto; width:40px; height:40px; font-size:0.9rem;">
                ${fighter.firstName[0]}${fighter.lastName[0]}
              </div>
              <div style="font-weight:700; font-size:0.85rem; margin-top:6px;">${fighter.firstName}</div>
              <div style="font-size:0.7rem; color:var(--text-secondary);">${fighter.wins}W-${fighter.losses}L · ${fRank ? '#'+fRank : 'NR'}</div>
            </div>
            <div style="text-align:center; font-weight:900; color:var(--accent);">VS</div>
            <div style="flex:1; text-align:center;">
              <div class="fighter-mini-avatar" style="background:${opponent.avatarColor}; margin:0 auto; width:40px; height:40px; font-size:0.9rem;">
                ${opponent.firstName[0]}${opponent.lastName[0]}
              </div>
              <div style="font-weight:700; font-size:0.85rem; margin-top:6px;">${opponent.firstName} ${personalityIcon}</div>
              <div style="font-size:0.7rem; color:var(--text-secondary);">${opponent.wins}W-${opponent.losses}L · ${oRank ? '#'+oRank : 'NR'}</div>
            </div>
          </div>

          <div id="pressconf-chat" style="flex:1; overflow-y:auto; padding:16px 24px; display:flex; flex-direction:column; gap:12px; min-height:120px;"></div>

          <div id="pressconf-input-area" style="padding:16px 24px; border-top:1px solid var(--border); flex-shrink:0;">
            <textarea id="trash-talk-input" placeholder="Réponds à ${opponent.firstName}... (ou ignore)"
              style="width:100%; min-height:70px; background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:8px; padding:10px 12px; color:var(--text-primary); font-size:0.875rem; resize:none; font-family:inherit; box-sizing:border-box;"
              maxlength="300"></textarea>
            <div style="display:flex; gap:8px; margin-top:10px;">
              <button id="pressconf-send-btn" class="btn btn-orange" style="flex:2;">🔥 Répliquer</button>
              <button id="pressconf-ignore-btn" class="btn btn-ghost" style="flex:1;">🤐 Terminer</button>
            </div>
          </div>

        </div>
      </div>`;
  },

  _appendMessage(role, text, speaker) {
    const chat = document.getElementById('pressconf-chat');
    if (!chat) return;

    const isOpponent = role === 'opponent';
    const msg = document.createElement('div');
    msg.style.cssText = `display:flex; align-items:flex-start; gap:10px; ${isOpponent ? '' : 'flex-direction:row-reverse;'}`;

    const bubbleColor = isOpponent
      ? 'background:rgba(255,100,50,0.08); border-left:3px solid var(--accent);'
      : 'background:rgba(99,179,237,0.08); border-left:3px solid #63b3ed;';

    msg.innerHTML = `
      <div class="fighter-mini-avatar" style="background:${speaker.avatarColor}; width:32px; height:32px; font-size:0.7rem; flex-shrink:0;">
        ${speaker.firstName[0]}${speaker.lastName[0]}
      </div>
      <div style="${bubbleColor} border-radius:0 8px 8px 0; padding:10px 14px; font-style:italic; line-height:1.6; font-size:0.875rem; max-width:85%; flex:1;">
        "${text}"
      </div>`;

    msg.style.opacity = '0';
    msg.style.transform = 'translateY(8px)';
    msg.style.transition = 'opacity 0.3s, transform 0.3s';
    chat.appendChild(msg);
    requestAnimationFrame(() => { msg.style.opacity = '1'; msg.style.transform = 'translateY(0)'; });
    chat.scrollTop = chat.scrollHeight;
  },

  _setInputState(enabled, placeholder) {
    const btn = document.getElementById('pressconf-send-btn');
    const input = document.getElementById('trash-talk-input');
    if (btn) { btn.disabled = !enabled; btn.textContent = enabled ? '🔥 Répliquer' : (placeholder || '⏳ ...'); }
    if (input) input.disabled = !enabled;
  },

  _updateIntensity(intensity) {
    const fill = document.getElementById('intensity-fill');
    const label = document.getElementById('intensity-label');
    if (!fill || !label) return;
    fill.style.width = `${intensity * 10}%`;
    fill.style.background = intensity >= 8 ? '#ff4444' : intensity >= 5 ? 'var(--accent)' : '#48c78e';
    const labels = ['Calme','Calme','Tendu','Tendu','Chaud','Chaud','Brûlant','Brûlant','🔥 Explosif','🔥 Explosif','💥 War'];
    label.textContent = labels[Math.min(10, Math.floor(intensity))] || 'Calme';
  },

  _bindInputEvents(exchangeState, modalRoot) {
    const send = async () => {
      const input = document.getElementById('trash-talk-input');
      const text = input?.value?.trim();

      if (!text) { this._finishExchange(exchangeState, modalRoot); return; }

      exchangeState.history.push({ role: 'player', text });
      this._appendMessage('player', text, exchangeState.fighter);
      if (input) input.value = '';
      this._setInputState(false, '⏳ En train de répondre...');

      const { history, fighter, opponent, fight, state, lang } = exchangeState;

      if (exchangeState.roundNumber >= this.MAX_ROUNDS) {
        this._finishExchange(exchangeState, modalRoot);
        return;
      }

      try {
        const fCtx = TrashTalkEngine._getFighterContext(fighter, state);
        const oCtx = TrashTalkEngine._getFighterContext(opponent, state);
        const context = TrashTalkEngine._getFightContext(fighter, opponent, fight, state);

        const res = await fetch(TrashTalkEngine.WORKER_URL + '/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ history, fighter: fCtx, opponent: oCtx, context, roundNumber: ++exchangeState.roundNumber, lang })
        });

        const data = await res.json();
        exchangeState.intensityPeak = Math.max(exchangeState.intensityPeak, data.intensity || 5);
        this._updateIntensity(data.intensity || 5);

        if (data.opponentReply) {
          await new Promise(r => setTimeout(r, 800));
          exchangeState.history.push({ role: 'opponent', text: data.opponentReply });
          this._appendMessage('opponent', data.opponentReply, opponent);
        }

        if (data.shouldContinue && exchangeState.roundNumber < this.MAX_ROUNDS) {
          this._setInputState(true, '');
        } else {
          await new Promise(r => setTimeout(r, 600));
          this._finishExchange(exchangeState, modalRoot);
        }
      } catch {
        this._finishExchange(exchangeState, modalRoot);
      }
    };

    document.getElementById('pressconf-send-btn')?.addEventListener('click', send);
    document.getElementById('pressconf-ignore-btn')?.addEventListener('click', () => this._finishExchange(exchangeState, modalRoot));
  },

  async _finishExchange(exchangeState, modalRoot) {
    const { history, fighter, opponent, fight, state, lang, onClose } = exchangeState;

    fight.pressConferenceDone = true;

    const hasPlayerMessages = history.some(m => m.role === 'player');
    if (!hasPlayerMessages) { GameState.save(); onClose(); return; }

    // Show judging state
    const area = document.getElementById('pressconf-input-area');
    if (area) area.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary);">⏳ Le jury analyse l'échange...</div>`;

    try {
      const fCtx = TrashTalkEngine._getFighterContext(fighter, state);
      const oCtx = TrashTalkEngine._getFighterContext(opponent, state);
      const context = TrashTalkEngine._getFightContext(fighter, opponent, fight, state);

      const res = await fetch(TrashTalkEngine.WORKER_URL + '/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, fighter: fCtx, opponent: oCtx, context, lang })
      });

      const effects = await res.json();

      const safeEffects = {
        winner: ['fighter','opponent','draw'].includes(effects.winner) ? effects.winner : 'opponent',
        score: Math.min(10, Math.max(1, effects.score || 5)),
        analysis: effects.analysis || '',
        playerMorale: Math.min(5, Math.max(-5, effects.playerMorale || 0)),
        opponentMorale: Math.min(5, Math.max(-5, effects.opponentMorale || 0)),
        hypeMultiplier: Math.min(1.6, Math.max(0.85, effects.hypeMultiplier || 1.0)),
        mentalBonus: Math.min(3, Math.max(-2, effects.mentalBonus || 0)),
        showFactor: Math.min(10, Math.max(1, effects.showFactor || 5)),
        playerError: effects.playerError || null,
        coaching: effects.coaching || null
      };

      // ── Rank-based difficulty scaling ──
      // If opponent is significantly better ranked, it's harder to dominate
      const playerRank = LeagueEngine.getFighterRanking(fighter.id, state);
      const opponentRank = LeagueEngine.getFighterRanking(opponent.id, state);
      const pRank = playerRank === null ? 20 : playerRank;
      const oRank = opponentRank === null ? 20 : opponentRank;
      const rankGap = pRank - oRank; // positive = opponent is better ranked

      if (rankGap > 3) {
        // Opponent much better ranked → penalize player score
        safeEffects.score = Math.max(1, safeEffects.score - Math.min(3, Math.floor(rankGap / 3)));
        if (safeEffects.winner === 'fighter' && safeEffects.score < 6) {
          safeEffects.winner = 'draw';
        }
      }

      // ── Defeat penalties — real consequences ──
      if (safeEffects.winner === 'opponent') {
        safeEffects.playerMorale = Math.min(-2, safeEffects.playerMorale);
        safeEffects.mentalBonus = Math.min(-1, safeEffects.mentalBonus);
        safeEffects.opponentMorale = Math.max(2, safeEffects.opponentMorale);
        // Bad hype if terrible score
        if (safeEffects.score <= 3) {
          safeEffects.hypeMultiplier = Math.min(0.95, safeEffects.hypeMultiplier);
        }
      }

      // ── Victory validation — must earn it ──
      if (safeEffects.winner === 'fighter' && safeEffects.score < 6) {
        safeEffects.winner = 'draw';
      }

      TrashTalkEngine.applyEffects(safeEffects, fighter, opponent, fight, state);
      fight._trashTalkEffects = safeEffects;
      GameState.save();

      this._showVerdict(safeEffects, fighter, opponent, exchangeState.roundNumber, onClose);


    } catch {
      GameState.save();
      onClose();
    }
  },

  _showVerdict(effects, fighter, opponent, rounds, onClose) {
    const area = document.getElementById('pressconf-input-area');
    if (!area) { onClose(); return; }

    const isDraw = effects.winner === 'draw';
    const playerWon = effects.winner === 'fighter';
    const hypeBonus = Math.round((effects.hypeMultiplier - 1) * 100);
    const roundsLabel = rounds <= 1 ? '1 round' : `${rounds} rounds`;
    const showFactor = effects.showFactor || 5;

    let headerColor, headerBorder, headerTitle;
    if (isDraw) {
      headerColor = 'rgba(99,179,237,0.1)'; headerBorder = 'rgba(99,179,237,0.3)';
      headerTitle = '🎭 Échange équilibré — mais quel show !';
    } else if (playerWon) {
      headerColor = 'rgba(72,199,142,0.1)'; headerBorder = 'rgba(72,199,142,0.3)';
      headerTitle = '🏆 Tu as remporté la conférence de presse !';
    } else {
      headerColor = 'rgba(255,100,50,0.1)'; headerBorder = 'rgba(255,100,50,0.3)';
      headerTitle = `😤 ${opponent.firstName} a pris le dessus... pour l'instant.`;
    }

    const errorLabels = {
      insultes_gratuites: '⚠️ Insultes sans faits — tu as motivé ton adversaire gratuitement',
      trop_arrogant: '⚠️ Trop arrogant pour ton niveau — le public ne te croit pas',
      hors_sujet: '⚠️ Réponse hors sujet — tu n\'as pas saisi l\'ouverture',
      promesse_impossible: '⚠️ Promesse impossible — ça reviendra te hanter si tu perds'
    };
    const errorMsg = errorLabels[effects.playerError] || null;

    area.innerHTML = `
      <div style="background:${headerColor}; border:1px solid ${headerBorder}; border-radius:10px; padding:16px; margin-bottom:12px;">
        <div style="font-size:1rem; font-weight:800; color:${playerWon ? '#48c78e' : isDraw ? '#63b3ed' : 'var(--accent)'}; margin-bottom:6px;">
          ${headerTitle}
        </div>
        <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:10px; line-height:1.5;">
          ${effects.analysis}
        </div>

        ${errorMsg ? `
          <div style="background:rgba(255,180,0,0.1); border-left:3px solid #f5a623; border-radius:0 6px 6px 0; padding:8px 12px; margin-bottom:10px; font-size:0.8rem; color:#f5a623;">
            ${errorMsg}
          </div>` : ''}

        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:${effects.coaching ? '10px' : '0'};">
          <span style="font-size:0.7rem; color:var(--text-muted);">📊 ${roundsLabel} · Score ${effects.score}/10 · Show ${showFactor}/10</span>
          ${effects.playerMorale > 0 ? `<span class="badge badge-win">Morale +${effects.playerMorale}</span>` : ''}
          ${effects.playerMorale < 0 ? `<span class="badge badge-loss">Morale ${effects.playerMorale}</span>` : ''}
          ${effects.mentalBonus > 0 ? `<span class="badge badge-win">🧠 Mental +${effects.mentalBonus}</span>` : ''}
          ${effects.mentalBonus < 0 ? `<span class="badge badge-loss">🧠 Mental ${effects.mentalBonus}</span>` : ''}
          ${hypeBonus > 0 ? `<span class="badge badge-style">🔥 Hype +${hypeBonus}%</span>` : ''}
          ${hypeBonus < 0 ? `<span class="badge badge-loss">📉 Hype ${hypeBonus}%</span>` : ''}
          ${effects.opponentMorale < 0 ? `<span class="badge badge-win">😰 ${opponent.firstName} déstabilisé</span>` : ''}
          ${effects.opponentMorale > 0 ? `<span class="badge badge-loss">💪 ${opponent.firstName} motivé</span>` : ''}
          ${isDraw && showFactor >= 7 ? `<span class="badge badge-style">🎭 Show légendaire</span>` : ''}
        </div>

        ${effects.coaching ? `
          <div style="background:rgba(255,255,255,0.04); border-radius:8px; padding:10px 12px; font-size:0.78rem; color:var(--text-secondary);">
            💡 <strong style="color:var(--text-primary);">Coach :</strong> ${effects.coaching}
          </div>` : ''}
      </div>
      <button id="pressconf-close-btn" class="btn btn-orange" style="width:100%;">
        ⚔️ Prêt pour le combat !
      </button>`;

    document.getElementById('pressconf-close-btn')?.addEventListener('click', onClose);
    const chat = document.getElementById('pressconf-chat');
    if (chat) chat.scrollTop = chat.scrollHeight;
  }
};
