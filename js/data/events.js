/* ============================================
   MMA Fighter Manager — Random Events
   ============================================ */

const RANDOM_EVENTS = [
  // --- MEDIA & REPUTATION ---
  {
    id: 'interview_request',
    title: '🎤 Interview demandée',
    icon: '🎤',
    category: 'media',
    probability: 0.15,
    getText: (fighter) => `Un journaliste de MMA Weekly veut interviewer <strong>${fighter.fullName}</strong> avant son prochain combat. Comment répondez-vous ?`,
    requiresFighter: true,
    choices: [
      {
        label: '✅ Accepter l\'interview',
        description: 'Bonne visibilité pour le fighter et la gym',
        effects: { morale: 5, budget: 500 },
        toast: '📰 L\'interview a boosté la réputation !'
      },
      {
        label: '❌ Refuser poliment',
        description: 'Le fighter reste concentré sur l\'entraînement',
        effects: { morale: -3 },
        toast: '🤐 Le journaliste est déçu, mais le fighter reste focus.'
      }
    ]
  },
  {
    id: 'social_media_buzz',
    title: '📱 Buzz sur les réseaux',
    icon: '📱',
    category: 'media',
    probability: 0.10,
    getText: (fighter) => `La vidéo d'entraînement de <strong>${fighter.fullName}</strong> est devenue virale ! Un sponsor s'intéresse à votre gym.`,
    requiresFighter: true,
    choices: [
      {
        label: '💰 Signer le deal sponsoring',
        description: '+$2,000 mais le fighter devra participer à des événements promo',
        effects: { budget: 2000, morale: -5 },
        toast: '💰 Deal sponsoring signé ! +$2,000 mais le fighter est distrait.'
      },
      {
        label: '🙅 Décliner l\'offre',
        description: 'Le fighter reste concentré, pas de distraction',
        effects: { morale: 3 },
        toast: '🧘 Le fighter apprécie de rester concentré sur le combat.'
      }
    ]
  },

  // --- TRAINING & GYM ---
  {
    id: 'training_breakthrough',
    title: '⚡ Percée à l\'entraînement',
    icon: '⚡',
    category: 'training',
    probability: 0.10,
    getText: (fighter) => `<strong>${fighter.fullName}</strong> a eu un déclic à l'entraînement ! Il veut intensifier son programme.`,
    requiresFighter: true,
    choices: [
      {
        label: '🔥 Pousser l\'intensité',
        description: 'Gains de stats doublés cette semaine, mais risque de blessure',
        effects: { statBoost: 3, injuryRisk: 0.20 },
        toast: '🔥 Entraînement intense ! Gros gains mais risque pris.'
      },
      {
        label: '🧘 Rester sur le programme',
        description: 'Pas de risque, petit boost de moral',
        effects: { morale: 5 },
        toast: '✅ Sage décision. Le fighter est content du programme.'
      }
    ]
  },
  {
    id: 'equipment_upgrade',
    title: '🏗️ Nouveau matériel disponible',
    icon: '🏗️',
    category: 'gym',
    probability: 0.08,
    getText: () => `Un fournisseur propose du matériel d'entraînement haut de gamme pour votre gym à prix réduit.`,
    requiresFighter: false,
    choices: [
      {
        label: '💳 Acheter l\'équipement ($3,000)',
        description: 'Tous les fighters gagnent un boost de stats pendant 3 semaines',
        effects: { budget: -3000, globalStatBoost: 2, boostWeeks: 3 },
        toast: '🏋️ Équipement installé ! Boost d\'entraînement pour toute la gym.'
      },
      {
        label: '🙅 Trop cher pour nous',
        description: 'On garde le budget intact',
        effects: {},
        toast: '💸 Offre déclinée. Le budget reste intact.'
      }
    ]
  },
  {
    id: 'sparring_partner',
    title: '🤝 Partenaire de sparring',
    icon: '🤝',
    category: 'training',
    probability: 0.12,
    getText: (fighter) => `Un ancien champion propose de faire du sparring avec <strong>${fighter.fullName}</strong> cette semaine. C'est une opportunité rare.`,
    requiresFighter: true,
    choices: [
      {
        label: '🥊 Accepter le sparring',
        description: 'Gros boost de stats mais coûte $1,500 et risque de blessure',
        effects: { budget: -1500, statBoost: 4, injuryRisk: 0.10, morale: 8 },
        toast: '🥊 Sparring exceptionnel ! Le fighter a énormément appris.'
      },
      {
        label: '❌ Décliner',
        description: 'Pas de risque, pas de coût',
        effects: {},
        toast: 'On passe notre tour cette fois.'
      }
    ]
  },

  // --- FIGHTERS & MORALE ---
  {
    id: 'fighter_complaint',
    title: '😤 Plainte d\'un fighter',
    icon: '😤',
    category: 'morale',
    probability: 0.12,
    getText: (fighter) => `<strong>${fighter.fullName}</strong> se plaint de l'intensité de l'entraînement. Il veut une semaine de repos.`,
    requiresFighter: true,
    filterFighter: (f) => f.morale < 65,
    choices: [
      {
        label: '🧘 Accorder le repos',
        description: 'Pas de progression cette semaine mais gros boost de moral',
        effects: { morale: 20, skipTraining: true },
        toast: '🧘 Semaine de repos accordée. Le moral remonte !'
      },
      {
        label: '💪 Refuser — on continue',
        description: 'Le fighter est mécontent mais s\'entraîne',
        effects: { morale: -10 },
        toast: '😤 Le fighter est frustré mais continue l\'entraînement.'
      }
    ]
  },
  {
    id: 'fighter_motivation',
    title: '🔥 Regain de motivation',
    icon: '🔥',
    category: 'morale',
    probability: 0.10,
    getText: (fighter) => `<strong>${fighter.fullName}</strong> a regardé ses anciens combats et brûle de motivation ! Il veut un combat le plus vite possible.`,
    requiresFighter: true,
    filterFighter: (f) => f.morale >= 50,
    choices: [
      {
        label: '🔥 Promettre un combat bientôt',
        description: 'Gros boost de moral',
        effects: { morale: 15 },
        toast: '🔥 Le fighter est survolté ! Moral au top.'
      },
      {
        label: '🤚 Tempérer ses ardeurs',
        description: 'On reste patient, petit impact sur le moral',
        effects: { morale: -3 },
        toast: '🤔 Le fighter comprend mais aurait aimé plus d\'ambition.'
      }
    ]
  },

  // --- INJURIES & HEALTH ---
  {
    id: 'fighter_pain',
    title: '🏥 Douleurs suspectes',
    icon: '🏥',
    category: 'health',
    probability: 0.10,
    getText: (fighter) => `<strong>${fighter.fullName}</strong> se plaint de douleurs au genou après l'entraînement. Que faire ?`,
    requiresFighter: true,
    choices: [
      {
        label: '🏥 Repos forcé (1 semaine)',
        description: 'Le fighter manque 1 semaine mais aucun risque',
        effects: { forceInjury: 'minor' },
        toast: '🏥 Repos préventif. Mieux vaut prévenir que guérir.'
      },
      {
        label: '💪 Continuer l\'entraînement',
        description: 'Risque de blessure grave si on ignore',
        effects: { injuryRisk: 0.35 },
        toast: '🎲 On prend le risque... Espérons que ça passe !'
      }
    ]
  },

  // --- FINANCIAL ---
  {
    id: 'gym_maintenance',
    title: '🔧 Réparation urgente',
    icon: '🔧',
    category: 'financial',
    probability: 0.08,
    getText: () => `Le ring d'entraînement a besoin de réparations urgentes. Impossible de s'entraîner correctement sans ça.`,
    requiresFighter: false,
    choices: [
      {
        label: '🔧 Réparer immédiatement ($2,000)',
        description: 'L\'entraînement peut continuer normalement',
        effects: { budget: -2000 },
        toast: '🔧 Réparations effectuées. Tout est en ordre.'
      },
      {
        label: '🩹 Réparer au minimum ($500)',
        description: 'L\'entraînement est un peu moins efficace cette semaine',
        effects: { budget: -500, globalStatPenalty: 1 },
        toast: '🩹 Réparation minimale. L\'entraînement sera moins efficace.'
      }
    ]
  },
  {
    id: 'bonus_sponsor',
    title: '💰 Offre de sponsoring',
    icon: '💰',
    category: 'financial',
    probability: 0.07,
    getText: () => `Une marque d'équipement MMA propose un sponsoring mensuel pour votre gym !`,
    requiresFighter: false,
    choices: [
      {
        label: '✅ Accepter ($3,000 immédiat)',
        description: 'Un bon boost pour les finances',
        effects: { budget: 3000 },
        toast: '💰 Sponsoring signé ! +$3,000 dans les caisses.'
      },
      {
        label: '🤝 Négocier un meilleur deal',
        description: '50% de chance d\'obtenir $5,000, 50% de perdre le deal',
        effects: { gamble: { win: 5000, lose: 0, chance: 0.5 } },
        toast: null // Set dynamically
      }
    ]
  },
  {
    id: 'local_event',
    title: '🎪 Événement local',
    icon: '🎪',
    category: 'community',
    probability: 0.08,
    getText: () => `La mairie organise un festival sportif et vous invite à présenter votre gym avec une démo.`,
    requiresFighter: false,
    choices: [
      {
        label: '🎪 Participer à la démo',
        description: 'Bonne pub locale, +$1,000 et moral global +3',
        effects: { budget: 1000, globalMorale: 3 },
        toast: '🎪 Super événement ! La gym gagne en visibilité.'
      },
      {
        label: '❌ On a pas le temps',
        description: 'On reste focus sur l\'entraînement',
        effects: {},
        toast: 'On reste concentré sur les combats.'
      }
    ]
  }
];
