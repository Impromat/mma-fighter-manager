/* ============================================
   MMA Fighter Manager — Finances View
   ============================================ */

const FinancesView = {
  render(container) {
    const state = GameState.get();
    const summary = FinanceEngine.getWeeklySummary(state);
    const recentTransactions = FinanceEngine.getRecentTransactions(state, 20);
    const weeklyFinances = FinanceEngine.calculateWeeklyFinances(state);

    // Calculate totals
    const totalIncome = state.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = state.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">${t('fin.title')}</h1>
          <div class="view-subtitle">${t('fin.subtitle', { gym: state.gymName, n: state.week })}</div>
        </div>
      </div>

      <!-- Finance Summary -->
      <div class="finance-summary">
        <div class="card summary-card animate-fade-in-up stagger-1">
          <div class="summary-card-label">💰 ${t('fin.budget')}</div>
          <div class="summary-card-value" style="font-size: var(--font-3xl); color: ${state.budget >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
            ${FinanceEngine.formatMoney(state.budget)}
          </div>
          ${state.budget < 0 ? `
            <div class="summary-card-detail text-danger">
              ⚠️ Negative for ${state.negativeBudgetWeeks}/4 weeks
            </div>
          ` : ''}
        </div>

        <div class="card summary-card animate-fade-in-up stagger-2">
          <div class="summary-card-label">📈 ${t('fin.weeklyIncome')}</div>
          <div class="summary-card-value text-success">${FinanceEngine.formatMoney(totalIncome)}</div>
          <div class="summary-card-detail">Since week 1</div>
        </div>

        <div class="card summary-card animate-fade-in-up stagger-3">
          <div class="summary-card-label">📉 ${t('fin.weeklyExpenses')}</div>
          <div class="summary-card-value text-danger">${FinanceEngine.formatMoney(totalExpenses)}</div>
          <div class="summary-card-detail">Since week 1</div>
        </div>
      </div>

      <div class="dashboard-main">
        <!-- Left: Breakdown -->
        <div>
          <!-- Weekly Revenue -->
          <div class="card mb-lg animate-fade-in-up stagger-4">
            <div class="card-header">
              <div class="card-title">
                <span class="card-title-icon">💰</span>
                ${t('finance.trainingFees')}
              </div>
            </div>

            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Fighter</th>
                    <th>OVR</th>
                    <th style="text-align: right;">${t('train.fee')}/sem</th>
                  </tr>
                </thead>
                <tbody>
                  ${state.fighters.map(fighter => {
                    const fee = FinanceEngine.getFighterFee(fighter);
                    const ovr = TrainingEngine.calculateOverall(fighter);
                    const multiplier = fighter.feeMultiplier || 1.0;

                    return `
                      <tr>
                        <td>
                          <div class="flex items-center gap-sm">
                            <div class="fighter-mini-avatar" style="background: ${fighter.avatarColor}; width: 28px; height: 28px; font-size: 10px;">
                              ${fighter.firstName[0]}${fighter.lastName[0]}
                            </div>
                            <span class="font-semibold">${fighter.fullName}</span>
                            ${multiplier !== 1.0 ? `<span class="text-xs ${multiplier > 1 ? 'text-success' : 'text-danger'}">×${multiplier.toFixed(2)}</span>` : ''}
                          </div>
                        </td>
                        <td class="text-sm text-muted">${ovr}</td>
                        <td class="text-right transaction-amount income">+${FinanceEngine.formatMoney(fee)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
                <tfoot>
                  <tr style="border-top: 2px solid var(--border-light);">
                    <td colspan="2" class="font-bold">${t('finance.trainingFees')}</td>
                    <td class="text-right font-bold transaction-amount income">+${FinanceEngine.formatMoney(weeklyFinances.fees)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" class="font-bold">${t('finance.gymCosts')}</td>
                    <td class="text-right font-bold transaction-amount expense">-${FinanceEngine.formatMoney(weeklyFinances.costs)}</td>
                  </tr>
                  <tr style="border-top: 2px solid var(--border-light);">
                    <td colspan="2" class="font-bold">Net hebdo</td>
                    <td class="text-right font-bold transaction-amount ${weeklyFinances.net >= 0 ? 'income' : 'expense'}">${weeklyFinances.net >= 0 ? '+' : ''}${FinanceEngine.formatMoney(weeklyFinances.net)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Budget History Mini -->
          <div class="card animate-fade-in-up stagger-5">
            <div class="card-header">
              <div class="card-title">
                <span class="card-title-icon">📊</span>
                Budget Trend
              </div>
            </div>
            ${this._renderBudgetChart(state)}
          </div>
        </div>

        <!-- Right: Transactions -->
        <div>
          <div class="card animate-fade-in-up stagger-4">
            <div class="card-header">
              <div class="card-title">
                <span class="card-title-icon">📝</span>
                Recent Transactions
              </div>
            </div>

            ${recentTransactions.length > 0 ? `
              <div class="table-container" style="max-height: 500px; overflow-y: auto;">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Description</th>
                      <th style="text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentTransactions.map(tx => `
                      <tr>
                        <td class="text-sm text-muted">W${tx.week}</td>
                        <td class="text-sm">${tx.description}</td>
                        <td class="text-right transaction-amount ${tx.type}">
                          ${tx.type === 'income' ? '+' : '-'}${FinanceEngine.formatMoney(tx.amount)}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div class="empty-state" style="padding: var(--space-lg);">
                <div class="text-muted text-sm">No transactions yet</div>
              </div>
            `}
          </div>

          <!-- Commission Guide -->
          <div class="card mt-lg animate-fade-in-up stagger-6">
            <div class="card-header">
              <div class="card-title">
                <span class="card-title-icon">💡</span>
                ${t('finance.commission')} Guide (${Math.round(GYM_CUT.pursePercent * 100)}% show / ${Math.round(GYM_CUT.winBonusPercent * 100)}% win)
              </div>
            </div>
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Fighter Level</th>
                    <th style="text-align: right;">Show Cut</th>
                    <th style="text-align: right;">Win Cut</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(FIGHT_PURSES).map(([key, purse]) => {
                    const cut = FinanceEngine.getGymCut(purse, true);
                    const label = key === 'unranked' ? 'Unranked' :
                                  key === 'ranked15_11' ? '#15—#11' :
                                  key === 'ranked10_6' ? '#10—#6' :
                                  key === 'ranked5_4' ? '#5—#4' :
                                  key === 'ranked3_1' ? '#3—#1' : '🏆 Title';
                    const isTitle = key === 'titleFight';
                    return `
                      <tr ${isTitle ? 'style="border-top: 2px solid var(--border-light);"' : ''}>
                        <td class="text-sm ${isTitle ? 'font-bold' : ''}">${label}</td>
                        <td class="text-right text-sm">${FinanceEngine.formatMoney(cut.showCut)}</td>
                        <td class="text-right text-sm text-success">${FinanceEngine.formatMoney(cut.winCut)}</td>
                        <td class="text-right text-sm text-success font-bold">${FinanceEngine.formatMoney(cut.total)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _renderBudgetChart(state) {
    const history = state.budgetHistory;
    if (history.length < 2) {
      return '<div class="text-sm text-muted p-md">Not enough data yet</div>';
    }

    const maxVal = Math.max(...history);
    const minVal = Math.min(...history, 0);
    const range = maxVal - minVal || 1;
    const width = 100;
    const height = 60;
    const padding = 5;

    const points = history.map((val, i) => {
      const x = padding + (i / (history.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    // Zero line
    const zeroY = height - padding - ((0 - minVal) / range) * (height - 2 * padding);

    // Gradient area
    const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

    return `
      <div style="padding: var(--space-md);">
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 120px;">
          <defs>
            <linearGradient id="budgetGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="var(--color-success)" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="var(--color-success)" stop-opacity="0.02"/>
            </linearGradient>
          </defs>
          <!-- Zero line -->
          <line x1="${padding}" y1="${zeroY}" x2="${width - padding}" y2="${zeroY}"
                stroke="rgba(255,255,255,0.1)" stroke-width="0.3" stroke-dasharray="2,2"/>
          <!-- Area -->
          <polygon points="${areaPoints}" fill="url(#budgetGradient)"/>
          <!-- Line -->
          <polyline points="${points}" fill="none" stroke="var(--color-success)" stroke-width="0.8" stroke-linejoin="round"/>
          <!-- Current point -->
          <circle cx="${points.split(' ').pop().split(',')[0]}" cy="${points.split(' ').pop().split(',')[1]}"
                  r="1.5" fill="var(--color-success)"/>
        </svg>
        <div class="flex justify-between text-xs text-muted">
          <span>Week 1</span>
          <span>Week ${state.week}</span>
        </div>
      </div>
    `;
  }
};
