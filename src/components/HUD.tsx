import React from 'react';
import { Heart, Disc3, ShieldAlert, Volume2, VolumeX, Pause, RefreshCw } from 'lucide-react';
import { WaveInfo, ZombieEntity } from '../types';

interface HUDProps {
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadProgress: number;
  coins: number;
  waveInfo: WaveInfo;
  boss: { name: string; health: number; maxHealth: number } | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPause: () => void;
  onReload: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  ammo,
  maxAmmo,
  isReloading,
  reloadProgress,
  coins,
  waveInfo,
  boss,
  soundEnabled,
  onToggleSound,
  onPause,
  onReload,
}) => {
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const isHealthLow = healthPercent <= 25;

  return (
    <div className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between select-none">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Health & Status */}
        <div className="flex flex-col gap-1 pointer-events-auto bg-zinc-950/80 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-zinc-800/80 shadow-xl min-w-[170px] sm:min-w-[220px]">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-zinc-300">
            <span className="flex items-center gap-1.5 text-red-400">
              <Heart className={`w-4 h-4 fill-red-500 text-red-500 ${isHealthLow ? 'animate-pulse' : ''}`} />
              SURVIVOR
            </span>
            <span className="font-mono text-zinc-200">
              {Math.ceil(health)} / {maxHealth}
            </span>
          </div>

          {/* Health Bar Track */}
          <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800 relative">
            <div
              className={`h-full transition-all duration-150 rounded-full ${
                isHealthLow ? 'bg-gradient-to-r from-red-600 to-red-500 animate-pulse' : 'bg-gradient-to-r from-red-600 to-emerald-500'
              }`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
        </div>

        {/* Center: Wave & Zombies Info */}
        <div className="flex flex-col items-center pointer-events-auto">
          <div className="bg-zinc-950/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-800 shadow-xl flex items-center gap-3 sm:gap-4">
            <div className="text-center">
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-400 uppercase block">Wave</span>
              <span className="text-lg sm:text-2xl font-black text-amber-400 tracking-wider">
                #{waveInfo.wave}
              </span>
            </div>

            <div className="h-7 w-px bg-zinc-800" />

            <div className="text-center">
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-400 uppercase block">Hostiles</span>
              <span className="text-base sm:text-xl font-bold text-red-400 flex items-center gap-1">
                <Disc3 className="w-3.5 h-3.5 animate-spin text-red-500" />
                {waveInfo.zombiesRemainingToSpawn + waveInfo.zombiesAlive}
              </span>
            </div>
          </div>

          {/* Boss HP Bar if Active */}
          {boss && (
            <div className="mt-2 w-64 sm:w-80 bg-zinc-950/90 border border-red-800/80 rounded-xl p-2 shadow-2xl backdrop-blur-md animate-bounce-short">
              <div className="flex items-center justify-between text-xs text-red-400 font-bold mb-1">
                <span className="flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                  BOSS ZOMBIE
                </span>
                <span>{Math.max(0, Math.ceil(boss.health))} / {boss.maxHealth}</span>
              </div>
              <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-red-950">
                <div
                  className="bg-red-600 h-full transition-all duration-100 rounded-full"
                  style={{ width: `${Math.max(0, (boss.health / boss.maxHealth) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Coins & Settings */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-zinc-950/80 backdrop-blur-md px-3 py-2 rounded-xl border border-zinc-800 flex items-center gap-2 shadow-xl">
            <span className="text-amber-400 text-base sm:text-lg">🪙</span>
            <span className="font-mono font-bold text-sm sm:text-base text-amber-300">
              {coins}
            </span>
          </div>

          <button
            id="sound-toggle-btn"
            onClick={onToggleSound}
            aria-label="Toggle Audio"
            className="p-2.5 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-zinc-300 transition shadow-xl"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500" />}
          </button>

          <button
            id="pause-game-btn"
            onClick={onPause}
            aria-label="Pause Game"
            className="p-2.5 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-zinc-300 transition shadow-xl"
          >
            <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Center / Right Weapon Card (Desktop or Mobile) */}
      <div className="hidden sm:flex justify-end items-end w-full">
        <div className="pointer-events-auto bg-zinc-950/85 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-800/80 shadow-2xl flex items-center gap-4 min-w-[200px]">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sidearm</span>
            <span className="text-sm font-black text-zinc-100 tracking-wide">9mm TACTICAL</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-2xl font-black font-mono ${ammo <= 3 ? 'text-red-500' : 'text-zinc-100'}`}>
                {ammo}
              </span>
              <span className="text-xs text-zinc-500 font-mono">/ {maxAmmo}</span>
            </div>
          </div>

          {/* Reload Action Button */}
          <button
            id="desktop-reload-btn"
            onClick={onReload}
            disabled={isReloading || ammo >= maxAmmo}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition border ${
              isReloading
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : ammo < maxAmmo
                ? 'bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 border-zinc-700'
                : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mb-0.5 ${isReloading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isReloading ? 'RELOADING' : 'RELOAD [R]'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
