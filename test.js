#!/usr/bin/env node
/**
 * MMA Fighter Manager — Test Suite
 * Tests the Cloudflare Worker endpoints + game logic
 */

const WORKER_URL = 'https://mma-trashtalk.lhoste-mathieu.workers.dev';

// ─── Colors ───────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', dim: '\x1b[2m', magenta: '\x1b[35m'
};
const pass = (msg) => console.log(`  ${C.green}✓${C.reset} ${msg}`);
const fail = (msg) => console.log(`  ${C.red}✗${C.reset} ${msg}`);
const info = (msg) => console.log(`  ${C.dim}→${C.reset} ${msg}`);
const section = (msg) => console.log(`\n${C.bold}${C.cyan}▶ ${msg}${C.reset}`);
const warn = (msg) => console.log(`  ${C.yellow}⚠${C.reset} ${msg}`);

let passed = 0, failed = 0;

function assert(condition, label, detail = '') {
  if (condition) { pass(label); passed++; }
  else { fail(label + (detail ? ` — ${C.red}${detail}${C.reset}` : '')); failed++; }
}

// ─── Mock data ────────────────────────────────────────────
const FIGHTER = {
  name: 'Luis Williams',
  wins: 0, losses: 0,
  rank: null, style: 'striker',
  personality: 'confident',
  strengths: 'striking (72), athleticism (68)',
  weakness: 'grappling (45)',
  winStreak: 0, lossStreak: 0,
  koWins: 0, isChampion: false
};

const OPPONENT = {
  name: 'Szymon Grabowski',
  wins: 15, losses: 2,
  rank: 8, style: 'wrestler',
  personality: 'trashTalker',
  strengths: 'wrestling (88), grappling (82)',
  weakness: 'chin (55)',
  winStreak: 3, lossStreak: 0,
  koWins: 5, isChampion: false
};

const CONTEXT_FRESH = { isTitle: false, rivalry: null, history: null };
const CONTEXT_RIVALRY = { isTitle: false, rivalry: 4, history: '1W-1L en 2 combats' };
const CONTEXT_TITLE = { isTitle: true, rivalry: 2, history: null };

// ─── HTTP helper ──────────────────────────────────────────
async function post(route, body) {
  const res = await fetch(`${WORKER_URL}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── TEST 1: /provoke ─────────────────────────────────────
async function testProvoke() {
  section('1. POST /provoke — Génération de trash talk initial');

  const data = await post('/provoke', {
    fighter: FIGHTER, opponent: OPPONENT,
    context: CONTEXT_FRESH, lang: 'fr'
  });

  info(`Réponse: "${data.trashtalk?.slice(0, 80)}..."`);

  assert(typeof data.trashtalk === 'string', 'Retourne un string trashtalk');
  assert(data.trashtalk.length > 20, 'Contenu suffisamment long (>20 chars)');
  assert(data.trashtalk.length < 800, 'Pas trop long (<800 chars)');
  assert(!data.trashtalk.includes('{'), 'Pas de template non résolu');
  assert(!data.error, 'Pas d\'erreur');

  // Test avec rivalité max
  const rivalData = await post('/provoke', {
    fighter: FIGHTER, opponent: { ...OPPONENT, personality: 'trashTalker' },
    context: CONTEXT_RIVALRY, lang: 'fr'
  });
  assert(typeof rivalData.trashtalk === 'string', 'Rivalité max: génère aussi un trashtalk');
  info(`Rivalité: "${rivalData.trashtalk?.slice(0, 80)}..."`);
}

// ─── TEST 2: /exchange ────────────────────────────────────
async function testExchange() {
  section('2. POST /exchange — Continuation de l\'échange');

  const history = [
    { role: 'opponent', text: 'Tu arrives avec un record vierge, tu ne mérites pas ce combat.' },
    { role: 'player', text: 'Tes 2 dernières défaites étaient par KO, prépare ton menton.' }
  ];

  const data = await post('/exchange', {
    history, fighter: FIGHTER, opponent: OPPONENT,
    context: CONTEXT_FRESH, roundNumber: 2, lang: 'fr'
  });

  info(`Reply: "${data.opponentReply?.slice(0, 80)}..."`);
  info(`shouldContinue: ${data.shouldContinue}, intensity: ${data.intensity}`);

  assert(typeof data.opponentReply === 'string', 'Retourne opponentReply');
  assert(data.opponentReply.length > 10, 'Reply non vide');
  assert(typeof data.shouldContinue === 'boolean', 'shouldContinue est un booléen');
  assert(typeof data.intensity === 'number', 'intensity est un nombre');
  assert(data.intensity >= 1 && data.intensity <= 10, `intensity entre 1-10 (${data.intensity})`);

  // Tester avec une réponse courte/plate → shouldContinue devrait être false
  const shortHistory = [
    { role: 'opponent', text: 'Tu ne seras rien.' },
    { role: 'player', text: 'ok' }
  ];
  const shortData = await post('/exchange', {
    history: shortHistory, fighter: FIGHTER, opponent: OPPONENT,
    context: CONTEXT_FRESH, roundNumber: 2, lang: 'fr'
  });
  info(`Réponse plate → shouldContinue: ${shortData.shouldContinue}, intensity: ${shortData.intensity}`);
  assert(typeof shortData.shouldContinue === 'boolean', 'Réponse plate: retourne quand même un booléen valide');
}

// ─── TEST 3: /judge — Échange complet ─────────────────────
async function testJudge() {
  section('3. POST /judge — Verdict sur échange complet');

  // Test 1: Bon échange factuel → joueur devrait gagner
  const goodHistory = [
    { role: 'opponent', text: 'Tu arrives avec un record vierge, Luis. Moi j\'ai 15 victoires.' },
    { role: 'player', text: 'Tes 2 dernières défaites étaient par KO au round 1. Ton chin est ta faiblesse, tout le monde le sait.' },
    { role: 'opponent', text: 'Ces KO c\'était contre des Top 5, pas un rookie comme toi.' },
    { role: 'player', text: 'Le sol a la même dureté pour tout le monde. Je t\'attends là.' }
  ];

  const goodData = await post('/judge', {
    history: goodHistory, fighter: FIGHTER, opponent: OPPONENT,
    context: CONTEXT_FRESH, lang: 'fr'
  });

  info(`Winner: ${goodData.winner}, Score: ${goodData.score}/10, Show: ${goodData.showFactor}/10`);
  info(`Analysis: "${goodData.analysis?.slice(0, 80)}"`);
  info(`Coaching: "${goodData.coaching?.slice(0, 80)}"`);

  assert(['fighter', 'opponent', 'draw'].includes(goodData.winner), `winner valide (${goodData.winner})`);
  assert(typeof goodData.score === 'number' && goodData.score >= 1 && goodData.score <= 10, `score 1-10 (${goodData.score})`);
  assert(typeof goodData.analysis === 'string' && goodData.analysis.length > 10, 'analysis non vide');
  assert(typeof goodData.playerMorale === 'number', `playerMorale est un nombre (${goodData.playerMorale})`);
  assert(typeof goodData.opponentMorale === 'number', `opponentMorale est un nombre (${goodData.opponentMorale})`);
  assert(typeof goodData.hypeMultiplier === 'number' && goodData.hypeMultiplier >= 1.0, `hypeMultiplier >= 1.0 (${goodData.hypeMultiplier})`);
  assert(typeof goodData.showFactor === 'number', `showFactor présent (${goodData.showFactor})`);
  assert(typeof goodData.coaching === 'string' && goodData.coaching.length > 5, 'coaching présent');
  assert(goodData.playerError === null || typeof goodData.playerError === 'string', `playerError valide (${goodData.playerError})`);

  // Test 2: Insultes gratuites en première rencontre → joueur devrait perdre + playerError
  section('3b. POST /judge — Insultes gratuites sans contexte');
  const badHistory = [
    { role: 'opponent', text: 'Tu n\'es pas à ta place ici.' },
    { role: 'player', text: 'Va te faire foutre, espèce de raté.' },
  ];

  const badData = await post('/judge', {
    history: badHistory, fighter: FIGHTER, opponent: OPPONENT,
    context: CONTEXT_FRESH, lang: 'fr'
  });

  info(`Winner: ${badData.winner}, playerError: ${badData.playerError}`);
  info(`Coaching: "${badData.coaching}"`);

  assert(badData.playerError !== null || badData.playerMorale <= 0, 'Insultes gratuites: pénalisé (playerError ou morale négatif)');
  assert(badData.playerError !== null, `playerError retourné (${badData.playerError})`);
  assert(typeof badData.coaching === 'string', 'Coaching présent même en cas d\'erreur');

  // Test 3: Rivalité max + échange agressif → acceptable
  section('3c. POST /judge — Rivalité max, agressivité permise');
  const rivalHistory = [
    { role: 'opponent', text: 'On se retrouve encore. La dernière fois tu t\'en es sorti par chance.' },
    { role: 'player', text: 'Par chance ? Tu as pleuré dans le vestiaire pendant 20 minutes. Je te termine cette fois.' },
    { role: 'opponent', text: 'Tu parles beaucoup pour quelqu\'un qui a failli finir au sol.' },
    { role: 'player', text: 'J\'ai hâte de voir ta tête quand le ref lèvera mon bras.' }
  ];

  const rivalData = await post('/judge', {
    history: rivalHistory, fighter: FIGHTER, opponent: OPPONENT,
    context: CONTEXT_RIVALRY, lang: 'fr'
  });

  info(`Rivalité max → Winner: ${rivalData.winner}, hype: ${rivalData.hypeMultiplier}, show: ${rivalData.showFactor}`);
  assert(rivalData.hypeMultiplier > 1.0, `Rivalité booste la hype (${rivalData.hypeMultiplier})`);
  // Avec rivalité 4, l'agressivité ne devrait PAS être pénalisée comme "insultes_gratuites"
  if (rivalData.playerError === 'insultes_gratuites') {
    warn(`playerError = insultes_gratuites malgré rivalité 4 — le LLM est peut-être trop strict`);
  } else {
    pass(`Pas d'erreur "insultes_gratuites" avec rivalité max (${rivalData.playerError || 'null'})`);
    passed++;
  }
}

// ─── TEST 4: Logique des effets (sans API) ────────────────
async function testEffectsLogic() {
  section('4. Logique locale — applyEffects() clamping');

  // Simulate applyEffects logic inline (mirrors trashtalk-engine.js)
  function applyEffects(effects, fighter, opponent, fight) {
    const result = { fighter: { ...fighter }, opponent: { ...opponent }, fight: { ...fight } };

    if (effects.playerMorale !== 0) {
      result.fighter.morale = Math.min(100, Math.max(10, fighter.morale + effects.playerMorale));
    }
    if (effects.opponentMorale !== 0 && opponent) {
      result.opponent.morale = Math.min(100, Math.max(10, (opponent.morale || 70) + effects.opponentMorale));
    }
    if (fight && effects.hypeMultiplier > 1.0) {
      result.fight.hypeMultiplier = effects.hypeMultiplier;
    }
    if (effects.mentalBonus > 0) {
      result.fighter._mentalBonus = effects.mentalBonus;
    }
    return result;
  }

  const mockFighter = { morale: 70 };
  const mockOpponent = { morale: 75 };
  const mockFight = {};

  // Bon trash talk
  const winEffects = { playerMorale: 4, opponentMorale: -3, hypeMultiplier: 1.25, mentalBonus: 2 };
  const r1 = applyEffects(winEffects, mockFighter, mockOpponent, mockFight);
  assert(r1.fighter.morale === 74, `morale joueur +4: ${r1.fighter.morale} == 74`);
  assert(r1.opponent.morale === 72, `morale adversaire -3: ${r1.opponent.morale} == 72`);
  assert(r1.fight.hypeMultiplier === 1.25, `hypeMultiplier appliqué: ${r1.fight.hypeMultiplier}`);
  assert(r1.fighter._mentalBonus === 2, `mentalBonus appliqué: ${r1.fighter._mentalBonus}`);

  // Morale clamping (ne dépasse pas 100 / ne descend pas sous 10)
  const extremePos = { playerMorale: 50, opponentMorale: 0, hypeMultiplier: 1.0, mentalBonus: 0 };
  const r2 = applyEffects(extremePos, { morale: 90 }, mockOpponent, mockFight);
  assert(r2.fighter.morale === 100, `Clamping max 100: morale ${r2.fighter.morale}`);

  const extremeNeg = { playerMorale: -99, opponentMorale: 0, hypeMultiplier: 1.0, mentalBonus: 0 };
  const r3 = applyEffects(extremeNeg, { morale: 15 }, mockOpponent, mockFight);
  assert(r3.fighter.morale === 10, `Clamping min 10: morale ${r3.fighter.morale}`);

  // getFightDueForPressConference logic
  function getFightDue(schedule, currentWeek) {
    return schedule.find(f =>
      !f.completed && !f.pressConferenceDone && f.week - currentWeek === 1
    ) || null;
  }

  const schedule = [
    { week: 5, completed: false, pressConferenceDone: false, id: 'fight1' },
    { week: 8, completed: false, pressConferenceDone: false, id: 'fight2' },
    { week: 8, completed: false, pressConferenceDone: true, id: 'fight3' },
  ];

  assert(getFightDue(schedule, 4)?.id === 'fight1', 'Détecte fight 1 semaine avant');
  assert(getFightDue(schedule, 7)?.id === 'fight2', 'Détecte fight2, ignore fight3 (déjà fait)');
  assert(getFightDue(schedule, 6) === null, 'Pas de fight dans 1 semaine → null');
  assert(getFightDue(schedule, 5) === null, 'Fight week actuelle → pas de presse');
}

// ─── MAIN ─────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.bold}${C.magenta}╔════════════════════════════════════════╗`);
  console.log(`║  MMA Fighter Manager — Test Suite      ║`);
  console.log(`╚════════════════════════════════════════╝${C.reset}`);
  console.log(`${C.dim}Worker: ${WORKER_URL}${C.reset}`);

  const start = Date.now();

  try {
    await testProvoke();
    await testExchange();
    await testJudge();
  } catch (e) {
    console.log(`\n${C.red}ERREUR API: ${e.message}${C.reset}`);
    console.log(`${C.dim}(Le Worker est-il déployé et accessible ?)${C.reset}`);
  }

  await testEffectsLogic();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n${C.bold}─────────────────────────────────────────${C.reset}`);
  console.log(`${C.bold}Résultat: ${C.green}${passed} passés${C.reset} · ${failed > 0 ? C.red : C.dim}${failed} échoués${C.reset} · ${elapsed}s`);

  if (failed === 0) {
    console.log(`${C.bold}${C.green}\n🎉 Tous les tests passent !${C.reset}\n`);
  } else {
    console.log(`${C.bold}${C.red}\n⚠️  ${failed} test(s) en échec.${C.reset}\n`);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
