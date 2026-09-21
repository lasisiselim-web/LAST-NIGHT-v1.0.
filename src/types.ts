export type ZombieType = 'walker' | 'runner' | 'tank' | 'boss';

export interface PlayerStats {
  damageLevel: number;
  maxHealthLevel: number;
  speedLevel: number;
  fireRateLevel: number;
  magazineLevel: number;
}

export interface UpgradeConfig {
  id: keyof PlayerStats;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  icon: string;
  getValueFormatted: (level: number) => string;
}

export interface PlayerSaveData {
  coins: number;
  bestWave: number;
  totalZombiesKilled: number;
  upgrades: PlayerStats;
  soundEnabled: boolean;
}

export interface Entity {
  x: number;
  y: number;
  radius: number;
}

export interface PlayerEntity extends Entity {
  vx: number;
  vy: number;
  speed: number;
  health: number;
  maxHealth: number;
  angle: number; // in radians
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  reloadDuration: number; // in ms
  invulnerableTimer: number; // in seconds
  fireCooldown: number;
  baseFireInterval: number;
  bulletDamage: number;
}

export interface ZombieEntity extends Entity {
  id: number;
  type: ZombieType;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  angle: number;
  attackCooldown: number;
  hitFlashTimer: number;
  scoreValue: number;
  coinValue: number;
  animLegOffset: number;
}

export interface BulletEntity extends Entity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  distanceTraveled: number;
  maxDistance: number;
}

export interface ParticleEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'square' | 'line';
  rotation?: number;
}

export interface FloatingTextEntity {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  alpha: number;
  duration: number;
  maxDuration: number;
  vy: number;
}

export interface CoinPickupEntity extends Entity {
  id: number;
  value: number;
  lifeTime: number;
  sparkleTimer: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'building' | 'car' | 'barricade' | 'tree' | 'streetlamp';
  color: string;
  detailColor?: string;
  hasLight?: boolean;
}

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'UPGRADES' | 'HOW_TO_PLAY' | 'GAME_OVER';

export interface WaveInfo {
  wave: number;
  totalZombiesInWave: number;
  zombiesRemainingToSpawn: number;
  zombiesAlive: number;
  state: 'COUNTDOWN' | 'IN_PROGRESS' | 'CLEARED';
  countdownTimer: number;
  isBossWave: boolean;
}
