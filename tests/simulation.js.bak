/**
 * MMA Fighter Manager — Smart Player Simulation v1
 * Simulates a real player over 104 weeks (2 full seasons)
 * 
 * Strategy: Accept all fights, set fight camps, adjust training
 */
global.localStorage = { _data: {}, getItem(k) { return this._data[k] || null; }, setItem(k, v) { this._data[k] = v; }, removeItem(k) { delete this._data[k]; } };
global.document = { getElementById: () => ({ innerHTML: '', addEventListener: () => {}, querySelectorAll: () => [] }), querySelectorAll: () => [], addEventListener: () => {} };
global.window = { addEventListener: () => {} };

const fs = require('fs'), vm = require('vm');
const ctx = vm.createContext(global);
[
  'js/data/constants.js', 'js/data/i18n.js', 'js/data/names.js', 'js/data/events.js',
  'js/engine/fighter-generator.js', 'js/data/ai-fighters.js',
  'js/engine/training-engine.js', 'js/engine/combat-engine.js',
  'js/engine/season-engine.js', 'js/engine/league-engine.js',
  'js/engine/finance-engine.js', 'js/engine/aging-engine.js',
  'js/engine/event-engine.js', 'js/engine/milestone-engine.js',
  'js/state/game-state.js',
].forEach(s => { try { vm.runInContext(fs.readFileSync(s, 'utf8'), ctx, { filename: s }); } catch (e) { console.log(`LOAD ERR ${s}: ${e.message}`); } });
function run(code) { return vm.runInContext(code, ctx); }
function fmt(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
function getOvr(f) { const s = f.stats; return Math.round((s.striking+s.grappling+s.submission+s.wrestling+s.cardio+s.chin+s.athleticism+s.mental)/8); }

const WEEKS = 104; // 2 seasons (~2 years)

// ═══════════ INIT ═══════════
console.log('🥊 MMA FIGHTER MANAGER — SMART PLAYER SIMULATION');
console.log('═'.repeat(70));
console.log(`  Simulating ${WEEKS} weeks of gameplay as a smart player\n`);

run('GameState.newGame("SmartPlayer")');

// ═══════════ TRACKING ═══════════
const log = {
  fights: [], wins: 0, losses: 0, kos: 0, subs: 0, decisions: 0,
  fightRevenue: 0, totalFees: 0, totalCosts: 0,
  events: 0, injuries: 0, milestonesTotal: 0,
  offersAccepted: 0, offersDeclined: 0,
  weekSnapshots: [],
  titleFights: 0, titleWins: 0,
  bestStreak: 0, currentStreak: 0,
  feeAdjustments: 0,
  signedAgents: 0, cutFighters: 0,
};
let crashed = false;

// ═══════════ SMART PLAYER AI ═══════════
function smartPlayerTurn(weekNum) {
  const state = run('GameState.get()');

  // --- 1. ACCEPT FIGHT OFFERS ---
  // Accept all pending offers for healthy fighters
  const offers = state.fightOffers.filter(o => o.status === 'pending');
  offers.forEach(offer => {
    const fighter = state.fighters.find(f => f.id === offer.fighterId);
    if (!fighter || fighter.status === 'injured') {
      // Decline if injured
      run(`GameState.declineOffer("${offer.id}", "notReady")`);
      log.offersDeclined++;
      return;
    }
    // Accept the fight
    const result = run(`GameState.acceptOffer("${offer.id}")`);
    if (result) {
      log.offersAccepted++;
    }
  });

  // --- 2. SET FIGHT CAMPS for scheduled fights ---
  const scheduledFights = state.schedule.filter(s => !s.completed && s.week > state.week);
  scheduledFights.forEach(sf => {
    if (sf.fightCamp) return; // Already set
    const opponent = state.aiFighters.find(f => f.id === sf.opponentId);
    if (!opponent) return;
    
    // Choose camp based on opponent style
    let campId = null;
    if (opponent.style === 'wrestler') campId = 'antiWrestler';
    else if (opponent.style === 'striker') campId = 'antiStriker';
    else if (opponent.style === 'grappler') campId = 'antiGrappler';
    else campId = 'antiStriker'; // Default
    
    // Only buy camp if we can afford it
    if (state.budget > 5000) {
      run(`
        var state = GameState.get();
        var sf = state.schedule.find(s => s.id === "${sf.id}");
        if (sf && !sf.fightCamp) {
          sf.fightCamp = "${campId}";
          state.budget -= 2000;
          FinanceEngine.addTransaction(state, 'expense', 'Fight Camp: ${campId}', 2000);
        }
        GameState.save();
      `);
    }
  });

  // --- 3. MANAGE TRAINING ---
  // Set optimal training based on fighter style
  state.fighters.forEach(fighter => {
    if (fighter.status === 'injured') return;
    
    // If morale is low, send to recovery
    if (fighter.morale < 40) {
      run(`var s = GameState.get(); var f = s.fighters.find(f => f.id === "${fighter.id}"); if(f) f.currentTraining = "recovery"; GameState.save();`);
      return;
    }
    
    // Train based on style
    let training = 'general';
    if (fighter.style === 'striker') training = 'campStriking';
    else if (fighter.style === 'grappler') training = 'campGrappling';
    else if (fighter.style === 'wrestler') training = 'campWrestling';
    
    run(`var s = GameState.get(); var f = s.fighters.find(f => f.id === "${fighter.id}"); if(f) f.currentTraining = "${training}"; GameState.save();`);
  });

  // --- 4. FEE MANAGEMENT ---
  // If budget is low, raise fees slightly
  if (state.budget < 15000 && Math.random() < 0.1) {
    state.fighters.forEach(fighter => {
      if ((fighter.feeMultiplier || 1.0) < 1.5) {
        run(`GameState.adjustFee("${fighter.id}", "up")`);
        log.feeAdjustments++;
      }
    });
  }
  // If budget is very healthy, lower fees for morale
  if (state.budget > 80000 && Math.random() < 0.1) {
    state.fighters.forEach(fighter => {
      if ((fighter.feeMultiplier || 1.0) > 0.75) {
        run(`GameState.adjustFee("${fighter.id}", "down")`);
        log.feeAdjustments++;
      }
    });
  }

  // --- 5. MARKET: Sign agents if roster < 5 and budget allows ---
  if (state.fighters.length < 5 && state.budget > 20000 && state.freeAgents && state.freeAgents.length > 0) {
    // Pick best available agent
    const best = state.freeAgents.reduce((best, a) => {
      const ovr = getOvr(a);
      return (!best || ovr > best.ovr) ? { agent: a, ovr } : best;
    }, null);
    if (best && best.agent.signingBonus < state.budget * 0.3) {
      const signed = run(`GameState.signFreeAgent("${best.agent.id}")`);
      if (signed) log.signedAgents++;
    }
  }
}

// ═══════════ MAIN LOOP ═══════════
for (let w = 0; w < WEEKS; w++) {
  try {
    // Smart player makes decisions before advancing
    smartPlayerTurn(w);

    // Advance week
    const report = run('GameState.advanceWeek()');
    const state = run('GameState.get()');

    // Track fight results
    if (report.fightResults && report.fightResults.length > 0) {
      report.fightResults.forEach(fr => {
        const isWin = fr.winner === 'fighter1';
        log.fights.push({
          week: state.week - 1,
          fighter: fr.fighter1?.fullName || '?',
          opponent: fr.fighter2?.fullName || '?',
          win: isWin,
          method: fr.method,
          rounds: fr.rounds?.length || 3,
          isTitle: fr.isTitle || false
        });
        if (isWin) {
          log.wins++;
          log.currentStreak++;
          log.bestStreak = Math.max(log.bestStreak, log.currentStreak);
        } else {
          log.losses++;
          log.currentStreak = 0;
        }
        if (fr.method === 'KO/TKO') log.kos++;
        else if (fr.method === 'Submission') log.subs++;
        else log.decisions++;
        if (fr.isTitle) { log.titleFights++; if (isWin) log.titleWins++; }
      });
    }

    // Track finances
    log.totalFees += report.gymFees || 0;
    log.totalCosts += report.gymCosts || 0;

    // Track events
    if (report.event) log.events++;
    if (report.milestones) log.milestonesTotal += report.milestones.length;

    // Track injuries
    const injured = state.fighters.filter(f => f.status === 'injured').length;
    if (injured > 0) log.injuries++;

    // Snapshot every 13 weeks (quarterly)
    if (w % 13 === 0 || state.gameOver) {
      log.weekSnapshots.push({
        week: state.week,
        budget: state.budget,
        fighters: state.fighters.length,
        avgOvr: Math.round(state.fighters.reduce((s,f) => s + getOvr(f), 0) / Math.max(1, state.fighters.length)),
        avgMorale: Math.round(state.fighters.reduce((s,f) => s + f.morale, 0) / Math.max(1, state.fighters.length)),
        reputation: state.reputation,
        totalWins: log.wins,
        totalLosses: log.losses,
        gameOver: state.gameOver,
        season: state.season
      });
    }

    if (state.gameOver) {
      console.log(`\n  💀 GAME OVER at week ${state.week}!`);
      break;
    }
  } catch(e) {
    console.log(`\n  ❌ CRASH at week ${w+1}: ${e.message}`);
    console.log(`     ${e.stack?.split('\n')[1]}`);
    crashed = true;
    break;
  }
}

// ═══════════ FINAL STATE ═══════════
const finalState = run('GameState.get()');

// ═══════════ REPORT ═══════════
console.log('\n' + '═'.repeat(70));
console.log('📊 SIMULATION REPORT — SMART PLAYER (' + WEEKS + ' weeks)');
console.log('═'.repeat(70));

// --- Stability ---
console.log('\n🔧 STABILITY');
console.log(`  Crashed: ${crashed ? '❌ YES' : '✅ NO'}`);
console.log(`  Weeks played: ${finalState.week}`);
console.log(`  Game Over: ${finalState.gameOver ? '💀 YES' : '✅ NO'}`);

// --- Finances ---
console.log('\n💰 FINANCES');
console.log(`  Starting budget:   $50,000`);
console.log(`  Final budget:      ${fmt(finalState.budget)}`);
console.log(`  Total fees earned: ${fmt(log.totalFees)}`);
console.log(`  Total costs paid:  ${fmt(log.totalCosts)}`);
console.log(`  Fee adjustments:   ${log.feeAdjustments}`);
const fightCommissions = log.fights.reduce((s, f) => {
  // Estimate commissions
  return s + 350; // rough avg for unranked
}, 0);
console.log(`  Fights fought:     ${log.fights.length} → revenue from commissions`);
console.log(`  Budget trend: ${finalState.budget > 50000 ? '📈 GROWING' : finalState.budget > 25000 ? '📊 STABLE' : finalState.budget > 0 ? '📉 DECLINING' : '💀 BANKRUPT'}`);

// --- Combat ---
console.log('\n⚔️ COMBAT RECORD');
console.log(`  Total fights: ${log.fights.length}`);
console.log(`  Record: ${log.wins}W - ${log.losses}L (${log.fights.length > 0 ? (log.wins/log.fights.length*100).toFixed(0) : 0}% win rate)`);
console.log(`  Methods: KO/TKO ${log.kos} | Submission ${log.subs} | Decision ${log.decisions}`);
console.log(`  Best win streak: 🔥 ${log.bestStreak}`);
console.log(`  Title fights: ${log.titleFights} (won: ${log.titleWins})`);
console.log(`  Fights per season: ~${(log.fights.length / (WEEKS / 26)).toFixed(1)}`);

// --- Fight Log ---
if (log.fights.length > 0) {
  console.log('\n  📋 Fight Log:');
  console.log('  ' + '-'.repeat(66));
  console.log('  Week  Fighter              Opponent             Result    Method');
  console.log('  ' + '-'.repeat(66));
  log.fights.forEach(f => {
    const result = f.win ? '✅ WIN ' : '❌ LOSS';
    const title = f.isTitle ? ' 🏆' : '';
    console.log(`  W${String(f.week).padEnd(4)} ${f.fighter.padEnd(20)} ${f.opponent.padEnd(20)} ${result}   ${f.method}${title}`);
  });
}

// --- Roster ---
console.log('\n👥 ROSTER');
console.log(`  Fighters: ${finalState.fighters.length}`);
console.log(`  Agents signed: ${log.signedAgents} | Cut: ${log.cutFighters}`);
console.log('  ' + '-'.repeat(55));
console.log('  Name                    OVR   Record      Morale  Status');
console.log('  ' + '-'.repeat(55));
finalState.fighters.forEach(f => {
  const ovr = getOvr(f);
  const record = `${f.wins}W-${f.losses}L`;
  const status = f.status === 'injured' ? `🏥 (${f.injuryWeeksLeft}wk)` : f.isChampion ? '🏆' : '✅';
  console.log(`  ${f.fullName.padEnd(22)} ${String(ovr).padEnd(5)} ${record.padEnd(11)} ${String(f.morale).padEnd(7)} ${status}`);
});

// --- Progression ---
console.log('\n📈 PROGRESSION TIMELINE');
console.log('  ' + '-'.repeat(62));
console.log('  Week  Budget        OVR   Morale  Rep   W-L      Season');
console.log('  ' + '-'.repeat(62));
log.weekSnapshots.forEach(s => {
  console.log(`  W${String(s.week).padEnd(4)} ${fmt(s.budget).padEnd(13)} ${String(s.avgOvr).padEnd(5)} ${String(s.avgMorale).padEnd(7)} ${String(s.reputation).padEnd(5)} ${s.totalWins}W-${s.totalLosses}L    S${s.season} ${s.gameOver ? '💀' : ''}`);
});

// --- Events & Milestones ---
console.log('\n🎯 ENGAGEMENT');
console.log(`  Random events:  ${log.events}`);
console.log(`  Milestones:     ${log.milestonesTotal}`);
console.log(`  Injury weeks:   ${log.injuries}`);
console.log(`  Offers accepted: ${log.offersAccepted} | Declined: ${log.offersDeclined}`);
console.log(`  Reputation:     ${finalState.reputation}`);

// ═══════════ GAME BALANCE ASSESSMENT ═══════════
console.log('\n' + '═'.repeat(70));
console.log('🎮 GAME BALANCE ASSESSMENT');
console.log('═'.repeat(70));

const issues = [];
const strengths = [];

// Financial balance
if (finalState.budget > 200000) issues.push('💰 Budget grows too fast — economy may be too easy');
else if (finalState.budget < 0) issues.push('💸 Went bankrupt — may be too punishing');
else if (finalState.budget > 50000) strengths.push('💰 Healthy financial progression');
else strengths.push('💰 Tight but viable finances — good tension');

// Fight frequency
const fightsPerSeason = log.fights.length / (WEEKS / 26);
if (fightsPerSeason < 2) issues.push(`🥊 Too few fights (${fightsPerSeason.toFixed(1)}/season) — not enough action`);
else if (fightsPerSeason > 8) issues.push(`🥊 Too many fights (${fightsPerSeason.toFixed(1)}/season) — may feel rushed`);
else strengths.push(`🥊 Good fight frequency: ~${fightsPerSeason.toFixed(1)} per season`);

// Win rate
const winRate = log.fights.length > 0 ? log.wins / log.fights.length : 0;
if (winRate > 0.85) issues.push(`⚔️ Win rate too high (${(winRate*100).toFixed(0)}%) — needs more challenge`);
else if (winRate < 0.3) issues.push(`⚔️ Win rate too low (${(winRate*100).toFixed(0)}%) — may be frustrating`);
else strengths.push(`⚔️ Balanced win rate: ${(winRate*100).toFixed(0)}%`);

// Morale
const avgMorale = Math.round(finalState.fighters.reduce((s,f) => s + f.morale, 0) / Math.max(1, finalState.fighters.length));
if (avgMorale < 30) issues.push(`😤 Very low morale (${avgMorale}) — fighters may feel neglected`);
else if (avgMorale > 90) issues.push(`😊 Morale too easy to maintain (${avgMorale})`);
else strengths.push(`😊 Reasonable morale level: ${avgMorale}`);

// Progression
const avgOvr = Math.round(finalState.fighters.reduce((s,f) => s + getOvr(f), 0) / Math.max(1, finalState.fighters.length));
if (avgOvr > 85) strengths.push(`📈 Strong progression — fighters reach elite level`);
else if (avgOvr < 55) issues.push(`📉 Fighters not progressing enough — training may be too weak`);
else strengths.push(`📈 Good progression: OVR ${avgOvr}`);

// Method variety  
if (log.kos > 0 && log.subs > 0 && log.decisions > 0) strengths.push('🎲 Good method variety (KO/Sub/Dec)');
else issues.push('🎲 Lacks method variety');

if (strengths.length > 0) {
  console.log('\n  ✅ STRENGTHS:');
  strengths.forEach(s => console.log(`     ${s}`));
}
if (issues.length > 0) {
  console.log('\n  ⚠️ ISSUES:');
  issues.forEach(i => console.log(`     ${i}`));
}

const score = Math.round((strengths.length / (strengths.length + issues.length)) * 100);
console.log(`\n  📊 Balance Score: ${score}% (${strengths.length} strengths / ${issues.length} issues)`);
console.log('═'.repeat(70));
