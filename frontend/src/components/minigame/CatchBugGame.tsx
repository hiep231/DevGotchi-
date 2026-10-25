import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Trophy,
  Flame,
  RotateCcw,
  Play,
  Heart,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Bug,
} from 'lucide-react';
import { usePetStore } from '../../store/usePetStore';
import { useFoodsQuery, useMinigameRewardMutation } from '../../hooks/usePetQueries';
import { tg } from '../../utils/telegram';
import { STARTER_PETS } from '../../data/petConfigs';
import { MASCOT_IMAGES } from '../3d/PetCanvas';

interface BugTarget {
  id: number;
  type: 'bug' | 'worm' | 'warning' | 'boss' | 'sparkle';
  x: number; // percentage 5% to 85%
  y: number; // percentage 5% to 85%
  size: number; // px
  points: number;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  speedY: number;
  createdAt: number;
  lifetime: number; // ms
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface CatchBugGameProps {
  onBackToPet?: () => void;
}

const TOTAL_TIME = 30; // 30 seconds

export const CatchBugGame: React.FC<CatchBugGameProps> = ({ onBackToPet }) => {
  const { pet, foods: fallbackFoods } = usePetStore();
  const { data: foods = fallbackFoods } = useFoodsQuery();
  const rewardMutation = useMinigameRewardMutation();

  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'ENDED'>('IDLE');
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_TIME);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [bugs, setBugs] = useState<BugTarget[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [claimedReward, setClaimedReward] = useState<{
    expGained: number;
    happinessGained: number;
    rewardFoodName: string;
    leveledUp: boolean;
  } | null>(null);

  const gameAreaRef = useRef<HTMLDivElement | null>(null);
  const lastHitTimeRef = useRef<number>(0);
  const nextBugIdRef = useRef<number>(1);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const config = pet ? STARTER_PETS.find((p) => p.id === pet.type) : undefined;
  const petMascotSrc = pet ? MASCOT_IMAGES[pet.type] : undefined;

  // Sound / Haptic / Particle triggers
  const triggerHitFeedback = (isBoss: boolean) => {
    if (isBoss) {
      tg.haptic.notification('success');
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FFB703', '#FF6B6B', '#2EC4B6'],
      });
    } else {
      tg.haptic.impact('medium');
    }
  };

  // Spawn a random bug
  const spawnBug = useCallback(() => {
    const rand = Math.random();
    let type: BugTarget['type'] = 'bug';
    let points = 1;
    let label = 'Bug Fixed!';
    let emoji = '🐞';
    let color = '#E11D48';
    let bgColor = '#FFE4E6';
    let size = 52;
    let lifetime = 2800;
    let speedY = 0.15 + Math.random() * 0.15;

    if (rand < 0.12) {
      // Golden Sparkle Bug (5 pts)
      type = 'sparkle';
      points = 5;
      label = '✨ CLEAN CODE!';
      emoji = '⚡';
      color = '#D97706';
      bgColor = '#FEF3C7';
      size = 56;
      lifetime = 2000;
      speedY = 0.25;
    } else if (rand < 0.28) {
      // NullPointer Boss Bug (4 pts)
      type = 'boss';
      points = 4;
      label = '💥 NULL FIXED!';
      emoji = '💥';
      color = '#7C3AED';
      bgColor = '#EDE9FE';
      size = 60;
      lifetime = 2400;
      speedY = 0.12;
    } else if (rand < 0.55) {
      // Warning / Exception (2 pts)
      type = 'warning';
      points = 2;
      label = '⚠️ CATCH!';
      emoji = '⚠️';
      color = '#D97706';
      bgColor = '#FEF9C3';
      size = 48;
      lifetime = 2600;
      speedY = 0.18;
    } else if (rand < 0.78) {
      // Worm / Memory Leak (2 pts)
      type = 'worm';
      points = 2;
      label = '🐛 DELEAK!';
      emoji = '🐛';
      color = '#059669';
      bgColor = '#D1FAE5';
      size = 50;
      lifetime = 2700;
      speedY = 0.16;
    }

    const newBug: BugTarget = {
      id: nextBugIdRef.current++,
      type,
      x: 8 + Math.random() * 74, // keep inside bounds
      y: 6 + Math.random() * 20, // starts near top
      size,
      points,
      label,
      emoji,
      color,
      bgColor,
      speedY,
      createdAt: Date.now(),
      lifetime,
    };

    setBugs((prev) => {
      // Keep max 7 bugs on screen at once to avoid lag
      const filtered = prev.filter((b) => Date.now() - b.createdAt < b.lifetime);
      if (filtered.length >= 7) return filtered;
      return [...filtered, newBug];
    });
  }, []);

  // Main Game Loop for movement
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      setBugs((prev) =>
        prev
          .map((b) => ({
            ...b,
            y: b.y + b.speedY * dt * 35, // fall slowly downwards
          }))
          .filter((b) => b.y < 92 && Date.now() - b.createdAt < b.lifetime)
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState]);

  // Bug Hit Handler
  const handleHitBug = (bug: BugTarget, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    const now = Date.now();
    const isRapid = now - lastHitTimeRef.current < 900;
    lastHitTimeRef.current = now;

    const newCombo = isRapid ? combo + 1 : 1;
    setCombo(newCombo);
    if (newCombo > maxCombo) setMaxCombo(newCombo);

    const comboMultiplier = newCombo >= 5 ? 2 : (newCombo >= 3 ? 1.5 : 1);
    const earnedPoints = Math.round(bug.points * comboMultiplier);

    setScore((prev) => prev + earnedPoints);
    triggerHitFeedback(bug.type === 'boss' || bug.type === 'sparkle');

    // Add floating text
    const textId = Date.now() + Math.random();
    setFloatingTexts((prev) => [
      ...prev,
      {
        id: textId,
        x: bug.x,
        y: bug.y,
        text: `+${earnedPoints} ${newCombo >= 3 ? `x${newCombo}!` : ''}`,
        color: bug.color,
      },
    ]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== textId));
    }, 800);

    // Remove hit bug
    setBugs((prev) => prev.filter((b) => b.id !== bug.id));
  };

  // Start Game
  const startGame = () => {
    tg.haptic.notification('success');
    setGameState('PLAYING');
    setTimeLeft(TOTAL_TIME);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setBugs([]);
    setFloatingTexts([]);
    setClaimedReward(null);
    lastHitTimeRef.current = 0;

    // Spawn first wave
    spawnBug();
    spawnBug();

    // Setup 1s timer countdown
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Setup spawn interval (every 750ms)
    spawnIntervalRef.current = setInterval(() => {
      spawnBug();
    }, 750);
  };

  // End Game
  const endGame = useCallback(async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    setGameState('ENDED');
    tg.haptic.notification('success');

    // Large confetti
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.4 },
      colors: ['#FFB703', '#FF6B6B', '#2EC4B6', '#8E7CFF'],
    });

    // Auto claim rewards via mutation
    if (pet) {
      try {
        const finalScore = score;
        const res = await rewardMutation.mutateAsync({
          score: finalScore,
          pet,
          foods,
        });

        if (res) {
          setClaimedReward({
            expGained: res.expGained,
            happinessGained: res.happinessGained,
            rewardFoodName: res.rewardFoodName,
            leveledUp: res.leveledUp,
          });
        }
      } catch (err) {
        console.error('Failed to claim minigame reward:', err);
      }
    }
  }, [score, pet, foods, rewardMutation]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 pb-24 animate-pop-in">
      {/* ===================================================================
          1. HEADER BAR: Title, Timer & Score Pill
          =================================================================== */}
      <div className="card-sticker p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[var(--primary)] border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)] flex items-center justify-center text-xl">
              🎮
            </div>
            <div>
              <h1 className="text-base font-heading font-black text-[var(--ink)] tracking-tight flex items-center gap-1.5">
                <span>Bắt Bug Xả Stress</span>
                <span className="text-[10px] font-heading font-black bg-[#FFE4E6] text-[#E11D48] px-2 py-0.5 rounded-full border border-[#FDA4AF]">
                  30s Quick Play
                </span>
              </h1>
              <p className="text-[11px] text-[var(--ink-soft)] font-medium">
                Chạm thật nhanh để đè bẹp các chú bọ lỗi!
              </p>
            </div>
          </div>

          {/* Return button if idle */}
          {gameState === 'IDLE' && onBackToPet && (
            <button
              onClick={onBackToPet}
              className="px-3 py-1.5 rounded-xl border-2 border-[var(--ink)] bg-white text-xs font-heading font-extrabold text-[var(--ink)] shadow-[0_2px_0_var(--ink)] active:translate-y-[1px] active:shadow-none cursor-pointer"
            >
              🐾 Về Pet
            </button>
          )}
        </div>

        {/* Live HUD Dashboard during Play */}
        {gameState === 'PLAYING' && (
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--line)]">
            {/* Time Left Pill */}
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-[#E0F2FE] border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)]">
              <span className="text-[10px] font-heading font-extrabold text-[#0284C7] uppercase">
                Thời gian
              </span>
              <span
                className={`text-lg font-heading font-black tabular-nums ${
                  timeLeft <= 5 ? 'text-rose-600 animate-ping' : 'text-[var(--ink)]'
                }`}
              >
                {timeLeft}s
              </span>
            </div>

            {/* Score Pill */}
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-[#FEF3C7] border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)]">
              <span className="text-[10px] font-heading font-extrabold text-[#D97706] uppercase">
                Điểm số
              </span>
              <span className="text-lg font-heading font-black text-[var(--ink)] tabular-nums">
                {score}
              </span>
            </div>

            {/* Combo Streak Pill */}
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-[#FEE2E2] border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)]">
              <span className="text-[10px] font-heading font-extrabold text-[#DC2626] uppercase flex items-center gap-0.5">
                <Flame className="w-3 h-3 text-[#DC2626] fill-[#DC2626]" />
                Combo
              </span>
              <span className="text-lg font-heading font-black text-[#DC2626] tabular-nums">
                {combo > 1 ? `x${combo}` : '-'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================
          2. GAME ARENA (TOUCH INTERACTIVE PLAY AREA)
          =================================================================== */}
      <div
        ref={gameAreaRef}
        className="relative w-full h-[400px] bg-gradient-to-b from-[#FFFDF9] to-[#F5EDE0] rounded-3xl border-2 border-[var(--ink)] shadow-[0_4px_0_var(--ink)] overflow-hidden select-none touch-none flex flex-col justify-between"
      >
        {/* Background Decorative Tech Glyphs */}
        <div className="absolute inset-0 pointer-events-none opacity-5 flex flex-wrap gap-12 p-6 font-mono text-xl text-[var(--ink)]">
          <span>&lt;div /&gt;</span>
          <span>npm run dev</span>
          <span>NullPointer</span>
          <span>git commit -m</span>
          <span>StackOverflow</span>
          <span>404 Not Found</span>
          <span>async await</span>
          <span>Docker build</span>
        </div>

        {/* =================================================================
            STATE A: IDLE (INTRO & START BUTTON)
            ================================================================= */}
        {gameState === 'IDLE' && (
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 text-center gap-4">
            {/* Mascot Preview */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-[var(--primary-tint)] border-2 border-[var(--ink)] shadow-[0_4px_0_var(--ink)] flex items-center justify-center overflow-hidden">
                {petMascotSrc ? (
                  <img
                    src={petMascotSrc}
                    alt={pet?.customName}
                    className="w-20 h-20 object-contain drop-shadow-md animate-bounce"
                  />
                ) : (
                  <span className="text-4xl animate-bounce">🐾</span>
                )}
              </div>
              <span className="absolute -top-2 -right-2 bg-[var(--coral)] text-white text-[10px] font-heading font-black px-2 py-0.5 rounded-full border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)]">
                Ready!
              </span>
            </div>

            <div>
              <h2 className="text-lg font-heading font-black text-[var(--ink)]">
                {pet ? `${pet.customName} đang ngứa tay!` : 'Săn Bug Nhận Đồ Ăn!'}
              </h2>
              <p className="text-xs text-[var(--ink-soft)] font-medium max-w-[260px] mx-auto mt-1 leading-relaxed">
                Đập tan các con bọ lỗi trong 30 giây để nhận <b>Bánh Cá RAM</b>, <b>Thạch Docker</b> và hàng tá EXP!
              </p>
            </div>

            {/* Loot Table Preview */}
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-2xl border border-[var(--line)] shadow-xs">
              <span className="text-xs">🎁 Quà may mắn:</span>
              <span className="text-sm">🐟 🐳 🦐 🍩</span>
              <span className="text-[11px] font-heading font-extrabold text-[var(--mint-deep)]">
                +80 EXP
              </span>
            </div>

            {/* Play Button */}
            <button
              onClick={startGame}
              className="btn-chunky btn-chunky-primary px-8 py-3.5 text-base font-heading font-black flex items-center gap-2 shadow-[0_4px_0_var(--ink)] active:translate-y-[2px] active:shadow-[0_2px_0_var(--ink)] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>BẮT ĐẦU CHƠI (30s)</span>
            </button>
          </div>
        )}

        {/* =================================================================
            STATE B: PLAYING (BUGS FALLING & TAP TARGETS)
            ================================================================= */}
        {gameState === 'PLAYING' && (
          <div className="relative w-full h-full">
            {/* Countdown Progress Line at the very top */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-200 z-20">
              <div
                className="h-full bg-[var(--primary)] transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / TOTAL_TIME) * 100}%` }}
              />
            </div>

            {/* Live Bugs */}
            {bugs.map((bug) => (
              <div
                key={bug.id}
                onClick={(e) => handleHitBug(bug, e)}
                onTouchStart={(e) => handleHitBug(bug, e)}
                style={{
                  left: `${bug.x}%`,
                  top: `${bug.y}%`,
                  width: `${bug.size}px`,
                  height: `${bug.size}px`,
                  backgroundColor: bug.bgColor,
                  borderColor: 'var(--ink)',
                }}
                className="absolute z-20 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer select-none shadow-[0_3px_0_var(--ink)] active:scale-90 active:translate-y-[2px] transition-transform duration-75 animate-bounce"
              >
                <span className="text-2xl pointer-events-none drop-shadow-xs">
                  {bug.emoji}
                </span>
                <span
                  style={{ color: bug.color }}
                  className="text-[9px] font-heading font-black leading-none mt-0.5 pointer-events-none"
                >
                  +{bug.points}
                </span>
              </div>
            ))}

            {/* Floating Popups */}
            {floatingTexts.map((ft) => (
              <div
                key={ft.id}
                style={{
                  left: `${ft.x}%`,
                  top: `${ft.y}%`,
                  color: ft.color,
                }}
                className="absolute z-30 font-heading font-black text-sm pointer-events-none animate-float drop-shadow-sm whitespace-nowrap"
              >
                {ft.text}
              </div>
            ))}

            {/* Mascot in bottom cheering */}
            <div className="absolute bottom-2 right-3 z-10 opacity-70 pointer-events-none flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-2xl border border-[var(--line)]">
              <span className="text-xs">🐾</span>
              <span className="text-[10px] font-heading font-extrabold text-[var(--ink)]">
                {pet?.customName || 'Bé cưng'}: "Đập nó sen ơi!"
              </span>
            </div>
          </div>
        )}

        {/* =================================================================
            STATE C: ENDED (CELEBRATION & REWARDS SUMMARY)
            ================================================================= */}
        {gameState === 'ENDED' && (
          <div className="relative z-30 w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3 bg-white/95 backdrop-blur-sm animate-pop-in">
            {/* Trophy Icon */}
            <div className="w-16 h-16 rounded-3xl bg-[var(--primary)] border-2 border-[var(--ink)] shadow-[0_4px_0_var(--ink)] flex items-center justify-center animate-bounce">
              <Trophy className="w-8 h-8 text-[var(--ink)]" />
            </div>

            <div>
              <span className="text-[11px] font-heading font-black text-[var(--coral-deep)] uppercase tracking-wider">
                Hết Giờ! Chiến Lợi Phẩm
              </span>
              <h2 className="text-2xl font-heading font-black text-[var(--ink)]">
                {score >= 20
                  ? '🏆 Senior Debugger!'
                  : score >= 10
                    ? '✨ QA Master!'
                    : '🐾 Junior Hunter!'}
              </h2>
              <p className="text-xs text-[var(--ink-soft)] font-medium">
                Bạn đã bắt thành công <b>{score} bug</b> (Combo cao nhất: <b>x{maxCombo}</b>)!
              </p>
            </div>

            {/* Rewards Card */}
            <div className="w-full max-w-[280px] p-3 rounded-2xl bg-[var(--mint-tint)] border-2 border-[var(--ink)] shadow-[0_2.5px_0_var(--ink)] flex flex-col gap-1.5 text-left">
              <span className="text-[10px] font-heading font-black text-[var(--mint-deep)] uppercase">
                🎁 Phần thưởng đã cộng vào ví:
              </span>

              {claimedReward ? (
                <div className="flex flex-col gap-1 text-xs font-heading font-extrabold text-[var(--ink)]">
                  <div className="flex items-center justify-between">
                    <span>Thức ăn nhận được:</span>
                    <span className="text-[var(--primary-deep)] font-black">
                      {claimedReward.rewardFoodName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>EXP nạp vào:</span>
                    <span className="text-[var(--mint-deep)]">+{claimedReward.expGained} EXP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Hạnh phúc:</span>
                    <span className="text-[var(--coral-deep)]">
                      +{claimedReward.happinessGained} 💖
                    </span>
                  </div>
                  {claimedReward.leveledUp && (
                    <div className="text-center py-1 mt-1 rounded-xl bg-[var(--primary)] text-[var(--ink)] font-black text-xs animate-pulse">
                      🎉 CHÚC MỪNG BÉ PET ĐÃ LÊN LEVEL!
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs text-[var(--ink-soft)] font-medium">
                  Đang ghi nhận phần thưởng vào túi đồ...
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={startGame}
                className="btn-chunky btn-chunky-primary px-5 py-2.5 text-xs font-heading font-black flex items-center gap-1.5 shadow-[0_3px_0_var(--ink)] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi Lại 🔄</span>
              </button>

              {onBackToPet && (
                <button
                  onClick={onBackToPet}
                  className="px-5 py-2.5 rounded-2xl border-2 border-[var(--ink)] bg-white text-xs font-heading font-black text-[var(--ink)] shadow-[0_3px_0_var(--ink)] active:translate-y-[2px] active:shadow-none cursor-pointer"
                >
                  🐾 Về Chăm Bé
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================
          3. CUTE HOW-TO-PLAY GUIDE CARD
          =================================================================== */}
      <div className="card-sticker p-3.5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-100 border-2 border-[var(--ink)] flex items-center justify-center shrink-0 text-base">
          💡
        </div>
        <div className="text-left">
          <h4 className="text-xs font-heading font-black text-[var(--ink)]">
            Mẹo gom combo diệt bug
          </h4>
          <p className="text-[11px] text-[var(--ink-soft)] font-medium leading-relaxed mt-0.5">
            Chạm liên tục dưới 0.9s để kích hoạt <b>Combo x2, x3</b> nhân đôi điểm số! Bọ vàng ⚡ và bọ NullPointer 💥 cho điểm cao nhất!
          </p>
        </div>
      </div>
    </div>
  );
};
