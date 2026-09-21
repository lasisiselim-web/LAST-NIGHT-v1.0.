import React from 'react';
import { Skull, Trophy, RotateCcw, Home, Zap } from 'lucide-react';
import { sound } from '../utils/audio';

interface GameOverModalProps {
  wavesSurvived: number;
  zombiesDefeated: number;
  coinsEarned: number;
  bestWave: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onOpenUpgrades: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  wavesSurvived,
  zombiesDefeated,
  coinsEarned,
  bestWave,
  isNewBest,
  onPlayAgain,
  onOpenUpgrades,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-30 select-none overflow-y-auto">
      <div className="bg-zinc-950 border border-red-900/60 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-scale-in">
        {/* Skull Icon Header */}
        <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-600 flex items-center justify-center mb-3 shadow-lg shadow-red-950/80">
          <Skull className="w-9 h-9 text-red-500 animate-pulse" />
        </div>

        <h2
          className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 via-red-500 to-red-800 tracking-tight mb-1"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          GAME OVER
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-zinc-400 tracking-widest uppercase mb-6">
          You succumbed to the horde
        </p>

        {/* Stats Grid */}
        <div className="w-full bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5 mb-6 space-y-3">
          <div className="flex justify-between items-center text-sm border-b border-zinc-800/80 pb-2">
            <span className="text-zinc-400">Wave Reached:</span>
            <span className="font-mono font-bold text-lg text-zinc-100">
              Wave {wavesSurvived}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm border-b border-zinc-800/80 pb-2">
            <span className="text-zinc-400">Zombies Defeated:</span>
            <span className="font-mono font-bold text-lg text-red-400">
              {zombiesDefeated}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm border-b border-zinc-800/80 pb-2">
            <span className="text-zinc-400">Coins Collected:</span>
            <span className="font-mono font-bold text-lg text-amber-300 flex items-center gap-1">
              +{coinsEarned} 🪙
            </span>
          </div>

          <div className="flex justify-between items-center text-sm pt-1">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              Best Wave Record:
            </span>
            <div className="flex items-center gap-1.5">
              {isNewBest && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500 text-white animate-bounce">
                  NEW!
                </span>
              )}
              <span className="font-mono font-black text-xl text-amber-400">
                Wave {bestWave}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            id="gameover-playagain-btn"
            onClick={() => {
              sound.playButtonClick();
              onPlayAgain();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-lg tracking-wider uppercase shadow-xl shadow-red-950/80 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            id="gameover-upgrades-btn"
            onClick={() => {
              sound.playButtonClick();
              onOpenUpgrades();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 font-bold text-sm tracking-wide border border-zinc-700/80 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>UPGRADE SURVIVOR</span>
          </button>

          <button
            id="gameover-menu-btn"
            onClick={() => {
              sound.playButtonClick();
              onMainMenu();
            }}
            className="w-full py-2.5 px-6 rounded-2xl bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-semibold text-xs tracking-wide transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
