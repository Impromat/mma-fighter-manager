/* ============================================
   MMA Fighter Manager — Constants
   ============================================ */

const WEIGHT_CLASSES = [
  { id: 'flyweight', name: 'Flyweight', maxWeight: 57, label: '57 kg' },
  { id: 'bantamweight', name: 'Bantamweight', maxWeight: 61, label: '61 kg' },
  { id: 'featherweight', name: 'Featherweight', maxWeight: 66, label: '66 kg' },
  { id: 'lightweight', name: 'Lightweight', maxWeight: 70, label: '70 kg' },
  { id: 'welterweight', name: 'Welterweight', maxWeight: 77, label: '77 kg' },
  { id: 'middleweight', name: 'Middleweight', maxWeight: 84, label: '84 kg' },
  { id: 'lightheavyweight', name: 'Light Heavyweight', maxWeight: 93, label: '93 kg' },
  { id: 'heavyweight', name: 'Heavyweight', maxWeight: 120, label: '120 kg' }
];

const STAT_NAMES = [
  { id: 'striking', label: 'Striking', short: 'STR', icon: '👊' },
  { id: 'grappling', label: 'Grappling', short: 'GRP', icon: '🤼' },
  { id: 'submission', label: 'Submission', short: 'SUB', icon: '🔒' },
  { id: 'wrestling', label: 'Wrestling', short: 'WRS', icon: '🤸' },
  { id: 'cardio', label: 'Cardio', short: 'CAR', icon: '❤️' },
  { id: 'chin', label: 'Chin', short: 'CHN', icon: '🛡️' },
  { id: 'athleticism', label: 'Athleticism', short: 'ATH', icon: '⚡' },
  { id: 'mental', label: 'Mental', short: 'MNT', icon: '🧠' }
];

const STYLES = {
  striker: {
    id: 'striker',
    name: 'Striker',
    icon: '👊',
    color: '#e63946',
    primaryStats: ['striking', 'athleticism', 'chin'],
    secondaryStats: ['cardio', 'mental'],
    weakStats: ['grappling', 'submission', 'wrestling'],
    description: 'Favors stand-up combat with powerful striking combinations'
  },
  grappler: {
    id: 'grappler',
    name: 'Grappler',
    icon: '🤼',
    color: '#3498db',
    primaryStats: ['grappling', 'submission', 'cardio'],
    secondaryStats: ['wrestling', 'mental'],
    weakStats: ['striking', 'chin', 'athleticism'],
    description: 'Excels on the ground with submission attempts and control'
  },
  wrestler: {
    id: 'wrestler',
    name: 'Wrestler',
    icon: '🤸',
    color: '#f4a261',
    primaryStats: ['wrestling', 'athleticism', 'cardio'],
    secondaryStats: ['chin', 'grappling'],
    weakStats: ['striking', 'submission', 'mental'],
    description: 'Dominates with takedowns, pressure and ground control'
  },
  wellRounded: {
    id: 'wellRounded',
    name: 'Well-Rounded',
    icon: '⚖️',
    color: '#2ecc71',
    primaryStats: ['mental', 'cardio'],
    secondaryStats: ['striking', 'grappling', 'wrestling', 'athleticism'],
    weakStats: ['submission', 'chin'],
    description: 'Balanced fighter who can compete anywhere the fight goes'
  }
};

const TRAINING_TYPES = {
  campStriking: {
    id: 'campStriking',
    name: 'Camp Striking',
    icon: '🥊',
    description: 'Focus on striking techniques, combinations and head movement',
    statGains: { striking: 3, chin: 1, athleticism: 1 },
    cost: 0,
    injuryRisk: 0.05,
    moralEffect: -2
  },
  campGrappling: {
    id: 'campGrappling',
    name: 'Camp Grappling',
    icon: '🤼',
    description: 'Train ground game, positions and submission chains',
    statGains: { grappling: 2, submission: 2, cardio: 1 },
    cost: 0,
    injuryRisk: 0.05,
    moralEffect: -2
  },
  campWrestling: {
    id: 'campWrestling',
    name: 'Camp Wrestling',
    icon: '🤸',
    description: 'Develop takedowns, takedown defense and clinch work',
    statGains: { wrestling: 3, cardio: 1, athleticism: 1 },
    cost: 0,
    injuryRisk: 0.05,
    moralEffect: -2
  },
  classicTraining: {
    id: 'classicTraining',
    name: 'Classic Training',
    icon: '🏃',
    description: 'Entraînement de base gratuit. Gains modestes, le moral en prend un coup.',
    statGains: { striking: 1, grappling: 1, wrestling: 1, cardio: 1 },
    cost: 0,
    injuryRisk: 0.03,
    moralEffect: -5
  },
  general: {
    id: 'general',
    name: 'General Training',
    icon: '🏋️',
    description: 'Balanced development across all disciplines',
    statGains: { striking: 1, grappling: 1, submission: 1, wrestling: 1, cardio: 1, chin: 0, athleticism: 1, mental: 1 },
    cost: 0,
    injuryRisk: 0.02,
    moralEffect: 0
  },
  sparring: {
    id: 'sparring',
    name: 'Intensive Sparring',
    icon: '⚔️',
    description: 'High-intensity sparring sessions. Fast gains but injury risk.',
    statGains: { striking: 2, grappling: 2, wrestling: 2, chin: 1, cardio: 1, mental: 2 },
    cost: 0,
    injuryRisk: 0.15,
    moralEffect: -5
  },
  recovery: {
    id: 'recovery',
    name: 'Recovery Week',
    icon: '🧘',
    description: 'Rest, recovery and mental preparation. Boosts morale.',
    statGains: { mental: 1 },
    cost: 0,
    injuryRisk: 0,
    moralEffect: 15
  }
};

const FIGHT_CAMP_TYPES = {
  antiWrestler: {
    id: 'antiWrestler',
    name: 'Anti-Wrestling Camp',
    icon: '🛡️',
    description: 'Focus on takedown defense and clinch escapes',
    bonuses: { wrestling: 5, grappling: 3, athleticism: 2 },
    cost: 2000,
    targetStyle: 'wrestler'
  },
  antiStriker: {
    id: 'antiStriker',
    name: 'Anti-Striking Camp',
    icon: '🥋',
    description: 'Work on chin training, distance management and counters',
    bonuses: { chin: 5, athleticism: 3, striking: 2 },
    cost: 2000,
    targetStyle: 'striker'
  },
  antiGrappler: {
    id: 'antiGrappler',
    name: 'Anti-Grappling Camp',
    icon: '💪',
    description: 'Submission defense drilling and scramble training',
    bonuses: { submission: 5, grappling: 3, wrestling: 2 },
    cost: 2000,
    targetStyle: 'grappler'
  }
};

const NATIONALITIES = [
  { id: 'us', name: 'USA', flag: '🇺🇸' },
  { id: 'br', name: 'Brazil', flag: '🇧🇷' },
  { id: 'ru', name: 'Russia', flag: '🇷🇺' },
  { id: 'ie', name: 'Ireland', flag: '🇮🇪' },
  { id: 'mx', name: 'Mexico', flag: '🇲🇽' },
  { id: 'jp', name: 'Japan', flag: '🇯🇵' },
  { id: 'ng', name: 'Nigeria', flag: '🇳🇬' },
  { id: 'fr', name: 'France', flag: '🇫🇷' },
  { id: 'gb', name: 'UK', flag: '🇬🇧' },
  { id: 'au', name: 'Australia', flag: '🇦🇺' },
  { id: 'pl', name: 'Poland', flag: '🇵🇱' },
  { id: 'kr', name: 'South Korea', flag: '🇰🇷' },
  { id: 'se', name: 'Sweden', flag: '🇸🇪' },
  { id: 'ge', name: 'Georgia', flag: '🇬🇪' },
  { id: 'dz', name: 'Algeria', flag: '🇩🇿' }
];

const FIGHT_PURSES = {
  unranked:    { show: 1500,  win: 3000 },
  ranked15_11: { show: 2500,  win: 5000 },
  ranked10_6:  { show: 4000,  win: 8000 },
  ranked5_4:   { show: 6000,  win: 12000 },
  ranked3_1:   { show: 8000,  win: 15000 },
  titleFight:  { show: 15000, win: 30000 }
};

// Performance bonuses (paid to the gym directly)
const PERFORMANCE_BONUS = {
  koFinish: 2000,          // KO/TKO finish bonus
  submissionFinish: 1500,  // Submission finish bonus
  fightOfTheNight: 3000,   // Random chance on exciting fights
  winStreak5: 5000,        // 5 win streak milestone
  winStreak10: 10000       // 10 win streak milestone
};

// --- Gym Financial Model (MMA Realistic) ---

// Fighters pay the gym weekly training fees (based on OVR bracket)
const GYM_FEES = {
  rookie: 300,     // OVR < 60
  prospect: 500,   // OVR 60-69
  contender: 750,  // OVR 70-79
  elite: 1000,     // OVR 80-89
  champion: 1500   // OVR 90+
};

// Gym fixed costs
const GYM_COSTS = {
  rent: 800,              // weekly rent/equipment (reduced for balance)
  staffPerFighter: 250    // coach cost per fighter
};

// Gym's default cut of fighter purses (adjustable per fighter)
const GYM_CUT = {
  pursePercent: 0.20,     // 20% of show money
  winBonusPercent: 0.15   // 15% of win bonus
};

// Commission multiplier steps (per fighter)
const COMMISSION_STEPS = {
  min: 0.50,   // ×0.50 = 10%/7.5%  → fighter happy
  max: 2.00,   // ×2.00 = 40%/30%   → fighter angry
  step: 0.25,
  default: 1.0,
  moralePerStep: 4   // morale change per step away from 1.0
};

const EVENT_INTERVAL = 1; // AFC every week

// --- Fight Offer System ---
const DECLINE_REASONS = {
  notReady: {
    id: 'notReady',
    icon: '🏥',
    moraleEffect: 0,          // 0 first time, -5 second time (handled in logic)
    nextEffect: 'same',       // same level opponent next time
  },
  lowPurse: {
    id: 'lowPurse',
    icon: '💰',
    moraleEffect: -5,
    nextEffect: 'betterPurse', // +20% purse next offer
  },
  tooWeak: {
    id: 'tooWeak',
    icon: '👎',
    moraleEffect: 5,           // fighter is flattered
    nextEffect: 'harderOpponent', // rank +2-3 next time
  },
  tooStrong: {
    id: 'tooStrong',
    icon: '😰',
    moraleEffect: -10,
    nextEffect: 'easierOpponent', // weaker opponent, -20% purse
  },
  notInterested: {
    id: 'notInterested',
    icon: '🚫',
    moraleEffect: -8,
    nextEffect: 'rankPenalty',  // 3 consecutive → lose ranking spots
  }
};

const OFFER_CONFIG = {
  offerFrequency: 1,         // generate offers every week
  offerExpiryWeeks: 2,       // offers expire after 2 weeks if not answered
  minPrepWeeks: 4,           // minimum weeks before a fight
  maxFutureWeeks: 16,        // can't schedule beyond 16 weeks
  prepWeeksNormal: 4,        // standard prep time for AI offers
  prepWeeksTitle: 6,         // title fight prep time
  prepWeeksShort: 3,         // short notice
  maxConsecutiveDeclines: 3,  // before rank penalty kicks in
  purseBoostOnDecline: 0.2,  // +20% purse after lowPurse decline
  pursePenaltyOnWeak: 0.2,   // -20% purse after tooStrong decline
  fightCooldown: 4,          // minimum weeks between fights
  counterProposePenalty: 15,  // -15% acceptance chance on counter-propose
};

const ACTIVE_WEIGHT_CLASSES = ['lightweight', 'welterweight', 'middleweight', 'heavyweight'];

const AGING_CONFIG = {
  weeksPerYear: 26,          // 1 saison = 1 an
  peakAgeMin: 27,
  peakAgeMax: 31,
  retireAgeMin: 35,
  retireAgeMax: 38,
  declineStatsPerYear: 2,    // number of stats that decline per year past peak
  declineAmountMin: 1,
  declineAmountMax: 3,
  trainingEfficiencyPeak: 1.0,
  trainingEfficiencyMin: 0.4,
  retireChancePerYear: 0.4,  // 40% chance per year past retireAge
  chinDamagePerKO: [2, 4],   // min-max permanent chin damage per KO loss
  glassChinThreshold: 3,     // KO losses before "glass chin" warning
};

const REPUTATION_CONFIG = {
  initial: 50,
  fightAccepted: 3,
  titleWin: 8,
  declineMotivated: -1,
  declineIgnored: -4,
  weeklyInactivityPenalty: -1,
  inactivityThreshold: 8,    // weeks without any fight before penalty
  offerQualityThresholdHigh: 75,
  offerQualityThresholdLow: 35,
};

const INJURY_DURATIONS = {
  minor: { min: 1, max: 2, label: 'Minor Injury' },
  moderate: { min: 3, max: 5, label: 'Moderate Injury' },
  severe: { min: 6, max: 10, label: 'Severe Injury' }
};

// Dynamic narration that uses i18n
function getNarration() {
  return {
    strikingExchange: t('narr.strikingExchange'),
    strikingDefense: t('narr.strikingDefense'),
    takedown: t('narr.takedown'),
    takedownDefense: t('narr.takedownDefense'),
    groundControl: t('narr.groundControl'),
    submissionAttempt: t('narr.submissionAttempt'),
    submissionDefense: t('narr.submissionDefense'),
    roundStart: t('narr.roundStart'),
    momentum: t('narr.momentum'),
    fatigue: t('narr.fatigue'),
    clinch: t('narr.clinch'),
    koFinish: t('narr.koFinish'),
    tkoFinish: t('narr.tkoFinish'),
    subFinish: t('narr.subFinish'),
    decision: t('narr.decision'),
  };
}

// Keep NARRATION as a getter for backward compat
const NARRATION = new Proxy({}, {
  get(target, prop) {
    return getNarration()[prop];
  }
});

const AVATAR_COLORS = [
  '#e63946', '#f4a261', '#2ecc71', '#3498db', '#9b59b6',
  '#e67e22', '#1abc9c', '#e74c3c', '#2980b9', '#8e44ad',
  '#d35400', '#16a085', '#c0392b', '#2c3e50', '#f39c12',
];

const CORNER_INSTRUCTIONS = {
  stayStanding: {
    id: 'stayStanding',
    get name() { return t('corner.stayStanding'); },
    icon: '🥊',
    get shortDesc() { return t('corner.stayStandingDesc'); },
    effects: { striking: 12, athleticism: 5, wrestling: -10 },
    phaseWeights: { striking: 1.4, wrestling: 0.5, ground: 0.6 }
  },
  takedown: {
    id: 'takedown',
    get name() { return t('corner.takedown'); },
    icon: '🤼',
    get shortDesc() { return t('corner.takedownDesc'); },
    effects: { wrestling: 15, grappling: 10, striking: -5 },
    phaseWeights: { wrestling: 1.6, ground: 1.4, striking: 0.6 }
  },
  goForFinish: {
    id: 'goForFinish',
    get name() { return t('corner.goForFinish'); },
    icon: '💀',
    get shortDesc() { return t('corner.goForFinishDesc'); },
    effects: { striking: 18, submission: 12, chin: -15, mental: -8 },
    phaseWeights: {}
  },
  stayPatient: {
    id: 'stayPatient',
    get name() { return t('corner.stayPatient'); },
    icon: '🛡️',
    get shortDesc() { return t('corner.stayPatientDesc'); },
    effects: { chin: 10, mental: 10, striking: -8, grappling: -5 },
    phaseWeights: {}
  },
  workTheBody: {
    id: 'workTheBody',
    get name() { return t('corner.workTheBody'); },
    icon: '🫁',
    get shortDesc() { return t('corner.workTheBodyDesc'); },
    effects: { striking: 5 },
    opponentEffects: { cardio: -12 },
    phaseWeights: { striking: 1.2, clinch: 1.5 }
  },
  recover: {
    id: 'recover',
    get name() { return t('corner.recover'); },
    icon: '❤️‍🩹',
    get shortDesc() { return t('corner.recoverDesc'); },
    effects: { chin: 8, mental: 5, cardio: 5, striking: -12, grappling: -10 },
    phaseWeights: {}
  }
};

// ========== MARKET ==========

const ROSTER_MAX = 6;

const MARKET_CONFIG = {
  poolSize: 5,             // Number of free agents in the pool
  refreshInterval: 4,     // Weeks between pool refreshes
  severancePay: 2,        // Multiplier of weekly salary for cutting
  signingBonusTiers: [
    // { minOvr, maxOvr, minBonus, maxBonus }
    { minOvr: 0,  maxOvr: 45, minBonus: 2000,  maxBonus: 4000  },
    { minOvr: 46, maxOvr: 55, minBonus: 4000,  maxBonus: 7000  },
    { minOvr: 56, maxOvr: 65, minBonus: 6000,  maxBonus: 10000 },
    { minOvr: 66, maxOvr: 75, minBonus: 9000,  maxBonus: 14000 },
    { minOvr: 76, maxOvr: 99, minBonus: 12000, maxBonus: 18000 }
  ],
  attractivenessThresholds: [
    // { minScore, statRange: [min, max] }
    { minScore: 0,  statRange: [30, 50] },
    { minScore: 4,  statRange: [40, 60] },
    { minScore: 7,  statRange: [50, 70] },
    { minScore: 10, statRange: [60, 80] }
  ]
};
