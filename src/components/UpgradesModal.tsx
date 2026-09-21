import React from 'react';
import { X, Sword, Heart, Zap, Flame, Shield, ArrowUp, Check } from 'lucide-react';
import { PlayerStats, PlayerSaveData, UpgradeConfig } from '../types';
import { UPGRADE_DEFINITIONS, getUpgradeCost } from '../game/constants';
import { sound } from '../utils/audio';

interface UpgradesModalProps {
  saveData: PlayerSaveData;
  onUpdateSave: (newSave: PlayerSaveData) => void;
  onClose: () => void;
}

export const UpgradesModal: React.FC<UpgradesModalProps> = ({
  saveData,
  onUpdateSave,
  onClose,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sword': return <Sword className="w-5 h-5 text-red-400" />;
      case 'Heart': return <Heart className="w-5 h-5 text-emerald-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Flame': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Shield': return <Shield className="w-5 h-5 text-blue-400" />;
      default: return <Sword className="w-5 h-5" />;
    }
  };

  const handleBuyUpgrade = (upgrade: UpgradeConfig) => {
    const currentLevel = saveData.upgrades[upgrade.id];
    if (currentLevel >= upgrade.maxLevel) return;

    const cost = getUpgradeCost(upgrade, currentLevel);
    if (saveData.coins < cost) return;

    sound.playCoinPickup();

    const nextUpgrades: PlayerStats = {
      ...saveData.upgrades,
      [upgrade.id]: currentLevel + 1,
    };

    onUpdateSave({
      ...saveData,
      coins: saveData.coins - cost,
      upgrades: nextUpgrades,
    });
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-30 select-none overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Armory Depot</span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 flex items-center gap-2">
              SURVIVOR UPGRADES
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-amber-950/40 border border-amber-800/80 px-3.5 py-1.5 rounded-2xl flex items-center gap-2 shadow-inner">
              <span className="text-lg">🪙</span>
              <span className="font-mono font-black text-amber-300 text-lg">
                {saveData.coins}
              </span>
            </div>

            <button
              id="close-upgrades-btn"
              onClick={() => {
                sound.playButtonClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upgrade Cards List */}
        <div className="overflow-y-auto my-4 space-y-3 pr-1">
          {UPGRADE_DEFINITIONS.map((upg) => {
            const currentLevel = saveData.upgrades[upg.id];
            const isMax = currentLevel >= upg.maxLevel;
            const cost = getUpgradeCost(upg, currentLevel);
            const canAfford = saveData.coins >= cost && !isMax;

            return (
              <div
                key={upg.id}
                className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition"
              >
                {/* Icon & Info */}
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex-shrink-0">
                    {getIcon(upg.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-zinc-100">{upg.name}</h3>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                        Lvl {currentLevel}/{upg.maxLevel}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{upg.description}</p>
                    <div className="text-xs font-mono font-bold text-amber-300 mt-1">
                      Current: {upg.getValueFormatted(currentLevel)}
                      {!isMax && (
                        <span className="text-emerald-400 ml-2">
                          → Next: {upg.getValueFormatted(currentLevel + 1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Buy Button */}
                <div className="flex-shrink-0">
                  <button
                    id={`buy-upgrade-${upg.id}`}
                    onClick={() => handleBuyUpgrade(upg)}
                    disabled={isMax || !canAfford}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                      isMax
                        ? 'bg-zinc-800/80 text-zinc-500 border border-zinc-700/50 cursor-default'
                        : canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-950/50 active:scale-95 cursor-pointer font-black'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700/30 cursor-not-allowed'
                    }`}
                  >
                    {isMax ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>MAX LEVEL</span>
                      </>
                    ) : (
                      <>
                        <ArrowUp className="w-4 h-4" />
                        <span>UPGRADE</span>
                        <span className="font-mono ml-1">({cost} 🪙)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            id="done-upgrades-btn"
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm tracking-wide transition active:scale-95 cursor-pointer"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
