/* ============================================
   MMA Fighter Manager — Market View
   ============================================ */

const MarketView = {
  render(container) {
    const state = GameState.get();
    const freeAgents = state.freeAgents || [];
    const rosterCount = state.fighters.length;
    const rosterFull = rosterCount >= ROSTER_MAX;
    const gymScore = LeagueEngine.calculateGymAttractiveness(state);
    const weeksUntilRefresh = MARKET_CONFIG.refreshInterval - (state.week - (state.lastMarketRefresh || 0));

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">💱 ${t('market.title')}</h1>
          <div class="view-subtitle">${t('market.subtitle')}</div>
        </div>
        <div class="market-roster-badge">
          ${t('market.rosterCount', { n: rosterCount, max: ROSTER_MAX })}
        </div>
      </div>

      <!-- Gym Reputation -->
      <div class="card market-rep-card mb-lg">
        <div class="market-rep-header">
          <span class="market-rep-title">⭐ ${t('market.gymRep')}</span>
          <span class="market-rep-score">${t('market.repScore', { n: gymScore })}</span>
        </div>
        <div class="market-rep-bar-bg">
          <div class="market-rep-bar-fill" style="width: ${(gymScore / 15 * 100)}%"></div>
        </div>
        <div class="market-rep-details">
          ${this._renderRepDetails(state, gymScore)}
        </div>
        <div class="market-refresh-timer">
          🔄 ${t('market.refreshIn', { n: Math.max(0, weeksUntilRefresh) })}
        </div>
      </div>

      <!-- Free Agents -->
      <div class="market-section-title">🆓 ${t('market.freeAgents')}</div>
      <div class="market-agents-grid" id="market-agents-grid">
        ${freeAgents.length === 0
          ? `<div class="market-empty">${t('market.noAgents')}</div>`
          : freeAgents.map((agent, i) => this._renderAgentCard(agent, i, rosterFull, state.budget)).join('')
        }
      </div>

      <!-- My Roster -->
      <div class="market-section-title mt-xl">✂️ ${t('market.myRoster')}</div>
      <div class="market-roster-grid" id="market-roster-grid">
        ${state.fighters.map(f => this._renderRosterCard(f, state)).join('')}
      </div>
    `;

    this._bindEvents();
  },

  _renderRepDetails(state, score) {
    const budgetPts = Math.min(4, Math.floor(Math.max(0, state.budget) / 10000));
    const champions = state.fighters.filter(f => {
      const rankings = state.rankings[f.weightClass];
      return rankings && rankings.champion === f.id;
    }).length;
    const recentWins = (state.fightHistory || []).slice(-10).filter(fh => fh.winner === 'fighter1').length;
    const avgMorale = state.fighters.length > 0
      ? Math.round(state.fighters.reduce((s, f) => s + f.morale, 0) / state.fighters.length)
      : 0;

    return `
      <div class="market-rep-item">
        <span class="market-rep-item-icon">💰</span>
        <span>${t('market.repBudget')}</span>
        <span class="market-rep-item-value">+${budgetPts}</span>
      </div>
      <div class="market-rep-item">
        <span class="market-rep-item-icon">🏆</span>
        <span>${t('market.repChampions')}</span>
        <span class="market-rep-item-value">+${champions * 3}</span>
      </div>
      <div class="market-rep-item">
        <span class="market-rep-item-icon">🥊</span>
        <span>${t('market.repWins')}</span>
        <span class="market-rep-item-value">+${Math.min(5, recentWins)}</span>
      </div>
      <div class="market-rep-item">
        <span class="market-rep-item-icon">😊</span>
        <span>${t('market.repMorale')} (${avgMorale})</span>
        <span class="market-rep-item-value">+${avgMorale >= 80 ? 2 : avgMorale >= 70 ? 1 : 0}</span>
      </div>
    `;
  },

  _renderAgentCard(agent, index, rosterFull, budget) {
    const ovr = TrainingEngine.calculateOverall(agent);
    const wcData = WEIGHT_CLASSES.find(wc => wc.id === agent.weightClass);
    const styleData = STYLES[agent.style];
    const canAfford = budget >= agent.signingBonus;
    const disabled = rosterFull || !canAfford;

    return `
      <div class="market-agent-card card card-interactive animate-fade-in-up stagger-${(index % 5) + 1}">
        <div class="market-agent-top">
          <div class="fighter-avatar" style="background: ${agent.avatarColor};">
            ${agent.firstName[0]}${agent.lastName[0]}
          </div>
          <div class="market-agent-info">
            <div class="market-agent-name">${agent.fullName}</div>
            <div class="market-agent-meta">
              ${agent.nationality.flag} ${wcData ? wcData.name : ''} · ${agent.age} ans
            </div>
            <div class="market-agent-meta">
              <span style="color: ${styleData.color}">${styleData.icon} ${styleData.name}</span>
              · ${agent.wins}W-${agent.losses}L
            </div>
          </div>
          <div class="market-agent-ovr">
            <div class="market-agent-ovr-value">${ovr}</div>
            <div class="market-agent-ovr-label">OVR</div>
          </div>
        </div>

        <div class="market-agent-stats">
          ${STAT_NAMES.map(s => `
            <div class="market-agent-stat">
              <span class="market-agent-stat-label">${s.icon} ${s.short}</span>
              <div class="draft-stat-bar">
                <div class="draft-stat-fill" style="width: ${agent.stats[s.id]}%; background: ${
                  agent.stats[s.id] >= 70 ? 'var(--color-success)' :
                  agent.stats[s.id] >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)'
                }"></div>
              </div>
              <span class="market-agent-stat-val">${agent.stats[s.id]}</span>
            </div>
          `).join('')}
        </div>

        <div class="market-agent-costs">
          <div class="market-agent-cost">
            <span class="market-agent-cost-label">✍️ ${t('market.signingBonus')}</span>
            <span class="market-agent-cost-value">${FinanceEngine.formatMoney(agent.signingBonus)}</span>
          </div>
          <div class="market-agent-cost">
            <span class="market-agent-cost-label">📅 ${t('market.weeklySalary')}</span>
            <span class="market-agent-cost-value">${FinanceEngine.formatMoney(agent.weeklySalary)}/sem</span>
          </div>
        </div>

        <button class="btn btn-primary btn-sign-agent" data-agent-id="${agent.id}" ${disabled ? 'disabled' : ''}>
          ${rosterFull
            ? t('market.rosterFull', { n: ROSTER_MAX, max: ROSTER_MAX })
            : !canAfford
              ? t('market.cantAfford')
              : `✍️ ${t('market.sign')} — ${FinanceEngine.formatMoney(agent.signingBonus)}`
          }
        </button>
      </div>
    `;
  },

  _renderRosterCard(fighter, state) {
    const ovr = TrainingEngine.calculateOverall(fighter);
    const wcData = WEIGHT_CLASSES.find(wc => wc.id === fighter.weightClass);
    const styleData = STYLES[fighter.style];
    const severance = LeagueEngine.calculateSeverancePay(fighter, state);
    const hasFight = state.schedule.some(s => !s.completed && s.playerFighterId === fighter.id);

    return `
      <div class="market-roster-card card">
        <div class="market-roster-top">
          <div class="fighter-avatar" style="background: ${fighter.avatarColor};">
            ${fighter.firstName[0]}${fighter.lastName[0]}
          </div>
          <div class="market-roster-info">
            <div class="market-roster-name">${fighter.fullName}</div>
            <div class="market-roster-meta">
              ${fighter.nationality.flag} ${wcData ? wcData.name : ''} ·
              <span style="color: ${styleData.color}">${styleData.icon} ${styleData.name}</span>
            </div>
            <div class="market-roster-meta">
              OVR ${ovr} · ${fighter.wins}W-${fighter.losses}L · 😊 ${fighter.morale}
            </div>
          </div>
        </div>
        <div class="market-roster-actions">
          ${hasFight
            ? `<span class="market-roster-fight-badge">⚔️ Combat planifié</span>`
            : `<button class="btn btn-outline-danger btn-cut-fighter" data-fighter-id="${fighter.id}">
                ✂️ ${t('market.cut')} (${FinanceEngine.formatMoney(severance)})
              </button>`
          }
        </div>
      </div>
    `;
  },

  _bindEvents() {
    // Sign buttons
    document.querySelectorAll('.btn-sign-agent').forEach(btn => {
      btn.addEventListener('click', () => {
        const agentId = btn.dataset.agentId;
        const result = GameState.signFreeAgent(agentId);

        if (result && result.error === 'cantAfford') {
          App.showToast(t('market.cantAfford'), 'error');
        } else if (result && result.error === 'rosterFull') {
          App.showToast(t('market.rosterFull', { n: ROSTER_MAX, max: ROSTER_MAX }), 'error');
        } else if (result && result.fighter) {
          App.showToast(t('market.signedToast', {
            name: result.fighter.fullName,
            cost: FinanceEngine.formatMoney(result.cost)
          }), 'success');
          App.updateSidebar();
          App.navigateTo('market');
        }
      });
    });

    // Cut buttons
    document.querySelectorAll('.btn-cut-fighter').forEach(btn => {
      btn.addEventListener('click', () => {
        const fighterId = btn.dataset.fighterId;
        App.confirmCutFighter(fighterId);
      });
    });
  }
};
