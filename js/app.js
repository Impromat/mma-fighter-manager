/* ============================================
   MMA Fighter Manager — App Controller
   ============================================ */

const App = {
  currentView: 'dashboard',
  toastTimeout: null,

  /**
   * Initialize the application
   */
  init() {
    // Set up routing
    window.addEventListener('hashchange', () => this.route());

    // Check for existing save
    if (GameState.hasSave()) {
      GameState.load();
      this.renderApp();
      this.route();
    } else {
      this.showWelcome();
    }

    // Listen for state changes
    GameState.on('*', (event, data) => this.onStateChange(event, data));
  },

  /**
   * Handle routing
   */
  route() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    this.navigateTo(hash);
  },

  /**
   * Navigate to a view
   */
  navigateTo(viewName) {
    this.currentView = viewName;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Render view
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = '';
    container.className = 'view-container';

    switch (viewName) {
      case 'dashboard': DashboardView.render(container); break;
      case 'fighters': FightersView.render(container); break;
      case 'training': TrainingView.render(container); break;
      case 'agenda': AgendaView.render(container); break;
      case 'rankings': RankingsView.render(container); break;
      case 'finances': FinancesView.render(container); break;
      case 'market': MarketView.render(container); break;
      case 'tutorial': TutorialView.render(container); break;
      default: DashboardView.render(container); break;
    }

    window.location.hash = viewName;
  },

  /**
   * Show welcome screen for new game
   */
  showWelcome() {
    document.getElementById('app').innerHTML = `
      <div class="modal-overlay" id="welcome-modal">
        <div class="modal" style="max-width: 500px;">
          <div class="modal-body">
            <div class="welcome-content">
              <div class="welcome-icon">🥊</div>
              <div class="welcome-title">MMA Fighter Manager</div>
              <div class="welcome-subtitle">
                ${t('welcome.subtitle')}
              </div>
              <div class="welcome-input-group">
                <label class="welcome-input-label">${t('welcome.gymLabel')}</label>
                <input type="text" id="gym-name-input" class="welcome-input"
                       placeholder="${t('welcome.gymPlaceholder')}" value="Iron Forge MMA" maxlength="30">
              </div>
              <button class="btn btn-primary btn-lg btn-block" id="start-game-btn" style="max-width: 350px; margin: 0 auto;">
                ${t('welcome.start')}
              </button>
              <div class="lang-toggle" style="margin-top: var(--space-lg);">
                <button class="lang-btn ${I18N.getLang() === 'fr' ? 'active' : ''}" data-lang="fr">FR</button>
                <button class="lang-btn ${I18N.getLang() === 'en' ? 'active' : ''}" data-lang="en">EN</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind language toggle on welcome
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        I18N.setLang(btn.dataset.lang);
        this.showWelcome();
      });
    });

    document.getElementById('start-game-btn').addEventListener('click', () => {
      const gymName = document.getElementById('gym-name-input').value.trim() || 'Iron Forge MMA';
      this._gymName = gymName;
      this.showDraft();
    });

    document.getElementById('gym-name-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('start-game-btn').click();
      }
    });
  },

  /**
   * Show fighter draft screen
   */
  showDraft() {
    const MAX_PICKS = 3;
    const POOL_SIZE = 8;

    // Generate a pool of candidates
    const candidates = FighterGenerator.generatePlayerRoster(POOL_SIZE);
    const selected = new Set();

    const renderDraft = () => {
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="draft-screen">
          <div class="draft-header">
            <div class="draft-header-top">
              <div class="draft-logo">🥊</div>
              <div>
                <h1 class="draft-title">${t('draft.title')}</h1>
                <div class="draft-subtitle">${t('draft.subtitle', { max: MAX_PICKS })}</div>
              </div>
            </div>
            <div class="draft-counter">
              <span class="draft-counter-current" id="draft-count">${selected.size}</span>
              <span class="draft-counter-sep">/</span>
              <span class="draft-counter-max">${MAX_PICKS}</span>
              <span class="draft-counter-label">${t('draft.selected', { n: selected.size, max: MAX_PICKS }).split('/').pop()}</span>
            </div>
          </div>

          <div class="draft-grid">
            ${candidates.map((f, i) => {
              const isSelected = selected.has(i);
              const overall = TrainingEngine.calculateOverall(f);
              const style = STYLES[f.style];
              const wc = WEIGHT_CLASSES.find(w => w.id === f.weightClass);

              // Calculate potential as avg of potential values
              const potentialAvg = Math.round(
                STAT_NAMES.reduce((sum, s) => sum + f.potential[s.id], 0) / STAT_NAMES.length
              );
              const potentialLabel = potentialAvg >= 85 ? '🌟 Élite' :
                                     potentialAvg >= 75 ? '⭐ Haut' :
                                     potentialAvg >= 65 ? '📈 Moyen' : '📊 Bas';

              // Weekly salary estimate
              const salary = SALARY_BY_RANK.unranked;

              // Top 3 stats
              const topStats = STAT_NAMES.map(s => ({
                ...s,
                value: Math.round(f.stats[s.id])
              })).sort((a, b) => b.value - a.value).slice(0, 4);

              return `
                <div class="draft-card ${isSelected ? 'selected' : ''} animate-fade-in-up stagger-${(i % 8) + 1}"
                     data-index="${i}" id="draft-card-${i}">
                  ${isSelected ? '<div class="draft-check">✓</div>' : ''}
                  <div class="draft-card-top">
                    <div class="fighter-mini-avatar" style="background: ${f.avatarColor}; width: 44px; height: 44px; font-size: 14px;">
                      ${f.firstName[0]}${f.lastName[0]}
                    </div>
                    <div class="draft-card-info">
                      <div class="draft-card-name">${f.fullName}</div>
                      <div class="draft-card-meta">
                        ${f.nationality.flag} ${wc?.name || ''} · ${f.age} ans
                      </div>
                    </div>
                    <div class="draft-card-ovr">
                      <div class="draft-ovr-value">${overall}</div>
                      <div class="draft-ovr-label">OVR</div>
                    </div>
                  </div>

                  <div class="draft-card-badges">
                    <span class="draft-badge" style="color: ${style.color};">${style.icon} ${style.name}</span>
                    <span class="draft-badge">${potentialLabel}</span>
                  </div>

                  <div class="draft-card-stats">
                    ${topStats.map(s => `
                      <div class="draft-stat">
                        <span class="draft-stat-label">${s.icon} ${s.short}</span>
                        <div class="draft-stat-bar">
                          <div class="draft-stat-fill" style="width: ${s.value}%; background: ${
                            s.value >= 70 ? 'var(--color-success)' :
                            s.value >= 50 ? 'var(--accent-orange)' : 'var(--color-danger)'
                          };"></div>
                        </div>
                        <span class="draft-stat-value">${s.value}</span>
                      </div>
                    `).join('')}
                  </div>

                  <div class="draft-card-footer">
                    <span class="text-xs text-muted">💰 Salaire : ${FinanceEngine.formatMoney(salary)}/sem</span>
                    <span class="text-xs text-muted">📈 Potentiel moy. : ${potentialAvg}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="draft-footer">
            <button class="btn btn-secondary" id="draft-reroll">
              🎲 Régénérer les fighters
            </button>
            <button class="btn btn-primary btn-lg" id="draft-confirm" ${selected.size !== MAX_PICKS ? 'disabled' : ''}>
              ⚡ Lancer la saison (${selected.size}/${MAX_PICKS})
            </button>
          </div>
        </div>
      `;

      // Card clicks
      document.querySelectorAll('.draft-card').forEach(card => {
        card.addEventListener('click', () => {
          const idx = parseInt(card.dataset.index);
          if (selected.has(idx)) {
            selected.delete(idx);
          } else if (selected.size < MAX_PICKS) {
            selected.add(idx);
          }
          renderDraft();
        });
      });

      // Reroll
      document.getElementById('draft-reroll').addEventListener('click', () => {
        selected.clear();
        const newCandidates = FighterGenerator.generatePlayerRoster(POOL_SIZE);
        candidates.splice(0, candidates.length, ...newCandidates);
        renderDraft();
      });

      // Confirm
      document.getElementById('draft-confirm').addEventListener('click', () => {
        if (selected.size !== MAX_PICKS) return;
        const chosenFighters = [...selected].map(i => candidates[i]);
        GameState.newGame(this._gymName, chosenFighters);
        this.renderApp();
        this.navigateTo('dashboard');
      });
    };

    renderDraft();
  },

  /**
   * Render the main app shell
   */
  renderApp() {
    const state = GameState.get();
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="app">
        <!-- Mobile header -->
        <div class="mobile-header" id="mobile-header">
          <button class="mobile-menu-btn" id="mobile-menu-btn">
            <span></span><span></span><span></span>
          </button>
          <div class="mobile-header-title">MMA Manager</div>
          <div class="mobile-header-week">${t('sidebar.week', { n: state.week })}</div>
        </div>
        <div class="sidebar-overlay" id="sidebar-overlay"></div>
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo">
              <div class="sidebar-logo-icon">AF</div>
              <div class="sidebar-logo-text">MMA Manager</div>
            </div>
            <div class="sidebar-gym-name">${state.gymName}</div>
            <div class="sidebar-week">
              <span>📅 ${t('sidebar.week', { n: '' })}</span>
              <span class="sidebar-week-number" id="sidebar-week">${state.week}</span>
            </div>
          </div>

          <nav class="sidebar-nav">
            <div class="nav-section-label">Main</div>
            <div class="nav-item active" data-view="dashboard">
              <span class="nav-item-icon">🏠</span>
              <span>${t('sidebar.dashboard')}</span>
            </div>
            <div class="nav-item" data-view="fighters">
              <span class="nav-item-icon">🥊</span>
              <span>${t('sidebar.fighters')}</span>
            </div>
            <div class="nav-item" data-view="training">
              <span class="nav-item-icon">🏋️</span>
              <span>${t('sidebar.training')}</span>
            </div>

            <div class="nav-section-label">Competition</div>
            <div class="nav-item" data-view="agenda">
              <span class="nav-item-icon">📅</span>
              <span>${t('sidebar.agenda')}</span>
              ${this._getUpcomingFightsCount(state) > 0 ? `<span class="nav-item-badge">${this._getUpcomingFightsCount(state)}</span>` : ''}
            </div>
            <div class="nav-item" data-view="rankings">
              <span class="nav-item-icon">🏆</span>
              <span>${t('sidebar.rankings')}</span>
            </div>
            <div class="nav-item" data-view="finances">
              <span class="nav-item-icon">💰</span>
              <span>${t('sidebar.finances')}</span>
            </div>
            <div class="nav-item" data-view="market">
              <span class="nav-item-icon">💱</span>
              <span>${t('sidebar.market')}</span>
              ${(state.freeAgents || []).length > 0 ? `<span class="nav-item-badge">${state.freeAgents.length}</span>` : ''}
            </div>

            <div class="nav-section-label">Help</div>
            <div class="nav-item" data-view="tutorial">
              <span class="nav-item-icon">📖</span>
              <span>Tutorial</span>
            </div>
          </nav>

          <div class="sidebar-footer">
            <div class="sidebar-budget">
              <span class="sidebar-budget-label">Budget</span>
              <span class="sidebar-budget-value ${state.budget < 0 ? 'negative' : ''}" id="sidebar-budget">
                ${FinanceEngine.formatMoney(state.budget)}
              </span>
            </div>
            <div class="sidebar-actions">
              <button class="btn btn-advance-week" id="advance-week-btn">
                ${t('sidebar.advanceWeek')}
              </button>
              <button class="btn btn-new-game" id="new-game-sidebar-btn">
                ${t('sidebar.newGame')}
              </button>
            </div>
            <div class="lang-toggle" id="lang-toggle">
              <button class="lang-btn ${I18N.getLang() === 'fr' ? 'active' : ''}" data-lang="fr">FR</button>
              <button class="lang-btn ${I18N.getLang() === 'en' ? 'active' : ''}" data-lang="en">EN</button>
            </div>
          </div>
        </aside>

        <main class="main-content">
          <div id="view-container" class="view-container"></div>
        </main>
      </div>

      <div class="toast-container" id="toast-container"></div>
      <div id="modal-root"></div>
    `;

    // Bind nav clicks
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        if (view) {
          this.navigateTo(view);
          // Auto-close sidebar on mobile
          this._closeMobileSidebar();
        }
      });
    });

    // Bind advance week
    document.getElementById('advance-week-btn').addEventListener('click', () => {
      this.advanceWeek();
    });

    // Bind new game
    document.getElementById('new-game-sidebar-btn').addEventListener('click', () => {
      this.confirmNewGame();
    });

    // Bind language toggle
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        I18N.setLang(lang);
        this.renderApp();
        this.navigateTo(this.currentView);
      });
    });

    // Bind mobile menu button
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
      this._toggleMobileSidebar();
    });
    document.getElementById('sidebar-overlay').addEventListener('click', () => {
      this._closeMobileSidebar();
    });
  },

  _toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const btn = document.getElementById('mobile-menu-btn');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    btn.classList.toggle('active');
  },

  _closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const btn = document.getElementById('mobile-menu-btn');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    if (btn) btn.classList.remove('active');
  },

  /**
   * Confirm new game with modal
   */
  confirmNewGame() {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal" style="max-width: 420px;">
          <div class="modal-header">
            <div class="modal-title">${t('sidebar.newGame')}</div>
            <button class="modal-close" id="cancel-new-game-x">✕</button>
          </div>
          <div class="modal-body">
            <p style="color: var(--text-secondary); line-height: 1.6;">
              ${t('sidebar.confirmReset')}
            </p>
          </div>
          <div class="modal-footer" style="gap: var(--space-md);">
            <button class="btn btn-secondary" id="cancel-new-game">${t('general.cancel')}</button>
            <button class="btn btn-danger" id="confirm-new-game">${t('sidebar.newGame')}</button>
          </div>
        </div>
      </div>
    `;

    const cancel = () => { modalRoot.innerHTML = ''; };
    document.getElementById('cancel-new-game').addEventListener('click', cancel);
    document.getElementById('cancel-new-game-x').addEventListener('click', cancel);
    document.getElementById('confirm-new-game').addEventListener('click', () => {
      GameState.reset();
      modalRoot.innerHTML = '';
      window.location.hash = '';
      this.showWelcome();
    });
  },

  /**
   * Advance week — new flow with events + summary
   */
  advanceWeek() {
    const state = GameState.get();
    if (state.gameOver) {
      this.showGameOver();
      return;
    }

    // Check for scheduled fights this week
    const thisWeekFights = state.schedule.filter(s => s.week === state.week && !s.completed);

    if (thisWeekFights.length > 0) {
      // Fight week: show fight simulation first
      this.showFightSimulation(thisWeekFights);
    } else {
      // Normal week: check for random event first
      const event = EventEngine.rollForEvent(state);
      if (event) {
        this.showRandomEvent(event, () => {
          this._processWeekAndShowSummary();
        });
      } else {
        this._processWeekAndShowSummary();
      }
    }
  },

  /**
   * Process the week and show summary overlay
   */
  _processWeekAndShowSummary() {
    const report = GameState.advanceWeek();
    this.updateSidebar();
    this.showWeeklySummary(report);
  },

  /**
   * Show random event decision modal
   */
  showRandomEvent(event, onComplete) {
    const modalRoot = document.getElementById('modal-root');
    const fighter = event.selectedFighter;

    modalRoot.innerHTML = `
      <div class="modal-overlay event-overlay">
        <div class="modal event-modal animate-scale-in" style="max-width: 520px;">
          <div class="event-modal-header">
            <div class="event-icon-wrapper">
              <span class="event-icon">${event.icon}</span>
            </div>
            <div class="event-category">${event.category.toUpperCase()}</div>
            <h2 class="event-title">${event.title}</h2>
          </div>
          <div class="event-body">
            <p class="event-text">${event.text}</p>
            <div class="event-choices">
              ${event.choices.map((choice, i) => `
                <button class="event-choice-btn" data-choice="${i}">
                  <div class="event-choice-label">${choice.label}</div>
                  <div class="event-choice-desc">${choice.description}</div>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind choices
    modalRoot.querySelectorAll('.event-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const choiceIndex = parseInt(btn.dataset.choice);
        const result = EventEngine.applyChoice(GameState.get(), event, choiceIndex);

        // Show brief result
        this._showEventResult(event, event.choices[choiceIndex], result, () => {
          modalRoot.innerHTML = '';
          onComplete();
        });
      });
    });
  },

  /**
   * Show event result briefly
   */
  _showEventResult(event, choice, result, onComplete) {
    const modalRoot = document.getElementById('modal-root');

    modalRoot.innerHTML = `
      <div class="modal-overlay event-overlay">
        <div class="modal event-modal animate-scale-in" style="max-width: 480px;">
          <div class="event-modal-header" style="padding-bottom: var(--space-md);">
            <div class="event-icon-wrapper">
              <span class="event-icon">${event.icon}</span>
            </div>
            <h2 class="event-title" style="font-size: var(--font-lg);">${event.title}</h2>
          </div>
          <div class="event-body">
            <div class="event-result-chosen">${choice.label}</div>
            ${result.applied.length > 0 ? `
              <div class="event-result-effects">
                ${result.applied.map(line => `
                  <div class="event-effect-line">${line}</div>
                `).join('')}
              </div>
            ` : ''}
            <button class="btn btn-primary btn-block mt-lg" id="event-continue">
              Continuer →
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('event-continue').addEventListener('click', onComplete);
  },

  /**
   * Show weekly summary overlay
   */
  showWeeklySummary(report) {
    const modalRoot = document.getElementById('modal-root');
    const state = GameState.get();

    // Training gains rows
    const trainingRows = report.trainingReport.map((tr, i) => {
      const trainingType = TRAINING_TYPES[tr.training];
      const statChips = Object.entries(tr.deltas).map(([statId, diff]) => {
        const statInfo = STAT_NAMES.find(s => s.id === statId);
        return `<span class="summary-stat-chip ${diff > 0 ? 'positive' : 'negative'}">
          ${statInfo?.icon || ''} ${diff > 0 ? '+' : ''}${diff}
        </span>`;
      }).join('');

      const moraleChip = tr.moraleDelta !== 0 ?
        `<span class="summary-stat-chip ${tr.moraleDelta > 0 ? 'positive' : 'negative'}">
          ${tr.moraleDelta > 0 ? '😊' : '😤'} ${tr.moraleDelta > 0 ? '+' : ''}${tr.moraleDelta}
        </span>` : '';

      return `
        <div class="summary-fighter-row animate-slide-in" style="animation-delay: ${i * 80}ms;">
          <div class="fighter-mini-avatar" style="background: ${tr.avatarColor}; width: 32px; height: 32px; font-size: 11px;">
            ${tr.initials}
          </div>
          <div class="summary-fighter-info">
            <div class="summary-fighter-name">${tr.name}</div>
            <div class="summary-fighter-training">
              ${trainingType ? `${trainingType.icon} ${trainingType.name}` : '—'}
              ${tr.status === 'injured' ? `<span class="text-danger">· 🤕 ${t('fighters.injured')}</span>` : ''}
            </div>
          </div>
          <div class="summary-fighter-gains">
            ${tr.hasChange ? statChips : '<span class="text-muted text-xs">—</span>'}
            ${moraleChip}
          </div>
        </div>
      `;
    }).join('');

    // Recoveries
    const recoveriesHTML = report.recoveries.length > 0 ? `
      <div class="summary-section animate-slide-in" style="animation-delay: ${report.trainingReport.length * 80 + 100}ms;">
        <div class="summary-section-title">${t('summary.recoveries')}</div>
        ${report.recoveries.map(name => `
          <div class="summary-recovery-line">✅ <strong>${name}</strong> ${t('summary.recovered', { name: '' }).trim()}</div>
        `).join('')}
      </div>
    ` : '';

    // Next event info
    const nextFight = state.schedule.find(s => !s.completed && s.week >= state.week);
    const nextEventInfo = nextFight ? `${t('summary.nextEvent', { n: nextFight.week })} ${t('summary.weeksUntil', { n: nextFight.week - state.week + 1 })}` : t('summary.nextEvent', { n: state.nextEventWeek });

    modalRoot.innerHTML = `
      <div class="modal-overlay summary-overlay">
        <div class="modal summary-modal animate-scale-in">
          <div class="summary-header">
            <div class="summary-week-badge animate-pop">
              <span class="summary-week-label">${t('summary.week')}</span>
              <span class="summary-week-number">${report.week}</span>
            </div>
            <div class="summary-header-text">
              <h2 class="summary-title">${t('summary.title')}</h2>
              <div class="summary-subtitle">${state.gymName}</div>
            </div>
          </div>

          <div class="summary-body">
            <!-- Finance bar -->
            <div class="summary-finance-bar animate-slide-in" style="animation-delay: 50ms;">
              <div class="summary-finance-item">
                <span class="text-xs text-muted">Budget</span>
                <span class="font-bold ${state.budget >= 0 ? 'text-success' : 'text-danger'}">
                  ${FinanceEngine.formatMoney(state.budget)}
                </span>
              </div>
              <div class="summary-finance-item">
                <span class="text-xs text-muted">${t('summary.salaries')}</span>
                <span class="font-bold text-danger">-${FinanceEngine.formatMoney(report.salaries)}</span>
              </div>
              <div class="summary-finance-item">
                <span class="text-xs text-muted">${t('summary.variation')}</span>
                <span class="font-bold ${report.budgetDelta >= 0 ? 'text-success' : 'text-danger'}">
                  ${report.budgetDelta >= 0 ? '+' : ''}${FinanceEngine.formatMoney(report.budgetDelta)}
                </span>
              </div>
            </div>

            <!-- Training Gains -->
            <div class="summary-section">
              <div class="summary-section-title">🏋️ ${t('sidebar.training')}</div>
              ${trainingRows}
            </div>

            ${recoveriesHTML}

            <!-- Next event -->
            <div class="summary-next-event animate-slide-in" style="animation-delay: ${report.trainingReport.length * 80 + 200}ms;">
              📅 ${nextEventInfo}
            </div>
          </div>

          <div class="summary-footer">
            <button class="btn btn-primary btn-lg" id="summary-continue">
              ${t('summary.continueBtn')} ${t('sidebar.week', { n: state.week })}
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('summary-continue').addEventListener('click', () => {
      modalRoot.innerHTML = '';
      this.navigateTo(this.currentView);

      if (state.gameOver) {
        this.showGameOver();
      }
    });
  },

  /**
   * Show fight simulation as full page (pre-fight card)
   */
  showFightSimulation(fights) {
    const state = GameState.get();

    // Hide sidebar, use full page
    document.querySelector('.sidebar')?.classList.add('fight-night-active');
    document.querySelector('.main-content')?.classList.add('fight-night-mode');

    const container = document.getElementById('view-container');

    const fightCards = fights.map(fight => {
      const playerFighter = state.fighters.find(f => f.id === fight.playerFighterId);
      const opponent = state.aiFighters.find(f => f.id === fight.opponentId);
      if (!playerFighter || !opponent) return '';

      const isInjured = playerFighter.status === 'injured';
      const f1Ovr = TrainingEngine.calculateOverall(playerFighter);
      const f2Ovr = TrainingEngine.calculateOverall(opponent);
      const wcData = WEIGHT_CLASSES.find(wc => wc.id === playerFighter.weightClass);

      return `
        <div class="fn-fight-card ${isInjured ? 'fn-cancelled' : ''}">
          <div class="fn-card-fighter">
            <div class="fn-card-avatar" style="background: ${playerFighter.avatarColor};">
              ${playerFighter.firstName[0]}${playerFighter.lastName[0]}
            </div>
            <div class="fn-card-name">${playerFighter.fullName}</div>
            <div class="fn-card-record">${playerFighter.wins}-${playerFighter.losses}</div>
            <div class="fn-card-ovr">${f1Ovr} OVR</div>
            <div class="fn-card-style">${STYLES[playerFighter.style]?.icon} ${STYLES[playerFighter.style]?.name}</div>
            ${isInjured ? `<span class="badge badge-injured">🤕 ${t('fighters.injured')}</span>` : ''}
          </div>
          <div class="fn-card-center">
            <div class="fn-card-vs">VS</div>
            <div class="fn-card-wc">${wcData?.icon} ${wcData?.name || ''}</div>
            ${fight.isTitle ? '<div class="fn-card-title">🏆 Title Fight</div>' : ''}
          </div>
          <div class="fn-card-fighter">
            <div class="fn-card-avatar" style="background: ${opponent.avatarColor};">
              ${opponent.firstName[0]}${opponent.lastName[0]}
            </div>
            <div class="fn-card-name">${opponent.fullName}</div>
            <div class="fn-card-record">${opponent.wins}-${opponent.losses}</div>
            <div class="fn-card-ovr">${f2Ovr} OVR</div>
            <div class="fn-card-style">${STYLES[opponent.style]?.icon} ${STYLES[opponent.style]?.name}</div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="fn-page">
        <div class="fn-header">
          <h1 class="fn-event-title">🏟️ ${fights[0]?.eventName || 'AFC Fight Night'}</h1>
          <div class="fn-event-sub">${t('sidebar.week', { n: state.week })} — ${t('fight.fightNight')}</div>
        </div>
        ${fightCards}
        <div class="fn-start-area">
          <button class="btn btn-primary btn-lg fn-start-btn" id="simulate-fights-btn">
            ⚔️ ${t('fight.simulate')}
          </button>
        </div>
      </div>
    `;

    document.getElementById('simulate-fights-btn').addEventListener('click', () => {
      const state = GameState.get();
      const thisWeekFights = state.schedule.filter(s => s.week === state.week && !s.completed);

      const fightData = [];
      const cancelledFights = [];

      thisWeekFights.forEach(sf => {
        const playerFighter = state.fighters.find(f => f.id === sf.playerFighterId);
        const opponent = state.aiFighters.find(f => f.id === sf.opponentId);
        if (!playerFighter || !opponent) return;

        if (playerFighter.status === 'injured') {
          sf.completed = true;
          cancelledFights.push(playerFighter.fullName);
          return;
        }

        let campBonuses = null;
        if (sf.fightCamp) campBonuses = FIGHT_CAMP_TYPES[sf.fightCamp].bonuses;
        fightData.push({ scheduledFight: sf, playerFighter, opponent, campBonuses });
      });

      cancelledFights.forEach(name => {
        this.showToast(`${name} — ${t('fight.cancelledInjury')}`, 'warning');
      });

      if (fightData.length === 0) {
        this._exitFightNight();
        const report = GameState.advanceWeek();
        this.updateSidebar();
        this.showWeeklySummary(report);
        return;
      }

      this._interactiveFightResults = [];
      this._playFightInteractive(fightData, 0);
    });
  },

  /**
   * Exit fight night mode — restore sidebar and main layout
   */
  _exitFightNight() {
    document.querySelector('.sidebar')?.classList.remove('fight-night-active');
    document.querySelector('.main-content')?.classList.remove('fight-night-mode');
    document.getElementById('modal-root').innerHTML = '';
  },

  /**
   * Play a fight interactively (round by round with corner instructions)
   */
  _playFightInteractive(fightData, fightIndex) {
    const container = document.getElementById('view-container');
    const { scheduledFight, playerFighter, opponent, campBonuses } = fightData[fightIndex];
    const isTitle = scheduledFight.isTitle;
    const totalRounds = isTitle ? 5 : 3;

    // Fight state
    const rounds = [];
    let currentRound = 1;
    let f1AccDamage = 0;
    let f2AccDamage = 0;
    let f1AccControl = 0;
    let f2AccControl = 0;
    let maxDamage = 10;
    let maxControl = 5;
    let fightFinished = false;
    let roundScoresHTML = '';

    const simulateAndShowRound = (cornerInstruction) => {
      if (fightFinished || currentRound > totalRounds) return;

      // Simulate this round
      const roundResult = CombatEngine.simulateOneRound(
        playerFighter, opponent, currentRound, totalRounds,
        campBonuses, cornerInstruction,
        f1AccDamage, f2AccDamage
      );

      rounds.push(roundResult);
      f1AccDamage += roundResult.f1DamageTaken;
      f2AccDamage += roundResult.f2DamageTaken;
      f1AccControl += roundResult.f1Control;
      f2AccControl += roundResult.f2Control;

      if (roundResult.finish) fightFinished = true;

      // Render the live fight UI
      this._renderLiveFight(container, playerFighter, opponent, scheduledFight, currentRound, totalRounds);

      // Animate events
      const log = document.getElementById('live-event-log');
      const roundIndicator = document.getElementById('live-round');
      const roundScoresEl = document.getElementById('live-round-scores');

      // Show round start
      roundIndicator.innerHTML = `Round <strong>${currentRound}</strong> / ${totalRounds}`;
      roundIndicator.classList.add('animate-pop');
      setTimeout(() => roundIndicator.classList.remove('animate-pop'), 500);

      // Show corner instruction if used
      if (cornerInstruction) {
        const cornerLine = document.createElement('div');
        cornerLine.className = 'live-corner-used animate-fade-in';
        cornerLine.innerHTML = `🗣️ "${cornerInstruction.icon} ${cornerInstruction.name}"`;
        log.appendChild(cornerLine);
      }

      // Restore round scores from previous rounds
      roundScoresEl.innerHTML = roundScoresHTML;

      // Play round events one by one
      let eventIdx = 0;
      const playNextEvent = () => {
        if (eventIdx >= roundResult.events.length) {
          // Round complete — update scoring bars
          maxDamage = Math.max(maxDamage, f2AccDamage, f1AccDamage);
          maxControl = Math.max(maxControl, f1AccControl, f2AccControl);

          document.getElementById('live-damage-f1').style.width = `${(f2AccDamage / maxDamage) * 50}%`;
          document.getElementById('live-damage-f2').style.width = `${(f1AccDamage / maxDamage) * 50}%`;
          document.getElementById('live-control-f1').style.width = `${(f1AccControl / maxControl) * 50}%`;
          document.getElementById('live-control-f2').style.width = `${(f2AccControl / maxControl) * 50}%`;

          if (fightFinished) {
            // Build final result and show
            const finalResult = CombatEngine.buildResult(playerFighter, opponent, rounds, isTitle);
            finalResult.eventName = scheduledFight.eventName;
            finalResult.week = GameState.get().week;
            finalResult.scheduleId = scheduledFight.id;

            this._showFightResult(log, finalResult, fightData, fightIndex);
          } else {
            // Round scoring chip
            const f1RoundScore = roundResult.f1Control + roundResult.f2DamageTaken * 1.5;
            const f2RoundScore = roundResult.f2Control + roundResult.f1DamageTaken * 1.5;
            const winner = f1RoundScore > f2RoundScore ? 'f1' : 'f2';

            roundScoresHTML += `
              <span class="live-round-chip ${winner === 'f1' ? 'f1-win' : 'f2-win'}">
                R${currentRound}: ${winner === 'f1' ? playerFighter.fullName.split(' ').pop() : opponent.fullName.split(' ').pop()}
              </span>
            `;
            roundScoresEl.innerHTML = roundScoresHTML;

            const separator = document.createElement('div');
            separator.className = 'live-round-end animate-fade-in';
            separator.innerHTML = t('fight.roundEnd', { n: currentRound, name: winner === 'f1' ? playerFighter.fullName : opponent.fullName });
            log.appendChild(separator);
            log.scrollTop = log.scrollHeight;

            currentRound++;

            // If that was the last round, go to decision
            if (currentRound > totalRounds) {
              setTimeout(() => {
                const finalResult = CombatEngine.buildResult(playerFighter, opponent, rounds, isTitle);
                finalResult.eventName = scheduledFight.eventName;
                finalResult.week = GameState.get().week;
                finalResult.scheduleId = scheduledFight.id;
                this._showFightResult(log, finalResult, fightData, fightIndex);
              }, 600);
            } else {
              // Show corner instructions picker
              setTimeout(() => {
                try {
                  const lastRound = rounds[rounds.length - 1];
                  this._showCornerInstructions(log, currentRound, totalRounds, playerFighter, opponent, lastRound, f1AccDamage, f2AccDamage, (chosenInstruction) => {
                    simulateAndShowRound(chosenInstruction);
                  });
                } catch(e) {
                  console.error('Corner error:', e);
                }
              }, 600);
            }
          }
          return;
        }

        const evt = roundResult.events[eventIdx];
        eventIdx++;

        const line = document.createElement('div');
        line.className = `live-event-line animate-fade-in ${evt.type === 'finish' ? 'live-finish' : ''} ${evt.type === 'highlight' ? 'live-highlight' : ''}`;
        line.textContent = evt.text;
        log.appendChild(line);
        log.scrollTop = log.scrollHeight;

        const delay = evt.type === 'finish' ? 1200 : evt.type === 'highlight' ? 700 : 400;
        setTimeout(playNextEvent, delay);
      };

      // Start event playback after a short delay
      setTimeout(playNextEvent, 500);
    };

    // Start first round (no corner instruction for round 1)
    simulateAndShowRound(null);
  },

  /**
   * Render the full-page fight UI (FM-style 3 columns)
   */
  _renderLiveFight(container, f1, f2, scheduledFight, currentRound, totalRounds) {
    const f1Ovr = TrainingEngine.calculateOverall(f1);
    const f2Ovr = TrainingEngine.calculateOverall(f2);

    container.innerHTML = `
      <div class="fn-page fn-live">
        <div class="fn-live-topbar">
          <div class="fn-live-event">🏟️ ${scheduledFight.eventName || 'AFC Fight Night'}</div>
          <div class="fn-live-round" id="live-round">${t('fight.round')} <strong>${currentRound}</strong> / ${totalRounds}</div>
          ${scheduledFight.isTitle ? '<div class="fn-live-title">🏆 Title Fight</div>' : ''}
        </div>

        <div class="fn-live-main">
          <!-- Left: Your fighter -->
          <div class="fn-live-panel fn-panel-f1">
            <div class="fn-panel-avatar" style="background: ${f1.avatarColor};">
              ${f1.firstName[0]}${f1.lastName[0]}
            </div>
            <div class="fn-panel-name">${f1.fullName}</div>
            <div class="fn-panel-record">${f1.wins}-${f1.losses}</div>
            <div class="fn-panel-ovr">${f1Ovr}</div>
            <div class="fn-panel-ovr-label">OVR</div>
            <div class="fn-panel-style">${STYLES[f1.style]?.icon} ${STYLES[f1.style]?.name}</div>
          </div>

          <!-- Center: Commentary -->
          <div class="fn-live-center">
            <div class="live-event-log" id="live-event-log"></div>
          </div>

          <!-- Right: Opponent -->
          <div class="fn-live-panel fn-panel-f2">
            <div class="fn-panel-avatar" style="background: ${f2.avatarColor};">
              ${f2.firstName[0]}${f2.lastName[0]}
            </div>
            <div class="fn-panel-name">${f2.fullName}</div>
            <div class="fn-panel-record">${f2.wins}-${f2.losses}</div>
            <div class="fn-panel-ovr">${f2Ovr}</div>
            <div class="fn-panel-ovr-label">OVR</div>
            <div class="fn-panel-style">${STYLES[f2.style]?.icon} ${STYLES[f2.style]?.name}</div>
          </div>
        </div>

        <!-- Bottom: Stats bars -->
        <div class="fn-live-stats">
          <div class="fn-stat-row">
            <div class="fn-stat-bar-wrap">
              <div class="fn-stat-label">👊 ${t('analysis.strikesLanded')}</div>
              <div class="live-dual-bar">
                <div class="live-bar-f1" id="live-damage-f1" style="width: 0%;"></div>
                <div class="live-bar-f2" id="live-damage-f2" style="width: 0%;"></div>
              </div>
            </div>
          </div>
          <div class="fn-stat-row">
            <div class="fn-stat-bar-wrap">
              <div class="fn-stat-label">🎯 ${t('analysis.control')}</div>
              <div class="live-dual-bar">
                <div class="live-bar-f1" id="live-control-f1" style="width: 0%;"></div>
                <div class="live-bar-f2" id="live-control-f2" style="width: 0%;"></div>
              </div>
            </div>
          </div>
          <div class="live-round-scores" id="live-round-scores"></div>
        </div>
      </div>
    `;
  },

  /**
   * Show corner instructions between rounds
   */
  _showCornerInstructions(log, nextRound, totalRounds, fighter, opponent, lastRound, f1AccDamage, f2AccDamage, onChoose) {
    const cornerEl = document.createElement('div');
    cornerEl.className = 'corner-instructions-panel animate-fade-in';

    // Build round analysis
    let analysisHTML = '';
    try {
      analysisHTML = this._buildRoundAnalysis(lastRound, fighter, opponent, f1AccDamage, f2AccDamage);
    } catch(e) {
      console.error('Corner analysis error:', e);
    }

    cornerEl.innerHTML = `
      ${analysisHTML}
      <div class="corner-header">
        <div class="corner-title">${t('corner.title', { n: nextRound })}</div>
        <div class="corner-subtitle">${t('corner.subtitle', { name: fighter.firstName })}</div>
      </div>
      <div class="corner-grid">
        ${Object.values(CORNER_INSTRUCTIONS).map(ci => `
          <button class="corner-btn" data-instruction="${ci.id}">
            <span class="corner-btn-icon">${ci.icon}</span>
            <span class="corner-btn-name">${ci.name}</span>
            <span class="corner-btn-desc">${ci.shortDesc}</span>
          </button>
        `).join('')}
      </div>
    `;

    log.appendChild(cornerEl);
    log.scrollTop = log.scrollHeight;

    cornerEl.querySelectorAll('.corner-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const instructionId = btn.dataset.instruction;
        const instruction = CORNER_INSTRUCTIONS[instructionId];
        cornerEl.remove();
        onChoose(instruction);
      });
    });
  },

  /**
   * Build the round analysis HTML
   */
  _buildRoundAnalysis(lastRound, fighter, opponent, f1AccDamage, f2AccDamage) {
    if (!lastRound) return '';

    const rn = lastRound.roundNumber;
    const phases = lastRound.phases || {};
    const strikes = lastRound.strikes || { f1: 0, f2: 0 };
    const takedowns = lastRound.takedowns || { f1: 0, f2: 0 };
    const f1Stats = lastRound.f1EffectiveStats || {};
    const f2Stats = lastRound.f2EffectiveStats || {};

    // Determine dominant phase
    const maxPhase = Math.max(phases.strikingExchanges || 0, phases.wrestlingExchanges || 0, phases.groundExchanges || 0);
    let dominantPhase = t('analysis.mixed');
    if ((phases.strikingExchanges || 0) === maxPhase && maxPhase > 0) dominantPhase = t('analysis.striking');
    else if ((phases.wrestlingExchanges || 0) === maxPhase && maxPhase > 0) dominantPhase = t('analysis.wrestling');
    else if ((phases.groundExchanges || 0) === maxPhase && maxPhase > 0) dominantPhase = t('analysis.ground');

    // Stamina & chin bars (percentage based on effective stats)
    const f1Stamina = Math.max(0, Math.min(100, f1Stats.cardio || 50));
    const f2Stamina = Math.max(0, Math.min(100, f2Stats.cardio || 50));
    const f1Chin = Math.max(0, Math.min(100, f1Stats.chin || 50));
    const f2Chin = Math.max(0, Math.min(100, f2Stats.chin || 50));

    const barColor = (val) => val > 60 ? 'var(--color-success)' : val > 35 ? 'var(--accent-orange)' : 'var(--accent-red)';

    return `
      <div class="round-analysis">
        <div class="round-analysis-title">📊 ${t('analysis.title', { n: rn })}</div>
        
        <div class="round-analysis-stats">
          <div class="analysis-stat-row">
            <span class="analysis-stat-val">${strikes.f1}</span>
            <span class="analysis-stat-label">👊 ${t('analysis.strikesLanded')}</span>
            <span class="analysis-stat-val">${strikes.f2}</span>
          </div>
          <div class="analysis-stat-row">
            <span class="analysis-stat-val">${takedowns.f1}</span>
            <span class="analysis-stat-label">🤼 ${t('analysis.takedowns')}</span>
            <span class="analysis-stat-val">${takedowns.f2}</span>
          </div>
          <div class="analysis-stat-row">
            <span class="analysis-stat-val">${lastRound.f1Control}</span>
            <span class="analysis-stat-label">🎯 ${t('analysis.control')}</span>
            <span class="analysis-stat-val">${lastRound.f2Control}</span>
          </div>
          <div class="analysis-stat-row">
            <span class="analysis-stat-val">${lastRound.f2DamageTaken}</span>
            <span class="analysis-stat-label">💥 ${t('analysis.damage')}</span>
            <span class="analysis-stat-val">${lastRound.f1DamageTaken}</span>
          </div>
        </div>

        <div class="analysis-phase">
          ⚡ ${t('analysis.dominantPhase')}: <strong>${dominantPhase}</strong>
        </div>

        <div class="analysis-condition">
          <div class="analysis-condition-fighter">
            <div class="analysis-condition-name">${fighter.firstName}</div>
            <div class="analysis-bar-group">
              <div class="analysis-bar-row">
                <span class="analysis-bar-label">❤️</span>
                <div class="analysis-bar-bg"><div class="analysis-bar-fill" style="width:${f1Stamina}%; background:${barColor(f1Stamina)}"></div></div>
              </div>
              <div class="analysis-bar-row">
                <span class="analysis-bar-label">🛡️</span>
                <div class="analysis-bar-bg"><div class="analysis-bar-fill" style="width:${f1Chin}%; background:${barColor(f1Chin)}"></div></div>
              </div>
            </div>
          </div>
          <div class="analysis-condition-fighter">
            <div class="analysis-condition-name">${opponent.firstName}</div>
            <div class="analysis-bar-group">
              <div class="analysis-bar-row">
                <span class="analysis-bar-label">❤️</span>
                <div class="analysis-bar-bg"><div class="analysis-bar-fill" style="width:${f2Stamina}%; background:${barColor(f2Stamina)}"></div></div>
              </div>
              <div class="analysis-bar-row">
                <span class="analysis-bar-label">🛡️</span>
                <div class="analysis-bar-bg"><div class="analysis-bar-fill" style="width:${f2Chin}%; background:${barColor(f2Chin)}"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Get contextual recommendation tags for corner instructions
   * These are HINTS, not guarantees — the fight still has randomness
   */
  _getCornerTags(lastRound, fighter, opponent, f1AccDamage, f2AccDamage) {
    const tags = {};
    if (!lastRound) return tags;

    const f1Stats = lastRound.f1EffectiveStats || fighter.stats;
    const f2Stats = lastRound.f2EffectiveStats || opponent.stats;
    const phases = lastRound.phases || {};

    // Is opponent hurt? (chin low or accumulated damage high)
    const oppHurt = f2Stats.chin < 40 || f2AccDamage > 15;
    // Is our fighter gassed?
    const weGassed = f1Stats.cardio < 40;
    // Is our fighter hurt?
    const weHurt = f1Stats.chin < 35 || f1AccDamage > 15;
    // Are we winning striking?
    const strikingDominant = (lastRound.strikes.f1 || 0) > (lastRound.strikes.f2 || 0) + 1;
    // Are we winning wrestling?
    const wrestlingDominant = (lastRound.takedowns.f1 || 0) > (lastRound.takedowns.f2 || 0);
    // Fighter stats advantages
    const goodStriker = fighter.stats.striking > opponent.stats.striking;
    const goodGrappler = fighter.stats.grappling > opponent.stats.grappling && fighter.stats.wrestling > opponent.stats.wrestling;

    // Stay Standing
    if (strikingDominant || goodStriker) {
      tags.stayStanding = { type: 'wise', label: t('corner.tagWise') };
    } else if (!goodStriker && wrestlingDominant) {
      tags.stayStanding = { type: 'risky', label: t('corner.tagRisky') };
    }

    // Takedown
    if (goodGrappler || wrestlingDominant) {
      tags.takedown = { type: 'wise', label: t('corner.tagWise') };
    } else if (goodStriker && strikingDominant) {
      tags.takedown = { type: 'risky', label: t('corner.tagRisky') };
    }

    // Go for finish
    if (oppHurt) {
      tags.goForFinish = { type: 'opportunity', label: t('corner.tagOpportunity') };
    } else if (weHurt || weGassed) {
      tags.goForFinish = { type: 'risky', label: t('corner.tagRisky') };
    }

    // Stay patient
    if (weHurt || weGassed) {
      tags.stayPatient = { type: 'safe', label: t('corner.tagSafe') };
    }

    // Work the body
    if (f2Stats.cardio < 50) {
      tags.workTheBody = { type: 'wise', label: t('corner.tagWise') };
    }

    // Recover
    if (weGassed || weHurt) {
      tags.recover = { type: 'wise', label: t('corner.tagWise') };
    } else if (!weGassed && !weHurt) {
      tags.recover = { type: 'risky', label: t('corner.tagRisky') };
    }

    return tags;
  },

  /**
   * Show the final fight result and continue button
   */
  _showFightResult(log, result, fightData, fightIndex) {
    const winnerName = result.winner === 'fighter1' ? result.fighter1.name : result.fighter2.name;
    const isPlayerWin = result.winner === 'fighter1';

    const resultEl = document.createElement('div');
    resultEl.className = 'live-result animate-scale-in';
    resultEl.innerHTML = `
      <div class="live-result-banner ${isPlayerWin ? 'win' : 'loss'}">
        ${isPlayerWin ? t('fight.victory') : t('fight.defeat')}
      </div>
      <div class="live-result-winner">${winnerName}</div>
      <div class="live-result-method">
        ${result.method}${result.finishRound ? ` — ${t('fight.round')} ${result.finishRound}` : ''}
      </div>
      <button class="btn btn-primary btn-lg fn-continue-btn" id="live-continue" style="margin-top: var(--space-lg); width: 100%;">
        ${fightIndex + 1 < fightData.length ? '⚔️ ' + t('fight.continue') : '→ ' + t('summary.continueBtn')}
      </button>
    `;
    log.appendChild(resultEl);
    log.scrollTop = log.scrollHeight;

    this._interactiveFightResults.push(result);

    document.getElementById('live-continue').addEventListener('click', () => {
      if (fightIndex + 1 < fightData.length) {
        this._playFightInteractive(fightData, fightIndex + 1);
      } else {
        this._exitFightNight();
        const report = GameState.advanceWeek(this._interactiveFightResults);
        this.updateSidebar();
        this.showWeeklySummary(report);
      }
    });
  },

  /**
   * Show fight results
   */
  showFightResults(results) {
    const modalRoot = document.getElementById('modal-root');

    const resultsHTML = results.map(result => {
      const winnerName = result.winner === 'fighter1' ? result.fighter1.name : result.fighter2.name;
      const loserName = result.winner === 'fighter1' ? result.fighter2.name : result.fighter1.name;
      const isPlayerWin = result.winner === 'fighter1';

      return `
        <div class="card mb-md" style="border-left: 3px solid ${isPlayerWin ? 'var(--color-success)' : 'var(--color-danger)'};">
          <div class="flex items-center justify-between mb-md">
            <div>
              <span class="badge ${isPlayerWin ? 'badge-win' : 'badge-loss'}">${isPlayerWin ? t('fight.victory') : t('fight.defeat')}</span>
            </div>
            <span class="text-sm text-muted">${result.method}${result.finishRound ? ` — ${t('fight.round')} ${result.finishRound}` : ''}</span>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="font-bold">${result.fighter1.name}</div>
              <div class="text-xs text-muted">${t('scout.yourFighter')}</div>
            </div>
            <div class="text-xl font-black text-accent">VS</div>
            <div style="text-align: right;">
              <div class="font-bold">${result.fighter2.name}</div>
              <div class="text-xs text-muted">${t('scout.opponent')}</div>
            </div>
          </div>
          <div class="divider"></div>
          <button class="btn btn-ghost btn-sm w-full view-fight-log-btn" data-fight-id="${result.id}">
            📋 View Full Fight Log
          </button>
        </div>
      `;
    }).join('');

    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header">
            <div class="modal-title">${t('results.title')}</div>
            <button class="modal-close" id="close-results">✕</button>
          </div>
          <div class="modal-body">
            ${resultsHTML}
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="continue-btn">${t('fight.continue')}</button>
          </div>
        </div>
      </div>
    `;

    const closeResults = () => {
      modalRoot.innerHTML = '';
      this.updateSidebar();
      this.navigateTo(this.currentView);

      // Check game over
      const state = GameState.get();
      if (state.gameOver) {
        this.showGameOver();
      }
    };

    document.getElementById('close-results').addEventListener('click', closeResults);
    document.getElementById('continue-btn').addEventListener('click', closeResults);

    // Fight log buttons
    document.querySelectorAll('.view-fight-log-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fightId = btn.dataset.fightId;
        const fight = results.find(r => r.id === fightId);
        if (fight) this.showFightLog(fight);
      });
    });
  },

  /**
   * Show detailed fight log
   */
  showFightLog(result) {
    const modalRoot = document.getElementById('modal-root');

    const roundsHTML = result.rounds.map(round => {
      const eventsHTML = round.events.map(event => {
        let className = 'fight-log-event';
        if (event.type === 'highlight') className += ' highlight';
        if (event.type === 'finish') className += ' finish';
        return `<div class="${className}">${event.text}</div>`;
      }).join('');

      return `
        <div class="fight-log-round">
          <div class="fight-log-round-header">
            <span class="fight-log-round-number">R${round.roundNumber}</span>
            <span class="fight-log-round-title">Round ${round.roundNumber}</span>
          </div>
          ${eventsHTML}
        </div>
      `;
    }).join('');

    const winnerName = result.winner === 'fighter1' ? result.fighter1.name : result.fighter2.name;

    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div class="modal-title">📋 Fight Log — ${result.fighter1.name} vs ${result.fighter2.name}</div>
            <button class="modal-close" id="close-fight-log">✕</button>
          </div>
          <div class="modal-body">
            <div class="fight-log">
              ${roundsHTML}
            </div>
            <div class="fight-log-result">
              <div class="fight-log-result-method">${result.method}</div>
              <div class="fight-log-result-detail">
                Winner: <strong>${winnerName}</strong>
                ${result.finishRound ? `— Round ${result.finishRound}` : ''}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="back-to-results">← Back</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('close-fight-log').addEventListener('click', () => {
      // Re-show results or close
      modalRoot.innerHTML = '';
      this.updateSidebar();
      this.navigateTo(this.currentView);
    });

    document.getElementById('back-to-results').addEventListener('click', () => {
      modalRoot.innerHTML = '';
      this.updateSidebar();
      this.navigateTo(this.currentView);
    });
  },

  /**
   * Show game over screen
   */
  showGameOver() {
    const modalRoot = document.getElementById('modal-root');
    const state = GameState.get();

    modalRoot.innerHTML = `
      <div class="game-over-overlay">
        <div class="game-over-content">
          <div class="game-over-title">💀 Game Over</div>
          <div class="game-over-message">
            Your gym "${state.gymName}" went bankrupt after ${state.week} weeks.<br>
            Budget was negative for 4 consecutive weeks.
          </div>
          <button class="btn btn-primary btn-lg" id="new-game-btn">🔄 New Game</button>
        </div>
      </div>
    `;

    document.getElementById('new-game-btn').addEventListener('click', () => {
      GameState.reset();
      modalRoot.innerHTML = '';
      this.showWelcome();
    });
  },

  /**
   * Show decline reason modal for a fight offer
   */
  showDeclineModal(offerId) {
    const modalRoot = document.getElementById('modal-root');
    const state = GameState.get();
    const offer = state.fightOffers.find(o => o.id === offerId);
    if (!offer) return;

    const fighter = state.fighters.find(f => f.id === offer.fighterId);
    const opponent = state.aiFighters.find(f => f.id === offer.opponentId);
    if (!fighter || !opponent) return;

    const reasonButtons = Object.values(DECLINE_REASONS).map(reason => `
      <button class="decline-reason-btn" data-reason="${reason.id}">
        <div class="decline-reason-header">
          <span class="decline-reason-icon">${reason.icon}</span>
          <span class="decline-reason-label">${t('decline.' + reason.id)}</span>
        </div>
        <div class="decline-reason-desc">${t('decline.' + reason.id + 'Desc')}</div>
        <div class="decline-reason-effect ${reason.moraleEffect > 0 ? 'positive' : reason.moraleEffect < 0 ? 'negative' : ''}">
          ⚡ ${t('decline.' + reason.id + 'Effect')}
        </div>
      </button>
    `).join('');

    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal" style="max-width: 520px;">
          <div class="modal-header">
            <div class="modal-title">${t('decline.title')}</div>
            <button class="modal-close" id="close-decline">✕</button>
          </div>
          <div class="modal-body">
            <div class="text-sm text-muted mb-lg" style="text-align: center;">
              ${t('decline.subtitle')}<br>
              <strong>${fighter.fullName}</strong> vs <strong>${opponent.fullName}</strong>
            </div>
            <div class="decline-reasons-grid">
              ${reasonButtons}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-decline">${t('general.cancel')}</button>
          </div>
        </div>
      </div>
    `;

    const closeModal = () => { modalRoot.innerHTML = ''; };
    document.getElementById('close-decline').addEventListener('click', closeModal);
    document.getElementById('cancel-decline').addEventListener('click', closeModal);

    document.querySelectorAll('.decline-reason-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const reasonId = btn.dataset.reason;
        const result = GameState.declineOffer(offerId, reasonId);
        if (result) {
          this.showToast(t('offer.declinedToast', { name: result.fighter.fullName }), 'warning');
          modalRoot.innerHTML = '';
          this.updateSidebar();
          this.navigateTo('dashboard');
        }
      });
    });
  },

  /**
   * Update sidebar with current state
   */
  updateSidebar() {
    const state = GameState.get();
    if (!state) return;

    const weekEl = document.getElementById('sidebar-week');
    if (weekEl) weekEl.textContent = state.week;

    const budgetEl = document.getElementById('sidebar-budget');
    if (budgetEl) {
      budgetEl.textContent = FinanceEngine.formatMoney(state.budget);
      budgetEl.className = `sidebar-budget-value ${state.budget < 0 ? 'negative' : ''}`;
    }

    // Mobile header week
    const mobileWeek = document.querySelector('.mobile-header-week');
    if (mobileWeek) mobileWeek.textContent = t('sidebar.week', { n: state.week });
  },

  /**
   * Show confirmation modal to cut a fighter
   */
  confirmCutFighter(fighterId) {
    const state = GameState.get();
    const fighter = state.fighters.find(f => f.id === fighterId);
    if (!fighter) return;

    const severance = LeagueEngine.calculateSeverancePay(fighter, state);
    const modalRoot = document.getElementById('modal-root');

    modalRoot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal" style="max-width: 460px;">
          <div class="modal-header">
            <div class="modal-title">${t('market.confirmCutTitle')}</div>
            <button class="modal-close" id="cancel-cut-x">✕</button>
          </div>
          <div class="modal-body">
            <p style="color: var(--text-secondary); line-height: 1.6;">
              ${t('market.confirmCutMsg', { name: fighter.fullName })}
            </p>
            <div class="market-cut-severance">
              💸 ${t('market.severance')}: <strong>${FinanceEngine.formatMoney(severance)}</strong>
            </div>
          </div>
          <div class="modal-footer" style="gap: var(--space-md);">
            <button class="btn btn-secondary" id="cancel-cut-btn">${t('general.cancel')}</button>
            <button class="btn btn-danger" id="confirm-cut-btn">✂️ ${t('market.confirmCutBtn')}</button>
          </div>
        </div>
      </div>
    `;

    const close = () => { modalRoot.innerHTML = ''; };
    document.getElementById('cancel-cut-x').addEventListener('click', close);
    document.getElementById('cancel-cut-btn').addEventListener('click', close);
    document.getElementById('confirm-cut-btn').addEventListener('click', () => {
      const result = GameState.cutFighter(fighterId);
      if (result && result.fighter) {
        this.showToast(t('market.cutToast', {
          name: result.fighter.fullName,
          cost: FinanceEngine.formatMoney(result.severance)
        }), 'warning');
        close();
        this.updateSidebar();
        this.navigateTo('market');
      }
    });
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: '✅',
      warning: '⚠️',
      danger: '❌',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
    `;

    container.appendChild(toast);

    // Auto-remove after 4s
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  },

  /**
   * Get count of upcoming fights
   */
  _getUpcomingFightsCount(state) {
    return state.schedule.filter(s => !s.completed && s.week >= state.week).length;
  },

  /**
   * Handle state changes
   */
  onStateChange(event, data) {
    switch (event) {
      case 'injury':
        if (data?.fighter) {
          this.showToast(`🤕 ${data.fighter.fullName} is injured! (${data.fighter.injuryType} — ${data.fighter.injuryWeeksLeft} weeks)`, 'danger');
        }
        break;
      case 'recovery':
        if (data?.fighter) {
          this.showToast(`💪 ${data.fighter.fullName} has recovered from injury!`, 'success');
        }
        break;
    }
  },

  /**
   * Create radar chart SVG
   */
  createRadarChart(stats, size = 260) {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 35;
    const statKeys = STAT_NAMES.map(s => s.id);
    const labels = STAT_NAMES.map(s => s.short);
    const numAxes = statKeys.length;
    const angleStep = (2 * Math.PI) / numAxes;

    let svg = `<svg class="radar-chart" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

    // Draw grid circles
    for (let level = 1; level <= 4; level++) {
      const r = (radius / 4) * level;
      let points = [];
      for (let i = 0; i < numAxes; i++) {
        const angle = angleStep * i - Math.PI / 2;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      svg += `<polygon class="radar-grid" points="${points.join(' ')}"/>`;
    }

    // Draw axes
    for (let i = 0; i < numAxes; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      svg += `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;
    }

    // Draw data polygon
    let dataPoints = [];
    let pointElements = '';
    for (let i = 0; i < numAxes; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const value = (stats[statKeys[i]] || 0) / 100;
      const x = cx + radius * value * Math.cos(angle);
      const y = cy + radius * value * Math.sin(angle);
      dataPoints.push(`${x},${y}`);
      pointElements += `<circle class="radar-point" cx="${x}" cy="${y}"/>`;
    }
    svg += `<polygon class="radar-area" points="${dataPoints.join(' ')}"/>`;
    svg += pointElements;

    // Draw labels
    for (let i = 0; i < numAxes; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const labelRadius = radius + 20;
      const x = cx + labelRadius * Math.cos(angle);
      const y = cy + labelRadius * Math.sin(angle);
      svg += `<text class="radar-label" x="${x}" y="${y}" dy="4">${labels[i]}</text>`;
    }

    svg += '</svg>';
    return svg;
  }
};

// Boot the app
document.addEventListener('DOMContentLoaded', () => App.init());
