import { useEffect, useRef, useState, useCallback } from 'react';
import { EyeGeometry, MascotMood, Point2D } from '../types';

export interface EyeTrackingState {
  pupilL: Point2D;
  pupilR: Point2D;
  specularL: Point2D;
  specularR: Point2D;
  isBlinking: boolean;
}

export interface UseEyeTrackingOptions {
  geometry: EyeGeometry;
  mood?: MascotMood;
  containerRef: React.RefObject<HTMLDivElement | null>;
  enabled?: boolean;
  swipeOffset?: number; // -1 to 1 for carousel swipe look
  enableBlink?: boolean;
}

export const useEyeTracking = ({
  geometry,
  mood = 'idle',
  containerRef,
  enabled = true,
  swipeOffset = 0,
  enableBlink = true,
}: UseEyeTrackingOptions) => {
  // Target coordinates for pupils (in SVG units offset from eye centers)
  const targetL = useRef<Point2D>({ x: 0, y: 0 });
  const targetR = useRef<Point2D>({ x: 0, y: 0 });

  // Current interpolated values (smooth lerp 0.15/frame)
  const currentL = useRef<Point2D>({ x: 0, y: 0 });
  const currentR = useRef<Point2D>({ x: 0, y: 0 });

  // State output for rendering
  const [eyeState, setEyeState] = useState<EyeTrackingState>({
    pupilL: { x: 0, y: 0 },
    pupilR: { x: 0, y: 0 },
    specularL: { x: 0, y: 0 },
    specularR: { x: 0, y: 0 },
    isBlinking: false,
  });

  const lastInteractionTime = useRef<number>(Date.now());
  const nextIdleGlanceTime = useRef<number>(Date.now() + 2000);
  const isBlinkingRef = useRef<boolean>(false);
  const nextBlinkTime = useRef<number>(Date.now() + 3000 + Math.random() * 3000);

  // Global Pointer & Touch Listeners
  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || !containerRef.current) return;
      lastInteractionTime.current = Date.now();

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Scale factor from screen pixels to SVG viewBox (400x400)
      const scaleX = 400 / rect.width;
      const scaleY = 400 / rect.height;

      // Pointer position in SVG coordinate space
      const svgX = (clientX - rect.left) * scaleX;
      const svgY = (clientY - rect.top) * scaleY;

      // Calculate vector from eye centers to pointer
      const dxL = svgX - geometry.centerL.x;
      const dyL = svgY - geometry.centerL.y;
      const distL = Math.hypot(dxL, dyL) || 1;

      const dxR = svgX - geometry.centerR.x;
      const dyR = svgY - geometry.centerR.y;
      const distR = Math.hypot(dxR, dyR) || 1;

      // Clamp pupil travel within maximum clamp radius (~12% eye size)
      const maxClamp = geometry.maxPupilClamp;
      const ratioL = Math.min(1, distL / (geometry.rx * 2.8));
      const ratioR = Math.min(1, distR / (geometry.rx * 2.8));

      // Stereo depth: slight convergence angle when looking up close
      targetL.current = {
        x: (dxL / distL) * maxClamp * ratioL,
        y: (dyL / distL) * maxClamp * ratioL,
      };

      targetR.current = {
        x: (dxR / distR) * (maxClamp * 0.96) * ratioR,
        y: (dyR / distR) * maxClamp * ratioR,
      };
    },
    [enabled, geometry, containerRef]
  );

  useEffect(() => {
    if (!enabled) return;

    const onPointerMove = (e: PointerEvent) => {
      handlePointer(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [enabled, handlePointer]);

  // Main Animation Loop for Lerp, Autonomous Glance, and Blink
  useEffect(() => {
    let animId: number;
    let isRunning = true;

    const tick = () => {
      if (!isRunning) return;
      const now = Date.now();

      // Autonomous idle glances if no user interaction for > 3 seconds
      if (enabled && now - lastInteractionTime.current > 3000) {
        // Mood overrides:
        if (mood === 'focus') {
          // In focus mode, eyes look down towards pomodoro clock/task
          targetL.current = { x: 0, y: geometry.maxPupilClamp * 0.75 };
          targetR.current = { x: 0, y: geometry.maxPupilClamp * 0.75 };
        } else if (mood === 'sleepy') {
          // Half-closed, looking slightly downward
          targetL.current = { x: 0, y: geometry.maxPupilClamp * 0.4 };
          targetR.current = { x: 0, y: geometry.maxPupilClamp * 0.4 };
        } else if (now > nextIdleGlanceTime.current) {
          // 30% chance to look directly at camera (0, 0), otherwise random glance
          const lookAtCamera = Math.random() < 0.3;
          if (lookAtCamera) {
            targetL.current = { x: 0, y: 0 };
            targetR.current = { x: 0, y: 0 };
          } else {
            const angle = Math.random() * Math.PI * 2;
            const dist = (0.3 + Math.random() * 0.7) * geometry.maxPupilClamp;
            targetL.current = {
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist * 0.7,
            };
            targetR.current = {
              x: Math.cos(angle) * (dist * 0.95),
              y: Math.sin(angle) * dist * 0.7,
            };
          }
          // Schedule next idle glance in 2 - 4 seconds
          nextIdleGlanceTime.current = now + 2000 + Math.random() * 2000;
        }
      }

      // Swipe offset gaze override (tilt & look along carousel swipe)
      if (Math.abs(swipeOffset) > 0.05) {
        const gazeX = Math.max(-1, Math.min(1, swipeOffset)) * geometry.maxPupilClamp;
        targetL.current.x = gazeX;
        targetR.current.x = gazeX;
      }

      // Smooth lerp (0.15 per frame)
      const lerp = 0.15;
      currentL.current.x += (targetL.current.x - currentL.current.x) * lerp;
      currentL.current.y += (targetL.current.y - currentL.current.y) * lerp;

      currentR.current.x += (targetR.current.x - currentR.current.x) * lerp;
      currentR.current.y += (targetR.current.y - currentR.current.y) * lerp;

      // Pupil specular highlight moves opposite direction 20% for 3D gloss depth
      const specL = {
        x: -currentL.current.x * 0.2,
        y: -currentL.current.y * 0.2,
      };
      const specR = {
        x: -currentR.current.x * 0.2,
        y: -currentR.current.y * 0.2,
      };

      // Periodic blink timer: random 3-6s, lasts 120ms
      if (enableBlink && now > nextBlinkTime.current && !isBlinkingRef.current) {
        isBlinkingRef.current = true;
        setEyeState((prev) => ({ ...prev, isBlinking: true }));

        setTimeout(() => {
          isBlinkingRef.current = false;
          setEyeState((prev) => ({ ...prev, isBlinking: false }));
          nextBlinkTime.current = Date.now() + 3000 + Math.random() * 3000;
        }, 120);
      }

      setEyeState({
        pupilL: { ...currentL.current },
        pupilR: { ...currentR.current },
        specularL: specL,
        specularR: specR,
        isBlinking: isBlinkingRef.current,
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [enabled, geometry, mood, swipeOffset, enableBlink]);

  return eyeState;
};
