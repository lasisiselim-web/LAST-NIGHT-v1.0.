import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RefreshCw, Crosshair } from 'lucide-react';

interface MobileControlsProps {
  onMoveVector: (vector: { x: number; y: number }) => void;
  onAimVector: (vector: { x: number; y: number }) => void;
  onFiringState: (isFiring: boolean) => void;
  onReload: () => void;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveVector,
  onAimVector,
  onFiringState,
  onReload,
  ammo,
  maxAmmo,
  isReloading,
}) => {
  // Movement joystick touch state
  const moveTouchId = useRef<number | null>(null);
  const moveCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [moveKnobPos, setMoveKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const moveBaseRef = useRef<HTMLDivElement>(null);

  // Aim/Fire joystick touch state
  const aimTouchId = useRef<number | null>(null);
  const aimCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [aimKnobPos, setAimKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const aimBaseRef = useRef<HTMLDivElement>(null);

  const JOYSTICK_RADIUS = 45;

  // Move Joystick Handlers
  const handleMoveStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (moveTouchId.current !== null) return;

    moveTouchId.current = e.pointerId;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    const rect = moveBaseRef.current?.getBoundingClientRect();
    if (rect) {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      moveCenter.current = { x: cx, y: cy };

      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        const clampedDist = Math.min(dist, JOYSTICK_RADIUS);
        const normX = dx / dist;
        const normY = dy / dist;
        setMoveKnobPos({ x: normX * clampedDist, y: normY * clampedDist });
        onMoveVector({
          x: normX * (clampedDist / JOYSTICK_RADIUS),
          y: normY * (clampedDist / JOYSTICK_RADIUS),
        });
      }
    }
  };

  const handleMoveMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== moveTouchId.current) return;
    e.preventDefault();

    const dx = e.clientX - moveCenter.current.x;
    const dy = e.clientY - moveCenter.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) {
      setMoveKnobPos({ x: 0, y: 0 });
      onMoveVector({ x: 0, y: 0 });
      return;
    }

    const clampedDist = Math.min(dist, JOYSTICK_RADIUS);
    const normX = dx / dist;
    const normY = dy / dist;

    setMoveKnobPos({
      x: normX * clampedDist,
      y: normY * clampedDist,
    });

    onMoveVector({
      x: normX * (clampedDist / JOYSTICK_RADIUS),
      y: normY * (clampedDist / JOYSTICK_RADIUS),
    });
  }, [onMoveVector]);

  const handleMoveEnd = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== moveTouchId.current) return;
    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    moveTouchId.current = null;
    setMoveKnobPos({ x: 0, y: 0 });
    onMoveVector({ x: 0, y: 0 });
  }, [onMoveVector]);

  // Aim & Fire Joystick Handlers
  const handleAimStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (aimTouchId.current !== null) return;

    aimTouchId.current = e.pointerId;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    const rect = aimBaseRef.current?.getBoundingClientRect();
    if (rect) {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      aimCenter.current = { x: cx, y: cy };

      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        const clampedDist = Math.min(dist, JOYSTICK_RADIUS);
        const normX = dx / dist;
        const normY = dy / dist;
        setAimKnobPos({ x: normX * clampedDist, y: normY * clampedDist });
        onAimVector({ x: normX, y: normY });
      }
    }

    onFiringState(true);
  };

  const handleAimMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== aimTouchId.current) return;
    e.preventDefault();

    const dx = e.clientX - aimCenter.current.x;
    const dy = e.clientY - aimCenter.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) {
      setAimKnobPos({ x: 0, y: 0 });
      return;
    }

    const clampedDist = Math.min(dist, JOYSTICK_RADIUS);
    const normX = dx / dist;
    const normY = dy / dist;

    setAimKnobPos({
      x: normX * clampedDist,
      y: normY * clampedDist,
    });

    onAimVector({ x: normX, y: normY });
    onFiringState(true);
  }, [onAimVector, onFiringState]);

  const handleAimEnd = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== aimTouchId.current) return;
    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    aimTouchId.current = null;
    setAimKnobPos({ x: 0, y: 0 });
    onFiringState(false);
  }, [onFiringState]);

  // Clean up pointer listeners on unmount
  useEffect(() => {
    return () => {
      onMoveVector({ x: 0, y: 0 });
      onFiringState(false);
    };
  }, [onMoveVector, onFiringState]);

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none p-4 pb-6 flex justify-between items-end select-none z-20">
      {/* Move Virtual Joystick (Bottom Left) */}
      <div className="relative pointer-events-auto flex flex-col items-center">
        <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase mb-1">Move</span>
        <div
          id="mobile-move-joystick"
          ref={moveBaseRef}
          onPointerDown={handleMoveStart}
          onPointerMove={handleMoveMove}
          onPointerUp={handleMoveEnd}
          onPointerCancel={handleMoveEnd}
          className="w-28 h-28 rounded-full bg-zinc-900/70 border-2 border-zinc-700/80 shadow-2xl relative flex items-center justify-center backdrop-blur-md touch-none"
        >
          {/* Inner stick base */}
          <div className="w-12 h-12 rounded-full border border-zinc-700/40" />

          {/* Moveable thumb knob */}
          <div
            className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-400 border border-white shadow-lg pointer-events-none transition-transform duration-75"
            style={{
              transform: `translate(${moveKnobPos.x}px, ${moveKnobPos.y}px)`,
            }}
          />
        </div>
      </div>

      {/* Right Controls: Quick Reload + Aim & Fire Stick */}
      <div className="relative pointer-events-auto flex flex-col items-center gap-3">
        {/* Mobile Ammo Counter & Reload Button */}
        <div className="flex items-center gap-2">
          <div className="bg-zinc-950/90 px-3 py-1.5 rounded-xl border border-zinc-800 text-center shadow-lg">
            <span className={`text-lg font-black font-mono ${ammo <= 3 ? 'text-red-500' : 'text-zinc-100'}`}>
              {ammo}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">/{maxAmmo}</span>
          </div>

          <button
            id="mobile-reload-btn"
            onClick={onReload}
            disabled={isReloading || ammo >= maxAmmo}
            className={`p-3 rounded-xl border shadow-lg active:scale-90 transition ${
              isReloading
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : ammo < maxAmmo
                ? 'bg-zinc-800 border-zinc-600 text-zinc-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-600'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${isReloading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Aim & Shoot Joystick */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-red-400 tracking-wider uppercase mb-1 flex items-center gap-1">
            <Crosshair className="w-3 h-3" /> Aim & Fire
          </span>
          <div
            id="mobile-aim-joystick"
            ref={aimBaseRef}
            onPointerDown={handleAimStart}
            onPointerMove={handleAimMove}
            onPointerUp={handleAimEnd}
            onPointerCancel={handleAimEnd}
            className="w-28 h-28 rounded-full bg-red-950/40 border-2 border-red-700/80 shadow-2xl relative flex items-center justify-center backdrop-blur-md touch-none"
          >
            {/* Inner fire target center */}
            <div className="w-12 h-12 rounded-full border border-red-700/50 flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-red-500/60" />
            </div>

            {/* Moveable aim thumb knob */}
            <div
              className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 border-2 border-red-300 shadow-xl pointer-events-none transition-transform duration-75 flex items-center justify-center"
              style={{
                transform: `translate(${aimKnobPos.x}px, ${aimKnobPos.y}px)`,
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
