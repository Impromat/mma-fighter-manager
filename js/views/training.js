/* ============================================
   MMA Fighter Manager — Training View (v2)
   ============================================ */

const TrainingView = {
  expandedFighter: null,

  render(container) {
    const state = GameState.get();

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">🏋️ ${t('train.title')}</h1>
          <div class="view-subtitle">${t('train.subtitle', { n: state.week, gym: state.gymName })}</div>
        </div>
        <button class="btn btn-secondary" id="set-all-general">
          🔄 Tous en Général
        </button>
      </div>

      <!-- Training Table -->
      <div class="card training-table-card">
        <div class="training-table">
          <div class="training-table-header">
            <div class="training-col-fighter">${t('sidebar.fighters')}</div>
            <div class="training-col-stats">${t('train.stats')}</div>
            <div class="training-col-training">${t('sidebar.training')}</div>
            <div class="training-col-salary">${t('train.fee')}</div>
            <div class="training-col-commission">${t('train.commission')}</div>
            <div class="training-col-moral">${t('train.morale')}</div>
          </div>
          ${state.fighters.map((fighter, i) => this._renderFighterRow(fighter, state, i)).join('')}
        </div>
      </div>

      <!-- Fight Camps -->
      ${this._renderFightCamps(state)}
    `;

    this._bindEvents(state, container);
  },

  _renderFighterRow(fighter, state, index) {
    const overall = TrainingEngine.calculateOverall(fighter);
    const style = STYLES[fighter.style];
    const weightClass = WEIGHT_CLASSES.find(wc => wc.id === fighter.weightClass);
    const currentTraining = TRAINING_TYPES[fighter.currentTraining];
    const isInjured = fighter.status === 'injured';

    // Top 3 stats
    const topStats = STAT_NAMES.map(s => ({ ...s, value: Math.round(fighter.stats[s.id]) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    const moraleColor = fighter.morale >= 70 ? 'var(--color-success)' :
                        fighter.morale >= 40 ? 'var(--color-warning)' : 'var(--color-danger)';

    // Training pills with rich tooltips
    const trainingPills = Object.values(TRAINING_TYPES).map(tt => {
      const isSelected = fighter.currentTraining === tt.id;
      const isDisabled = isInjured && tt.id !== 'recovery';

      // Build tooltip content
      const statGainsHTML = Object.entries(tt.statGains)
        .filter(([_, v]) => v > 0)
        .map(([statId, gain]) => {
          const statInfo = STAT_NAMES.find(s => s.id === statId);
          return `<span class="tt-stat-chip">+${gain} ${statInfo?.short || statId}</span>`;
        }).join('');

      const moraleHTML = tt.moralEffect !== 0
        ? `<div class="tt-row ${tt.moralEffect > 0 ? 'tt-positive' : 'tt-negative'}">Moral: ${tt.moralEffect > 0 ? '+' : ''}${tt.moralEffect}</div>`
        : '<div class="tt-row tt-neutral">Moral: 0</div>';

      const injuryHTML = tt.injuryRisk > 0
        ? `<div class="tt-row tt-negative">⚠️ Blessure: ${Math.round(tt.injuryRisk * 100)}%</div>`
        : '';

      const shortLabel = tt.name
        .replace('Camp ', '')
        .replace('General Training', 'Général')
        .replace('Classic Training', 'Classic')
        .replace('Intensive Sparring', 'Sparring')
        .replace('Recovery Week', 'Repos');

      return `
        <div class="training-pill-wrapper">
          <button class="training-pill ${isSelected ? 'active' : ''} ${isDisabled ? 'disabled' : ''}"
                  data-training="${tt.id}" data-fighter="${fighter.id}"
                  ${isDisabled ? 'disabled' : ''}>
            <span class="training-pill-icon">${tt.icon}</span>
            <span class="training-pill-label">${shortLabel}</span>
          </button>
          <div class="training-tooltip">
            <div class="tt-title">${tt.icon} ${tt.name}</div>
            <div class="tt-desc">${tt.description}</div>
            <div class="tt-stats">${statGainsHTML || '<span class="tt-stat-chip tt-none">Repos</span>'}</div>
            ${moraleHTML}
            ${injuryHTML}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="training-row animate-fade-in-up stagger-${index + 1}" data-fighter-id="${fighter.id}">
        <div class="training-col-fighter">
          <div class="fighter-mini-avatar" style="background: ${fighter.avatarColor};">
            ${fighter.firstName[0]}${fighter.lastName[0]}
          </div>
          <div class="training-fighter-details">
            <div class="training-fighter-name">
              ${fighter.fullName}
              ${isInjured ? '<span class="badge badge-injured" style="margin-left: 6px;">🤕 ' + fighter.injuryWeeksLeft + 'w</span>' : ''}
            </div>
            <div class="training-fighter-meta">
              ${fighter.nationality.flag} ${weightClass?.name || ''} · OVR <strong>${overall}</strong>
            </div>
            <!-- Target Profile inline selector -->
            <div style="margin-top:6px;">
              <select class="target-profile-select" data-fighter-id="${fighter.id}"
                style="font-size:0.72rem; padding:2px 6px; border-radius:6px;
                       background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15);
                       color:${(STYLES[fighter.targetProfile] || STYLES.wellRounded).color};
                       cursor:pointer; outline:none;">
                ${Object.values(STYLES).map(s => `
                  <option value="${s.id}" ${fighter.targetProfile === s.id ? 'selected' : ''}
                          style="background:#1a1a2e; color:${s.color};">
                    ${s.icon} ${s.name}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="training-col-stats">
          ${topStats.map(s => `
            <span class="training-top-stat">${s.icon} ${s.value}</span>
          `).join('')}
        </div>

        <div class="training-col-training">
          <div class="training-pills-row">
            ${trainingPills}
          </div>
        </div>

        <div class="training-col-salary">
          <div class="salary-adjuster">
            <button class="salary-btn salary-down" data-fighter="${fighter.id}" data-dir="down"
                    ${(fighter.feeMultiplier || 1.0) <= 0.5 ? 'disabled' : ''}>−</button>
            <div class="salary-display">
              <div class="salary-amount">${FinanceEngine.formatMoney(FinanceEngine.getFighterFee(fighter))}</div>
              <div class="salary-multiplier ${(fighter.feeMultiplier || 1.0) > 1.0 ? 'high' : (fighter.feeMultiplier || 1.0) < 1.0 ? 'low' : ''}">
                ×${(fighter.feeMultiplier || 1.0).toFixed(2)}
              </div>
            </div>
            <button class="salary-btn salary-up" data-fighter="${fighter.id}" data-dir="up"
                    ${(fighter.feeMultiplier || 1.0) >= 2.0 ? 'disabled' : ''}>+</button>
          </div>
        </div>

        <div class="training-col-commission">
          <div class="salary-adjuster">
            <button class="salary-btn salary-down" data-commission="${fighter.id}" data-dir="down"
                    ${(fighter.commissionMultiplier || 1.0) <= COMMISSION_STEPS.min ? 'disabled' : ''}>−</button>
            <div class="salary-display">
              <div class="salary-amount">${FinanceEngine.getCommissionRates(fighter).showPercent}%/${FinanceEngine.getCommissionRates(fighter).winPercent}%</div>
              <div class="salary-multiplier ${(fighter.commissionMultiplier || 1.0) > 1.0 ? 'high' : (fighter.commissionMultiplier || 1.0) < 1.0 ? 'low' : ''}">
                ×${(fighter.commissionMultiplier || 1.0).toFixed(2)}
              </div>
            </div>
            <button class="salary-btn salary-up" data-commission="${fighter.id}" data-dir="up"
                    ${(fighter.commissionMultiplier || 1.0) >= COMMISSION_STEPS.max ? 'disabled' : ''}>+</button>
          </div>
        </div>

        <div class="training-col-moral">
          <div class="training-morale-display">
            <div class="training-morale-bar">
              <div class="training-morale-fill" style="width: ${fighter.morale}%; background: ${moraleColor};"></div>
            </div>
            <span class="training-morale-value" style="color: ${moraleColor};">${fighter.morale}</span>
          </div>
        </div>
      </div>
    `;
  },

  _renderFightCamps(state) {
    const fightersWithFights = state.fighters.map(fighter => {
      const scheduledFight = state.schedule.find(
        s => !s.completed && s.playerFighterId === fighter.id && s.week >= state.week
      );
      if (!scheduledFight) return null;
      const opponent = state.aiFighters.find(f => f.id === scheduledFight.opponentId);
      if (!opponent) return null;
      return { fighter, scheduledFight, opponent };
    }).filter(Boolean);

    if (fightersWithFights.length === 0) return '';

    return `
      <div class="card mt-lg">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-icon">⚔️</span>
            ${t('train.fightCamps')}
          </div>
        </div>
        <div class="text-xs text-muted mb-lg" style="margin-top: -8px;">
          ${t('train.campDesc')}
        </div>

        ${fightersWithFights.map(({ fighter, scheduledFight, opponent }) => {
          const opponentStyle = STYLES[opponent.style];
          const opponentOverall = TrainingEngine.calculateOverall(opponent);
          const weeksAway = scheduledFight.week - state.week;

          return `
            <div class="fight-camp-row">
              <div class="fight-camp-matchup">
                <div class="fight-camp-fighter">
                  <div class="fighter-mini-avatar" style="background: ${fighter.avatarColor}; width: 32px; height: 32px; font-size: 11px;">
                    ${fighter.firstName[0]}${fighter.lastName[0]}
                  </div>
                  <div>
                    <div class="font-semibold text-sm">${fighter.fullName}</div>
                    <div class="text-xs text-muted">${STYLES[fighter.style].icon} ${STYLES[fighter.style].name}</div>
                  </div>
                </div>

                <div class="fight-camp-vs">
                  <span class="text-xs text-muted">VS</span>
                  <span class="text-xs text-muted">W${scheduledFight.week} (${weeksAway}w)</span>
                </div>

                <div class="fight-camp-fighter">
                  <div class="fighter-mini-avatar" style="background: ${opponent.avatarColor}; width: 32px; height: 32px; font-size: 11px;">
                    ${opponent.firstName[0]}${opponent.lastName[0]}
                  </div>
                  <div>
                    <div class="font-semibold text-sm">${opponent.fullName}</div>
                    <div class="text-xs text-muted">${opponentStyle.icon} ${opponentStyle.name} · OVR ${opponentOverall}</div>
                  </div>
                </div>

                <button class="btn btn-secondary btn-sm scout-btn"
                        data-fighter-id="${fighter.id}" data-opponent-id="${opponent.id}"
                        data-schedule-id="${scheduledFight.id}">
                  🔍 Analyser
                </button>
              </div>

              <div class="fight-camp-pills">
                ${Object.values(FIGHT_CAMP_TYPES).map(camp => {
                  const isSelected = scheduledFight.fightCamp === camp.id;
                  const isRecommended = camp.targetStyle === opponent.style;
                  const bonusChips = Object.entries(camp.bonuses).map(([stat, bonus]) => {
                    const statInfo = STAT_NAMES.find(s => s.id === stat);
                    return `+${bonus} ${statInfo?.short || stat}`;
                  }).join(', ');

                  return `
                    <button class="camp-pill ${isSelected ? 'active' : ''} ${isRecommended ? 'recommended' : ''}"
                            data-camp="${camp.id}" data-schedule="${scheduledFight.id}"
                            title="${camp.name}: ${bonusChips}">
                      <span>${camp.icon} ${camp.name.replace(' Camp', '')}</span>
                      ${isRecommended ? '<span class="camp-rec-dot">●</span>' : ''}
                    </button>
                  `;
                }).join('')}
                ${scheduledFight.fightCamp ? `
                  <button class="camp-pill cancel" data-cancel-schedule="${scheduledFight.id}" title="Annuler le camp">
                    ✕
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  /**
   * Show opponent scouting modal
   */
  _showScoutingModal(fighter, opponent, state) {
    const modalRoot = document.getElementById('modal-root');
    const opponentOverall = TrainingEngine.calculateOverall(opponent);
    const fighterOverall = TrainingEngine.calculateOverall(fighter);
    const opponentStyle = STYLES[opponent.style];
    const fighterStyle = STYLES[fighter.style];
    const wc = WEIGHT_CLASSES.find(w => w.id === opponent.weightClass);

    // All stats comparison
    const statsComparison = STAT_NAMES.map(s => {
      const fVal = Math.round(fighter.stats[s.id]);
      const oVal = Math.round(opponent.stats[s.id]);
      const diff = fVal - oVal;
      return { ...s, fVal, oVal, diff };
    });

    // Strengths (top 3 of opponent)
    const sorted = [...statsComparison].sort((a, b) => b.oVal - a.oVal);
    const strengths = sorted.slice(0, 3);
    const weaknesses = sorted.slice(-3).reverse();

    // Where you have advantage vs disadvantage
    const advantages = statsComparison.filter(s => s.diff >= 5).sort((a, b) => b.diff - a.diff);
    const disadvantages = statsComparison.filter(s => s.diff <= -5).sort((a, b) => a.diff - b.diff);

    // Tactical recommendation
    let recommendation = '';
    const avgStriking = opponent.stats.striking;
    const avgGrappling = (opponent.stats.grappling + opponent.stats.submission + opponent.stats.wrestling) / 3;

    if (avgStriking > avgGrappling + 10) {
      recommendation = t('scout.strikerAnalysis', { name: opponent.firstName });
    } else if (avgGrappling > avgStriking + 10) {
      recommendation = t('scout.grapplerAnalysis', { name: opponent.firstName });
    } else {
      recommendation = t('scout.completeAnalysis', { name: opponent.firstName, w1: weaknesses[0]?.short, w2: weaknesses[1]?.short });
    }

    // Cardio warning
    if (opponent.stats.cardio >= 75) {
      recommendation += ` ${t('scout.goodCardio')}`;
    } else if (opponent.stats.cardio <= 45) {
      recommendation += ` ${t('scout.weakCardio')}`;
    }

    modalRoot.innerHTML = `
      <div class="modal-overlay" id="scout-overlay">
        <div class="modal scout-modal animate-scale-in">
          <div class="scout-header">
            <div class="scout-header-fighters">
              <div class="scout-your-fighter">
                <div class="fighter-mini-avatar" style="background: ${fighter.avatarColor}; width: 36px; height: 36px; font-size: 12px;">
                  ${fighter.firstName[0]}${fighter.lastName[0]}
                </div>
                <div>
                  <div class="text-xs text-muted">${t('scout.yourFighter')}</div>
                  <div class="font-semibold text-sm">${fighter.fullName}</div>
                </div>
              </div>
              <div class="scout-vs">VS</div>
              <div class="scout-opponent">
                <div class="fighter-mini-avatar" style="background: ${opponent.avatarColor}; width: 36px; height: 36px; font-size: 12px;">
                  ${opponent.firstName[0]}${opponent.lastName[0]}
                </div>
                <div>
                  <div class="text-xs text-muted">${t('scout.opponent')}</div>
                  <div class="font-semibold text-sm">${opponent.fullName}</div>
                </div>
              </div>
            </div>
            <button class="modal-close-btn" id="scout-close">✕</button>
          </div>

          <div class="scout-body">
            <!-- Opponent Profile -->
            <div class="scout-section">
              <div class="scout-section-title">${t('scout.profile')}</div>
              <div class="scout-profile-grid">
                <div class="scout-profile-item">
                  <span class="text-xs text-muted">Style</span>
                  <span class="font-semibold" style="color: ${opponentStyle.color}">${opponentStyle.icon} ${opponentStyle.name}</span>
                </div>
                <div class="scout-profile-item">
                  <span class="text-xs text-muted">${t('scout.weightClass')}</span>
                  <span class="font-semibold">${wc?.name || '—'}</span>
                </div>
                <div class="scout-profile-item">
                  <span class="text-xs text-muted">${t('scout.age')}</span>
                  <span class="font-semibold">${opponent.age} ${t('scout.years')}</span>
                </div>
                <div class="scout-profile-item">
                  <span class="text-xs text-muted">${t('scout.record')}</span>
                  <span class="font-semibold">${opponent.wins}W - ${opponent.losses}L</span>
                </div>
                <div class="scout-profile-item">
                  <span class="text-xs text-muted">OVR</span>
                  <span class="font-semibold">${opponentOverall} <span class="text-xs text-muted">(${t('scout.you')}: ${fighterOverall})</span></span>
                </div>
              </div>
            </div>

            <!-- Stats Comparison -->
            <div class="scout-section">
              <div class="scout-section-title">${t('scout.statsComparison')}</div>
              <div class="scout-stats-table">
                ${statsComparison.map(s => {
                  const maxVal = Math.max(s.fVal, s.oVal, 1);
                  const diffClass = s.diff > 5 ? 'advantage' : s.diff < -5 ? 'disadvantage' : 'even';
                  const diffLabel = s.diff > 0 ? `+${s.diff}` : `${s.diff}`;
                  return `
                    <div class="scout-stat-row">
                      <div class="scout-stat-name">${s.icon} ${s.short}</div>
                      <div class="scout-stat-val scout-f1-val">${s.fVal}</div>
                      <div class="scout-stat-bars">
                        <div class="scout-bar-container">
                          <div class="scout-bar scout-bar-yours" style="width: ${(s.fVal / 100) * 100}%;"></div>
                        </div>
                        <div class="scout-bar-container">
                          <div class="scout-bar scout-bar-opp" style="width: ${(s.oVal / 100) * 100}%;"></div>
                        </div>
                      </div>
                      <div class="scout-stat-val scout-f2-val">${s.oVal}</div>
                      <div class="scout-stat-diff ${diffClass}">${diffLabel}</div>
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="scout-stat-legend">
                <span class="scout-legend-item"><span class="scout-legend-dot yours"></span> ${fighter.lastName}</span>
                <span class="scout-legend-item"><span class="scout-legend-dot opp"></span> ${opponent.lastName}</span>
              </div>
            </div>

            <!-- Analysis -->
            <div class="scout-columns">
              <div class="scout-section scout-col">
                <div class="scout-section-title text-danger">${t('scout.strengths')}</div>
                ${strengths.map(s => `
                  <div class="scout-tag danger">${s.icon} ${s.label} <strong>${s.oVal}</strong></div>
                `).join('')}
              </div>
              <div class="scout-section scout-col">
                <div class="scout-section-title text-success">${t('scout.weaknesses')}</div>
                ${weaknesses.map(s => `
                  <div class="scout-tag success">${s.icon} ${s.label} <strong>${s.oVal}</strong></div>
                `).join('')}
              </div>
            </div>

            ${advantages.length > 0 ? `
              <div class="scout-section">
                <div class="scout-section-title text-success">${t('scout.advantages')}</div>
                <div class="scout-tags-row">
                  ${advantages.slice(0, 4).map(s => `
                    <span class="scout-tag success">${s.icon} ${s.short} <strong>+${s.diff}</strong></span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${disadvantages.length > 0 ? `
              <div class="scout-section">
                <div class="scout-section-title text-danger">${t('scout.disadvantages')}</div>
                <div class="scout-tags-row">
                  ${disadvantages.slice(0, 4).map(s => `
                    <span class="scout-tag danger">${s.icon} ${s.short} <strong>${s.diff}</strong></span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Tactical Recommendation -->
            <div class="scout-section scout-recommendation">
              <div class="scout-section-title">${t('scout.recommendation')}</div>
              <div class="scout-rec-text">${recommendation}</div>
            </div>
          </div>

          <div class="scout-footer">
            <button class="btn btn-secondary" id="scout-close-btn">${t('scout.close')}</button>
          </div>
        </div>
      </div>
    `;

    // Close handlers
    const close = () => { modalRoot.innerHTML = ''; };
    document.getElementById('scout-close').addEventListener('click', close);
    document.getElementById('scout-close-btn').addEventListener('click', close);
    document.getElementById('scout-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'scout-overlay') close();
    });
  },

  _bindEvents(state, container) {
    // Target profile selects
    container.querySelectorAll('.target-profile-select').forEach(select => {
      select.addEventListener('change', () => {
        const fighterId = select.dataset.fighterId;
        const styleId = select.value;
        GameState.setTargetProfile(fighterId, styleId);
        const style = STYLES[styleId];
        select.style.color = style.color;
        const fighter = state.fighters.find(f => f.id === fighterId);
        App.showToast(`🎯 ${fighter.fullName} → ${style.icon} ${style.name}`, 'success');
      });
    });

    // Training pill clicks
    container.querySelectorAll('.training-pill:not(.disabled)').forEach(pill => {
      pill.addEventListener('click', () => {
        const trainingId = pill.dataset.training;
        const fighterId = pill.dataset.fighter;

        GameState.setTraining(fighterId, trainingId);

        // Update pills for this fighter
        const row = pill.closest('.training-row');
        row.querySelectorAll('.training-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const fighter = state.fighters.find(f => f.id === fighterId);
        const tt = TRAINING_TYPES[trainingId];
        App.showToast(`${fighter.fullName} → ${tt.icon} ${tt.name}`, 'success');
      });
    });

    // Fee adjustment clicks
    container.querySelectorAll('.salary-btn[data-fighter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fighterId = btn.dataset.fighter;
        const direction = btn.dataset.dir;

        const result = GameState.adjustFee(fighterId, direction);
        if (result) {
          const moraleIcon = result.moraleChange > 0 ? '😊' : '😤';
          const moraleText = result.moraleChange > 0 ? `+${result.moraleChange}` : result.moraleChange;
          App.showToast(
            `💰 ${result.fighter.fullName} — ${t('finance.feeAdjusted')} (×${result.fighter.feeMultiplier.toFixed(2)}) · ${moraleIcon} Moral ${moraleText}`,
            result.moraleChange > 0 ? 'success' : 'warning'
          );
          this.render(container);
        }
      });
    });

    // Commission adjustment clicks
    container.querySelectorAll('.salary-btn[data-commission]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fighterId = btn.dataset.commission;
        const direction = btn.dataset.dir;

        const result = GameState.adjustCommission(fighterId, direction);
        if (result) {
          const rates = FinanceEngine.getCommissionRates(result.fighter);
          const moraleIcon = result.moraleChange > 0 ? '😊' : '😤';
          const moraleText = result.moraleChange > 0 ? `+${result.moraleChange}` : result.moraleChange;
          App.showToast(
            `📊 ${result.fighter.fullName} — ${t('finance.commissionAdjusted')} (${rates.showPercent}%/${rates.winPercent}%) · ${moraleIcon} Moral ${moraleText}`,
            result.moraleChange > 0 ? 'success' : 'warning'
          );
          this.render(container);
        }
      });
    });

    // Scout button clicks
    container.querySelectorAll('.scout-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fighterId = btn.dataset.fighterId;
        const opponentId = btn.dataset.opponentId;
        const fighter = state.fighters.find(f => f.id === fighterId);
        const opponent = state.aiFighters.find(f => f.id === opponentId);
        if (fighter && opponent) {
          this._showScoutingModal(fighter, opponent, state);
        }
      });
    });

    // Fight camp clicks
    container.querySelectorAll('.camp-pill:not(.cancel)').forEach(pill => {
      pill.addEventListener('click', () => {
        const campId = pill.dataset.camp;
        const scheduleId = pill.dataset.schedule;

        GameState.setFightCamp(scheduleId, campId);

        // Re-render fight camps section
        this.render(container);
        App.showToast(`Fight camp activé : ${FIGHT_CAMP_TYPES[campId].icon} ${FIGHT_CAMP_TYPES[campId].name}`, 'success');
      });
    });

    // Cancel camp
    container.querySelectorAll('[data-cancel-schedule]').forEach(btn => {
      btn.addEventListener('click', () => {
        const scheduleId = btn.dataset.cancelSchedule;
        GameState.setFightCamp(scheduleId, null);
        this.render(container);
        App.showToast('Fight camp annulé', 'info');
      });
    });

    // Set all to general
    document.getElementById('set-all-general')?.addEventListener('click', () => {
      state.fighters.forEach(f => GameState.setTraining(f.id, 'general'));
      this.render(container);
      App.showToast('Tous les fighters en entraînement général', 'success');
    });
  }
};
