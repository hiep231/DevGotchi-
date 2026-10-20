import { useEffect, useRef, useState, useCallback } from 'react';
import { Point2D } from '../types';

export interface ParallaxTiltState {
  tiltX: number; // -1 to 1 normalized
  tiltY: number; // -1 to 1 normalized
  rollDeg: number; // ±6 degrees body roll
  isDragging: boolean;
}

export interface UseParallaxTiltOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  enabled?: boolean;
  enableGyro?: boolean;
  swipeOffset?: number; // -1 to 1 for carousel swipe tilt
  maxRollDeg?: number; // default 6
}

export const useParallaxTilt = ({
  containerRef,
  enabled = true,
  enableGyro = true,
  swipeOffset = 0,
  maxRollDeg = 6,
}: UseParallaxTiltOptions) => {
  // Target normalized tilt (-1 to 1)
  const targetTilt = useRef<Point2D>({ x: 0, y: 0 });
  // Current interpolated tilt
  const currentTilt = useRef<Point2D>({ x: 0, y: 0 });
  // Spring velocity for drag release
  const springVelocity = useRef<Point2D>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const dragStart = useRef<Point2D>({ x: 0, y: 0 });

  const [tiltState, setTiltState] = useState<ParallaxTiltState>({
    tiltX: 0,
    tiltY: 0,
    rollDeg: 0,
    isDragging: false,
  });

  // Check prefers-reduced-motion
  const prefersReducedMotion = useRef<boolean>(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReducedMotion.current = media.matches;
      const listener = (e: MediaQueryListEvent) => {
        prefersReducedMotion.current = e.matches;
      };
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, []);

  // Desktop Pointer Parallax
  const handleGlobalPointer = useCallback(
    (e: PointerEvent) => {
      if (!enabled || prefersReducedMotion.current || isDraggingRef.current) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Distance from mascot center normalized to screen
      const nx = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth * 0.45)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight * 0.45)));

      targetTilt.current = { x: nx, y: ny };
    },
    [enabled, containerRef]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('pointermove', handleGlobalPointer, { passive: true });
    return () => window.removeEventListener('pointermove', handleGlobalPointer);
  }, [enabled, handleGlobalPointer]);

  // Mobile DeviceOrientation (Gyroscope)
  useEffect(() => {
    if (!enabled || !enableGyro || prefersReducedMotion.current) return;

    let hasGyro = false;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (isDraggingRef.current) return;
      if (e.gamma !== null && e.beta !== null) {
        hasGyro = true;
        // Gamma: tilt left-right (-45 to 45 deg)
        // Beta: tilt front-back (20 to 60 deg typical holding angle)
        const gx = Math.max(-1, Math.min(1, e.gamma / 35));
        const gy = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
        targetTilt.current = { x: gx, y: gy };
      }
    };

    // iOS 13+ permission request if needed
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission ===
        'function'
    ) {
      // Permission can be requested on first touch
      const requestIOS = () => {
        (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
          .requestPermission()
          .then((res: string) => {
            if (res === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation, { passive: true });
            }
          })
          .catch(() => {});
        window.removeEventListener('touchend', requestIOS);
      };
      window.addEventListener('touchend', requestIOS, { once: true });
    } else {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [enabled, enableGyro]);

  // Mascot Drag Gesture (Drag with finger -> releases with spring physics)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || prefersReducedMotion.current) return;
    isDraggingRef.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setTiltState((prev) => ({ ...prev, isDragging: true }));
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStart.current.x) / (rect.width * 0.4);
    const dy = (e.clientY - dragStart.current.y) / (rect.height * 0.4);
    targetTilt.current = {
      x: Math.max(-1.5, Math.min(1.5, dx)),
      y: Math.max(-1.5, Math.min(1.5, dy)),
    };
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setTiltState((prev) => ({ ...prev, isDragging: false }));
    // Release with spring to center
    targetTilt.current = { x: 0, y: 0 };
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Physics Loop (Spring on drag release + Smooth Lerp)
  useEffect(() => {
    let animId: number;
    let isRunning = true;

    const tick = () => {
      if (!isRunning) return;

      if (prefersReducedMotion.current) {
        setTiltState({ tiltX: 0, tiltY: 0, rollDeg: 0, isDragging: false });
        animId = requestAnimationFrame(tick);
        return;
      }

      // Combine with carousel swipe offset
      const effectiveTargetX = targetTilt.current.x + swipeOffset * 0.8;
      const effectiveTargetY = targetTilt.current.y;

      if (isDraggingRef.current) {
        // Direct responsive tracking during drag
        const lerp = 0.25;
        currentTilt.current.x += (effectiveTargetX - currentTilt.current.x) * lerp;
        currentTilt.current.y += (effectiveTargetY - currentTilt.current.y) * lerp;
      } else {
        // Spring physics return to target
        const stiffness = 0.12;
        const damping = 0.82;

        const forceX = (effectiveTargetX - currentTilt.current.x) * stiffness;
        const forceY = (effectiveTargetY - currentTilt.current.y) * stiffness;

        springVelocity.current.x = (springVelocity.current.x + forceX) * damping;
        springVelocity.current.y = (springVelocity.current.y + forceY) * damping;

        currentTilt.current.x += springVelocity.current.x;
        currentTilt.current.y += springVelocity.current.y;
      }

      const roll = currentTilt.current.x * maxRollDeg;

      setTiltState({
        tiltX: currentTilt.current.x,
        tiltY: currentTilt.current.y,
        rollDeg: roll,
        isDragging: isDraggingRef.current,
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [enabled, swipeOffset, maxRollDeg]);

  return {
    ...tiltState,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
};
