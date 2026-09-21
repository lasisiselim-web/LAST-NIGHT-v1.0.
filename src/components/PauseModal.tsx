import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Zap } from 'lucide-react';
import { sound } from '../utils/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenUpgrades: () => void;
  onMainMenu: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenUpgrades,
  onMainMenu,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-30 select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-3xl font-black text-zinc-100 tracking-wide mb-1">
          GAME PAUSED
        </h2>
        <p className="text-xs text-zinc-400 font-semibold tracking-wider uppercase mb-6">
          Take a breath, survivor
        </p>

        <div className="w-full flex flex-col gap-2.5">
          <button
            id="pause-resume-btn"
            onClick={() => {
              sound.playButtonClick();
              onResume();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 text-white font-bold text-base tracking-wider uppercase shadow-lg shadow-red-950/60 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>RESUME</span>
          </button>

          <button
            id="pause-upgrades-btn"
            onClick={() => {
              sound.playButtonClick();
              onOpenUpgrades();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 font-bold text-sm tracking-wide border border-zinc-800 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>UPGRADES SHOP</span>
          </button>

          <button
            id="pause-restart-btn"
            onClick={() => {
              sound.playButtonClick();
              onRestart();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm tracking-wide border border-zinc-800 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART GAME</span>
          </button>

          <button
            id="pause-audio-btn"
            onClick={() => {
              sound.playButtonClick();
              onToggleSound();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm tracking-wide border border-zinc-800 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>AUDIO: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-zinc-500" />
                <span>AUDIO: MUTED</span>
              </>
            )}
          </button>

          <button
            id="pause-menu-btn"
            onClick={() => {
              sound.playButtonClick();
              onMainMenu();
            }}
            className="w-full py-2.5 px-6 rounded-2xl bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-medium text-xs tracking-wide transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>QUIT TO MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
