/**
 * MMA Fighter Manager — Trash Talk API (Cloudflare Worker)
 * 
 * Routes:
 *   POST /provoke  → AI fighter generates a provocation
 *   POST /judge    → AI evaluates the trash talk exchange
 */

const SYSTEM_PROMPT_PROVOKE = `Tu es un scénariste de conférences de presse MMA/UFC.
Tu incarnes un fighter qui provoque son adversaire avant un combat.
Règles:
- 2-3 phrases maximum, percutantes et réalistes
- Utilise UNIQUEMENT les données fournies (stats, record, ranking)
- Style conférence de presse UFC: confiant, provocateur mais crédible
- Ne mentionne jamais que tu es une IA
- Adapte le ton à la personnalité indiquée`;

const SYSTEM_PROMPT_JUDGE = `Tu es un analyste MMA expert en psychologie du combat.
Tu évalues un échange de conférence de presse entre deux fighters.
Règles:
- Évalue la qualité du trash talk: pertinence, créativité, impact psychologique
- Un bon trash talk référence des faits réels (stats, record, faiblesses)
- Le bluff peut marcher s'il est bien fait
- Une réponse faible ou générique donne l'avantage à l'adversaire
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
      max_tokens: 200,
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

async function handleJudge(body, env) {
  const { provocation, response, opponent, fighter, context, lang } = body;

  const userPrompt = `Évalue cet échange de conférence de presse MMA.
${lang === 'en' ? 'Réponds en anglais.' : 'Réponds en français.'}

PROVOCATION de ${opponent.name} (${opponent.wins}W-${opponent.losses}L, ${opponent.personality}):
"${provocation}"

RÉPONSE de ${fighter.name} (${fighter.wins}W-${fighter.losses}L):
"${response}"

Contexte: ${context.isTitle ? 'Title fight' : 'Ranked fight'}, ${fighter.rank ? '#' + fighter.rank : 'NR'} vs ${opponent.rank ? '#' + opponent.rank : 'NR'}

Réponds UNIQUEMENT avec ce JSON (sans markdown, sans explication):
{
  "winner": "fighter",
  "score": 7,
  "analysis": "exemple d'analyse courte",
  "playerMorale": 3,
  "opponentMorale": -2,
  "hypeMultiplier": 1.2,
  "mentalBonus": 1
}
Remplace les valeurs selon ton évaluation. winner = "fighter" si ${fighter.name} a le dessus, "opponent" sinon.`;

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
    // CORS preflight
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
      if (path === '/provoke') return await handleProvoke(body, env);
      if (path === '/judge')   return await handleJudge(body, env);
      return jsonResponse({ error: 'Not found' }, 404);
    } catch (e) {
      return jsonResponse({ error: e.message }, 500);
    }
  }
};
