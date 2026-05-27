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
        document.getElementById('rankings-content').innerHTML =
          this._renderWeightClassRankings(this.currentWeightClass, state);
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

    return `
      <!-- Champion Card -->
      ${champion ? `
        <div class="rankings-champion animate-fade-in-up ${playerFighterIds.includes(champion.id) ? 'card-accent' : ''}">
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
                <th>Nationality</th>
              </tr>
            </thead>
            <tbody>
              ${fullRankings.ranked.map((fighter, index) => {
                const isPlayer = playerFighterIds.includes(fighter.id);
                const rank = index + 1;
                const rankClass = rank <= 3 ? 'top-3' : rank <= 5 ? 'top-5' : '';
                const style = STYLES[fighter.style];

                return `
                  <tr class="${isPlayer ? 'highlighted' : ''}" style="animation: fadeInUp 0.3s ease ${index * 30}ms both;">
                    <td>
                      <span class="rank-number ${rankClass}">${rank}</span>
                    </td>
                    <td>
                      <div class="flex items-center gap-sm">
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
                    <td>${fighter.nationality?.flag || ''} ${fighter.nationality?.name || ''}</td>
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
  }
};
