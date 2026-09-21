import React from 'react';
import { X, Keyboard, Smartphone, Skull, ShieldAlert, Award } from 'lucide-react';
import { sound } from '../utils/audio';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-30 select-none overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">Field Manual</span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100">HOW TO SURVIVE</h2>
          </div>

          <button
            id="close-howtoplay-btn"
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs / Sections */}
        <div className="overflow-y-auto my-4 space-y-5 pr-1 text-sm">
          {/* Controls section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Desktop Controls */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-zinc-200 font-bold mb-2.5">
                <Keyboard className="w-4 h-4 text-amber-400" />
                <span>DESKTOP CONTROLS</span>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                <li className="flex justify-between border-b border-zinc-800/60 pb-1">
                  <span className="text-zinc-400">Move Survivor:</span>
                  <span className="font-mono font-bold text-amber-400">W, A, S, D / Arrows</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/60 pb-1">
                  <span className="text-zinc-400">Aim Weapon:</span>
                  <span className="font-mono font-bold text-amber-400">Mouse Cursor</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/60 pb-1">
                  <span className="text-zinc-400">Fire Bullets:</span>
                  <span className="font-mono font-bold text-amber-400">Left Click (Hold)</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/60 pb-1">
                  <span className="text-zinc-400">Reload Magazine:</span>
                  <span className="font-mono font-bold text-amber-400">R Key</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-400">Pause Game:</span>
                  <span className="font-mono font-bold text-amber-400">ESC Key</span>
                </li>
              </ul>
            </div>

            {/* Mobile Controls */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-zinc-200 font-bold mb-2.5">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <span>MOBILE PHONE TOUCH</span>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                <li className="flex justify-between border-b border-zinc-800/60 pb-1">
                  <span className="text-zinc-400">Movement:</span>
                  <span className="font-semibold text-sky-400">Left Virtual Stick</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/60 pb-1">
                  <span className="text-zinc-400">Aim & Shoot:</span>
                  <span className="font-semibold text-sky-400">Right Red Stick</span>
                </li>
                <li className="flex justify-between border-b border-zinc-800/60 pb-1">
                  <span className="text-zinc-400">Reload Ammo:</span>
                  <span className="font-semibold text-sky-400">Tap [Reload] Icon</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-zinc-400">Pause / Audio:</span>
                  <span className="font-semibold text-sky-400">Top Right Corner Buttons</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Zombie Intel */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-zinc-200 font-bold mb-3">
              <Skull className="w-4 h-4 text-red-500" />
              <span>ZOMBIE THREAT CLASSIFICATION</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-lime-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-zinc-100">Walker</h4>
                  <p className="text-zinc-400">Standard infected. Slow-moving, low health, swarm danger.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-red-400">Runner</h4>
                  <p className="text-zinc-400">Fierce and rapid sprint speed. Eliminate these first!</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-blue-900 border border-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-blue-300">Tank</h4>
                  <p className="text-zinc-400">Heavy armored hulks with massive health and bone-crushing damage.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-red-900/80 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <h4 className="font-bold text-red-500">Boss (Every 5 Waves)</h4>
                  <p className="text-zinc-400">Giant mutant anomaly. Huge health pool, heavy coin bounty reward.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Survival Tips */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-zinc-200 font-bold mb-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>TACTICAL SURVIVAL TIPS</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400">
              <li>Keep moving! Getting cornered against buildings or cars means certain death.</li>
              <li>Collect the gold coins dropped by fallen zombies — coins auto-magnetize when you get close.</li>
              <li>Reload proactively during lulls before the horde closes in.</li>
              <li>Spend your coins in the Upgrades shop to permanently boost damage, health, and fire rate.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            id="gotit-howtoplay-btn"
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide transition active:scale-95 cursor-pointer"
          >
            I'M READY TO SURVIVE
          </button>
        </div>
      </div>
    </div>
  );
};
