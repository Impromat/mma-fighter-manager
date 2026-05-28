/* ============================================
   MMA Fighter Manager — Dashboard View
   ============================================ */

const DashboardView = {
  render(container) {
    const state = GameState.get();
    const summary = FinanceEngine.getWeeklySummary(state);
    const upcomingFights = state.schedule.filter(s => !s.completed && s.week >= state.week).slice(0, 3);
    const recentResults = state.fightHistory.slice(-3).reverse();
    const injuredCount = state.fighters.filter(f => f.status === 'injured').length;

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">${t('dash.title')}</h1>
          <div class="view-subtitle">${t('dash.weekLabel', { n: state.week, gym: state.gymName })}</div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="dashboard-summary-cards">
        <div class="card summary-card animate-fade-in-up stagger-1">
          <div class="summary-card-label">${t('dash.budget')}</div>
          <div class="summary-card-value ${state.budget < 0 ? 'text-danger' : 'text-success'}">
            ${FinanceEngine.formatMoney(state.budget)}
          </div>
          <div class="summary-card-detail">
            ${summary.net >= 0 ? `<span class="text-success">+${FinanceEngine.formatMoney(summary.net)}</span>` :
              `<span class="text-danger">${FinanceEngine.formatMoney(summary.net)}</span>`} ${t('dash.lastWeek')}
          </div>
        </div>

        <div class="card summary-card animate-fade-in-up stagger-2">
          <div class="summary-card-label">${t('dash.fighters')}</div>
          <div class="summary-card-value">${state.fighters.length}</div>
          <div class="summary-card-detail">
            ${state.fighters.filter(f => f.status === 'available').length} ${t('dash.available')}
            ${injuredCount > 0 ? `· <span class="text-danger">${injuredCount} ${t('dash.injured')}</span>` : ''}
          </div>
        </div>

        <div class="card summary-card animate-fade-in-up stagger-3">
          <div class="summary-card-label">${t('dash.record')}</div>
          <div class="summary-card-value">
            ${state.fighters.reduce((s, f) => s + f.wins, 0)}-${state.fighters.reduce((s, f) => s + f.losses, 0)}
          </div>
          <div class="summary-card-detail">${t('dash.gymRecord')}</div>
        </div>

        <div class="card summary-card animate-fade-in-up stagger-4">
          <div class="summary-card-label">${t('dash.nextEvent')}</div>
          <div class="summary-card-value">
            ${this._getNextEventWeek(state) ? `${t('sidebar.week', { n: this._getNextEventWeek(state) })}` : '—'}
          </div>
          <div class="summary-card-detail">
            ${this._getNextEventWeek(state) ? t('dash.weeksAway', { n: this._getNextEventWeek(state) - state.week }) : t('dash.noEvents')}
          </div>
        </div>

        <div class="card summary-card animate-fade-in-up stagger-5">
          <div class="summary-card-label">⭐ ${t('dash.reputation')}</div>
          <div class="summary-card-value rep-value-${(state.reputation || 50) >= 75 ? 'high' : (state.reputation || 50) >= 35 ? 'mid' : 'low'}">
            ${state.reputation || 50}/100
          </div>
          <div class="summary-card-detail">
            <div class="rep-bar-mini">
              <div class="rep-bar-mini-fill rep-fill-${(state.reputation || 50) >= 75 ? 'high' : (state.reputation || 50) >= 35 ? 'mid' : 'low'}" style="width: ${state.reputation || 50}%;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Season Objectives (full width) -->
      ${this._renderSeasonObjectives(state)}

      <!-- Main Grid -->
      <div class="dashboard-main">
        <!-- Left Column -->
        <div>
          <!-- Fighter Status -->
          <div class="card mb-lg animate-fade-in-up stagger-5">
            <div class="card-header">
              <div class="card-title">
                <span class="card-title-icon">🥊</span>
                ${t('dash.fighterStatus')}
              </div>
              <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('fighters')">${t('dash.viewAll')}</button>
            </div>
            <div class="dashboard-fighters-mini">
              ${state.fighters.map(fighter => this._renderFighterMiniRow(fighter, state)).join('')}
            </div>
          </div>

          <!-- Recent Results -->
          ${recentResults.length > 0 ? `
            <div class="card animate-fade-in-up stagger-7">
              <div class="card-header">
                <div class="card-title">
                  <span class="card-title-icon">📊</span>
                  ${t('dash.recentResults')}
                </div>
              </div>
              ${recentResults.map(result => this._renderRecentResult(result)).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Right Column -->
        <div>
          <!-- Upcoming Fights -->
          <div class="card mb-lg animate-fade-in-up stagger-6">
            <div class="card-header">
              <div class="card-title">
                <span class="card-title-icon">📅</span>
                ${t('dash.upcomingFights')}
              </div>
            </div>
            ${upcomingFights.length > 0 ? upcomingFights.map(fight => this._renderUpcomingFight(fight, state)).join('') : `
              <div class="empty-state" style="padding: var(--space-lg);">
                <div class="text-muted text-sm">${t('dash.noUpcoming')}</div>
              </div>
            `}
          </div>

          <!-- Alerts -->
          ${this._renderAlerts(state)}

          <!-- Quick Actions -->
          <div class="card animate-fade-in-up stagger-8">
            <div class="card-header">
              <div class="card-title">
                <span class="card-title-icon">⚡</span>
                ${t('dash.quickActions')}
              </div>
            </div>
            <div class="flex flex-col gap-sm">
              <button class="btn btn-secondary btn-block" onclick="App.navigateTo('training')">
                ${t('dash.setTraining')}
              </button>
              <button class="btn btn-secondary btn-block" onclick="App.navigateTo('rankings')">
                ${t('dash.viewRankings')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Fight Offers (bottom) -->
      ${this._renderOffers(state)}
    `;

    // Bind offer button events
    this._bindOfferEvents(container);
  },

  _renderFighterMiniRow(fighter, state) {
    const overall = TrainingEngine.calculateOverall(fighter);
    const ranking = LeagueEngine.getFighterRanking(fighter.id, state);
    const rankDisplay = ranking === 0 ? '🏆 C' : ranking ? `#${ranking}` : 'NR';
    const weightClass = WEIGHT_CLASSES.find(wc => wc.id === fighter.weightClass);

    return `
      <div class="fighter-mini-row" onclick="App.navigateTo('fighters')">
        <div class="fighter-mini-avatar" style="background: ${fighter.avatarColor};">
          ${fighter.firstName[0]}${fighter.lastName[0]}
        </div>
        <div class="fighter-mini-info">
          <div class="fighter-mini-name">${fighter.fullName}</div>
          <div class="fighter-mini-detail">
            ${weightClass?.name || ''} · ${fighter.wins}-${fighter.losses} · OVR ${overall}
            ${ranking !== null ? `· <span class="text-orange">${rankDisplay}</span>` : ''}
          </div>
        </div>
        <div class="fighter-mini-status">
          ${fighter.status === 'available' ?
            `<span class="badge badge-available">${t('dash.ready')}</span>` :
            `<span class="badge badge-injured">🤕 ${fighter.injuryWeeksLeft}${t('general.weeks').charAt(0)}</span>`
          }
        </div>
      </div>
    `;
  },

  _renderUpcomingFight(fight, state) {
    const fighter = state.fighters.find(f => f.id === fight.playerFighterId);
    const opponent = state.aiFighters.find(f => f.id === fight.opponentId);
    if (!fighter || !opponent) return '';

    const weeksUntil = fight.week - state.week;
    const isInjured = fighter.status === 'injured';
    const injuryWarning = isInjured && fighter.injuryWeeksLeft > weeksUntil;

    return `
      <div class="upcoming-fight ${injuryWarning ? 'upcoming-fight-danger' : ''}">
        <div class="upcoming-fight-vs">${t('general.vs')}</div>
        <div class="upcoming-fight-info" style="flex:1;">
          <div class="upcoming-fight-names">
            ${fighter.fullName} vs <span class="text-secondary">${opponent.fullName}</span>
          </div>
          <div class="upcoming-fight-details">
            ${t('sidebar.week', { n: fight.week })} · ${fight.eventName}
            ${fight.isTitle ? ` · <span class="text-warning">${t('dash.titleFight')}</span>` : ''}
            ${fight.fightCamp ? ` · <span class="badge badge-camp">${t('dash.camp')}: ${FIGHT_CAMP_TYPES[fight.fightCamp].name}</span>` : ''}
          </div>
          ${injuryWarning ? `
            <div class="text-danger text-xs mt-xs" style="font-weight:600;">
              ⚠️ ${t('dash.injuredForFight', { name: fighter.fullName, n: fighter.injuryWeeksLeft })}
            </div>
          ` : ''}
        </div>
        <button class="btn btn-ghost btn-sm withdraw-fight-btn" data-fight-id="${fight.id}" title="${t('dash.withdraw')}" style="color: var(--accent-red); flex-shrink:0;">
          ✕ ${t('dash.withdraw')}
        </button>
      </div>
    `;
  },

  _renderRecentResult(result) {
    const isWin = result.winner === 'fighter1';
    return `
      <div class="flex items-center gap-md p-sm" style="border-bottom: 1px solid var(--border-subtle);">
        <span class="badge ${isWin ? 'badge-win' : 'badge-loss'}" style="width: 30px; justify-content: center;">${isWin ? t('fighters.win') : t('fighters.loss')}</span>
        <div style="flex: 1;">
          <div class="text-sm font-semibold">${result.fighter1.name} vs ${result.fighter2.name}</div>
          <div class="text-xs text-muted">${result.method}${result.finishRound ? ` · R${result.finishRound}` : ''}</div>
        </div>
      </div>
    `;
  },

  _renderAlerts(state) {
    const alerts = [];

    if (state.budget < 5000 && state.budget >= 0) {
      alerts.push({ type: 'warning', message: t('dash.lowBudget') });
    }
    if (state.budget < 0) {
      alerts.push({ type: 'danger', message: t('dash.negativeBudget', { n: 4 - state.negativeBudgetWeeks }) });
    }

    const injuredFighters = state.fighters.filter(f => f.status === 'injured');
    injuredFighters.forEach(f => {
      alerts.push({ type: 'info', message: t('dash.fighterInjured', { name: f.fullName, n: f.injuryWeeksLeft }) });
    });

    const lowMorale = state.fighters.filter(f => f.morale < 40);
    lowMorale.forEach(f => {
      alerts.push({ type: 'warning', message: t('dash.lowMorale', { name: f.fullName, n: f.morale }) });
    });

    if (alerts.length === 0) return '';

    return `
      <div class="card mb-lg animate-fade-in-up stagger-7">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-icon">🔔</span>
            ${t('dash.alerts')}
          </div>
        </div>
        ${alerts.map(a => `
          <div class="flex items-center gap-sm p-sm text-sm" style="color: var(--color-${a.type});">
            ${a.message}
          </div>
        `).join('')}
      </div>
    `;
  },

  _getNextEventWeek(state) {
    const upcoming = state.schedule.filter(s => !s.completed && s.week >= state.week);
    if (upcoming.length > 0) {
      return Math.min(...upcoming.map(s => s.week));
    }
    // Check pending offers
    const pendingOffers = (state.fightOffers || []).filter(o => o.status === 'pending');
    if (pendingOffers.length > 0) {
      return Math.min(...pendingOffers.map(o => o.fightWeek));
    }
    return null;
  },

  // ==============================
  // Fight Offers
  // ==============================

  _renderOffers(state) {
    const pendingOffers = (state.fightOffers || []).filter(o => o.status === 'pending');
    if (pendingOffers.length === 0) return '';

    const offersHTML = pendingOffers.map((offer, idx) => {
      const fighter = state.fighters.find(f => f.id === offer.fighterId);
      const opponent = state.aiFighters.find(f => f.id === offer.opponentId);
      if (!fighter || !opponent) return '';

      const opponentOvr = TrainingEngine.calculateOverall(opponent);
      const fighterOvr = TrainingEngine.calculateOverall(fighter);
      const opponentStyle = STYLES[opponent.style];
      const ovrDiff = opponentOvr - fighterOvr;
      const ovrClass = ovrDiff > 5 ? 'text-danger' : ovrDiff < -5 ? 'text-success' : 'text-secondary';
      const rankDisplay = offer.opponentRank !== null ? t('offer.vsRank', { n: offer.opponentRank }) : t('offer.vsUnranked');
      const fighterRank = LeagueEngine.getFighterRanking(fighter.id, state);
      const weeksLeft = offer.expiresWeek - state.week;
      const prepWeeks = offer.fightWeek - state.week - OFFER_CONFIG.decisionWindow;
      const reasonKey = offer.reason ? `match.reason.${offer.reason}` : 'match.reason.ranking';

      return `
        <div class="offer-card animate-fade-in-up" style="animation-delay: ${idx * 100}ms;" data-offer-id="${offer.id}">
          <div class="offer-reason-badge">${t(reasonKey)}</div>
          ${offer.isTitle ? `<div class="offer-badge-title">${t('offer.titleFight')}</div>` : ''}

          <div class="offer-matchup">
            <div class="offer-fighter offer-fighter-clickable" data-fighter-id="${fighter.id}" data-is-player="true">
              <div class="fighter-mini-avatar" style="background: ${fighter.avatarColor}; width: 44px; height: 44px;">
                ${fighter.firstName[0]}${fighter.lastName[0]}
              </div>
              <div class="offer-fighter-name">${fighter.fullName}</div>
              <div class="offer-fighter-meta">${fighter.wins}-${fighter.losses} · OVR ${fighterOvr}</div>
              <span class="badge badge-style" style="margin-top: 4px;">${STYLES[fighter.style]?.icon} ${STYLES[fighter.style]?.name}</span>
              <span class="badge" style="margin-top: 2px;">${fighterRank !== null ? t('offer.vsRank', { n: fighterRank }) : t('offer.vsUnranked')}</span>
              <div class="offer-scout-hint">🔍 ${t('scout.title')}</div>
            </div>

            <div class="offer-vs">VS</div>

            <div class="offer-fighter offer-fighter-clickable" data-fighter-id="${opponent.id}" data-is-player="false">
              <div class="fighter-mini-avatar" style="background: ${opponent.avatarColor}; width: 44px; height: 44px;">
                ${opponent.firstName[0]}${opponent.lastName[0]}
              </div>
              <div class="offer-fighter-name">${opponent.fullName}</div>
              <div class="offer-fighter-meta">${opponent.wins}-${opponent.losses} · <span class="${ovrClass}">OVR ${opponentOvr}</span></div>
              <span class="badge badge-style" style="margin-top: 4px;">${opponentStyle.icon} ${opponentStyle.name}</span>
              <span class="badge" style="margin-top: 2px;">${rankDisplay}</span>
              <div class="offer-scout-hint">🔍 ${t('scout.title')}</div>
            </div>
          </div>

          <div class="offer-details">
            <div class="offer-detail-item">
              <span class="offer-detail-icon">💰</span>
              <div>
                <div class="offer-detail-label">${t('offer.purse')}</div>
                <div class="offer-detail-value">${FinanceEngine.formatMoney(offer.purse.show)} + ${FinanceEngine.formatMoney(offer.purse.win)}</div>
              </div>
            </div>
            <div class="offer-detail-item">
              <span class="offer-detail-icon">📅</span>
              <div>
                <div class="offer-detail-label">${t('offer.fightWeek', { n: offer.fightWeek })}</div>
                <div class="offer-detail-value">${t('offer.prepWeeks', { n: prepWeeks > 0 ? prepWeeks : offer.prepWeeks })}</div>
              </div>
            </div>
            <div class="offer-detail-item">
              <span class="offer-detail-icon">⏰</span>
              <div>
                <div class="offer-detail-label">${t('offer.expiresIn', { n: weeksLeft })}</div>
                <div class="offer-detail-value ${weeksLeft <= 1 ? 'text-danger' : ''}">${weeksLeft <= 1 ? '⚠️' : ''}</div>
              </div>
            </div>
          </div>

          <div class="offer-actions">
            <button class="btn btn-primary btn-sm offer-accept-btn" data-offer-id="${offer.id}">
              ${t('offer.accept')}
            </button>
            <button class="btn btn-ghost btn-sm offer-decline-btn" data-offer-id="${offer.id}">
              ${t('offer.decline')}
            </button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="offers-section animate-fade-in-up stagger-4">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="card-title-icon">📨</span>
              ${t('offer.title')}
            </div>
            <span class="badge badge-camp">${pendingOffers.length}</span>
          </div>
          <div class="offers-grid">
            ${offersHTML}
          </div>
        </div>
      </div>
    `;
  },

  _bindOfferEvents(container) {
    container.querySelectorAll('.offer-accept-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const offerId = btn.dataset.offerId;
        const result = GameState.acceptOffer(offerId);
        if (result) {
          App.showToast(t('offer.acceptedToast', {
            name: result.fighter.fullName,
            opponent: result.opponent.fullName,
            n: result.scheduledFight.week
          }), 'success');
          App.updateSidebar();
          App.navigateTo('dashboard');
        }
      });
    });

    container.querySelectorAll('.offer-decline-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const offerId = btn.dataset.offerId;
        App.showDeclineModal(offerId);
      });
    });

    // Fighter analysis click (both player + opponent)
    container.querySelectorAll('.offer-fighter-clickable').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
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

    // Withdraw from scheduled fight
    container.querySelectorAll('.withdraw-fight-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fightId = btn.dataset.fightId;
        App.showWithdrawConfirm(fightId);
      });
    });
  },

  _renderSeasonObjectives(state) {
    const objectives = state.seasonObjectives;
    if (!objectives || objectives.length === 0) return '';

    const season = state.season || 1;
    const seasonWeek = state.seasonWeek || 1;

    const objRows = objectives.map(obj => {
      const def = SEASON_OBJECTIVES_POOL.find(p => p.id === obj.id);
      const icon = def?.icon || '🎯';
      const name = def?.name || obj.id;
      const reward = obj.reward || def?.reward || 0;
      const statusClass = obj.completed ? 'completed' : 'pending';
      const statusIcon = obj.completed ? '✅' : '🔲';

      return `
        <div class="season-obj-row ${statusClass}">
          <span class="season-obj-icon">${icon}</span>
          <div class="season-obj-info">
            <div class="season-obj-name">${name}</div>
            <div class="season-obj-reward">${t('season.reward')}: +${FinanceEngine.formatMoney(reward)}</div>
          </div>
          <span class="season-obj-status">${statusIcon}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="card mb-lg animate-fade-in-up stagger-6">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-icon">🏆</span>
            ${t('season.objectives')}
          </div>
          <span class="badge badge-accent">${t('season.label', { n: season })} — ${t('season.week', { n: seasonWeek })}</span>
        </div>
        <div class="season-obj-list">
          ${objRows}
        </div>
      </div>
    `;
  }
};
