import {
  PlayerEntity,
  ZombieEntity,
  BulletEntity,
  ParticleEntity,
  FloatingTextEntity,
  CoinPickupEntity,
  Obstacle,
  ZombieType,
  WaveInfo,
  PlayerStats,
  PlayerSaveData,
} from '../types';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  calculatePlayerDerivedStats,
  generateCityObstacles,
} from './constants';
import { sound } from '../utils/audio';

export interface BossStatus {
  name: string;
  health: number;
  maxHealth: number;
}

export interface GameEngineCallbacks {
  onWaveChange: (waveInfo: WaveInfo) => void;
  onCoinsChange: (coins: number) => void;
  onPlayerStatsChange: (health: number, maxHealth: number, ammo: number, maxAmmo: number, isReloading: boolean, reloadProgress: number) => void;
  onGameOver: (stats: { wavesSurvived: number; zombiesDefeated: number; coinsEarned: number }) => void;
  onBossUpdate: (boss: BossStatus | null) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameEngineCallbacks;

  // Running state
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  private lastTime: number = 0;
  private animFrameId: number | null = null;

  // Entities
  public player!: PlayerEntity;
  public zombies: ZombieEntity[] = [];
  public bullets: BulletEntity[] = [];
  public particles: ParticleEntity[] = [];
  public floatingTexts: FloatingTextEntity[] = [];
  public coins: CoinPickupEntity[] = [];
  public obstacles: Obstacle[] = [];

  // Wave info
  public waveInfo: WaveInfo = {
    wave: 1,
    totalZombiesInWave: 5,
    zombiesRemainingToSpawn: 5,
    zombiesAlive: 0,
    state: 'COUNTDOWN',
    countdownTimer: 3,
    isBossWave: false,
  };

  // Stats for this run
  public sessionCoinsEarned: number = 0;
  public sessionKills: number = 0;
  public totalCoins: number = 0;

  // Camera & Screen Shake
  public cameraX: number = 0;
  public cameraY: number = 0;
  private shakeTime: number = 0;
  private shakeIntensity: number = 0;

  // Inputs
  public keys: { [key: string]: boolean } = {};
  public mousePos: { x: number; y: number } = { x: 0, y: 0 };
  public isMouseDown: boolean = false;
  public mobileMoveVector: { x: number; y: number } = { x: 0, y: 0 };
  public mobileAimVector: { x: number; y: number } = { x: 0, y: 0 };
  public isMobileFiring: boolean = false;

  private nextEntityId: number = 1;
  private zombieSpawnTimer: number = 0;
  private muzzleFlashTimer: number = 0;
  private currentBoss: ZombieEntity | null = null;
  private bossSpawnedThisWave: boolean = false;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks, initialSave: PlayerSaveData) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Cannot get 2d context');
    this.ctx = context;
    this.callbacks = callbacks;
    this.totalCoins = initialSave.coins;

    this.obstacles = generateCityObstacles();
    this.initPlayer(initialSave);
  }

  public initPlayer(saveData: PlayerSaveData) {
    const derived = calculatePlayerDerivedStats(saveData.upgrades);
    this.player = {
      x: 1400,
      y: 1050,
      radius: 18,
      vx: 0,
      vy: 0,
      speed: derived.speed,
      health: derived.maxHealth,
      maxHealth: derived.maxHealth,
      angle: 0,
      ammo: derived.maxAmmo,
      maxAmmo: derived.maxAmmo,
      isReloading: false,
      reloadProgress: 0,
      reloadDuration: 1200,
      invulnerableTimer: 0,
      fireCooldown: 0,
      baseFireInterval: derived.fireInterval,
      bulletDamage: derived.bulletDamage,
    };
  }

  public applyUpgrades(upgrades: PlayerStats) {
    const derived = calculatePlayerDerivedStats(upgrades);
    const healthDiff = derived.maxHealth - this.player.maxHealth;
    this.player.maxHealth = derived.maxHealth;
    if (healthDiff > 0) {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + healthDiff);
    }
    this.player.speed = derived.speed;
    this.player.baseFireInterval = derived.fireInterval;
    const ammoDiff = derived.maxAmmo - this.player.maxAmmo;
    this.player.maxAmmo = derived.maxAmmo;
    if (ammoDiff > 0) {
      this.player.ammo += ammoDiff;
    }
    this.player.bulletDamage = derived.bulletDamage;
    this.notifyPlayerStats();
  }

  public start(saveData: PlayerSaveData) {
    this.initPlayer(saveData);
    this.totalCoins = saveData.coins;
    this.sessionCoinsEarned = 0;
    this.sessionKills = 0;
    this.zombies = [];
    this.bullets = [];
    this.particles = [];
    this.floatingTexts = [];
    this.coins = [];
    this.currentBoss = null;
    this.bossSpawnedThisWave = false;

    this.waveInfo = {
      wave: 1,
      totalZombiesInWave: 5,
      zombiesRemainingToSpawn: 5,
      zombiesAlive: 0,
      state: 'COUNTDOWN',
      countdownTimer: 2.5,
      isBossWave: false,
    };

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();

    this.callbacks.onWaveChange({ ...this.waveInfo });
    this.callbacks.onCoinsChange(this.totalCoins);
    this.notifyPlayerStats();
    this.callbacks.onBossUpdate(null);

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.loop(performance.now());
  }

  public pause() {
    this.isPaused = true;
    this.keys = {};
    this.isMouseDown = false;
    this.isMobileFiring = false;
  }

  public resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now();
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public triggerReload() {
    if (this.player.isReloading || this.player.ammo >= this.player.maxAmmo) return;
    this.player.isReloading = true;
    this.player.reloadProgress = 0;
    sound.playReload();
    this.addFloatingText(this.player.x, this.player.y - 30, 'RELOADING...', '#f59e0b', 14);
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.updatePlayer(dt);
    this.updateZombies(dt);
    this.updateBullets(dt);
    this.updateCoins(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateWave(dt);
    this.updateCamera(dt);

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
    }
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
    }
  }

  private updatePlayer(dt: number) {
    const p = this.player;

    // Movement calculation from keyboard or mobile virtual joystick
    let moveX = 0;
    let moveY = 0;

    if (
      this.keys['KeyW'] ||
      this.keys['Keyw'] ||
      this.keys['w'] ||
      this.keys['W'] ||
      this.keys['ArrowUp'] ||
      this.keys['Up']
    ) {
      moveY -= 1;
    }
    if (
      this.keys['KeyS'] ||
      this.keys['Keys'] ||
      this.keys['s'] ||
      this.keys['S'] ||
      this.keys['ArrowDown'] ||
      this.keys['Down']
    ) {
      moveY += 1;
    }
    if (
      this.keys['KeyA'] ||
      this.keys['Keya'] ||
      this.keys['a'] ||
      this.keys['A'] ||
      this.keys['ArrowLeft'] ||
      this.keys['Left']
    ) {
      moveX -= 1;
    }
    if (
      this.keys['KeyD'] ||
      this.keys['Keyd'] ||
      this.keys['d'] ||
      this.keys['D'] ||
      this.keys['ArrowRight'] ||
      this.keys['Right']
    ) {
      moveX += 1;
    }

    // Mobile joystick overrides/adds
    if (Math.hypot(this.mobileMoveVector.x, this.mobileMoveVector.y) > 0.05) {
      moveX = this.mobileMoveVector.x;
      moveY = this.mobileMoveVector.y;
    }

    const moveMag = Math.hypot(moveX, moveY);
    if (moveMag > 0.05) {
      const normX = moveX / (moveMag > 1 ? moveMag : 1);
      const normY = moveY / (moveMag > 1 ? moveMag : 1);
      p.vx = normX * p.speed;
      p.vy = normY * p.speed;
    } else {
      p.vx = 0;
      p.vy = 0;
    }

    // Attempt movement with obstacle sliding and fail-safe unstuck handling
    const nextX = p.x + p.vx * dt;
    const nextY = p.y + p.vy * dt;

    if (!this.checkObstacleCollision(nextX, p.y, p.radius)) {
      p.x = Math.max(p.radius + 20, Math.min(MAP_WIDTH - p.radius - 20, nextX));
    } else if (this.checkObstacleCollision(p.x, p.y, p.radius)) {
      // If already inside an obstacle, allow movement away to escape
      p.x = Math.max(p.radius + 20, Math.min(MAP_WIDTH - p.radius - 20, nextX));
    }

    if (!this.checkObstacleCollision(p.x, nextY, p.radius)) {
      p.y = Math.max(p.radius + 20, Math.min(MAP_HEIGHT - p.radius - 20, nextY));
    } else if (this.checkObstacleCollision(p.x, p.y, p.radius)) {
      // If already inside an obstacle, allow movement away to escape
      p.y = Math.max(p.radius + 20, Math.min(MAP_HEIGHT - p.radius - 20, nextY));
    }

    // Aiming calculation
    if (Math.hypot(this.mobileAimVector.x, this.mobileAimVector.y) > 0.25) {
      p.angle = Math.atan2(this.mobileAimVector.y, this.mobileAimVector.x);
    } else {
      // Desktop mouse aiming in world coordinates
      const worldMouseX = this.mousePos.x + this.cameraX;
      const worldMouseY = this.mousePos.y + this.cameraY;
      p.angle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);
    }

    // Firing cooldown
    if (p.fireCooldown > 0) {
      p.fireCooldown -= dt * 1000;
    }

    // Reloading
    if (p.isReloading) {
      p.reloadProgress += (dt * 1000) / p.reloadDuration;
      if (p.reloadProgress >= 1) {
        p.isReloading = false;
        p.reloadProgress = 0;
        p.ammo = p.maxAmmo;
      }
      this.notifyPlayerStats();
    }

    // Invulnerability
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer -= dt;
    }

    // Auto-fire / manual fire check
    const wantsToShoot = this.isMouseDown || this.isMobileFiring;
    if (wantsToShoot && p.fireCooldown <= 0) {
      this.shoot();
    }
  }

  private shoot() {
    const p = this.player;
    if (p.isReloading) return;

    if (p.ammo <= 0) {
      p.ammo = 0;
      sound.playEmptyGun();
      this.triggerReload();
      p.fireCooldown = 350;
      return;
    }

    p.ammo = Math.max(0, p.ammo - 1);
    p.fireCooldown = p.baseFireInterval;
    this.muzzleFlashTimer = 0.06;
    this.triggerScreenShake(3, 0.08);

    sound.playShoot();

    // Spawn bullet slightly in front of gun barrel
    const gunOffsetDist = 24;
    const gunOffsetAngle = p.angle + 0.25; // slightly to right hand
    const startX = p.x + Math.cos(gunOffsetAngle) * gunOffsetDist;
    const startY = p.y + Math.sin(gunOffsetAngle) * gunOffsetDist;

    // Slight bullet spread
    const spread = (Math.random() - 0.5) * 0.08;
    const finalAngle = p.angle + spread;
    const bulletSpeed = 950;

    this.bullets.push({
      id: this.nextEntityId++,
      x: startX,
      y: startY,
      vx: Math.cos(finalAngle) * bulletSpeed,
      vy: Math.sin(finalAngle) * bulletSpeed,
      radius: 4,
      damage: p.bulletDamage,
      distanceTraveled: 0,
      maxDistance: 900,
    });

    // Muzzle sparks and shell casing
    for (let i = 0; i < 4; i++) {
      const sparkAngle = finalAngle + (Math.random() - 0.5) * 0.5;
      const sparkSpd = 100 + Math.random() * 200;
      this.particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(sparkAngle) * sparkSpd,
        vy: Math.sin(sparkAngle) * sparkSpd,
        size: 2 + Math.random() * 2,
        color: '#fef08a',
        alpha: 1,
        decay: 12,
      });
    }

    // Shell casing flying out
    const casingAngle = p.angle + Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    this.particles.push({
      x: startX - Math.cos(p.angle) * 8,
      y: startY - Math.sin(p.angle) * 8,
      vx: Math.cos(casingAngle) * (60 + Math.random() * 50),
      vy: Math.sin(casingAngle) * (60 + Math.random() * 50),
      size: 3,
      color: '#eab308',
      alpha: 1,
      decay: 2.5,
      shape: 'line',
      rotation: Math.random() * Math.PI * 2,
    });

    this.notifyPlayerStats();

    // Auto reload if emptied
    if (p.ammo === 0) {
      this.triggerReload();
    }
  }

  private updateZombies(dt: number) {
    const p = this.player;

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];

      if (z.hitFlashTimer > 0) {
        z.hitFlashTimer -= dt;
      }
      if (z.attackCooldown > 0) {
        z.attackCooldown -= dt;
      }

      // Track distance to player
      const dx = p.x - z.x;
      const dy = p.y - z.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0) {
        z.angle = Math.atan2(dy, dx);
      }

      // Flocking separation from other nearby zombies to avoid clustering
      let sepX = 0;
      let sepY = 0;
      for (let j = 0; j < this.zombies.length; j++) {
        if (i === j) continue;
        const other = this.zombies[j];
        const odx = z.x - other.x;
        const ody = z.y - other.y;
        const odist = Math.hypot(odx, ody);
        const minDist = z.radius + other.radius;
        if (odist < minDist && odist > 0) {
          sepX += (odx / odist) * (minDist - odist) * 2;
          sepY += (ody / odist) * (minDist - odist) * 2;
        }
      }

      // Move toward player + separation
      const dirX = dist > 0 ? (dx / dist) * z.speed : 0;
      const dirY = dist > 0 ? (dy / dist) * z.speed : 0;

      const targetVx = dirX + sepX * 12;
      const targetVy = dirY + sepY * 12;

      const nX = z.x + targetVx * dt;
      const nY = z.y + targetVy * dt;

      // Obstacle avoidance for zombies
      if (!this.checkObstacleCollision(nX, z.y, z.radius)) {
        z.x = nX;
      }
      if (!this.checkObstacleCollision(z.x, nY, z.radius)) {
        z.y = nY;
      }

      // Keep zombies inside map borders
      z.x = Math.max(z.radius + 15, Math.min(MAP_WIDTH - z.radius - 15, z.x));
      z.y = Math.max(z.radius + 15, Math.min(MAP_HEIGHT - z.radius - 15, z.y));

      // Zombie walking leg oscillation
      z.animLegOffset += dt * (z.speed / 15);

      // Attack player if within touch distance
      const touchDist = z.radius + p.radius;
      if (dist <= touchDist && z.attackCooldown <= 0) {
        this.damagePlayer(z.damage);
        z.attackCooldown = 0.9;
      }
    }
  }

  private damagePlayer(amount: number) {
    const p = this.player;
    if (p.invulnerableTimer > 0) return;

    p.health = Math.max(0, p.health - amount);
    p.invulnerableTimer = 0.7; // 700ms grace period
    this.triggerScreenShake(9, 0.25);
    sound.playPlayerHurt();

    this.addFloatingText(p.x, p.y - 25, `-${Math.round(amount)}`, '#ef4444', 20);

    // Blood splatter from player
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 100;
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 3,
        color: '#dc2626',
        alpha: 0.9,
        decay: 3.5,
      });
    }

    this.notifyPlayerStats();

    if (p.health <= 0) {
      this.handleGameOver();
    }
  }

  private updateBullets(dt: number) {
    for (let bIndex = this.bullets.length - 1; bIndex >= 0; bIndex--) {
      const b = this.bullets[bIndex];

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.distanceTraveled += Math.hypot(b.vx * dt, b.vy * dt);

      // Check max range
      if (b.distanceTraveled >= b.maxDistance) {
        this.bullets.splice(bIndex, 1);
        continue;
      }

      // Check obstacle collision
      if (this.checkObstacleCollision(b.x, b.y, b.radius)) {
        // Wall sparks
        for (let i = 0; i < 3; i++) {
          this.particles.push({
            x: b.x,
            y: b.y,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            size: 2,
            color: '#facc15',
            alpha: 1,
            decay: 10,
          });
        }
        this.bullets.splice(bIndex, 1);
        continue;
      }

      // Check zombie collision
      let hitZombie = false;
      for (let zIndex = this.zombies.length - 1; zIndex >= 0; zIndex--) {
        const z = this.zombies[zIndex];
        const dist = Math.hypot(b.x - z.x, b.y - z.y);

        if (dist <= z.radius + b.radius) {
          hitZombie = true;
          this.damageZombie(zIndex, b.damage, b.vx, b.vy);
          this.bullets.splice(bIndex, 1);
          break;
        }
      }

      if (hitZombie) continue;
    }
  }

  private damageZombie(zIndex: number, damage: number, bulletVx: number, bulletVy: number) {
    const z = this.zombies[zIndex];
    if (!z) return;

    z.health -= damage;
    z.hitFlashTimer = 0.12;

    // Knockback
    const bSpeed = Math.hypot(bulletVx, bulletVy) || 1;
    const knockback = z.type === 'boss' ? 8 : z.type === 'tank' ? 18 : 45;
    z.x += (bulletVx / bSpeed) * knockback;
    z.y += (bulletVy / bSpeed) * knockback;

    sound.playZombieHit();

    // Blood particles on hit
    for (let i = 0; i < 5; i++) {
      const pAngle = Math.atan2(bulletVy, bulletVx) + (Math.random() - 0.5) * 1.2;
      const pSpeed = 30 + Math.random() * 90;
      this.particles.push({
        x: z.x,
        y: z.y,
        vx: Math.cos(pAngle) * pSpeed,
        vy: Math.sin(pAngle) * pSpeed,
        size: 3 + Math.random() * 3,
        color: z.type === 'runner' ? '#991b1b' : '#3f6212',
        alpha: 0.9,
        decay: 4.5,
      });
    }

    this.addFloatingText(z.x, z.y - 15, `-${Math.round(damage)}`, '#ffffff', 14);

    if (z.type === 'boss') {
      this.callbacks.onBossUpdate({
        name: 'MUTANT TITAN BOSS',
        health: Math.max(0, Math.ceil(z.health)),
        maxHealth: z.maxHealth,
      });
    }

    if (z.health <= 0) {
      this.killZombie(zIndex);
    }
  }

  private killZombie(zIndex: number) {
    const z = this.zombies[zIndex];
    if (!z) return;

    sound.playZombieDeath();
    this.sessionKills++;

    // Large splatter
    const count = z.type === 'boss' ? 35 : z.type === 'tank' ? 18 : 10;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * (z.type === 'boss' ? 220 : 120);
      this.particles.push({
        x: z.x,
        y: z.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        color: z.type === 'runner' ? '#7f1d1d' : '#2d4715',
        alpha: 1,
        decay: 2.2,
      });
    }

    // Drop coins
    const coinsToDrop = z.type === 'boss' ? 12 : z.type === 'tank' ? 4 : z.type === 'runner' ? 2 : 1;
    for (let c = 0; c < coinsToDrop; c++) {
      const spread = (Math.random() - 0.5) * 40;
      this.coins.push({
        id: this.nextEntityId++,
        x: z.x + spread,
        y: z.y + (Math.random() - 0.5) * 40,
        radius: 10,
        value: z.coinValue,
        lifeTime: 25,
        sparkleTimer: 0,
      });
    }

    if (z.type === 'boss') {
      this.currentBoss = null;
      this.callbacks.onBossUpdate(null);
      this.triggerScreenShake(12, 0.4);
    }

    this.zombies.splice(zIndex, 1);
    this.waveInfo.zombiesAlive = this.zombies.length;
    this.callbacks.onWaveChange({ ...this.waveInfo });
  }

  private updateCoins(dt: number) {
    const p = this.player;
    const magnetDist = 140;

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.lifeTime -= dt;

      if (coin.lifeTime <= 0) {
        this.coins.splice(i, 1);
        continue;
      }

      const dx = p.x - coin.x;
      const dy = p.y - coin.y;
      const dist = Math.hypot(dx, dy);

      // Magnet pull toward player
      if (dist < magnetDist) {
        const pullSpeed = 380 * (1 - dist / magnetDist) + 120;
        coin.x += (dx / dist) * pullSpeed * dt;
        coin.y += (dy / dist) * pullSpeed * dt;
      }

      // Collect coin
      if (dist <= p.radius + coin.radius) {
        this.totalCoins += coin.value;
        this.sessionCoinsEarned += coin.value;
        sound.playCoinPickup();
        this.addFloatingText(coin.x, coin.y - 12, `+${coin.value} 🪙`, '#facc15', 15);
        this.callbacks.onCoinsChange(this.totalCoins);
        this.coins.splice(i, 1);
      }
    }
  }

  private updateParticles(dt: number) {
    if (this.particles.length > 200) {
      this.particles.splice(0, this.particles.length - 200);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.94;
      pt.vy *= 0.94;
      pt.alpha -= pt.decay * dt;

      if (pt.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    if (this.floatingTexts.length > 30) {
      this.floatingTexts.splice(0, this.floatingTexts.length - 30);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.duration += dt;
      ft.alpha = Math.max(0, 1 - ft.duration / ft.maxDuration);

      if (ft.duration >= ft.maxDuration) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private updateWave(dt: number) {
    const w = this.waveInfo;

    if (w.state === 'COUNTDOWN') {
      w.countdownTimer -= dt;
      if (w.countdownTimer <= 0) {
        w.state = 'IN_PROGRESS';
        this.zombieSpawnTimer = 0.5;
        this.callbacks.onWaveChange({ ...w });

        if (w.isBossWave) {
          sound.playBossAlert();
          this.triggerScreenShake(8, 0.5);
        }
      }
      return;
    }

    if (w.state === 'IN_PROGRESS') {
      // Spawn zombies
      if (w.zombiesRemainingToSpawn > 0) {
        this.zombieSpawnTimer -= dt;
        if (this.zombieSpawnTimer <= 0) {
          this.spawnNextWaveZombie();
          w.zombiesRemainingToSpawn--;
          w.zombiesAlive = this.zombies.length;
          this.callbacks.onWaveChange({ ...w });
          // Progressive spawn pacing: faster as waves increase
          const spawnInterval = Math.max(0.45, 1.6 - w.wave * 0.08);
          this.zombieSpawnTimer = spawnInterval + Math.random() * 0.4;
        }
      }

      // Check for wave clear
      if (w.zombiesRemainingToSpawn === 0 && this.zombies.length === 0) {
        this.clearWave();
      }
    }

    if (w.state === 'CLEARED') {
      w.countdownTimer -= dt;
      if (w.countdownTimer <= 0) {
        this.advanceToNextWave();
      }
    }
  }

  private spawnNextWaveZombie() {
    const w = this.waveInfo;

    // Calculate spawn coordinates at random edge of city map, safely away from player
    let spawnX = 0;
    let spawnY = 0;
    const edge = Math.floor(Math.random() * 4);
    const padding = 60;

    switch (edge) {
      case 0: // Top
        spawnX = padding + Math.random() * (MAP_WIDTH - padding * 2);
        spawnY = padding;
        break;
      case 1: // Right
        spawnX = MAP_WIDTH - padding;
        spawnY = padding + Math.random() * (MAP_HEIGHT - padding * 2);
        break;
      case 2: // Bottom
        spawnX = padding + Math.random() * (MAP_WIDTH - padding * 2);
        spawnY = MAP_HEIGHT - padding;
        break;
      case 3: // Left
        spawnX = padding;
        spawnY = padding + Math.random() * (MAP_HEIGHT - padding * 2);
        break;
    }

    // Determine type
    let type: ZombieType = 'walker';

    if (w.isBossWave && !this.bossSpawnedThisWave) {
      type = 'boss';
      this.bossSpawnedThisWave = true;
    } else {
      const roll = Math.random();
      if (w.wave >= 4 && roll > 0.75) {
        type = 'tank';
      } else if (w.wave >= 2 && roll > 0.45) {
        type = 'runner';
      } else {
        type = 'walker';
      }
    }

    const zombie = this.createZombie(spawnX, spawnY, type, w.wave);
    this.zombies.push(zombie);

    if (type === 'boss') {
      this.currentBoss = zombie;
      this.callbacks.onBossUpdate({
        name: 'MUTANT TITAN BOSS',
        health: zombie.health,
        maxHealth: zombie.maxHealth,
      });
    }
  }

  private createZombie(x: number, y: number, type: ZombieType, wave: number): ZombieEntity {
    let health = 40 + wave * 8;
    let speed = 80 + Math.min(45, wave * 3);
    let damage = 12 + wave * 1.5;
    let radius = 17;
    let scoreValue = 10;
    let coinValue = 1;

    switch (type) {
      case 'runner':
        health = 32 + wave * 6;
        speed = 165 + Math.min(60, wave * 4);
        damage = 10 + wave * 1.2;
        radius = 15;
        scoreValue = 20;
        coinValue = 2;
        break;
      case 'tank':
        health = 180 + wave * 25;
        speed = 52 + Math.min(25, wave * 2);
        damage = 25 + wave * 2.5;
        radius = 28;
        scoreValue = 40;
        coinValue = 4;
        break;
      case 'boss':
        health = 800 + wave * 150;
        speed = 68;
        damage = 38;
        radius = 44;
        scoreValue = 200;
        coinValue = 25;
        break;
    }

    return {
      id: this.nextEntityId++,
      type,
      x,
      y,
      radius,
      health,
      maxHealth: health,
      speed,
      damage,
      angle: 0,
      attackCooldown: 0,
      hitFlashTimer: 0,
      scoreValue,
      coinValue,
      animLegOffset: Math.random() * 10,
    };
  }

  private clearWave() {
    const w = this.waveInfo;
    w.state = 'CLEARED';
    w.countdownTimer = 3.5; // intermission before next wave

    sound.playWaveCleared();

    // Wave reward coins
    const waveBonus = 25 + w.wave * 15;
    this.totalCoins += waveBonus;
    this.sessionCoinsEarned += waveBonus;
    this.callbacks.onCoinsChange(this.totalCoins);

    this.addFloatingText(this.player.x, this.player.y - 45, `WAVE CLEARED! +${waveBonus} 🪙`, '#22c55e', 22);

    this.callbacks.onWaveChange({ ...w });
  }

  private advanceToNextWave() {
    const nextWave = this.waveInfo.wave + 1;
    const isBoss = nextWave % 5 === 0;
    const count = 5 + (nextWave - 1) * 3 + (isBoss ? 5 : 0);

    this.bossSpawnedThisWave = false;
    this.currentBoss = null;

    this.waveInfo = {
      wave: nextWave,
      totalZombiesInWave: count,
      zombiesRemainingToSpawn: count,
      zombiesAlive: 0,
      state: 'COUNTDOWN',
      countdownTimer: 3.0,
      isBossWave: isBoss,
    };

    this.callbacks.onWaveChange({ ...this.waveInfo });
  }

  private handleGameOver() {
    this.isRunning = false;
    sound.playPlayerHurt();
    this.callbacks.onGameOver({
      wavesSurvived: this.waveInfo.wave,
      zombiesDefeated: this.sessionKills,
      coinsEarned: this.sessionCoinsEarned,
    });
  }

  private updateCamera(dt: number) {
    const screenW = this.canvas.width;
    const screenH = this.canvas.height;

    // Center camera on player with smooth interpolation
    const targetCamX = this.player.x - screenW / 2;
    const targetCamY = this.player.y - screenH / 2;

    const lerp = Math.min(1, dt * 6.5);
    this.cameraX += (targetCamX - this.cameraX) * lerp;
    this.cameraY += (targetCamY - this.cameraY) * lerp;

    // Clamp camera within map
    this.cameraX = Math.max(0, Math.min(MAP_WIDTH - screenW, this.cameraX));
    this.cameraY = Math.max(0, Math.min(MAP_HEIGHT - screenH, this.cameraY));
  }

  public triggerScreenShake(intensity: number, duration: number) {
    this.shakeIntensity = intensity;
    this.shakeTime = duration;
  }

  public addFloatingText(x: number, y: number, text: string, color: string, size: number) {
    this.floatingTexts.push({
      id: this.nextEntityId++,
      x,
      y,
      text,
      color,
      size,
      alpha: 1,
      duration: 0,
      maxDuration: 1.1,
      vy: -35,
    });
  }

  private checkObstacleCollision(x: number, y: number, radius: number): boolean {
    for (const obs of this.obstacles) {
      // Streetlamps are overhead light poles with ambient floor glow; they do not block movement
      if (obs.type === 'streetlamp') {
        continue;
      }

      // Axis aligned bounding box with circle
      const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.width));
      const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.height));
      const distX = x - closestX;
      const distY = y - closestY;
      if (distX * distX + distY * distY < radius * radius) {
        return true;
      }
    }
    return false;
  }

  private notifyPlayerStats() {
    this.callbacks.onPlayerStatsChange(
      this.player.health,
      this.player.maxHealth,
      this.player.ammo,
      this.player.maxAmmo,
      this.player.isReloading,
      this.player.reloadProgress
    );
  }

  // ==================== RENDERING ====================
  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    // Clear background
    ctx.fillStyle = '#090a0f';
    ctx.fillRect(0, 0, w, h);

    // Camera transform with screen shake
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (this.shakeTime > 0) {
      shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    }

    ctx.translate(-Math.round(this.cameraX + shakeOffsetX), -Math.round(this.cameraY + shakeOffsetY));

    // 1. Draw Map Ground (Roads, Sidewalks, Markings)
    this.drawCityGround(ctx);

    // 2. Draw Obstacles (Buildings, Abandoned Cars, Barricades)
    this.drawObstacles(ctx);

    // 3. Draw Coins on Ground
    this.drawCoins(ctx);

    // 4. Draw Blood & Debris Particles
    this.drawParticles(ctx);

    // 5. Draw Zombies
    this.drawZombies(ctx);

    // 6. Draw Bullets
    this.drawBullets(ctx);

    // 7. Draw Survivor Player
    this.drawPlayer(ctx);

    // 8. Draw Atmospheric Darkness with Flashlight & Streetlight Cone Masks
    this.drawAtmosphereAndLighting(ctx, w, h);

    // 9. Draw Floating Combat Numbers (Damage / Reload / Coins)
    this.drawFloatingTexts(ctx);

    ctx.restore();
  }

  private drawCityGround(ctx: CanvasRenderingContext2D) {
    // Base dark asphalt
    ctx.fillStyle = '#11141c';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Sidewalk tiles & Road dividers
    ctx.strokeStyle = '#1e2433';
    ctx.lineWidth = 2;

    // Road Grid Pattern
    const roadWidth = 240;
    const blockSpacing = 650;

    for (let x = 0; x < MAP_WIDTH; x += blockSpacing) {
      ctx.fillStyle = '#171b26';
      ctx.fillRect(x + 50, 0, roadWidth, MAP_HEIGHT);

      // Dashed yellow lane lines
      ctx.strokeStyle = '#856404';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 25]);
      ctx.beginPath();
      ctx.moveTo(x + 50 + roadWidth / 2, 0);
      ctx.lineTo(x + 50 + roadWidth / 2, MAP_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y < MAP_HEIGHT; y += blockSpacing) {
      ctx.fillStyle = '#171b26';
      ctx.fillRect(0, y + 50, MAP_WIDTH, roadWidth);

      // Dashed yellow lane lines
      ctx.strokeStyle = '#856404';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 25]);
      ctx.beginPath();
      ctx.moveTo(0, y + 50 + roadWidth / 2);
      ctx.lineTo(MAP_WIDTH, y + 50 + roadWidth / 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Manholes & road cracks
    ctx.strokeStyle = '#22283a';
    ctx.lineWidth = 4;
    ctx.strokeRect(400, 300, 40, 40);
    ctx.strokeRect(1300, 800, 40, 40);
    ctx.strokeRect(2100, 1400, 40, 40);
  }

  private drawObstacles(ctx: CanvasRenderingContext2D) {
    for (const obs of this.obstacles) {
      if (obs.type === 'building') {
        // Building shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(obs.x + 8, obs.y + 12, obs.width, obs.height);

        // Building roof
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Building inner roof bevel
        ctx.strokeStyle = obs.detailColor || '#333';
        ctx.lineWidth = 3;
        ctx.strokeRect(obs.x + 6, obs.y + 6, obs.width - 12, obs.height - 12);

        // Roof AC vents
        ctx.fillStyle = '#0f1218';
        ctx.fillRect(obs.x + 20, obs.y + 20, 40, 30);
        ctx.fillRect(obs.x + obs.width - 65, obs.y + 25, 45, 35);
      } else if (obs.type === 'car') {
        ctx.save();
        ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);

        // Car shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-obs.width / 2 + 5, -obs.height / 2 + 6, obs.width, obs.height);

        // Car body
        ctx.fillStyle = obs.color;
        ctx.beginPath();
        ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 8);
        ctx.fill();

        // Car roof/windshields
        ctx.fillStyle = '#090b10';
        ctx.beginPath();
        ctx.roundRect(-obs.width / 2 + 14, -obs.height / 2 + 6, obs.width - 28, obs.height - 12, 4);
        ctx.fill();

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(obs.width / 2 - 4, -obs.height / 2 + 4, 3, 6);
        ctx.fillRect(obs.width / 2 - 4, obs.height / 2 - 10, 3, 6);

        ctx.restore();
      } else if (obs.type === 'barricade') {
        // Wooden / metal hazard barricade
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(obs.x + 3, obs.y + 4, obs.width, obs.height);

        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Hazard stripes
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < obs.width; i += 16) {
          ctx.moveTo(obs.x + i, obs.y);
          ctx.lineTo(obs.x + i + 8, obs.y + obs.height);
        }
        ctx.stroke();
      } else if (obs.type === 'streetlamp') {
        // Base post
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Glowing bulb
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawCoins(ctx: CanvasRenderingContext2D) {
    const time = performance.now() * 0.005;
    for (const coin of this.coins) {
      const bob = Math.sin(time + coin.id) * 2;

      ctx.save();
      ctx.translate(coin.x, coin.y + bob);

      // Glow
      ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, coin.radius + 4, 0, Math.PI * 2);
      ctx.fill();

      // Coin base
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
      ctx.fill();

      // Coin rim
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Coin symbol
      ctx.fillStyle = '#713f12';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 1);

      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const pt of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, pt.alpha));
      ctx.fillStyle = pt.color;

      if (pt.shape === 'line') {
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rotation || 0);
        ctx.fillRect(-pt.size, -1, pt.size * 2, 2);
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawZombies(ctx: CanvasRenderingContext2D) {
    for (const z of this.zombies) {
      ctx.save();
      ctx.translate(z.x, z.y);
      ctx.rotate(z.angle);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 4, z.radius * 1.1, z.radius * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Zombie base color
      let skinColor = '#4d7c0f'; // walker green
      let shirtColor = '#334155';
      if (z.type === 'runner') {
        skinColor = '#b91c1c';
        shirtColor = '#7f1d1d';
      } else if (z.type === 'tank') {
        skinColor = '#1e293b';
        shirtColor = '#0f172a';
      } else if (z.type === 'boss') {
        skinColor = '#7f1d1d';
        shirtColor = '#450a0a';
      }

      // Hit flash override
      if (z.hitFlashTimer > 0) {
        skinColor = '#ffffff';
        shirtColor = '#ffffff';
      }

      // Hands reaching forward
      ctx.fillStyle = skinColor;
      const handDist = z.radius + 8;
      const armSwing = Math.sin(z.animLegOffset) * 4;
      ctx.beginPath();
      ctx.arc(handDist, -z.radius * 0.55 + armSwing, z.radius * 0.28, 0, Math.PI * 2);
      ctx.arc(handDist, z.radius * 0.55 - armSwing, z.radius * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Shoulders & Torso
      ctx.fillStyle = shirtColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, z.radius * 0.9, z.radius * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(0, 0, z.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = z.type === 'boss' ? '#fbbf24' : '#ef4444';
      ctx.beginPath();
      ctx.arc(z.radius * 0.35, -4, 2, 0, Math.PI * 2);
      ctx.arc(z.radius * 0.35, 4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Boss special aura
      if (z.type === 'boss') {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, z.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Mini Health Bar above damaged zombies
      if (z.health < z.maxHealth && z.type !== 'boss') {
        const barW = z.radius * 2;
        const barH = 4;
        const barX = z.x - barW / 2;
        const barY = z.y - z.radius - 10;
        const pct = Math.max(0, z.health / z.maxHealth);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        ctx.fillStyle = z.type === 'tank' ? '#3b82f6' : '#ef4444';
        ctx.fillRect(barX, barY, barW * pct, barH);
      }
    }
  }

  private drawBullets(ctx: CanvasRenderingContext2D) {
    for (const b of this.bullets) {
      ctx.save();

      // Bullet trail
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.5)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - (b.vx / 900) * 16, b.y - (b.vy / 900) * 16);
      ctx.stroke();

      // Bullet head
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Invulnerability flicker
    if (p.invulnerableTimer > 0 && Math.floor(performance.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 5, p.radius * 1.1, p.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(p.angle);

    // Hands & Pistol
    ctx.fillStyle = '#d4d4d8'; // hands
    ctx.beginPath();
    ctx.arc(18, 7, 4, 0, Math.PI * 2);
    ctx.fill();

    // Weapon body (Pistol barrel)
    ctx.fillStyle = '#27272a';
    ctx.fillRect(14, 5, 12, 4);

    // Muzzle Flash
    if (this.muzzleFlashTimer > 0) {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(28, 7, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(29, 7, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shoulders (Tactical vest)
    ctx.fillStyle = '#3f3f46';
    ctx.beginPath();
    ctx.ellipse(0, 0, p.radius * 0.9, p.radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head / Helmet
    ctx.fillStyle = '#71717a';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 0.52, 0, Math.PI * 2);
    ctx.fill();

    // Tactical Goggles / Visor
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(2, -4, 5, 8);

    ctx.restore();
  }

  private drawAtmosphereAndLighting(ctx: CanvasRenderingContext2D, screenW: number, screenH: number) {
    // We create a dark night overlay with transparent cutouts for:
    // 1. Streetlights (warm circular ambient pools)
    // 2. Player flashlight cone (aimed in front of the player)
    // 3. Player local glow

    ctx.save();

    // Create darkness canvas mask
    const p = this.player;

    // Viewport bounds in world coords
    const viewLeft = this.cameraX;
    const viewTop = this.cameraY;
    const viewRight = this.cameraX + screenW;
    const viewBottom = this.cameraY + screenH;

    // Build gradient darkness
    // Flashlight cone:
    const flashRadius = 380;
    const coneAngle = 0.52; // roughly 60 degrees

    const coneGrad = ctx.createRadialGradient(p.x, p.y, 20, p.x, p.y, flashRadius);
    coneGrad.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
    coneGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.08)');
    coneGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, flashRadius, p.angle - coneAngle, p.angle + coneAngle);
    ctx.closePath();
    ctx.fill();

    // Ambient light around player
    const playerGlow = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, 90);
    playerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    playerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = playerGlow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 90, 0, Math.PI * 2);
    ctx.fill();

    // Streetlamp ambient light pools
    for (const obs of this.obstacles) {
      if (obs.type === 'streetlamp' && obs.hasLight) {
        if (obs.x >= viewLeft - 180 && obs.x <= viewRight + 180 && obs.y >= viewTop - 180 && obs.y <= viewBottom + 180) {
          const lampGrad = ctx.createRadialGradient(obs.x, obs.y, 10, obs.x, obs.y, 160);
          lampGrad.addColorStop(0, 'rgba(253, 230, 138, 0.22)');
          lampGrad.addColorStop(0.7, 'rgba(253, 230, 138, 0.06)');
          lampGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = lampGrad;
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, 160, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D) {
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px 'Rajdhani', sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
