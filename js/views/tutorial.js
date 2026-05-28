/* ============================================
   MMA Fighter Manager — Tutorial View
   ============================================ */

const TutorialView = {
  currentSection: 0,

  _getSections() {
    return [
      {
        icon: '🎯',
        title: t('tuto.s1Title'),
        content: `
          <p>${t('tuto.s1Intro')}</p>
          <div class="tutorial-highlight">
            <span class="tutorial-highlight-icon">💡</span>
            <div>${t('tuto.s1WeekFlow')}</div>
          </div>
        `
      },
      {
        icon: '📋',
        title: t('tuto.s2Title'),
        content: `
          <p>${t('tuto.s2Intro')}</p>
          <div class="tutorial-stats-grid">
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🔢</span>
              <div><strong>${t('tuto.s2MaxFighters')}</strong> — ${t('tuto.s2MaxFightersDesc')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🎨</span>
              <div><strong>${t('tuto.s2Cost')}</strong> — ${t('tuto.s2CostDesc')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">📊</span>
              <div><strong>${t('tuto.s2Potential')}</strong> — ${t('tuto.s2PotentialDesc')}</div>
            </div>
          </div>
          <div class="tutorial-highlight mt-md">
            <span class="tutorial-highlight-icon">🔑</span>
            <div>${t('tuto.s2Tip')}</div>
          </div>
        `
      },
      {
        icon: '🥊',
        title: t('tuto.s3Title'),
        content: `
          <p>${t('tuto.s3Intro')}</p>
          <div class="tutorial-stats-grid">
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">👊</span>
              <div><strong>Striking</strong> — ${t('tuto.s3Striking')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🤼</span>
              <div><strong>Grappling</strong> — ${t('tuto.s3Grappling')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🔒</span>
              <div><strong>Submission</strong> — ${t('tuto.s3Submission')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🤸</span>
              <div><strong>Wrestling</strong> — ${t('tuto.s3Wrestling')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">❤️</span>
              <div><strong>Cardio</strong> — ${t('tuto.s3Cardio')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🛡️</span>
              <div><strong>Chin</strong> — ${t('tuto.s3Chin')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">⚡</span>
              <div><strong>Athleticism</strong> — ${t('tuto.s3Athleticism')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🧠</span>
              <div><strong>Mental</strong> — ${t('tuto.s3Mental')}</div>
            </div>
          </div>
          <div class="tutorial-highlight">
            <span class="tutorial-highlight-icon">🔑</span>
            <div>${t('tuto.s3PotentialTip')}</div>
          </div>
          <p class="mt-md">${t('tuto.s3Styles')}</p>
        `
      },
      {
        icon: '🏋️',
        title: t('tuto.s4Title'),
        content: `
          <p>${t('tuto.s4Intro')}</p>

          <h5 class="mt-lg mb-sm">📋 ${t('tuto.s4WeeklyTitle')}</h5>
          <div class="tutorial-training-list">
            <div>🥊 <strong>${t('tuto.s4CampStriking')}</strong> — ${t('tuto.s4CampStrikingDesc')}</div>
            <div>🤼 <strong>${t('tuto.s4CampGrappling')}</strong> — ${t('tuto.s4CampGrapplingDesc')}</div>
            <div>🤸 <strong>${t('tuto.s4CampWrestling')}</strong> — ${t('tuto.s4CampWrestlingDesc')}</div>
            <div>🏋️ <strong>${t('tuto.s4General')}</strong> — ${t('tuto.s4GeneralDesc')}</div>
            <div>⚔️ <strong>${t('tuto.s4Sparring')}</strong> — ${t('tuto.s4SparringDesc')}</div>
            <div>🧘 <strong>${t('tuto.s4Recovery')}</strong> — ${t('tuto.s4RecoveryDesc')}</div>
          </div>

          <h5 class="mt-lg mb-sm">🏕️ ${t('tuto.s4FightCampTitle')}</h5>
          <p>${t('tuto.s4FightCampDesc')}</p>

          <div class="tutorial-highlight mt-md">
            <span class="tutorial-highlight-icon">⚠️</span>
            <div>${t('tuto.s4FightCampWarning')}</div>
          </div>

          <h5 class="mt-lg mb-sm">🔍 ${t('tuto.s4ScoutTitle')}</h5>
          <p>${t('tuto.s4ScoutDesc')}</p>
        `
      },
      {
        icon: '📨',
        title: t('tuto.s5Title'),
        content: `
          <p>${t('tuto.s5Intro')}</p>

          <h5 class="mt-lg mb-sm">📬 ${t('tuto.s5HowTitle')}</h5>
          <ul class="tutorial-list">
            <li>${t('tuto.s5Step1')}</li>
            <li>${t('tuto.s5Step2')}</li>
            <li>${t('tuto.s5Step3')}</li>
          </ul>

          <h5 class="mt-lg mb-sm">❌ ${t('tuto.s5DeclineTitle')}</h5>
          <p>${t('tuto.s5DeclineIntro')}</p>
          <div class="tutorial-camps-grid">
            <div class="tutorial-camp-item">
              <div class="font-bold">🏥 ${t('decline.notReady')}</div>
              <div class="text-xs text-muted">${t('decline.notReadyEffect')}</div>
            </div>
            <div class="tutorial-camp-item">
              <div class="font-bold">💰 ${t('decline.lowPurse')}</div>
              <div class="text-xs text-muted">${t('decline.lowPurseEffect')}</div>
            </div>
            <div class="tutorial-camp-item">
              <div class="font-bold">👎 ${t('decline.tooWeak')}</div>
              <div class="text-xs text-muted">${t('decline.tooWeakEffect')}</div>
            </div>
            <div class="tutorial-camp-item">
              <div class="font-bold">😰 ${t('decline.tooStrong')}</div>
              <div class="text-xs text-muted">${t('decline.tooStrongEffect')}</div>
            </div>
            <div class="tutorial-camp-item">
              <div class="font-bold">🚫 ${t('decline.notInterested')}</div>
              <div class="text-xs text-muted">${t('decline.notInterestedEffect')}</div>
            </div>
          </div>

          <div class="tutorial-highlight mt-md">
            <span class="tutorial-highlight-icon">💡</span>
            <div>${t('tuto.s5DeclineTip')}</div>
          </div>
          <div class="tutorial-highlight mt-md" style="border-color: var(--accent-red); background: rgba(230, 57, 70, 0.06);">
            <span class="tutorial-highlight-icon">🚨</span>
            <div>${t('tuto.s5IgnoreWarning')}</div>
          </div>
        `
      },
      {
        icon: '⚔️',
        title: t('tuto.s6Title'),
        content: `
          <p>${t('tuto.s6Intro')}</p>

          <h5 class="mt-lg mb-sm">🎬 ${t('tuto.s6FlowTitle')}</h5>
          <ul class="tutorial-list">
            <li>${t('tuto.s6Flow1')}</li>
            <li>${t('tuto.s6Flow2')}</li>
            <li>${t('tuto.s6Flow3')}</li>
            <li>${t('tuto.s6Flow4')}</li>
          </ul>

          <h5 class="mt-lg mb-sm">🗣️ ${t('tuto.s6CornerTitle')}</h5>
          <p>${t('tuto.s6CornerDesc')}</p>
          <div class="tutorial-camps-grid">
            <div class="tutorial-camp-item">
              <div class="font-bold">🔥 ${t('tuto.s6CornerAggressive')}</div>
              <div class="text-xs text-muted">${t('tuto.s6CornerAggressiveDesc')}</div>
            </div>
            <div class="tutorial-camp-item">
              <div class="font-bold">🛡️ ${t('tuto.s6CornerDefensive')}</div>
              <div class="text-xs text-muted">${t('tuto.s6CornerDefensiveDesc')}</div>
            </div>
            <div class="tutorial-camp-item">
              <div class="font-bold">🤼 ${t('tuto.s6CornerTakedowns')}</div>
              <div class="text-xs text-muted">${t('tuto.s6CornerTakedownsDesc')}</div>
            </div>
            <div class="tutorial-camp-item">
              <div class="font-bold">💪 ${t('tuto.s6CornerMotivate')}</div>
              <div class="text-xs text-muted">${t('tuto.s6CornerMotivateDesc')}</div>
            </div>
          </div>

          <h5 class="mt-lg mb-sm">🏁 ${t('tuto.s6ResultsTitle')}</h5>
          <div class="tutorial-results-grid">
            <div class="tutorial-result-item">
              <span class="badge badge-loss" style="background: rgba(230, 57, 70, 0.2); color: var(--accent-red);">KO/TKO</span>
              <span class="text-sm">${t('tuto.s6KO')}</span>
            </div>
            <div class="tutorial-result-item">
              <span class="badge badge-loss" style="background: rgba(52, 152, 219, 0.2); color: var(--color-info);">Submission</span>
              <span class="text-sm">${t('tuto.s6Sub')}</span>
            </div>
            <div class="tutorial-result-item">
              <span class="badge badge-style">Decision</span>
              <span class="text-sm">${t('tuto.s6Decision')}</span>
            </div>
          </div>
        `
      },
      {
        icon: '🏆',
        title: t('tuto.s7Title'),
        content: `
          <p>${t('tuto.s7Intro')}</p>

          <h5 class="mt-lg mb-sm">📊 ${t('tuto.s7HowTitle')}</h5>
          <ul class="tutorial-list">
            <li>${t('tuto.s7Rule1')}</li>
            <li>${t('tuto.s7Rule2')}</li>
            <li>${t('tuto.s7Rule3')}</li>
            <li>${t('tuto.s7Rule4')}</li>
          </ul>

          <div class="tutorial-title-path">
            <div class="tutorial-path-step">
              <div class="tutorial-path-dot"></div>
              <div>
                <div class="font-bold">Unranked</div>
                <div class="text-xs text-muted">${t('tuto.s7PathUnranked')}</div>
              </div>
            </div>
            <div class="tutorial-path-arrow">↓</div>
            <div class="tutorial-path-step">
              <div class="tutorial-path-dot" style="background: var(--text-muted);"></div>
              <div>
                <div class="font-bold">Top 15</div>
                <div class="text-xs text-muted">${t('tuto.s7PathTop15')}</div>
              </div>
            </div>
            <div class="tutorial-path-arrow">↓</div>
            <div class="tutorial-path-step">
              <div class="tutorial-path-dot" style="background: var(--accent-orange);"></div>
              <div>
                <div class="font-bold text-orange">Top 3</div>
                <div class="text-xs text-muted">${t('tuto.s7PathTop3')}</div>
              </div>
            </div>
            <div class="tutorial-path-arrow">↓</div>
            <div class="tutorial-path-step">
              <div class="tutorial-path-dot" style="background: #ffd700;"></div>
              <div>
                <div class="font-bold" style="color: #ffd700;">🏆 Champion</div>
                <div class="text-xs text-muted">${t('tuto.s7PathChamp')}</div>
              </div>
            </div>
          </div>
        `
      },
      {
        icon: '💰',
        title: t('tuto.s8Title'),
        content: `
          <p>${t('tuto.s8Intro')}</p>

          <h5 class="mt-lg mb-sm">📥 ${t('tuto.s8IncomeTitle')}</h5>
          <p>${t('tuto.s8IncomeDesc')}</p>
          <div class="tutorial-finance-table">
            <div class="tutorial-finance-row">
              <span>${t('tuto.s8TrainingFees')}</span>
              <span class="text-success font-bold">$300 — $1,500/sem</span>
            </div>
            <div class="tutorial-finance-row">
              <span>${t('tuto.s8ShowCut')}</span>
              <span class="text-success font-bold">20%</span>
            </div>
            <div class="tutorial-finance-row">
              <span>${t('tuto.s8WinCut')}</span>
              <span class="text-success font-bold">15%</span>
            </div>
          </div>
          <p class="text-xs text-muted mt-sm">${t('tuto.s8FeeNote')}</p>

          <h5 class="mt-lg mb-sm">📤 ${t('tuto.s8ExpenseTitle')}</h5>
          <div class="tutorial-finance-table">
            <div class="tutorial-finance-row">
              <span>${t('tuto.s8Rent')}</span>
              <span class="text-danger font-bold">$800/sem</span>
            </div>
            <div class="tutorial-finance-row">
              <span>${t('tuto.s8Staff')}</span>
              <span class="text-danger font-bold">$250/fighter/sem</span>
            </div>
          </div>

          <h5 class="mt-lg mb-sm">📊 ${t('tuto.s8FeeTitle')}</h5>
          <p>${t('tuto.s8FeeDesc')}</p>

          <h5 class="mt-lg mb-sm">💱 ${t('tuto.s8CommTitle')}</h5>
          <p>${t('tuto.s8CommDesc')}</p>

          <div class="tutorial-highlight mt-md">
            <span class="tutorial-highlight-icon">💡</span>
            <div>${t('tuto.s8Tip')}</div>
          </div>

          <div class="tutorial-highlight mt-lg">
            <span class="tutorial-highlight-icon">💀</span>
            <div>${t('tuto.s8GameOver')}</div>
          </div>
        `
      },
      {
        icon: '💱',
        title: t('tuto.s10Title'),
        content: `
          <p>${t('tuto.s10Intro')}</p>

          <h5 class="mt-lg mb-sm">🆓 ${t('tuto.s10FreeAgentsTitle')}</h5>
          <div class="tutorial-stats-grid">
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">👥</span>
              <div><strong>${t('tuto.s10PoolSize')}</strong> — ${t('tuto.s10PoolSizeDesc')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🔄</span>
              <div><strong>${t('tuto.s10Refresh')}</strong> — ${t('tuto.s10RefreshDesc')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">✍️</span>
              <div><strong>${t('tuto.s10Signing')}</strong> — ${t('tuto.s10SigningDesc')}</div>
            </div>
          </div>

          <h5 class="mt-lg mb-sm">✂️ ${t('tuto.s10CutTitle')}</h5>
          <p>${t('tuto.s10CutDesc')}</p>

          <h5 class="mt-lg mb-sm">⭐ ${t('tuto.s10RepTitle')}</h5>
          <p>${t('tuto.s10RepDesc')}</p>
          <div class="tutorial-stats-grid">
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">💰</span>
              <div><strong>${t('market.repBudget')}</strong> — ${t('tuto.s10RepBudget')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🏆</span>
              <div><strong>${t('market.repChampions')}</strong> — ${t('tuto.s10RepChampions')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🥊</span>
              <div><strong>${t('market.repWins')}</strong> — ${t('tuto.s10RepWins')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">😊</span>
              <div><strong>${t('market.repMorale')}</strong> — ${t('tuto.s10RepMorale')}</div>
            </div>
          </div>

          <div class="tutorial-highlight mt-lg">
            <span class="tutorial-highlight-icon">🔑</span>
            <div>${t('tuto.s10Tip')}</div>
          </div>
        `
      },
      {
        icon: '🔍',
        title: t('tuto.sAnalyseTitle'),
        content: `
          <p>${t('tuto.sAnalyseIntro')}</p>

          <div class="tutorial-stats-grid">
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">👆</span>
              <div>${t('tuto.sAnalyseClick')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">📊</span>
              <div>${t('tuto.sAnalyseStats')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">📍</span>
              <div>${t('tuto.sAnalyseWhere')}</div>
            </div>
          </div>

          <div class="tutorial-highlight mt-md">
            <span class="tutorial-highlight-icon">💡</span>
            <div>${t('tuto.sAnalyseTip')}</div>
          </div>
        `
      },
      {
        icon: '⚔️',
        title: t('tuto.sMatchTitle'),
        content: `
          <p>${t('tuto.sMatchIntro')}</p>

          <h5 class="mt-lg mb-sm">📋 Comment proposer</h5>
          <ul class="tutorial-list">
            <li>${t('tuto.sMatchHow1')}</li>
            <li>${t('tuto.sMatchHow2')}</li>
            <li>${t('tuto.sMatchHow3')}</li>
            <li>${t('tuto.sMatchHow4')}</li>
          </ul>

          <div class="tutorial-highlight mt-md">
            <span class="tutorial-highlight-icon">📊</span>
            <div>${t('tuto.sMatchAcceptance')}</div>
          </div>

          <div class="tutorial-highlight mt-md">
            <span class="tutorial-highlight-icon">⏱️</span>
            <div>${t('tuto.sMatchCooldown')}</div>
          </div>

          <div class="tutorial-highlight mt-md">
            <span class="tutorial-highlight-icon">🔑</span>
            <div>${t('tuto.sMatchTip')}</div>
          </div>
        `
      },
      {
        icon: '🏆',
        title: t('tuto.sSeasonTitle'),
        content: `
          <p>${t('tuto.sSeasonIntro')}</p>

          <div class="tutorial-stats-grid">
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🎯</span>
              <div>${t('tuto.sSeasonObj')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">📋</span>
              <div>${t('tuto.sSeasonTrack')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🏁</span>
              <div>${t('tuto.sSeasonEnd')}</div>
            </div>
          </div>

          <div class="tutorial-highlight mt-md">
            <span class="tutorial-highlight-icon">💡</span>
            <div>${t('tuto.sSeasonTip')}</div>
          </div>
        `
      },
      {
        icon: '🎲',
        title: t('tuto.sEventTitle'),
        content: `
          <p>${t('tuto.sEventIntro')}</p>

          <div class="tutorial-stats-grid">
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🎯</span>
              <div>${t('tuto.sEventChoices')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">⚠️</span>
              <div>${t('tuto.sEventMandatory')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">📂</span>
              <div>${t('tuto.sEventCategories')}</div>
            </div>
          </div>

          <div class="tutorial-highlight mt-md">
            <span class="tutorial-highlight-icon">💡</span>
            <div>${t('tuto.sEventTip')}</div>
          </div>
        `
      },
      {
        icon: '🧓',
        title: t('tuto.sAgingTitle'),
        content: `
          <p>${t('tuto.sAgingIntro')}</p>

          <div class="tutorial-stats-grid">
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">📈</span>
              <div>${t('tuto.sAgingPeak')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">📉</span>
              <div>${t('tuto.sAgingDecline')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🌅</span>
              <div>${t('tuto.sAgingRetire')}</div>
            </div>
          </div>

          <div class="tutorial-highlight mt-md" style="border-color: var(--accent-orange); background: rgba(255, 159, 28, 0.06);">
            <span class="tutorial-highlight-icon">⚠️</span>
            <div>${t('tuto.sAgingTip')}</div>
          </div>
        `
      },
      {
        icon: '🥊',
        title: t('tuto.sChinTitle'),
        content: `
          <p>${t('tuto.sChinIntro')}</p>

          <div class="tutorial-stats-grid">
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">💀</span>
              <div>${t('tuto.sChinDamage')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🛑</span>
              <div>${t('tuto.sChinGlass')}</div>
            </div>
          </div>

          <div class="tutorial-highlight mt-md" style="border-color: var(--accent-red); background: rgba(230, 57, 70, 0.06);">
            <span class="tutorial-highlight-icon">🚨</span>
            <div>${t('tuto.sChinTip')}</div>
          </div>
        `
      },
      {
        icon: '⭐',
        title: t('tuto.sRepTitle'),
        content: `
          <p>${t('tuto.sRepIntro')}</p>

          <div class="tutorial-stats-grid">
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">📈</span>
              <div>${t('tuto.sRepUp')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">📉</span>
              <div>${t('tuto.sRepDown')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🎯</span>
              <div>${t('tuto.sRepImpact')}</div>
            </div>
          </div>

          <div class="tutorial-highlight mt-md">
            <span class="tutorial-highlight-icon">💡</span>
            <div>${t('tuto.sRepTip')}</div>
          </div>
        `
      },
      {
        icon: '🔥',
        title: t('tuto.sRivalTitle'),
        content: `
          <p>${t('tuto.sRivalIntro')}</p>

          <div class="tutorial-stats-grid">
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">⏳</span>
              <div>${t('tuto.sRivalGrow')}</div>
            </div>
            <div class="tutorial-stat-item">
              <span class="tutorial-stat-icon">🤜</span>
              <div>${t('tuto.sRivalChoice')}</div>
            </div>
          </div>

          <div class="tutorial-highlight mt-md">
            <span class="tutorial-highlight-icon">💡</span>
            <div>${t('tuto.sRivalTip')}</div>
          </div>
        `
      },
      {
        icon: '🗺️',
        title: t('tuto.s9Title'),
        content: `
          <div class="tutorial-tips">
            <div class="tutorial-tip">
              <span class="tutorial-tip-number">1</span>
              <div>
                <div class="font-bold">${t('tuto.s9Tip1Title')}</div>
                <p class="text-sm text-secondary">${t('tuto.s9Tip1Desc')}</p>
              </div>
            </div>
            <div class="tutorial-tip">
              <span class="tutorial-tip-number">2</span>
              <div>
                <div class="font-bold">${t('tuto.s9Tip2Title')}</div>
                <p class="text-sm text-secondary">${t('tuto.s9Tip2Desc')}</p>
              </div>
            </div>
            <div class="tutorial-tip">
              <span class="tutorial-tip-number">3</span>
              <div>
                <div class="font-bold">${t('tuto.s9Tip3Title')}</div>
                <p class="text-sm text-secondary">${t('tuto.s9Tip3Desc')}</p>
              </div>
            </div>
            <div class="tutorial-tip">
              <span class="tutorial-tip-number">4</span>
              <div>
                <div class="font-bold">${t('tuto.s9Tip4Title')}</div>
                <p class="text-sm text-secondary">${t('tuto.s9Tip4Desc')}</p>
              </div>
            </div>
            <div class="tutorial-tip">
              <span class="tutorial-tip-number">5</span>
              <div>
                <div class="font-bold">${t('tuto.s9Tip5Title')}</div>
                <p class="text-sm text-secondary">${t('tuto.s9Tip5Desc')}</p>
              </div>
            </div>
            <div class="tutorial-tip">
              <span class="tutorial-tip-number">6</span>
              <div>
                <div class="font-bold">${t('tuto.s9Tip6Title')}</div>
                <p class="text-sm text-secondary">${t('tuto.s9Tip6Desc')}</p>
              </div>
            </div>
            <div class="tutorial-tip">
              <span class="tutorial-tip-number">7</span>
              <div>
                <div class="font-bold">${t('tuto.s9Tip7Title')}</div>
                <p class="text-sm text-secondary">${t('tuto.s9Tip7Desc')}</p>
              </div>
            </div>
          </div>

          <div class="tutorial-highlight mt-lg">
            <span class="tutorial-highlight-icon">🚀</span>
            <div>${t('tuto.s9Outro')}</div>
          </div>
        `
      }
    ];
  },

  render(container) {
    const sections = this._getSections();
    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">📖 ${t('tuto.pageTitle')}</h1>
          <div class="view-subtitle">${t('tuto.pageSubtitle')}</div>
        </div>
      </div>

      <div class="tutorial-layout">
        <!-- Table of Contents -->
        <div class="tutorial-toc">
          <div class="card">
            <div class="card-title mb-md">${t('tuto.toc')}</div>
            ${sections.map((s, i) => `
              <div class="tutorial-toc-item ${i === this.currentSection ? 'active' : ''}" data-section="${i}">
                <span class="tutorial-toc-icon">${s.icon}</span>
                <span>${s.title}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Content -->
        <div class="tutorial-content">
          <div class="card animate-fade-in" id="tutorial-card">
            <div class="tutorial-section-header">
              <span class="tutorial-section-icon">${sections[this.currentSection].icon}</span>
              <h2 class="tutorial-section-title">${sections[this.currentSection].title}</h2>
            </div>
            <div class="tutorial-section-body">
              ${sections[this.currentSection].content}
            </div>
            <div class="tutorial-nav">
              ${this.currentSection > 0 ? `
                <button class="btn btn-secondary" id="tutorial-prev">
                  ← ${sections[this.currentSection - 1].title}
                </button>
              ` : '<div></div>'}
              <span class="text-xs text-muted">${this.currentSection + 1} / ${sections.length}</span>
              ${this.currentSection < sections.length - 1 ? `
                <button class="btn btn-primary" id="tutorial-next">
                  ${sections[this.currentSection + 1].title} →
                </button>
              ` : `
                <button class="btn btn-primary" id="tutorial-dashboard">
                  🏠 ${t('tuto.goToDashboard')}
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindEvents(container);
  },

  _bindEvents(container) {
    // TOC clicks
    container.querySelectorAll('.tutorial-toc-item').forEach(item => {
      item.addEventListener('click', () => {
        this.currentSection = parseInt(item.dataset.section);
        this.render(container);
      });
    });

    // Prev/Next
    const prevBtn = document.getElementById('tutorial-prev');
    const nextBtn = document.getElementById('tutorial-next');
    const dashBtn = document.getElementById('tutorial-dashboard');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentSection = Math.max(0, this.currentSection - 1);
        this.render(container);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentSection = Math.min(this._getSections().length - 1, this.currentSection + 1);
        this.render(container);
      });
    }
    if (dashBtn) {
      dashBtn.addEventListener('click', () => {
        App.navigateTo('dashboard');
      });
    }
  }
};
