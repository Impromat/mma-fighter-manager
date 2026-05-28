/* ============================================
   MMA Fighter Manager — Fighters View
   ============================================ */

const FightersView = {
  selectedFighter: null,

  render(container) {
    const state = GameState.get();
    this.selectedFighter = null;

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">${t('fighters.title')}</h1>
          <div class="view-subtitle">${t('fighters.subtitle', { n: state.fighters.length })}</div>
        </div>
      </div>

      <div class="fighters-grid" id="fighters-grid">
        ${state.fighters.map((fighter, index) => this._renderFighterCard(fighter, state, index)).join('')}
      </div>

      <div id="fighter-detail-container"></div>
    `;

    // Bind click events
    container.querySelectorAll('.fighter-card').forEach(card => {
      card.addEventListener('click', () => {
        const fighterId = card.dataset.fighterId;
        const fighter = state.fighters.find(f => f.id === fighterId);
        if (fighter) this._showFighterDetail(fighter, state);
      });
    });
  },

  _renderFighterCard(fighter, state, index) {
    const overall = TrainingEngine.calculateOverall(fighter);
    const ranking = LeagueEngine.getFighterRanking(fighter.id, state);
    const weightClass = WEIGHT_CLASSES.find(wc => wc.id === fighter.weightClass);
    const style = STYLES[fighter.style];
    const rankDisplay = ranking === 0 ? '🏆 Champion' : ranking ? `#${ranking}` : '';

    // Top 2 stats
    const sortedStats = STAT_NAMES.map(s => ({ ...s, value: fighter.stats[s.id] }))
      .sort((a, b) => b.value - a.value);

    return `
      <div class="card card-interactive fighter-card animate-fade-in-up stagger-${index + 1}" data-fighter-id="${fighter.id}">
        <div class="fighter-card-header">
          <div class="fighter-avatar" style="background: ${fighter.avatarColor};">
            ${fighter.firstName[0]}${fighter.lastName[0]}
          </div>
          <div class="fighter-card-info">
            <div class="fighter-card-name">${fighter.fullName}</div>
            <div class="fighter-card-meta">
              <span>${fighter.nationality.flag}</span>
              <span>${weightClass?.name || ''}</span>
              <span>·</span>
              <span class="fighter-card-record">${fighter.wins}-${fighter.losses}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="text-2xl font-black" style="line-height: 1;">${overall}</div>
            <div class="text-xs text-muted">OVR</div>
          </div>
        </div>

        <div class="flex items-center gap-sm mb-md">
          <span class="badge badge-style">${style.icon} ${style.name}</span>
          ${fighter.status === 'available' ?
            `<span class="badge badge-available">${t('fighters.available')}</span>` :
            `<span class="badge badge-injured">🤕 ${t('fighters.injured')} · ${fighter.injuryWeeksLeft}${t('general.weeks').charAt(0)}</span>`
          }
          ${rankDisplay ? `<span class="badge badge-champion">${rankDisplay}</span>` : ''}
        </div>

        <div class="fighter-card-stats">
          ${sortedStats.slice(0, 4).map(stat => `
            <div class="fighter-mini-stat">
              <span>${stat.label}</span>
              <span class="fighter-mini-stat-value">${Math.round(stat.value)}</span>
            </div>
          `).join('')}
        </div>

        <div class="morale-bar" style="margin-top: var(--space-md);">
          <div class="morale-bar-fill" style="width: ${fighter.morale}%; background: ${
            fighter.morale >= 70 ? 'var(--color-success)' :
            fighter.morale >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'
          };"></div>
        </div>
        <div class="flex justify-between text-xs text-muted mt-sm">
          <span>${t('train.morale')}</span>
          <span>${fighter.morale}/100</span>
        </div>
      </div>
    `;
  },

  _showFighterDetail(fighter, state) {
    const modalRoot = document.getElementById('modal-root');
    const overall = TrainingEngine.calculateOverall(fighter);
    const ranking = LeagueEngine.getFighterRanking(fighter.id, state);
    const weightClass = WEIGHT_CLASSES.find(wc => wc.id === fighter.weightClass);
    const style = STYLES[fighter.style];
    const rankDisplay = ranking === 0 ? t('fighters.champion') : ranking ? `#${ranking}` : t('fighters.unranked');

    // Get fight history for this fighter
    const fightHistory = state.fightHistory.filter(
      f => f.fighter1.id === fighter.id || f.fighter2.id === fighter.id
    ).reverse().slice(0, 5);

    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div class="modal-title">${fighter.nationality.flag} ${fighter.fullName}</div>
            <button class="modal-close" id="close-fighter-detail">✕</button>
          </div>
          <div class="modal-body">
            <div class="fighter-detail">
              <!-- Left Sidebar -->
              <div class="fighter-detail-sidebar">
                <div class="card">
                  <div class="fighter-detail-avatar" style="background: ${fighter.avatarColor};">
                    ${fighter.firstName[0]}${fighter.lastName[0]}
                  </div>
                  <div class="fighter-detail-name">${fighter.fullName}</div>
                  <div class="fighter-detail-meta">${weightClass?.name || ''} · Age ${fighter.age}</div>
                  <div class="fighter-detail-badges">
                    <span class="badge badge-style">${style.icon} ${style.name}</span>
                    ${fighter.status === 'available' ?
                      `<span class="badge badge-available">${t('fighters.available')}</span>` :
                      `<span class="badge badge-injured">🤕 ${t('fighters.injured')}</span>`
                    }
                  </div>
                  <div class="fighter-info-grid">
                    <div class="fighter-info-item">
                      <span class="fighter-info-label">${t('fighters.overall')}</span>
                      <span class="fighter-info-value">${overall}</span>
                    </div>
                    <div class="fighter-info-item">
                      <span class="fighter-info-label">${t('fighters.ranking')}</span>
                      <span class="fighter-info-value text-orange">${rankDisplay}</span>
                    </div>
                    <div class="fighter-info-item">
                      <span class="fighter-info-label">${t('fighters.record')}</span>
                      <span class="fighter-info-value">${fighter.wins}-${fighter.losses}</span>
                    </div>
                    <div class="fighter-info-item">
                      <span class="fighter-info-label">${t('train.morale')}</span>
                      <span class="fighter-info-value" style="color: ${
                        fighter.morale >= 70 ? 'var(--color-success)' :
                        fighter.morale >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'
                      }">${fighter.morale}/100</span>
                    </div>
                    <div class="fighter-info-item">
                      <span class="fighter-info-label">Nationality</span>
                      <span class="fighter-info-value">${fighter.nationality.flag} ${fighter.nationality.name}</span>
                    </div>
                    <div class="fighter-info-item">
                      <span class="fighter-info-label">Training</span>
                      <span class="fighter-info-value text-sm">${TRAINING_TYPES[fighter.currentTraining]?.name || 'General'}</span>
                    </div>
                  </div>
                </div>

                <!-- Target Profile -->
                <div class="card">
                  <div class="card-title mb-md">🎯 Target Profile</div>
                  <select id="target-profile-select" class="w-full" style="padding: var(--space-sm);">
                    ${Object.values(STYLES).map(s => `
                      <option value="${s.id}" ${fighter.targetProfile === s.id ? 'selected' : ''}>
                        ${s.icon} ${s.name}
                      </option>
                    `).join('')}
                  </select>
                  <div class="text-xs text-muted mt-sm">
                    ${STYLES[fighter.targetProfile]?.description || ''}
                  </div>
                </div>
              </div>

              <!-- Main Content -->
              <div class="fighter-detail-main">
                <!-- Radar Chart -->
                <div class="card">
                  <div class="card-title mb-md">📊 Attributes</div>
                  <div class="radar-chart-container">
                    ${App.createRadarChart(fighter.stats)}
                  </div>
                </div>

                <!-- Stat Bars -->
                <div class="card">
                  <div class="card-title mb-md">📈 Detailed Stats</div>
                  ${STAT_NAMES.map(stat => {
                    const value = Math.round(fighter.stats[stat.id]);
                    const potential = fighter.potential[stat.id];
                    const level = TrainingEngine.getStatLevel(value);
                    return `
                      <div class="stat-bar-container">
                        <div class="stat-bar-label">${stat.icon} ${stat.label}</div>
                        <div class="stat-bar-track">
                          <div class="stat-bar-fill stat-${level}" style="width: ${value}%"></div>
                        </div>
                        <div class="stat-bar-value">${value}</div>
                      </div>
                    `;
                  }).join('')}
                </div>

                <!-- Fight History -->
                ${fightHistory.length > 0 ? `
                  <div class="card">
                    <div class="card-title mb-md">🥊 Fight History</div>
                    ${fightHistory.map(fight => {
                      const isF1 = fight.fighter1.id === fighter.id;
                      const isWin = (fight.winner === 'fighter1' && isF1) || (fight.winner === 'fighter2' && !isF1);
                      const opponentName = isF1 ? fight.fighter2.name : fight.fighter1.name;
                      return `
                        <div class="flex items-center gap-md p-sm" style="border-bottom: 1px solid var(--border-subtle);">
                          <span class="badge ${isWin ? 'badge-win' : 'badge-loss'}" style="width: 30px; justify-content: center;">${isWin ? t('fighters.win') : t('fighters.loss')}</span>
                          <div style="flex: 1;">
                            <div class="text-sm font-semibold">vs ${opponentName}</div>
                            <div class="text-xs text-muted">${fight.method}${fight.finishRound ? ` · R${fight.finishRound}` : ''} · Week ${fight.week || '?'}</div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind close
    document.getElementById('close-fighter-detail').addEventListener('click', () => {
      modalRoot.innerHTML = '';
    });

    // Bind overlay close
    modalRoot.querySelector('.modal-overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        modalRoot.innerHTML = '';
      }
    });

    // Bind target profile change
    document.getElementById('target-profile-select').addEventListener('change', (e) => {
      GameState.setTargetProfile(fighter.id, e.target.value);
      App.showToast(`Target profile updated for ${fighter.fullName}`, 'success');
    });
  }
};
