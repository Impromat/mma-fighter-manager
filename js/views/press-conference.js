/* ============================================
   MMA Fighter Manager — Press Conference View
   Shown 1 week before a scheduled fight.
   Integrates with TrashTalkEngine (LLM).
   ============================================ */

const PressConferenceView = {

  /**
   * Check if a press conference should trigger this week
   * Returns the fight object or null
   */
  getFightDueForPressConference(state) {
    return state.schedule.find(fight =>
      !fight.completed &&
      !fight.pressConferenceDone &&
      fight.week - state.week === 1  // exactly 1 week before the fight
    ) || null;
  },

  /**
   * Show the press conference modal for a given fight
   * onClose: callback when the player is done
   */
  async show(fight, state, onClose) {
    const fighter = state.fighters.find(f => f.id === fight.playerFighterId);
    const opponent = state.aiFighters.find(f => f.id === fight.opponentId);
    if (!fighter || !opponent) { onClose(); return; }

    const modalRoot = document.getElementById('modal-root');
    const lang = state.lang || 'fr';

    // Show loading state first
    modalRoot.innerHTML = this._renderLoading(fighter, opponent, fight);

    // Generate provocation via LLM
    let provocationText = '';
    try {
      const result = await TrashTalkEngine.generateProvocation(fighter, opponent, fight, state);
      provocationText = result.text;
    } catch (e) {
      provocationText = lang === 'fr'
        ? `${opponent.fullName} préfère laisser ses poings parler samedi.`
        : `${opponent.fullName} lets his fists do the talking on Saturday.`;
    }

    // Store on fight for judge use later
    fight._provocation = provocationText;

    // Render full UI with provocation
    modalRoot.innerHTML = this._renderFull(fighter, opponent, fight, provocationText, lang);

    // Bind events
    this._bindEvents(fight, fighter, opponent, state, modalRoot, onClose);
  },

  _renderLoading(fighter, opponent, fight) {
    return `
      <div class="modal-overlay" id="pressconf-overlay">
        <div class="modal modal-lg" style="max-width:600px;">
          <div class="modal-header">
            <div class="modal-title">🎙️ Conférence de presse</div>
          </div>
          <div class="modal-body" style="text-align:center; padding: 60px 20px;">
            <div style="font-size:2rem; margin-bottom:16px;">⏳</div>
            <div style="color: var(--text-secondary);">
              ${opponent.fullName} prépare sa déclaration...
            </div>
          </div>
        </div>
      </div>`;
  },

  _renderFull(fighter, opponent, fight, provocation, lang) {
    const personalityIcon = {
      trashTalker: '🗣️', confident: '😤', humble: '🤝', quiet: '🤫'
    }[opponent.personality || 'confident'] || '🗣️';

    const personalityLabel = {
      trashTalker: 'Provocateur', confident: 'Confiant',
      humble: 'Respectueux', quiet: 'Taciturne'
    }[opponent.personality || 'confident'] || '';

    const fOvr = TrainingEngine.calculateOverall(fighter);
    const oOvr = TrainingEngine.calculateOverall(opponent);
    const fRank = LeagueEngine.getFighterRanking(fighter.id, GameState.get());
    const oRank = LeagueEngine.getFighterRanking(opponent.id, GameState.get());

    return `
      <div class="modal-overlay" id="pressconf-overlay">
        <div class="modal modal-lg animate-scale-in" style="max-width:640px;">

          <div class="modal-header" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-bottom: 1px solid rgba(255,100,50,0.3);">
            <div>
              <div class="modal-title">🎙️ Conférence de presse</div>
              <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">
                ${fight.eventName} — Dans 1 semaine
              </div>
            </div>
            ${fight.isTitle ? '<span class="badge badge-warning">🏆 TITLE FIGHT</span>' : ''}
          </div>

          <div class="modal-body" style="padding:0;">

            <!-- Matchup banner -->
            <div style="display:flex; align-items:center; gap:16px; padding:20px 24px; background:rgba(255,255,255,0.03); border-bottom:1px solid var(--border);">
              <div style="flex:1; text-align:center;">
                <div class="fighter-mini-avatar" style="background:${fighter.avatarColor}; margin:0 auto; width:52px; height:52px; font-size:1.1rem;">
                  ${fighter.firstName[0]}${fighter.lastName[0]}
                </div>
                <div style="font-weight:700; margin-top:8px;">${fighter.fullName}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary);">${fighter.wins}W-${fighter.losses}L · OVR ${fOvr}</div>
                <div style="font-size:0.75rem; color:var(--accent); margin-top:4px;">${fRank ? '#' + fRank : 'NR'}</div>
              </div>
              <div style="text-align:center; font-size:1.5rem; font-weight:900; color:var(--accent);">VS</div>
              <div style="flex:1; text-align:center;">
                <div class="fighter-mini-avatar" style="background:${opponent.avatarColor}; margin:0 auto; width:52px; height:52px; font-size:1.1rem;">
                  ${opponent.firstName[0]}${opponent.lastName[0]}
                </div>
                <div style="font-weight:700; margin-top:8px;">${opponent.fullName}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary);">${opponent.wins}W-${opponent.losses}L · OVR ${oOvr}</div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${oRank ? '#' + oRank : 'NR'}</div>
              </div>
            </div>

            <!-- Opponent provocation -->
            <div style="padding:20px 24px; border-bottom:1px solid var(--border);">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                <div class="fighter-mini-avatar" style="background:${opponent.avatarColor}; width:32px; height:32px; font-size:0.75rem; flex-shrink:0;">
                  ${opponent.firstName[0]}${opponent.lastName[0]}
                </div>
                <div>
                  <span style="font-weight:700;">${opponent.fullName}</span>
                  <span style="font-size:0.75rem; color:var(--text-secondary); margin-left:8px;">${personalityIcon} ${personalityLabel}</span>
                </div>
              </div>
              <div style="background:rgba(255,100,50,0.08); border-left:3px solid var(--accent); border-radius:0 8px 8px 0; padding:14px 16px; font-style:italic; line-height:1.6; color:var(--text-primary);">
                "${provocation}"
              </div>
            </div>

            <!-- Player response section -->
            <div style="padding:20px 24px;" id="response-section">
              <div style="font-weight:700; margin-bottom:12px; color:var(--text-primary);">
                💬 Comment ${fighter.firstName} répond ?
              </div>

              <textarea id="trash-talk-input" placeholder="Tape ta réponse... (ou laisse vide pour ignorer)" 
                style="width:100%; min-height:80px; background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:8px; padding:12px; color:var(--text-primary); font-size:0.9rem; resize:vertical; font-family:inherit; box-sizing:border-box;"
                maxlength="300"></textarea>

              <div style="display:flex; gap:8px; margin-top:12px;">
                <button id="pressconf-respond-btn" class="btn btn-orange" style="flex:1;">
                  🔥 Répondre
                </button>
                <button id="pressconf-ignore-btn" class="btn btn-ghost" style="flex:1;">
                  🤐 Ignorer
                </button>
              </div>
            </div>

            <!-- Verdict section (hidden initially) -->
            <div id="verdict-section" style="display:none; padding:20px 24px; border-top:1px solid var(--border);">
            </div>

          </div>
        </div>
      </div>`;
  },

  _bindEvents(fight, fighter, opponent, state, modalRoot, onClose) {
    const respond = async () => {
      const input = document.getElementById('trash-talk-input');
      const responseText = input?.value?.trim();
      if (!responseText) { this._ignore(fight, modalRoot, onClose); return; }

      // Disable buttons during API call
      document.getElementById('pressconf-respond-btn').disabled = true;
      document.getElementById('pressconf-respond-btn').textContent = '⏳ Analyse en cours...';

      try {
        const effects = await TrashTalkEngine.judgeExchange(
          fight._provocation, responseText, fighter, opponent, fight, state
        );

        // Apply effects
        TrashTalkEngine.applyEffects(effects, fighter, opponent, fight, state);
        fight.pressConferenceDone = true;
        fight._trashTalkEffects = effects;
        fight._playerResponse = responseText;
        GameState.save();

        // Show verdict
        this._showVerdict(effects, fighter, opponent, responseText, fight._provocation, modalRoot, onClose);

      } catch(e) {
        fight.pressConferenceDone = true;
        GameState.save();
        onClose();
      }
    };

    document.getElementById('pressconf-respond-btn')?.addEventListener('click', respond);
    document.getElementById('pressconf-ignore-btn')?.addEventListener('click', () => {
      this._ignore(fight, modalRoot, onClose);
    });

    // Enter key in textarea doesn't submit (user may want newlines)
  },

  _ignore(fight, modalRoot, onClose) {
    fight.pressConferenceDone = true;
    GameState.save();
    onClose();
  },

  _showVerdict(effects, fighter, opponent, response, provocation, modalRoot, onClose) {
    const verdictSection = document.getElementById('verdict-section');
    const responseSection = document.getElementById('response-section');
    if (!verdictSection || !responseSection) { onClose(); return; }

    responseSection.style.display = 'none';

    const playerWon = effects.winner === 'fighter';
    const hypeBonus = Math.round((effects.hypeMultiplier - 1) * 100);

    verdictSection.style.display = 'block';
    verdictSection.innerHTML = `
      <!-- Player's response shown -->
      <div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:16px;">
        <div class="fighter-mini-avatar" style="background:${fighter.avatarColor}; width:32px; height:32px; font-size:0.75rem; flex-shrink:0;">
          ${fighter.firstName[0]}${fighter.lastName[0]}
        </div>
        <div style="background:rgba(99,179,237,0.08); border-left:3px solid #63b3ed; border-radius:0 8px 8px 0; padding:12px 14px; font-style:italic; line-height:1.6; flex:1;">
          "${response}"
        </div>
      </div>

      <!-- Verdict -->
      <div style="background:${playerWon ? 'rgba(72,199,142,0.1)' : 'rgba(255,100,50,0.1)'}; border:1px solid ${playerWon ? 'rgba(72,199,142,0.3)' : 'rgba(255,100,50,0.3)'}; border-radius:10px; padding:16px;">
        <div style="font-size:1.2rem; font-weight:800; color:${playerWon ? '#48c78e' : 'var(--accent)'}; margin-bottom:8px;">
          ${playerWon ? '🏆 Tu as remporté le mind game !' : '😤 Santos a eu le dessus... pour l\'instant.'}
        </div>
        <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:12px; line-height:1.5;">
          ${effects.analysis}
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          ${effects.playerMorale !== 0 ? `<span class="badge ${effects.playerMorale > 0 ? 'badge-win' : 'badge-loss'}">Morale ${effects.playerMorale > 0 ? '+' : ''}${effects.playerMorale}</span>` : ''}
          ${effects.mentalBonus > 0 ? `<span class="badge badge-win">🧠 Bonus mental +${effects.mentalBonus}</span>` : ''}
          ${hypeBonus > 0 ? `<span class="badge badge-style">🔥 Hype +${hypeBonus}% (bourse)</span>` : ''}
          ${effects.opponentMorale < 0 ? `<span class="badge badge-win">😰 ${opponent.firstName} déstabilisé</span>` : ''}
        </div>
      </div>

      <button id="pressconf-close-btn" class="btn btn-orange" style="width:100%; margin-top:16px;">
        ⚔️ Prêt pour le combat !
      </button>
    `;

    document.getElementById('pressconf-close-btn')?.addEventListener('click', onClose);
  }
};
