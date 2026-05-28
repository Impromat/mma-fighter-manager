/**
 * MMA Fighter Manager — Trash Talk API (Cloudflare Worker)
 * 
 * Routes:
 *   POST /provoke   → AI fighter generates first provocation
 *   POST /exchange  → AI responds to player + decides if exchange continues
 *   POST /judge     → Final verdict on full conversation
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

const SYSTEM_PROMPT_JUDGE = `Tu es un analyste MMA expert en psychologie du combat.
Tu évalues un échange complet de conférence de presse entre deux fighters.
Règles:
- Évalue la qualité globale de l'échange sur tous les rounds
- Un bon trash talk référence des faits réels (stats, record, faiblesses)
- Le bluff peut marcher s'il est bien fait
- Une réponse faible ou générique donne l'avantage à l'adversaire
- Les insultes sans contenu réel sont faibles — l'IA les pénalise
- Plus l'échange est long et intense, plus les effets sont amplifiés
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
      max_tokens: 250,
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
${context.rivalry ? 'RIVALITÉ ACTIVE (intensité: ' + context.rivalry + ')' : ''}`;

  const result = await callOpenAI(env, SYSTEM_PROMPT_PROVOKE, userPrompt);
  return jsonResponse({ trashtalk: result });
}

async function handleExchange(body, env) {
  const { history, fighter, opponent, context, roundNumber, lang } = body;

  // Format conversation history
  const historyText = history.map((msg, i) =>
    `${msg.role === 'opponent' ? opponent.name : fighter.name}: "${msg.text}"`
  ).join('\n');

  const userPrompt = `Échange de conférence de presse MMA — Round ${roundNumber}.
${lang === 'en' ? 'Réponds en anglais.' : 'Réponds en français.'}

FIGHTERS:
- ${opponent.name} (${opponent.wins}W-${opponent.losses}L, ${opponent.personality}, style: ${opponent.style})
- ${fighter.name} (${fighter.wins}W-${fighter.losses}L, style: ${fighter.style})

ÉCHANGE SO FAR:
${historyText}

CONTEXTE: Round ${roundNumber}/4 max. ${context.isTitle ? 'Title fight.' : ''}

Génère la réplique de ${opponent.name} et décide si l'échange continue.
L'échange continue si la réponse du joueur était substantielle/intéressante.
L'échange s'arrête si: réponse vide/courte, max rounds atteint, ou échange naturellement terminé.

Réponds UNIQUEMENT avec ce JSON:
{
  "opponentReply": "réplique de ${opponent.name} en 2-3 phrases max",
  "shouldContinue": true,
  "intensity": 7,
  "reason": "heated"
}
shouldContinue = false si l'échange doit se terminer après cette réplique.
intensity = 1-10 (niveau de tension de l'échange).`;

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

  const userPrompt = `Évalue cet échange complet de conférence de presse MMA (${rounds} round(s)).
${lang === 'en' ? 'Réponds en anglais.' : 'Réponds en français.'}

${opponent.name} (${opponent.wins}W-${opponent.losses}L) vs ${fighter.name} (${fighter.wins}W-${fighter.losses}L)
Contexte: ${context.isTitle ? 'Title fight' : 'Ranked fight'}

ÉCHANGE COMPLET:
${historyText}

Évalue qui a dominé la conférence de presse sur l'ensemble de l'échange.
Les insultes sans contenu factuel sont FAIBLES. Les références aux stats/records sont FORTES.
Les effets sont amplifiés si l'échange a duré plusieurs rounds.

Réponds UNIQUEMENT avec ce JSON:
{
  "winner": "fighter",
  "score": 7,
  "analysis": "analyse en 1-2 phrases",
  "playerMorale": 3,
  "opponentMorale": -2,
  "hypeMultiplier": 1.2,
  "mentalBonus": 1
}
winner = "fighter" si ${fighter.name} a dominé, "opponent" sinon.
hypeMultiplier: entre 1.0 et ${1.0 + rounds * 0.15} (amplifié par le nombre de rounds).`;

  const result = await callOpenAI(env, SYSTEM_PROMPT_JUDGE, userPrompt);
  
  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return jsonResponse(JSON.parse(cleaned));
  } catch {
    return jsonResponse({ 
      winner: 'opponent', score: 5, 
      analysis: 'Échange serré.',
      playerMorale: 0, opponentMorale: 0, 
      hypeMultiplier: 1.0, mentalBonus: 0 
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
