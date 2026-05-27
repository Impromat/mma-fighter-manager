/* ============================================
   MMA Fighter Manager — Rankings View
   ============================================ */

const RankingsView = {
  currentWeightClass: 'lightweight',

  render(container) {
    const state = GameState.get();
    const activeClasses = Object.keys(state.rankings);

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">🏆 ${t('rank.title')}</h1>
          <div class="view-subtitle">${t('rank.subtitle')}</div>
        </div>
      </div>

      <!-- Weight Class Tabs -->
      <div class="tabs" id="weight-class-tabs">
        ${activeClasses.map(wcId => {
          const wc = WEIGHT_CLASSES.find(w => w.id === wcId);
          return `
            <div class="tab ${wcId === this.currentWeightClass ? 'active' : ''}"
                 data-wc="${wcId}">
              ${wc?.name || wcId}
            </div>
          `;
        }).join('')}
      </div>

      <div id="rankings-content">
        ${this._renderWeightClassRankings(this.currentWeightClass, state)}
      </div>
    `;

    // Tab switching
    container.querySelectorAll('#weight-class-tabs .tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentWeightClass = tab.dataset.wc;
        container.querySelectorAll('#weight-class-tabs .tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const content = document.getElementById('rankings-content');
        content.innerHTML = this._renderWeightClassRankings(this.currentWeightClass, GameState.get());
        this._bindRankingEvents(content);
      });
    });

    this._bindRankingEvents(container);
  },

  _bindRankingEvents(container) {
    // Click on fighter name to see analysis
    container.querySelectorAll('.ranking-fighter-clickable').forEach(el => {
      el.addEventListener('click', () => {
        const fighterId = el.dataset.fighterId;
        const isPlayer = el.dataset.isPlayer === 'true';
        const state = GameState.get();
        if (isPlayer) {
          const fighter = state.fighters.find(f => f.id === fighterId);
          if (fighter) FightersView._showFighterDetail(fighter, state);
        } else {
          const opponent = state.aiFighters.find(f => f.id === fighterId);
          if (opponent) App.showOpponentDetail(opponent);
        }
      });
    });

    // Propose fight button
    container.querySelectorAll('.rank-propose-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const opponentId = btn.dataset.opponentId;
        this._showProposeModal(opponentId);
      });
    });
  },

  _renderWeightClassRankings(wcId, state) {
    const fullRankings = LeagueEngine.getFullRankings(wcId, state);
    if (!fullRankings) return '<div class="card"><div class="empty-state">No rankings available</div></div>';

    const wc = WEIGHT_CLASSES.find(w => w.id === wcId);
    const champion = fullRankings.champion;

    // Find player fighters in this weight class
    const playerFighterIds = state.fighters.filter(f => f.weightClass === wcId).map(f => f.id);
    const hasAvailableFighter = state.fighters.some(f => 
      f.weightClass === wcId && LeagueEngine.canProposeFight(f, state).ok
    );

    return `
      <!-- Champion Card -->
      ${champion ? `
        <div class="rankings-champion animate-fade-in-up ranking-fighter-clickable ${playerFighterIds.includes(champion.id) ? 'card-accent' : ''}" 
             data-fighter-id="${champion.id}" data-is-player="${playerFighterIds.includes(champion.id)}" 
             style="cursor: pointer;">
          <div class="rankings-champion-belt">🏆</div>
          <div class="rankings-champion-info">
            <div class="rankings-champion-label">${wc?.name || ''} ${t('rank.champion')}</div>
            <div class="rankings-champion-name">
              ${champion.nationality?.flag || ''} ${champion.fullName}
              ${playerFighterIds.includes(champion.id) ? ` <span class="text-accent">(${t('rank.yourFighter')})</span>` : ''}
            </div>
            <div class="text-sm text-secondary mt-sm">
              ${STYLES[champion.style]?.icon || ''} ${STYLES[champion.style]?.name || ''} ·
              ${champion.wins}-${champion.losses} ·
              OVR ${TrainingEngine.calculateOverall(champion)}
            </div>
          </div>
          <div style="text-align: right;">
            <div class="text-3xl font-black" style="color: #ffd700;">C</div>
          </div>
        </div>
      ` : `
        <div class="rankings-champion">
          <div class="rankings-champion-belt">🏆</div>
          <div class="rankings-champion-info">
            <div class="rankings-champion-label">${wc?.name || ''} ${t('rank.champion')}</div>
            <div class="rankings-champion-name text-muted">${t('rank.vacant')}</div>
          </div>
        </div>
      `}

      <!-- Rankings Table -->
      <div class="card animate-fade-in-up stagger-2">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-icon">📊</span>
            ${wc?.name || ''} Division Rankings
          </div>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>${t('sidebar.fighters')}</th>
                <th>${t('fighters.style')}</th>
                <th>${t('fighters.record')}</th>
                <th>OVR</th>
                <th style="width: 120px;"></th>
              </tr>
            </thead>
            <tbody>
              ${fullRankings.ranked.map((fighter, index) => {
                const isPlayer = playerFighterIds.includes(fighter.id);
                const rank = index + 1;
                const rankClass = rank <= 3 ? 'top-3' : rank <= 5 ? 'top-5' : '';
                const style = STYLES[fighter.style];

                // Check if opponent is available for a challenge
                const opponentBooked = state.schedule.some(s => !s.completed && s.opponentId === fighter.id);
                const hasPendingChallenge = (state.outgoingChallenges || []).some(c => c.status === 'pending' && c.opponentId === fighter.id);
                const canChallenge = !isPlayer && hasAvailableFighter && !opponentBooked && !hasPendingChallenge;

                return `
                  <tr class="${isPlayer ? 'highlighted' : ''}" style="animation: fadeInUp 0.3s ease ${index * 30}ms both;">
                    <td>
                      <span class="rank-number ${rankClass}">${rank}</span>
                    </td>
                    <td>
                      <div class="flex items-center gap-sm ranking-fighter-clickable" 
                           data-fighter-id="${fighter.id}" data-is-player="${isPlayer}"
                           style="cursor: pointer;">
                        <div class="fighter-mini-avatar" style="background: ${fighter.avatarColor}; width: 30px; height: 30px; font-size: 10px;">
                          ${fighter.firstName[0]}${fighter.lastName[0]}
                        </div>
                        <div>
                          <div class="font-semibold">
                            ${fighter.fullName}
                            ${isPlayer ? '<span class="text-accent text-xs ml-sm">★</span>' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-style">${style?.icon || ''} ${style?.name || ''}</span>
                    </td>
                    <td class="font-semibold">${fighter.wins}-${fighter.losses}</td>
                    <td>
                      <span class="font-bold">${TrainingEngine.calculateOverall(fighter)}</span>
                    </td>
                    <td>
                      ${hasPendingChallenge ? `
                        <span class="badge badge-pending">⏳ ${t('match.pendingChallenge')}</span>
                      ` : canChallenge ? `
                        <button class="btn btn-ghost btn-xs rank-propose-btn" data-opponent-id="${fighter.id}">
                          ⚔️ ${t('match.propose')}
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${playerFighterIds.some(id => !fullRankings.ranked.some(r => r.id === id) && fullRankings.champion?.id !== id) ? `
          <div class="divider"></div>
          <div class="text-sm text-muted p-md">
            💡 Your unranked fighters in this division need to win fights to enter the rankings.
          </div>
        ` : ''}

        ${fullRankings.ranked.some(r => playerFighterIds.includes(r.id) && fullRankings.ranked.indexOf(r) < 3) ? `
          <div class="divider"></div>
          <div class="flex items-center gap-sm p-md" style="background: rgba(244, 162, 97, 0.06); border-radius: var(--radius-sm);">
            <span class="text-lg">⚡</span>
            <div>
              <div class="text-sm font-bold text-orange">Title Shot Available!</div>
              <div class="text-xs text-muted">Your fighter is in the Top 3 and eligible for a title fight!</div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  _showProposeModal(opponentId) {
    const state = GameState.get();
    const opponent = state.aiFighters.find(f => f.id === opponentId);
    if (!opponent) return;

    // Get player fighters in this weight class that can fight
    const candidates = state.fighters.filter(f => 
      f.weightClass === opponent.weightClass
    );

    const modalRoot = document.getElementById('modal-root');
    const opponentOvr = TrainingEngine.calculateOverall(opponent);
    const opponentRank = LeagueEngine.getFighterRanking(opponent.id, state);
    const opponentRankDisplay = opponentRank === 0 ? t('fighters.champion') : opponentRank ? `#${opponentRank}` : t('fighters.unranked');

    const candidateOptions = candidates.map(f => {
      const check = LeagueEngine.canProposeFight(f, state);
      const ovr = TrainingEngine.calculateOverall(f);
      const chance = check.ok ? LeagueEngine.getAcceptanceChance(f, opponent, state) : 0;
      const disabled = !check.ok;
      let statusText = '';
      if (!check.ok) {
        if (check.reason === 'injured') statusText = `🤕 ${t('fighters.injured')}`;
        else if (check.reason === 'cooldown') statusText = t('match.cooldown', { n: check.earliestWeek });
        else if (check.reason === 'booked') statusText = t('match.alreadyBooked');
        else if (check.reason === 'pendingChallenge') statusText = t('match.pendingChallenge');
      }

      return `
        <div class="propose-candidate ${disabled ? 'disabled' : ''}" data-fighter-id="${f.id}" ${disabled ? 'data-disabled="true"' : ''}>
          <div class="propose-candidate-info">
            <div class="fighter-mini-avatar" style="background: ${f.avatarColor}; width: 36px; height: 36px;">
              ${f.firstName[0]}${f.lastName[0]}
            </div>
            <div>
              <div class="font-semibold">${f.fullName}</div>
              <div class="text-xs text-muted">${f.wins}-${f.losses} · OVR ${ovr}</div>
            </div>
          </div>
          ${disabled ? `
            <div class="text-xs text-muted">${statusText}</div>
          ` : `
            <div class="propose-candidate-chance">
              <div class="propose-chance-val ${chance >= 70 ? 'high' : chance >= 40 ? 'mid' : 'low'}">${chance}%</div>
              <div class="text-xs text-muted">${t('match.acceptChance')}</div>
            </div>
          `}
        </div>
      `;
    }).join('');

    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal" style="max-width: 500px;">
          <div class="modal-header">
            <div class="modal-title">⚔️ ${t('match.proposeTitle')}</div>
            <button class="modal-close" id="close-propose-modal">✕</button>
          </div>
          <div class="modal-body">
            <div class="propose-target">
              <div class="propose-target-label">${t('match.propose')}</div>
              <div class="propose-target-fighter">
                <div class="fighter-mini-avatar" style="background: ${opponent.avatarColor}; width: 48px; height: 48px;">
                  ${opponent.firstName[0]}${opponent.lastName[0]}
                </div>
                <div>
                  <div class="font-bold text-lg">${opponent.fullName}</div>
                  <div class="text-sm text-muted">${opponent.wins}-${opponent.losses} · OVR ${opponentOvr} · ${opponentRankDisplay}</div>
                  <span class="badge badge-style mt-xs">${STYLES[opponent.style]?.icon} ${STYLES[opponent.style]?.name}</span>
                </div>
              </div>
            </div>

            <div class="propose-divider">VS</div>

            <div class="propose-select-label">${t('match.selectFighter')}</div>
            <div class="propose-candidates" id="propose-candidates">
              ${candidateOptions}
            </div>
          </div>
        </div>
      </div>
    `;

    // Close modal
    document.getElementById('close-propose-modal').addEventListener('click', () => {
      modalRoot.innerHTML = '';
    });
    modalRoot.querySelector('.modal-overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) modalRoot.innerHTML = '';
    });

    // Candidate selection
    document.querySelectorAll('.propose-candidate:not([data-disabled])').forEach(el => {
      el.addEventListener('click', () => {
        const fighterId = el.dataset.fighterId;
        const fighter = state.fighters.find(f => f.id === fighterId);
        if (!fighter) return;

        const challenge = LeagueEngine.createChallenge(fighterId, opponentId, state);
        if (challenge) {
          modalRoot.innerHTML = '';
          App.showToast(t('match.sent'), 'success');
          App.navigateTo('rankings');
        }
      });
    });
  }
};
