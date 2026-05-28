/**
 * MMA Fighter Manager — Trash Talk API (Cloudflare Worker)
 *
 * Routes:
 *   POST /provoke   → AI fighter generates first provocation
 *   POST /exchange  → AI responds to player + decides if exchange continues
 *   POST /judge     → Final context-aware verdict on full conversation
 */

const SYSTEM_PROMPT_PROVOKE = `Tu es un scénariste de conférences de presse MMA/UFC.
Tu incarnes un fighter qui provoque son adversaire avant un combat.
Règles:
- 2-3 phrases maximum, percutantes et réalistes
- Utilise UNIQUEMENT les données fournies (stats, record, ranking)
- Style conférence de presse UFC: confiant, provocateur mais crédible
- Ne mentionne jamais que tu es une IA
- Adapte le ton à la personnalité indiquée`;

const SYSTEM_PROMPT_EXCHANGE = `Tu es un scénariste de conférences de presse MMA/UFC.
Tu gères un échange de trash talk entre deux fighters.
Règles:
- Génère la réplique du fighter IA en réponse au joueur
- 2-3 phrases max, escalade le ton si la réponse du joueur était bonne
- Décide si l'échange continue (intensité suffisante) ou s'arrête
- L'échange continue max 4 rounds total
- Réponds UNIQUEMENT en JSON valide, sans markdown`;

const SYSTEM_PROMPT_JUDGE = `Tu es un analyste MMA expert en psychologie du combat et en communication.
Tu évalues des échanges de conférence de presse avec NUANCE selon le contexte.
Règles générales:
- Les références aux stats, records et faiblesses réelles sont toujours FORTES
- Le show et l'entertainment ont une valeur indépendante du "gagnant" technique
- Un draw spectaculaire peut générer plus de hype qu'une victoire ennuyeuse
- Réponds UNIQUEMENT en JSON valide, sans markdown`;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

async function callOpenAI(env, systemPrompt, userPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.9,
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

async function handleProvoke(body, env) {
  const { opponent, fighter, context, lang } = body;

  const userPrompt = `Génère la provocation de ${opponent.name} envers ${fighter.name}.
${lang === 'en' ? 'Réponds en anglais.' : 'Réponds en français.'}

PROVOCATEUR: ${opponent.name}
- Record: ${opponent.wins}W-${opponent.losses}L
- Ranking: ${opponent.rank || 'non classé'}
- Style: ${opponent.style}
- Personnalité: ${opponent.personality}
- Stats fortes: ${opponent.strengths}
- Faiblesse: ${opponent.weakness}

CIBLE: ${fighter.name}
- Record: ${fighter.wins}W-${fighter.losses}L
- Ranking: ${fighter.rank || 'non classé'}
- Style: ${fighter.style}
- Win streak: ${fighter.winStreak || 0}
- Loss streak: ${fighter.lossStreak || 0}

CONTEXTE: ${context.isTitle ? 'COMBAT POUR LE TITRE 🏆' : 'Combat classé'}
Historique face-à-face: ${context.history || 'Première rencontre'}
${context.rivalry ? 'RIVALITÉ ACTIVE (intensité: ' + context.rivalry + '/5)' : ''}`;

  const result = await callOpenAI(env, SYSTEM_PROMPT_PROVOKE, userPrompt);
  return jsonResponse({ trashtalk: result });
}

async function handleExchange(body, env) {
  const { history, fighter, opponent, context, roundNumber, lang } = body;

  const historyText = history.map(msg =>
    `${msg.role === 'opponent' ? opponent.name : fighter.name}: "${msg.text}"`
  ).join('\n');

  const rivalryCtx = context.rivalry >= 3
    ? `RIVALITÉ FORTE (${context.rivalry}/5) — l'escalade agressive est attendue`
    : context.rivalry >= 1
    ? `Rivalité existante (${context.rivalry}/5)`
    : 'Première rencontre — pas de rivalité';

  const userPrompt = `Échange de conférence de presse MMA — Round ${roundNumber}.
${lang === 'en' ? 'Réponds en anglais.' : 'Réponds en français.'}

FIGHTERS:
- ${opponent.name} (${opponent.wins}W-${opponent.losses}L, ${opponent.personality}, style: ${opponent.style})
- ${fighter.name} (${fighter.wins}W-${fighter.losses}L, style: ${fighter.style})
${rivalryCtx}

ÉCHANGE SO FAR:
${historyText}

Génère la réplique de ${opponent.name} et décide si l'échange continue.
L'échange continue si la réponse du joueur était substantielle ou enflammée.
L'échange s'arrête si: réponse vide/très courte, ou échange naturellement terminé.
Max ${4 - roundNumber} rounds restants.

Réponds UNIQUEMENT avec ce JSON:
{
  "opponentReply": "réplique en 2-3 phrases max",
  "shouldContinue": true,
  "intensity": 7,
  "reason": "heated"
}`;

  const result = await callOpenAI(env, SYSTEM_PROMPT_EXCHANGE, userPrompt);

  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return jsonResponse(JSON.parse(cleaned));
  } catch {
    return jsonResponse({
      opponentReply: `${opponent.name} reste concentré sur le combat à venir.`,
      shouldContinue: false,
      intensity: 3,
      reason: 'neutral'
    });
  }
}

async function handleJudge(body, env) {
  const { history, opponent, fighter, context, lang } = body;

  const historyText = history.map(msg =>
    `${msg.role === 'opponent' ? opponent.name : fighter.name}: "${msg.text}"`
  ).join('\n');

  const rounds = Math.ceil(history.length / 2);
  const rivalryLevel = context.rivalry || 0;
  const isTitle = context.isTitle || false;
  const maxHype = (1.0 + rounds * 0.15 + (rivalryLevel >= 3 ? 0.2 : 0) + (isTitle ? 0.1 : 0)).toFixed(2);

  // Context-aware rules shift based on rivalry
  const contextRules = rivalryLevel >= 4
    ? `RIVALITÉ MAXIMALE (${rivalryLevel}/5) — MODE McGregor:
- L'agressivité pure EST PERMISE et attendue: c'est du show, le public adore
- Les insultes bien délivrées avec du swagger fonctionnent ici, même sans données
- Le "show factor" compte AUTANT que les arguments factuels
- Un échange brutal et électrique = hype max même si personne ne domine
- L'erreur ici c'est d'être ENNUYEUX, pas d'être violent`
    : rivalryLevel >= 2
    ? `RIVALITÉ EXISTANTE (${rivalryLevel}/5):
- L'agressivité est tolérée si elle fait référence à l'historique entre les deux
- Les insultes qui rappellent une défaite passée ou un incident sont FORTES
- Le show matter mais les faits restent plus efficaces que les insultes pures`
    : `PREMIÈRE RENCONTRE / PAS DE RIVALITÉ:
- Les insultes gratuites sans faits sont FAIBLES — l'adversaire rétorque facilement
- Les références aux stats et records sont FORTES et crédibles
- Être agressif est OK si l'argument derrière tient la route
- Insulter sans contexte = perdre la salle de presse`;

  const userPrompt = `Évalue cet échange de conférence de presse MMA (${rounds} round(s)).
${lang === 'en' ? 'Réponds en anglais.' : 'Réponds en français.'}

${opponent.name} (${opponent.wins}W-${opponent.losses}L, ${opponent.personality}) vs ${fighter.name} (${fighter.wins}W-${fighter.losses}L)
Contexte: ${isTitle ? '🏆 TITLE FIGHT' : 'Combat classé'}
Historique: ${context.history || 'Première rencontre'}

${contextRules}

ÉCHANGE COMPLET:
${historyText}

Analyse:
1. Qui a dominé l'échange (ou draw spectaculaire)?
2. Qualité du show produit (indépendant du vainqueur)
3. Erreur principale du joueur (${fighter.name}) si applicable
4. Un conseil coaching court et précis

Réponds UNIQUEMENT avec ce JSON:
{
  "winner": "fighter",
  "score": 7,
  "analysis": "analyse en 1-2 phrases précises référençant l'échange réel",
  "playerMorale": 3,
  "opponentMorale": -2,
  "hypeMultiplier": 1.2,
  "mentalBonus": 1,
  "showFactor": 8,
  "playerError": null,
  "coaching": "conseil court et spécifique"
}
winner: "fighter" | "opponent" | "draw" (draw si échange équilibré mais spectaculaire).
hypeMultiplier: entre 1.0 et ${maxHype} — un bon show booste la hype même en défaite.
showFactor: 1-10 (qualité du spectacle indépendamment du résultat).
playerError: null | "insultes_gratuites" | "trop_arrogant" | "hors_sujet" | "promesse_impossible"
coaching: conseil précis basé sur CE QUI S'EST PASSÉ dans cet échange.`;

  const result = await callOpenAI(env, SYSTEM_PROMPT_JUDGE, userPrompt);

  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Draw = entertaining tie → still give hype boost
    if (parsed.winner === 'draw') {
      parsed.hypeMultiplier = Math.max(
        parsed.hypeMultiplier || 1.0,
        1.0 + (parsed.showFactor || 5) * 0.04
      );
      parsed.playerMorale = parsed.playerMorale ?? 1;
    }

    return jsonResponse(parsed);
  } catch {
    return jsonResponse({
      winner: 'opponent', score: 5,
      analysis: 'Échange serré.',
      playerMorale: 0, opponentMorale: 0,
      hypeMultiplier: 1.0, mentalBonus: 0,
      showFactor: 5, playerError: null,
      coaching: 'Appuie-toi sur des faits réels pour avoir le dessus.'
    });
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      const body = await request.json();
      if (path === '/provoke')  return await handleProvoke(body, env);
      if (path === '/exchange') return await handleExchange(body, env);
      if (path === '/judge')    return await handleJudge(body, env);
      return jsonResponse({ error: 'Not found' }, 404);
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }
};
