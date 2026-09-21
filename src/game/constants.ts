import { UpgradeConfig, PlayerStats, PlayerSaveData, Obstacle } from '../types';

export const MAP_WIDTH = 2800;
export const MAP_HEIGHT = 2400;

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  damageLevel: 1,
  maxHealthLevel: 1,
  speedLevel: 1,
  fireRateLevel: 1,
  magazineLevel: 1,
};

export const UPGRADE_DEFINITIONS: UpgradeConfig[] = [
  {
    id: 'damageLevel',
    name: 'Bullet Damage',
    description: 'Increases bullet kinetic power, tearing down zombies faster.',
    baseCost: 50,
    costMultiplier: 1.5,
    maxLevel: 10,
    icon: 'Sword',
    getValueFormatted: (lvl) => `${20 + (lvl - 1) * 8} DMG`,
  },
  {
    id: 'maxHealthLevel',
    name: 'Max Health',
    description: 'Tougher survivor plating granting extra survivability.',
    baseCost: 40,
    costMultiplier: 1.45,
    maxLevel: 10,
    icon: 'Heart',
    getValueFormatted: (lvl) => `${100 + (lvl - 1) * 25} HP`,
  },
  {
    id: 'speedLevel',
    name: 'Movement Speed',
    description: 'Increases sprint agility to kite fast swarms and runners.',
    baseCost: 45,
    costMultiplier: 1.5,
    maxLevel: 8,
    icon: 'Zap',
    getValueFormatted: (lvl) => `+${(lvl - 1) * 12}% SPD`,
  },
  {
    id: 'fireRateLevel',
    name: 'Fire Rate',
    description: 'Decreases delay between consecutive shots.',
    baseCost: 60,
    costMultiplier: 1.6,
    maxLevel: 8,
    icon: 'Flame',
    getValueFormatted: (lvl) => `${(1000 / (260 - (lvl - 1) * 20)).toFixed(1)} shots/s`,
  },
  {
    id: 'magazineLevel',
    name: 'Magazine Size',
    description: 'Holds more rounds in the clip before needing a reload.',
    baseCost: 50,
    costMultiplier: 1.4,
    maxLevel: 8,
    icon: 'Shield',
    getValueFormatted: (lvl) => `${10 + (lvl - 1) * 4} rounds`,
  },
];

export function getUpgradeCost(config: UpgradeConfig, currentLevel: number): number {
  return Math.round(config.baseCost * Math.pow(config.costMultiplier, currentLevel - 1));
}

export function calculatePlayerDerivedStats(upgrades: PlayerStats) {
  const maxHealth = 100 + (upgrades.maxHealthLevel - 1) * 25;
  const baseSpeed = 210 * (1 + (upgrades.speedLevel - 1) * 0.12);
  const fireInterval = Math.max(100, 260 - (upgrades.fireRateLevel - 1) * 20); // in ms
  const maxAmmo = 10 + (upgrades.magazineLevel - 1) * 4;
  const bulletDamage = 20 + (upgrades.damageLevel - 1) * 8;

  return {
    maxHealth,
    speed: baseSpeed,
    fireInterval,
    maxAmmo,
    bulletDamage,
  };
}

const STORAGE_KEY = 'last_night_save_v1';

export function loadSaveData(): PlayerSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        coins: typeof parsed.coins === 'number' ? parsed.coins : 0,
        bestWave: typeof parsed.bestWave === 'number' ? parsed.bestWave : 1,
        totalZombiesKilled: typeof parsed.totalZombiesKilled === 'number' ? parsed.totalZombiesKilled : 0,
        upgrades: {
          ...DEFAULT_PLAYER_STATS,
          ...(parsed.upgrades || {}),
        },
        soundEnabled: parsed.soundEnabled ?? true,
      };
    }
  } catch (err) {
    console.warn('Failed to parse save data', err);
  }

  return {
    coins: 0,
    bestWave: 1,
    totalZombiesKilled: 0,
    upgrades: { ...DEFAULT_PLAYER_STATS },
    soundEnabled: true,
  };
}

export function saveGameData(data: PlayerSaveData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save data', err);
  }
}

// Generate static city layout obstacles (buildings, broken cars, barricades, trees, streetlamps)
export function generateCityObstacles(): Obstacle[] {
  const obstacles: Obstacle[] = [];

  // Corner and perimeter buildings
  const buildings = [
    { x: 100, y: 100, width: 380, height: 260, color: '#181b22', detailColor: '#2b313d' },
    { x: 550, y: 100, width: 440, height: 260, color: '#161920', detailColor: '#242a36' },
    { x: 1800, y: 100, width: 420, height: 260, color: '#1b1e28', detailColor: '#2e3544' },
    { x: 2300, y: 100, width: 400, height: 320, color: '#161920', detailColor: '#252a36' },

    { x: 100, y: 800, width: 320, height: 480, color: '#1a1e27', detailColor: '#2d3443' },
    { x: 100, y: 1500, width: 340, height: 460, color: '#171a23', detailColor: '#282f3d' },

    { x: 2360, y: 800, width: 340, height: 500, color: '#161922', detailColor: '#262d3a' },
    { x: 2360, y: 1500, width: 340, height: 500, color: '#1a1f29', detailColor: '#2a3342' },

    { x: 120, y: 2100, width: 500, height: 220, color: '#181c25', detailColor: '#272f3e' },
    { x: 800, y: 2100, width: 500, height: 220, color: '#161922', detailColor: '#252b38' },
    { x: 1600, y: 2100, width: 550, height: 220, color: '#191d27', detailColor: '#2a3242' },

    // Central abandoned plaza blocks
    { x: 700, y: 650, width: 280, height: 220, color: '#191c25', detailColor: '#2e3543' },
    { x: 1800, y: 650, width: 280, height: 220, color: '#181b24', detailColor: '#2c3341' },
    { x: 700, y: 1450, width: 280, height: 220, color: '#191d26', detailColor: '#2c3340' },
    { x: 1800, y: 1450, width: 280, height: 220, color: '#171a22', detailColor: '#292f3b' },
  ];

  buildings.forEach((b) => {
    obstacles.push({
      ...b,
      type: 'building',
    });
  });

  // Broken cars on streets
  const cars = [
    { x: 1100, y: 450, width: 84, height: 46, color: '#4a2828', detailColor: '#6a3636' },
    { x: 1600, y: 480, width: 90, height: 48, color: '#2a3b4c', detailColor: '#3d556e' },
    { x: 1300, y: 920, width: 86, height: 46, color: '#383e42', detailColor: '#4f575c' },
    { x: 1550, y: 1150, width: 48, height: 92, color: '#543b25', detailColor: '#7a5535' },
    { x: 1150, y: 1550, width: 92, height: 48, color: '#2b4438', detailColor: '#3c6250' },
    { x: 1500, y: 1750, width: 88, height: 46, color: '#4c2e3d', detailColor: '#6c4156' },
    { x: 2150, y: 1100, width: 48, height: 88, color: '#3f382a', detailColor: '#5c523d' },
    { x: 550, y: 1200, width: 48, height: 86, color: '#2b3345', detailColor: '#3f4b66' },
  ];

  cars.forEach((c) => {
    obstacles.push({
      ...c,
      type: 'car',
    });
  });

  // Barricades
  const barricades = [
    { x: 1250, y: 700, width: 90, height: 24, color: '#5a4628', detailColor: '#8a6a3b' },
    { x: 1460, y: 700, width: 90, height: 24, color: '#5a4628', detailColor: '#8a6a3b' },
    { x: 1250, y: 1350, width: 90, height: 24, color: '#5a4628', detailColor: '#8a6a3b' },
    { x: 1460, y: 1350, width: 90, height: 24, color: '#5a4628', detailColor: '#8a6a3b' },
    { x: 1000, y: 1100, width: 24, height: 80, color: '#4a3820', detailColor: '#705430' },
    { x: 1750, y: 1100, width: 24, height: 80, color: '#4a3820', detailColor: '#705430' },
  ];

  barricades.forEach((bar) => {
    obstacles.push({
      ...bar,
      type: 'barricade',
    });
  });

  // Streetlamps that illuminate pools of ground
  const streetlamps = [
    { x: 500, y: 450 },
    { x: 1100, y: 350 },
    { x: 1700, y: 350 },
    { x: 2200, y: 450 },

    { x: 550, y: 1000 },
    { x: 1200, y: 950 },
    { x: 1600, y: 950 },
    { x: 2250, y: 1000 },

    { x: 550, y: 1650 },
    { x: 1200, y: 1700 },
    { x: 1600, y: 1700 },
    { x: 2250, y: 1650 },

    // Plaza lighting placed safely outside the player spawn zone
    { x: 1280, y: 950 },
    { x: 1520, y: 1150 },
  ];

  streetlamps.forEach((lamp) => {
    obstacles.push({
      x: lamp.x,
      y: lamp.y,
      width: 14,
      height: 14,
      type: 'streetlamp',
      color: '#e2d9b5',
      hasLight: true,
    });
  });

  return obstacles;
}
