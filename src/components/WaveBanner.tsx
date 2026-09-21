import React from 'react';
import { WaveInfo } from '../types';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface WaveBannerProps {
  waveInfo: WaveInfo;
  onOpenUpgrades?: () => void;
}

export const WaveBanner: React.FC<WaveBannerProps> = ({ waveInfo, onOpenUpgrades }) => {
  if (waveInfo.state === 'IN_PROGRESS') return null;

  return (
    <div className="absolute top-20 sm:top-24 inset-x-0 flex justify-center pointer-events-none z-10 px-4">
      {waveInfo.state === 'COUNTDOWN' && (
        <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex flex-col items-center animate-pulse ${
          waveInfo.isBossWave
            ? 'bg-red-950/80 border-red-600 text-red-100'
            : 'bg-zinc-950/80 border-amber-500/60 text-zinc-100'
        }`}>
          {waveInfo.isBossWave ? (
            <div className="flex items-center gap-2 text-red-400 font-black text-sm tracking-widest uppercase">
              <ShieldAlert className="w-5 h-5 text-red-500 animate-bounce" />
              WARNING: BOSS MUTATION APPROACHING
            </div>
          ) : (
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              PREPARE DEFENSES
            </span>
          )}

          <div className="text-2xl sm:text-3xl font-black tracking-wide my-1">
            WAVE {waveInfo.wave}
          </div>

          <span className="text-xs font-mono text-zinc-400">
            Horde incoming in {Math.max(1, Math.ceil(waveInfo.countdownTimer))}s
          </span>
        </div>
      )}

      {waveInfo.state === 'CLEARED' && (
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/60 bg-zinc-950/90 backdrop-blur-md shadow-2xl flex flex-col items-center pointer-events-auto">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-xs sm:text-sm tracking-widest uppercase">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            SECTOR SECURED
          </div>

          <div className="text-2xl sm:text-4xl font-black text-emerald-300 tracking-tight my-1">
            WAVE {waveInfo.wave} CLEARED!
          </div>

          <p className="text-xs text-zinc-300 mb-2">
            Wave bounty added. Next wave starts in <span className="font-mono font-bold text-amber-400">{Math.ceil(waveInfo.countdownTimer)}s</span>
          </p>

          {onOpenUpgrades && (
            <button
              id="wave-cleared-upgrades-btn"
              onClick={onOpenUpgrades}
              className="px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-300 text-xs font-bold hover:bg-amber-500/30 active:scale-95 transition cursor-pointer"
            >
              UPGRADE GEAR NOW ⚡
            </button>
          )}
        </div>
      )}
    </div>
  );
};
