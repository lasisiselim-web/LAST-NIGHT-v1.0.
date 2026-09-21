import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine, BossStatus } from './game/engine';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { MainMenu } from './components/MainMenu';
import { UpgradesModal } from './components/UpgradesModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { WaveBanner } from './components/WaveBanner';
import { GameState, WaveInfo, PlayerSaveData } from './types';
import { loadSaveData, saveGameData } from './game/constants';
import { sound } from './utils/audio';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Persistence
  const [saveData, setSaveData] = useState<PlayerSaveData>(() => loadSaveData());

  // Game UI States
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [previousStateBeforeModal, setPreviousStateBeforeModal] = useState<GameState>('MENU');

  // Runtime Stats for HUD
  const [playerHealth, setPlayerHealth] = useState<number>(100);
  const [playerMaxHealth, setPlayerMaxHealth] = useState<number>(100);
  const [ammo, setAmmo] = useState<number>(10);
  const [maxAmmo, setMaxAmmo] = useState<number>(10);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [reloadProgress, setReloadProgress] = useState<number>(0);
  const [coins, setCoins] = useState<number>(saveData.coins);
  const [activeBoss, setActiveBoss] = useState<BossStatus | null>(null);

  const [waveInfo, setWaveInfo] = useState<WaveInfo>({
    wave: 1,
    totalZombiesInWave: 5,
    zombiesRemainingToSpawn: 5,
    zombiesAlive: 0,
    state: 'COUNTDOWN',
    countdownTimer: 3,
    isBossWave: false,
  });

  // Game Over Run Result
  const [gameOverStats, setGameOverStats] = useState({
    wavesSurvived: 1,
    zombiesDefeated: 0,
    coinsEarned: 0,
    isNewBest: false,
  });

  // Detect touch device
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024;
  });

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024
      );
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    window.addEventListener('touchstart', () => setIsTouchDevice(true), { once: true });
    sound.setSoundEnabled(saveData.soundEnabled);

    return () => window.removeEventListener('resize', checkTouch);
  }, [saveData.soundEnabled]);

  // Update Save and persist to storage
  const handleUpdateSave = useCallback((newSave: PlayerSaveData) => {
    setSaveData(newSave);
    setCoins(newSave.coins);
    saveGameData(newSave);
    sound.setSoundEnabled(newSave.soundEnabled);

    // If engine is initialized, apply upgrades without resetting player position
    if (engineRef.current) {
      engineRef.current.applyUpgrades(newSave.upgrades);
      engineRef.current.totalCoins = newSave.coins;
    }
  }, []);

  // Initialize Canvas Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const engine = new GameEngine(
      canvas,
      {
        onWaveChange: (w) => setWaveInfo(w),
        onCoinsChange: (c) => {
          setCoins(c);
          setSaveData((prev) => {
            const updated = { ...prev, coins: c };
            saveGameData(updated);
            return updated;
          });
        },
        onPlayerStatsChange: (h, mh, am, mam, rel, prog) => {
          setPlayerHealth(h);
          setPlayerMaxHealth(mh);
          setAmmo(am);
          setMaxAmmo(mam);
          setIsReloading(rel);
          setReloadProgress(prog);
        },
        onGameOver: (stats) => {
          setGameState('GAME_OVER');
          setSaveData((prev) => {
            const isNew = stats.wavesSurvived > prev.bestWave;
            const updated: PlayerSaveData = {
              ...prev,
              bestWave: Math.max(prev.bestWave, stats.wavesSurvived),
              totalZombiesKilled: prev.totalZombiesKilled + stats.zombiesDefeated,
              coins: prev.coins, // already accumulated
            };
            saveGameData(updated);
            setGameOverStats({
              ...stats,
              isNewBest: isNew,
            });
            return updated;
          });
        },
        onBossUpdate: (boss) => {
          setActiveBoss(boss);
        },
      },
      saveData
    );

    engineRef.current = engine;

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      engine.stop();
    };
  }, []); // Run once on mount

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
       const engine = engineRef.current;
      if (!engine) return;

      if (e.key === 'r' || e.key === 'R' || e.code === 'KeyR') {
        engine.triggerReload();
        return;
      }

      if (e.code === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'PLAYING') {
          engine.pause();
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          engine.resume();
          setGameState('PLAYING');
        }
        return;
      }

      if (e.code) engine.keys[e.code] = true;
      if (e.key) {
        engine.keys[e.key] = true;
        engine.keys[e.key.toLowerCase()] = true;
        engine.keys[e.key.toUpperCase()] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;
      if (e.code) engine.keys[e.code] = false;
      if (e.key) {
        engine.keys[e.key] = false;
        engine.keys[e.key.toLowerCase()] = false;
        engine.keys[e.key.toUpperCase()] = false;
      }
    };

    const handleBlur = () => {
      if (engineRef.current) engineRef.current.keys = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState]);

  // Global mouse release safety
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (engineRef.current) {
        engineRef.current.isMouseDown = false;
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Mouse aim and shoot for desktop
  const handleMouseMove = (e: React.MouseEvent) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.mousePos = { x: e.clientX, y: e.clientY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const engine = engineRef.current;
    if (!engine || gameState !== 'PLAYING') return;
    engine.isMouseDown = true;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const engine = engineRef.current;
    if (!engine) return;
    engine.isMouseDown = false;
  };

  // Game Control Actions
  const startGame = () => {
    sound.initCtx();
    const engine = engineRef.current;
    if (!engine) return;
    setGameState('PLAYING');
    engine.start(saveData);
  };

  const pauseGame = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.pause();
    setGameState('PAUSED');
  };

  const resumeGame = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.resume();
    setGameState('PLAYING');
  };

  const restartGame = () => {
    sound.initCtx();
    const engine = engineRef.current;
    if (!engine) return;
    setGameState('PLAYING');
    engine.start(saveData);
  };

  const returnToMainMenu = () => {
    const engine = engineRef.current;
    if (engine) engine.stop();
    setGameState('MENU');
  };

  const openUpgrades = () => {
    setPreviousStateBeforeModal(gameState);
    if (gameState === 'PLAYING' && engineRef.current) {
      engineRef.current.pause();
    }
    setGameState('UPGRADES');
  };

  const closeUpgrades = () => {
    if (previousStateBeforeModal === 'PLAYING') {
      if (engineRef.current) engineRef.current.resume();
      setGameState('PLAYING');
    } else if (previousStateBeforeModal === 'PAUSED') {
      setGameState('PAUSED');
    } else if (previousStateBeforeModal === 'GAME_OVER') {
      setGameState('GAME_OVER');
    } else {
      setGameState('MENU');
    }
  };

  const openHowToPlay = () => {
    setPreviousStateBeforeModal(gameState);
    setGameState('HOW_TO_PLAY');
  };

  const closeHowToPlay = () => {
    setGameState(previousStateBeforeModal === 'PAUSED' ? 'PAUSED' : 'MENU');
  };

  const toggleSound = () => {
    const nextVal = !saveData.soundEnabled;
    handleUpdateSave({ ...saveData, soundEnabled: nextVal });
  };

  const triggerReload = () => {
    const engine = engineRef.current;
    if (engine) engine.triggerReload();
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-black select-none"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Primary HTML5 Canvas */}
      <canvas
        id="game-canvas"
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair touch-none"
      />

      {/* Main Menu Screen */}
      {gameState === 'MENU' && (
        <MainMenu
          onPlay={startGame}
          onOpenUpgrades={openUpgrades}
          onOpenHowToPlay={openHowToPlay}
          saveData={saveData}
        />
      )}

      {/* Active In-Game Heads Up Display (HUD) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <>
          <HUD
            health={playerHealth}
            maxHealth={playerMaxHealth}
            ammo={ammo}
            maxAmmo={maxAmmo}
            isReloading={isReloading}
            reloadProgress={reloadProgress}
            coins={coins}
            waveInfo={waveInfo}
            boss={activeBoss}
            soundEnabled={saveData.soundEnabled}
            onToggleSound={toggleSound}
            onPause={pauseGame}
            onReload={triggerReload}
          />

          {/* Wave Transition & Cleared Banners */}
          <WaveBanner
            waveInfo={waveInfo}
            onOpenUpgrades={waveInfo.state === 'CLEARED' ? openUpgrades : undefined}
          />

          {/* Virtual Mobile Dual-Stick Controls */}
          {isTouchDevice && (
            <MobileControls
              ammo={ammo}
              maxAmmo={maxAmmo}
              isReloading={isReloading}
              onReload={triggerReload}
              onMoveVector={(vec) => {
                if (engineRef.current) engineRef.current.mobileMoveVector = vec;
              }}
              onAimVector={(vec) => {
                if (engineRef.current) engineRef.current.mobileAimVector = vec;
              }}
              onFiringState={(firing) => {
                if (engineRef.current) engineRef.current.isMobileFiring = firing;
              }}
            />
          )}
        </>
      )}

      {/* Upgrades Modal Shop */}
      {gameState === 'UPGRADES' && (
        <UpgradesModal
          saveData={saveData}
          onUpdateSave={handleUpdateSave}
          onClose={closeUpgrades}
        />
      )}

      {/* How To Play Manual */}
      {gameState === 'HOW_TO_PLAY' && (
        <HowToPlayModal onClose={closeHowToPlay} />
      )}

      {/* Pause Screen */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={resumeGame}
          onRestart={restartGame}
          onOpenUpgrades={openUpgrades}
          onMainMenu={returnToMainMenu}
          soundEnabled={saveData.soundEnabled}
          onToggleSound={toggleSound}
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          wavesSurvived={gameOverStats.wavesSurvived}
          zombiesDefeated={gameOverStats.zombiesDefeated}
          coinsEarned={gameOverStats.coinsEarned}
          bestWave={saveData.bestWave}
          isNewBest={gameOverStats.isNewBest}
          onPlayAgain={startGame}
          onOpenUpgrades={openUpgrades}
          onMainMenu={returnToMainMenu}
        />
      )}
    </div>
  );
}
