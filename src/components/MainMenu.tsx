import React from 'react';
import { Play, Zap, HelpCircle, Trophy, Skull, Disc3 } from 'lucide-react';
import { PlayerSaveData } from '../types';
import { sound } from '../utils/audio';

interface MainMenuProps {
  onPlay: () => void;
  onOpenUpgrades: () => void;
  onOpenHowToPlay: () => void;
  saveData: PlayerSaveData;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlay,
  onOpenUpgrades,
  onOpenHowToPlay,
  saveData,
}) => {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black flex flex-col items-center justify-between p-6 sm:p-10 z-20 select-none overflow-y-auto">
      {/* Background ambient lighting effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-900/15 rounded-full blur-3xl" />
      </div>

      {/* Top Trophy / High Score Badge */}
      <div className="relative z-10 flex items-center gap-4 bg-zinc-900/80 border border-zinc-800/90 px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>BEST WAVE: <span className="font-mono text-white text-base">#{saveData.bestWave}</span></span>
        </div>
        <div className="h-4 w-px bg-zinc-700" />
        <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-sm">
          <span>🪙</span>
          <span className="font-mono text-amber-300">{saveData.coins}</span>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="relative z-10 text-center my-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/60 text-red-400 text-xs font-bold tracking-widest uppercase mb-3 animate-pulse">
          <Disc3 className="w-3.5 h-3.5 animate-spin" />
          Post-Apocalyptic Survival Shooter
        </div>

        <h1
          className="text-5xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 via-red-500 to-red-800 tracking-tight drop-shadow-[0_10px_20px_rgba(220,38,38,0.4)]"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          LAST NIGHT
        </h1>

        <p className="text-sm sm:text-xl font-bold tracking-[0.3em] uppercase text-zinc-400 mt-1 mb-8">
          ZOMBIE SURVIVAL
        </p>

        {/* Action Buttons Menu */}
        <div className="flex flex-col gap-3.5 w-full max-w-xs sm:max-w-sm">
          {/* PLAY Button */}
          <button
            id="menu-play-btn"
            onClick={() => {
              sound.initCtx();
              sound.playButtonClick();
              onPlay();
            }}
            className="group relative w-full py-4 sm:py-5 px-8 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xl sm:text-2xl tracking-wider uppercase shadow-2xl shadow-red-950/80 border border-red-400/30 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>PLAY NOW</span>
          </button>

          {/* UPGRADES Button */}
          <button
            id="menu-upgrades-btn"
            onClick={() => {
              sound.playButtonClick();
              onOpenUpgrades();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold text-base sm:text-lg tracking-wide border border-zinc-700/80 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Zap className="w-5 h-5 text-amber-400" />
            <span>UPGRADES SHOP</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              🪙 {saveData.coins}
            </span>
          </button>

          {/* HOW TO PLAY Button */}
          <button
            id="menu-howtoplay-btn"
            onClick={() => {
              sound.playButtonClick();
              onOpenHowToPlay();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-zinc-950/70 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-semibold text-sm sm:text-base tracking-wide border border-zinc-800 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            <span>HOW TO PLAY</span>
          </button>
        </div>
      </div>

      {/* Footer statistics */}
      <div className="relative z-10 w-full max-w-md pt-4 border-t border-zinc-800/80 flex items-center justify-around text-zinc-400 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <Skull className="w-4 h-4 text-red-400" />
          <span>Kills: <strong className="text-zinc-200">{saveData.totalZombiesKilled}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Record: <strong className="text-zinc-200">Wave {saveData.bestWave}</strong></span>
        </div>
      </div>
    </div>
  );
};
