import React, { useEffect, useState, useCallback, useRef } from 'react';
import { tg } from '../../utils/telegram';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  emoji?: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  scale: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

const CANDY_COLORS = [
  '#FFB703', // Warm Gold
  '#FF6B8B', // Coral Pink
  '#2EC4B6', // Mint
  '#8E7CFF', // Grape
  '#4CC9F0', // Sky Blue
  '#FFD166', // Butter Yellow
];

const SPARKLE_EMOJIS = ['✨', '⭐', '💖', '🐾', '🍬', '🌟', '🌸'];

export const TapEffectOverlay: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const lastHapticRef = useRef<number>(0);
  const nextIdRef = useRef<number>(1);

  // Spawn tap particles at screen coordinates
  const spawnTapEffect = useCallback((clientX: number, clientY: number, customEmoji?: string) => {
    const now = performance.now();
    // Throttle haptic slightly to 40ms to keep vibration crisp
    if (now - lastHapticRef.current > 40) {
      tg.haptic.impact('light');
      lastHapticRef.current = now;
    }

    const rippleColor = CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)];
    const newRippleId = nextIdRef.current++;

    // 1. Create expanding ripple ring
    setRipples((prev) => [
      ...prev.slice(-10),
      {
        id: newRippleId,
        x: clientX,
        y: clientY,
        color: rippleColor,
      },
    ]);

    // 2. Create 4-6 flying candy particles
    const particleCount = 4 + Math.floor(Math.random() * 3);
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.8;
      const speed = 2 + Math.random() * 3.5;
      const useEmoji = Math.random() > 0.4;
      const emoji = customEmoji || (useEmoji ? SPARKLE_EMOJIS[Math.floor(Math.random() * SPARKLE_EMOJIS.length)] : undefined);

      newParticles.push({
        id: nextIdRef.current++,
        x: clientX,
        y: clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5, // slight upward bias
        size: useEmoji ? 16 + Math.random() * 8 : 6 + Math.random() * 6,
        color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)],
        emoji,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
        scale: 1,
      });
    }

    setParticles((prev) => [...prev.slice(-30), ...newParticles]);
  }, []);

  // Listen to global pointerdown & custom float-text event
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // Don't spawn if tapping on an input or textarea
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      spawnTapEffect(e.clientX, e.clientY);
    };

    const handleCustomFloat = (e: Event) => {
      const customEvt = e as CustomEvent<{ x: number; y: number; text: string; color?: string; emoji?: string }>;
      if (!customEvt.detail) return;
      const { x, y, text, color = '#FF6B8B', emoji } = customEvt.detail;

      if (emoji) {
        spawnTapEffect(x, y, emoji);
      }

      const id = nextIdRef.current++;
      setFloatingTexts((prev) => [
        ...prev.slice(-8),
        {
          id,
          x,
          y,
          text,
          color,
        },
      ]);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('devgotchi:float-text', handleCustomFloat);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('devgotchi:float-text', handleCustomFloat);
    };
  }, [spawnTapEffect]);

  // Animation frame loop for particles and texts
  useEffect(() => {
    let animId: number;

    const tick = () => {
      // Update particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.18, // gentle gravity
            vx: p.vx * 0.96, // air resistance
            rotation: p.rotation + p.rotationSpeed,
            opacity: p.opacity - 0.028,
            scale: Math.max(0, p.scale - 0.015),
          }))
          .filter((p) => p.opacity > 0 && p.scale > 0)
      );

      // Clean up ripples after 450ms
      setRipples((prev) => (prev.length > 0 ? prev : []));

      // Update floating texts
      setFloatingTexts((prev) =>
        prev
          .map((t) => ({
            ...t,
            y: t.y - 1.4, // float upward
          }))
      );

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Auto clean ripples
  useEffect(() => {
    if (ripples.length === 0) return;
    const timer = setTimeout(() => {
      setRipples([]);
    }, 450);
    return () => clearTimeout(timer);
  }, [ripples]);

  // Auto clean floating texts
  useEffect(() => {
    if (floatingTexts.length === 0) return;
    const timer = setTimeout(() => {
      setFloatingTexts((prev) => prev.slice(1));
    }, 1100);
    return () => clearTimeout(timer);
  }, [floatingTexts]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      {/* 1. Expanding Touch Ripples */}
      {ripples.map((r) => (
        <div
          key={r.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 animate-ping opacity-60 pointer-events-none"
          style={{
            left: r.x,
            top: r.y,
            width: 38,
            height: 38,
            borderColor: r.color,
          }}
        />
      ))}

      {/* 2. Flying Candy Micro-particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none will-change-transform"
          style={{
            left: p.x,
            top: p.y,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${p.scale})`,
            opacity: p.opacity,
          }}
        >
          {p.emoji ? (
            <span style={{ fontSize: `${p.size}px`, lineHeight: 1 }}>{p.emoji}</span>
          ) : (
            <div
              className="rounded-full shadow-xs"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                border: '1px solid #1B2A4A',
              }}
            />
          )}
        </div>
      ))}

      {/* 3. Floating Numbers & Reaction Emotes */}
      {floatingTexts.map((ft) => (
        <div
          key={ft.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 font-heading font-black text-sm tracking-wide bg-white/95 border-2 border-[var(--ink)] px-2.5 py-0.5 rounded-full shadow-[0_3px_0_var(--ink)] pointer-events-none animate-float-reaction"
          style={{
            left: ft.x,
            top: ft.y,
            color: ft.color,
          }}
        >
          {ft.text}
        </div>
      ))}
    </div>
  );
};

/**
 * Utility helper to spawn a floating reward/reaction popup at specific coordinates
 */
export const spawnFloatingReaction = (
  x: number,
  y: number,
  text: string,
  color = '#FF6B8B',
  emoji = '💖'
) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('devgotchi:float-text', {
      detail: { x, y, text, color, emoji },
    })
  );
};
