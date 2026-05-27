/* ============================================
   MMA Fighter Manager — Agenda View
   ============================================ */

const AgendaView = {
  render(container) {
    const state = GameState.get();
    const upcomingFights = state.schedule
      .filter(s => !s.completed && s.week >= state.week)
      .sort((a, b) => a.week - b.week);

    const pastFights = state.fightHistory.slice().reverse();

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">${t('agenda.title')}</h1>
          <div class="view-subtitle">${t('agenda.subtitle')}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <div class="tab active" data-tab="upcoming">📅 ${t('agenda.upcoming')}</div>
        <div class="tab" data-tab="history">📊 ${t('agenda.past')}</div>
      </div>

      <div id="agenda-content">
        ${this._renderUpcoming(upcomingFights, state)}
      </div>
    `;

    // Tab switching
    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const content = document.getElementById('agenda-content');
        if (tab.dataset.tab === 'upcoming') {
          content.innerHTML = this._renderUpcoming(upcomingFights, state);
        } else {
          content.innerHTML = this._renderHistory(pastFights, state);
          this._bindHistoryEvents();
        }
      });
    });
  },

  _renderUpcoming(fights, state) {
    if (fights.length === 0) {
      return `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">📅</div>
            <div class="empty-state-text">No upcoming fights scheduled.<br>Events happen every ${EVENT_INTERVAL} weeks.</div>
          </div>
        </div>
      `;
    }

    // Group by event week
    const grouped = {};
    fights.forEach(fight => {
      if (!grouped[fight.week]) {
        grouped[fight.week] = { eventName: fight.eventName, week: fight.week, fights: [] };
      }
      grouped[fight.week].fights.push(fight);
    });

    return Object.values(grouped).map(event => {
      const weeksAway = event.week - state.week;
      return `
        <div class="card mb-lg animate-fade-in-up">
          <div class="card-header">
            <div class="card-title">
              <span class="card-title-icon">🏟️</span>
              ${event.eventName}
            </div>
            <span class="badge ${weeksAway === 0 ? 'badge-camp' : 'badge-style'}">
              ${weeksAway === 0 ? `🔴 ${t('agenda.thisWeek')}` : t('agenda.weeksAway', { n: weeksAway })}
            </span>
          </div>

          ${event.fights.map(fight => {
            const fighter = state.fighters.find(f => f.id === fight.playerFighterId);
            const opponent = state.aiFighters.find(f => f.id === fight.opponentId);
            if (!fighter || !opponent) return '';

            const fighterOverall = TrainingEngine.calculateOverall(fighter);
            const opponentOverall = TrainingEngine.calculateOverall(opponent);
            const opponentStyle = STYLES[opponent.style];

            return `
              <div class="upcoming-fight" style="flex-direction: column; align-items: stretch;">
                <div class="flex items-center gap-lg">
                  <!-- Fighter 1 -->
                  <div style="flex: 1; text-align: center;">
                    <div class="fighter-mini-avatar" style="background: ${fighter.avatarColor}; margin: 0 auto; width: 48px; height: 48px;">
                      ${fighter.firstName[0]}${fighter.lastName[0]}
                    </div>
                    <div class="font-bold mt-sm">${fighter.fullName}</div>
                    <div class="text-xs text-muted">${fighter.wins}-${fighter.losses} · OVR ${fighterOverall}</div>
                    <span class="badge badge-style mt-sm">${STYLES[fighter.style].icon} ${STYLES[fighter.style].name}</span>
                  </div>

                  <!-- VS -->
                  <div style="text-align: center; flex-shrink: 0;">
                    <div class="text-2xl font-black text-accent">VS</div>
                    ${fight.isTitle ? '<div class="text-xs text-warning font-bold mt-sm">🏆 TITLE FIGHT</div>' : ''}
                  </div>

                  <!-- Fighter 2 -->
                  <div style="flex: 1; text-align: center;">
                    <div class="fighter-mini-avatar" style="background: ${opponent.avatarColor}; margin: 0 auto; width: 48px; height: 48px;">
                      ${opponent.firstName[0]}${opponent.lastName[0]}
                    </div>
                    <div class="font-bold mt-sm">${opponent.fullName}</div>
                    <div class="text-xs text-muted">${opponent.wins}-${opponent.losses} · OVR ${opponentOverall}</div>
                    <span class="badge badge-style mt-sm">${opponentStyle.icon} ${opponentStyle.name}</span>
                  </div>
                </div>

                ${fight.fightCamp ? `
                  <div class="flex items-center justify-center gap-sm mt-md">
                    <span class="badge badge-camp">${FIGHT_CAMP_TYPES[fight.fightCamp].icon} ${FIGHT_CAMP_TYPES[fight.fightCamp].name}</span>
                  </div>
                ` : `
                  <div class="text-center mt-md">
                    <button class="btn btn-orange btn-sm set-camp-btn" onclick="App.navigateTo('training')">
                      🏕️ Set Fight Camp
                    </button>
                  </div>
                `}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('');
  },

  _renderHistory(fights, state) {
    if (fights.length === 0) {
      return `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-text">No fight history yet. Time to book some fights!</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="card">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Result</th>
                <th>Fighter</th>
                <th>Opponent</th>
                <th>Method</th>
                <th>Round</th>
                <th>Week</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${fights.map(fight => {
                const isWin = fight.winner === 'fighter1';
                return `
                  <tr class="${isWin ? '' : 'highlighted'}">
                    <td>
                      <span class="badge ${isWin ? 'badge-win' : 'badge-loss'}">${isWin ? t('fighters.win') : t('fighters.loss')}</span>
                    </td>
                    <td class="font-semibold">${fight.fighter1.name}</td>
                    <td>${fight.fighter2.name}</td>
                    <td class="text-sm">${fight.method}</td>
                    <td class="text-sm">${fight.finishRound ? `R${fight.finishRound}` : 'Decision'}</td>
                    <td class="text-sm text-muted">${fight.week || '—'}</td>
                    <td>
                      <button class="btn btn-ghost btn-sm view-log-btn" data-fight-id="${fight.id}">
                        📋
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _bindHistoryEvents() {
    document.querySelectorAll('.view-log-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const state = GameState.get();
        const fightId = btn.dataset.fightId;
        const fight = state.fightHistory.find(f => f.id === fightId);
        if (fight) App.showFightLog(fight);
      });
    });
  }
};
