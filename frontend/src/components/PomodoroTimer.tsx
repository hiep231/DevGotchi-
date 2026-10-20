import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Play, Pause, RotateCcw, Clock, Sparkles, ShieldAlert, HeartCrack, AlertTriangle } from 'lucide-react';
import { usePetStore } from '../store/usePetStore';
import { useCompleteSessionMutation, useFoodsQuery } from '../hooks/usePetQueries';
import { tg } from '../utils/telegram';
import { IconButton } from './ui/IconButton';
import { Toast } from './ui/Toast';
import { STARTER_PETS } from '../data/petConfigs';
import { MASCOT_IMAGES } from './3d/PetCanvas';
import { spawnFloatingReaction } from './ui/TapEffectOverlay';

export interface RoleCategory {
  id: string;
  name: string;
  icon: string;
  tags: string[];
}

export const ROLE_CATEGORIES: RoleCategory[] = [
  {
    id: 'ALL',
    name: 'Tất cả',
    icon: '⚡',
    tags: ['DeepWork', 'Coding', 'Figma', 'TestCase', 'Meeting', 'Learning'],
  },
  {
    id: 'DEV',
    name: 'Dev',
    icon: '💻',
    tags: ['Coding', 'Bugfix', 'CodeReview', 'Refactor', 'API', 'Deploy'],
  },
  {
    id: 'QA',
    name: 'QA & Test',
    icon: '🔍',
    tags: ['TestCase', 'BugHunter', 'Regression', 'VerifyPR', 'E2ETest', 'EdgeCase'],
  },
  {
    id: 'DESIGN',
    name: 'Design',
    icon: '🎨',
    tags: ['Figma', 'Wireframe', 'DesignSystem', 'Prototype', 'UIReview', 'Branding'],
  },
  {
    id: 'PRODUCT',
    name: 'Product',
    icon: '📋',
    tags: ['PRD', 'SprintPlanning', 'UserStory', 'Roadmap', 'Backlog', 'Analytics'],
  },
];

export const PomodoroTimer: React.FC = () => {
  const { pet, setMood, penalizeDistraction, foods: fallbackFoods } = usePetStore();
  const { data: foods = fallbackFoods } = useFoodsQuery();
  const sessionMutation = useCompleteSessionMutation();

  const [activeRoleCategory, setActiveRoleCategory] = useState('ALL');
  const [mode, setMode] = useState<'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'>('FOCUS');
  const [selectedTag, setSelectedTag] = useState('DeepWork');
  const [duration, setDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [rewardToast, setRewardToast] = useState<{ exp: number; leveledUp: boolean } | null>(null);

  // Strict Mode & Penalty State
  const [isStrictMode, setIsStrictMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('devgotchi_strict_mode') !== 'false';
    } catch {
      return true;
    }
  });
  const [warningToast, setWarningToast] = useState<string | null>(null);
  const [penaltyModal, setPenaltyModal] = useState<{ awaySeconds: number; petQuote: string } | null>(null);
  const leaveTimestampRef = useRef<number | null>(null);

  const config = pet ? STARTER_PETS.find((p) => p.id === pet.type) || STARTER_PETS[0] : null;

  const handleModeChange = (newMode: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK') => {
    tg.haptic.selection();
    setIsRunning(false);
    setMode(newMode);
    let seconds = 25 * 60;
    if (newMode === 'SHORT_BREAK') seconds = 5 * 60;
    if (newMode === 'LONG_BREAK') seconds = 15 * 60;
    setDuration(seconds);
    setTimeLeft(seconds);
    if (newMode !== 'FOCUS') {
      setMood('HAPPY');
    }
  };

  // Timer Tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleCompleteSession();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  // Anti-Distraction Strict Mode Tracker (detect leaving Telegram chat / minimizing app)
  useEffect(() => {
    if (!isRunning || mode !== 'FOCUS' || !isStrictMode) {
      leaveTimestampRef.current = null;
      return;
    }

    const checkVisibility = () => {
      if (document.visibilityState === 'hidden') {
        leaveTimestampRef.current = Date.now();
      } else if (document.visibilityState === 'visible' && leaveTimestampRef.current) {
        const awaySeconds = Math.round((Date.now() - leaveTimestampRef.current) / 1000);
        leaveTimestampRef.current = null;

        if (awaySeconds >= 2 && awaySeconds <= 10) {
          // Grace period warning!
          tg.haptic.notification('warning');
          setWarningToast(`⚠️ Bạn vừa rời phiên ${awaySeconds}s! Mau tập trung lại kẻo bị phạt nhé!`);
        } else if (awaySeconds > 10) {
          // PENALTY FIRED!
          setIsRunning(false);
          setTimeLeft(duration);
          penalizeDistraction(15);
          tg.haptic.notification('error');

          if (typeof window !== 'undefined') {
            const x = window.innerWidth / 2;
            const y = 300;
            spawnFloatingReaction(x, y, '-15 💔 • Phạt rời app!', '#FF6B6B', '💔');
          }

          let quote = 'Sen bỏ đi xem tin nhắn khác làm hỏng phiên tập trung rồi huhu! 😢';
          if (pet) {
            if (pet.type === 'BYTEY') {
              quote = 'Huhu... sen bỏ đi lướt tin nhắn làm màu sắc prototype bị lệch hết rồi! 😿';
            } else if (pet.type === 'PUFFY') {
              quote = 'Ôi không... sếp đi hóng drama làm cháy cả roadmap sprint rồi! 🐡';
            } else if (pet.type === 'OCTY') {
              quote = 'Trời ơi... sen lơ là một cái là bug tràn lan không kịp bắt! 🐙';
            } else if (pet.type === 'GOLEMY') {
              quote = 'Toang rồi... bỏ đi xem tin nhắn làm server crash 500 mất rồi sen ơi! 🦕';
            }
          }

          setPenaltyModal({ awaySeconds, petQuote: quote });
        }
      }
    };

    const handleBlur = () => {
      if (!leaveTimestampRef.current) leaveTimestampRef.current = Date.now();
    };

    const handleFocus = () => {
      checkVisibility();
    };

    document.addEventListener('visibilitychange', checkVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', checkVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isRunning, mode, isStrictMode, duration, pet, penalizeDistraction]);

  const handleCompleteSession = () => {
    if (mode === 'FOCUS' && pet) {
      tg.haptic.notification('success');
      const minutes = Math.round(duration / 60);
      sessionMutation.mutate(
        { minutes, tag: selectedTag, pet, foods },
        {
          onSuccess: (data) => {
            setRewardToast({ exp: data.expGained, leveledUp: data.leveledUp });
            if (typeof window !== 'undefined') {
              const x = window.innerWidth / 2;
              const y = 300;
              spawnFloatingReaction(x, y, `+${data.expGained} EXP • Hoàn thành! 🎉`, '#2EC4B6', '⭐');
            }
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
            });
          },
        }
      );
    }
  };

  const togglePlay = () => {
    tg.haptic.impact('medium');
    if (typeof window !== 'undefined') {
      const x = window.innerWidth / 2;
      const y = 320;
      spawnFloatingReaction(x, y, !isRunning ? '🔥 Bắt đầu tập trung!' : '⏸️ Tạm dừng', '#FFB703', !isRunning ? '⏱️' : '⏸️');
    }
    if (!isRunning && mode === 'FOCUS') {
      setMood('FOCUSING');
    } else if (isRunning && mode === 'FOCUS') {
      setMood('HAPPY');
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    tg.haptic.selection();
    if (typeof window !== 'undefined') {
      const x = window.innerWidth / 2;
      const y = 320;
      spawnFloatingReaction(x, y, '🔄 Đặt lại đồng hồ', '#6B6890', '⏱️');
    }
    setIsRunning(false);
    setTimeLeft(duration);
    if (mode === 'FOCUS') setMood('HAPPY');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="space-y-3.5">
      {/* Toast Notification upon session complete */}
      <Toast
        isOpen={Boolean(rewardToast)}
        message={`Hoàn thành phiên Pomodoro! +${rewardToast?.exp ?? 0} EXP`}
        subMessage={rewardToast?.leveledUp ? '🎉 CHÚC MỪNG BÉ PET ĐÃ LÊN CẤP!' : 'Đã thưởng thêm 1 món ăn ngẫu nhiên vào túi!'}
        type="reward"
        onClose={() => setRewardToast(null)}
      />

      {/* Mode Switcher Tabs */}
      <div className="flex p-1.5 rounded-2xl bg-white border-2 border-[var(--ink)] shadow-[0_3px_0_var(--ink)]">
        <button
          onClick={() => handleModeChange('FOCUS')}
          className={`flex-1 py-1.5 rounded-xl font-heading font-extrabold text-xs transition-all cursor-pointer ${
            mode === 'FOCUS'
              ? 'bg-[var(--primary)] text-[var(--ink)] border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)]'
              : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          25m Focus
        </button>
        <button
          onClick={() => handleModeChange('SHORT_BREAK')}
          className={`flex-1 py-1.5 rounded-xl font-heading font-extrabold text-xs transition-all cursor-pointer ${
            mode === 'SHORT_BREAK'
              ? 'bg-[var(--mint)] text-white border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)]'
              : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          5m Nghỉ ngắn
        </button>
        <button
          onClick={() => handleModeChange('LONG_BREAK')}
          className={`flex-1 py-1.5 rounded-xl font-heading font-extrabold text-xs transition-all cursor-pointer ${
            mode === 'LONG_BREAK'
              ? 'bg-[var(--sky)] text-[var(--ink)] border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)]'
              : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          15m Nghỉ dài
        </button>
      </div>

      {/* Strict Focus Anti-Distraction Toggle Card */}
      {mode === 'FOCUS' && (
        <div className="card-sticker p-2.5 bg-white flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 border-[var(--ink)] shadow-xs transition-colors shrink-0 ${
                isStrictMode ? 'bg-[var(--coral-tint)] text-[var(--coral-deep)]' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-heading font-black text-[var(--ink)] flex items-center gap-1.5">
                <span>Kỷ Luật Thép</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-heading font-black ${
                    isStrictMode ? 'bg-[var(--coral)] text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isStrictMode ? 'BẬT' : 'TẮT'}
                </span>
              </span>
              <span className="text-[10px] text-[var(--ink-soft)] font-semibold mt-0.5">
                Phạt trừ 15 💖 nếu thoát ra xem tin nhắn Telegram (&gt;10s)
              </span>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isStrictMode}
            onClick={() => {
              tg.haptic.selection();
              const next = !isStrictMode;
              setIsStrictMode(next);
              try {
                localStorage.setItem('devgotchi_strict_mode', String(next));
              } catch {}
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-[var(--ink)] transition-colors duration-200 ease-in-out focus:outline-none ${
              isStrictMode ? 'bg-[var(--coral)]' : 'bg-[#E5E0D8]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white border border-[var(--ink)] shadow-sm transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                isStrictMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}

      {/* Multi-Role Tag Selector (Dev, QA, Design, Product, All) */}
      {mode === 'FOCUS' && (
        <div className="space-y-1.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {ROLE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  tg.haptic.selection();
                  setActiveRoleCategory(cat.id);
                }}
                className={`text-[11px] font-heading font-extrabold px-2.5 py-1 rounded-full transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  activeRoleCategory === cat.id
                    ? 'bg-[var(--primary)] text-[var(--ink)] border border-[var(--ink)] shadow-xs'
                    : 'bg-white/80 text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--ink)]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Active Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(ROLE_CATEGORIES.find((c) => c.id === activeRoleCategory)?.tags || []).map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  tg.haptic.selection();
                  setSelectedTag(tag);
                }}
                className={`text-xs px-3 py-1 rounded-full font-heading font-bold transition-all shrink-0 cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-[var(--sky-tint)] text-[var(--sky-deep)] border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)]'
                    : 'bg-white text-[var(--ink-soft)] border border-[var(--line)] hover:border-[var(--ink)]'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4.5 Big Clean Circular Timer Card */}
      <div className="card-sticker p-6 flex flex-col items-center justify-center relative overflow-hidden bg-white">
        {/* Soft Background Accents */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="43"
              className="text-[#F2ECE1]"
              strokeWidth="7"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Active Colored Progress */}
            <circle
              cx="50"
              cy="50"
              r="43"
              style={{
                color: mode === 'FOCUS' ? 'var(--sky)' : 'var(--mint)',
              }}
              strokeWidth="7"
              strokeDasharray="270"
              strokeDashoffset={270 - (270 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              className="transition-all duration-300"
            />
          </svg>

          {/* Center Digital Clock */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-4xl font-heading font-black text-[var(--ink)] tracking-tight tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-[var(--ink-soft)] mt-1 flex items-center gap-1">
              {isRunning ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[var(--coral)] animate-ping" />
                  Đang tập trung
                </>
              ) : (
                'Sẵn sàng làm việc'
              )}
            </span>
          </div>
        </div>

        {/* Mini Cheering Pet Avatar Beside Clock */}
        {pet && config && (
          <div className="flex items-center gap-2.5 mt-4 px-3.5 py-1.5 rounded-full bg-[var(--bg)] border-2 border-[var(--ink)] shadow-[0_2px_0_var(--ink)]">
            <img
              src={
                pet.type === 'GOLEMY'
                  ? isRunning
                    ? '/dino_expressions/dino_excited.png'
                    : '/dino_expressions/dino_happy.png'
                  : MASCOT_IMAGES[pet.type] || '/mascot_puffy.png'
              }
              alt={config.name}
              className={`w-7 h-7 object-contain ${isRunning ? 'animate-bounce' : 'animate-float-gentle'}`}
            />
            <span className="text-xs font-heading font-bold text-[var(--ink)]">
              {(() => {
                const petName = pet.customName || config.name;
                if (!isRunning) return `${petName} đang ngồi cạnh sẵn sàng cổ vũ bạn!`;
                const t = selectedTag.toLowerCase();
                if (t.includes('test') || t.includes('bug') || t.includes('edge')) {
                  return `🔍 ${petName} soi bug cùng bạn, test case pass 100%!`;
                }
                if (t.includes('figma') || t.includes('design') || t.includes('wireframe') || t.includes('proto')) {
                  return `🎨 ${petName} ngắm từng đường nét pixel tuyệt mỹ của bạn!`;
                }
                if (t.includes('code') || t.includes('api') || t.includes('deploy') || t.includes('refactor')) {
                  return `💻 ${petName} cổ vũ bạn gõ code mượt mà không bug!`;
                }
                if (t.includes('prd') || t.includes('sprint') || t.includes('roadmap') || t.includes('story')) {
                  return `📋 ${petName} chúc sprint của bạn về đích ngoạn mục!`;
                }
                return `⚡ ${petName} đang đồng hành cùng bạn tập trung cao độ!`;
              })()}
            </span>
          </div>
        )}
      </div>

      {/* Chunky Primary Full-Width Action Button (56px) + Reset Button */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={togglePlay}
          className={`flex-1 h-14 btn-chunky text-base flex items-center justify-center gap-2.5 ${
            isRunning ? 'btn-chunky-secondary' : 'btn-chunky-primary'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-[var(--ink)]" />
              <span>Tạm dừng</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-[var(--ink)]" />
              <span>Bắt đầu phiên ({Math.round(duration / 60)} phút)</span>
            </>
          )}
        </button>

        <IconButton
          variant="sticker"
          size={56}
          onClick={handleReset}
          title="Đặt lại đồng hồ"
        >
          <RotateCcw className="w-5 h-5 text-[var(--ink)]" />
        </IconButton>
      </div>

      {/* Warning Grace Period Toast */}
      {warningToast && (
        <Toast
          message={warningToast}
          type="warning"
          isOpen={!!warningToast}
          onClose={() => setWarningToast(null)}
        />
      )}

      {/* 🚨 Strict Mode Penalty Modal Overlay */}
      {penaltyModal && (
        <div className="fixed inset-0 z-50 bg-[#1B2A4A]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="card-sticker max-w-sm w-full bg-white p-5 flex flex-col items-center text-center space-y-3.5 shadow-2xl animate-pop-in border-3 border-[var(--coral-deep)] relative">
            {/* Header Alarm Icon & Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-[var(--coral-tint)] border-2 border-[var(--coral-deep)] flex items-center justify-center shadow-md">
                <HeartCrack className="w-8 h-8 text-[var(--coral-deep)] animate-bounce" />
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[var(--coral)] text-white text-[9px] font-heading font-black rounded-full border border-[var(--ink)] shadow-xs">
                -15 💖
              </span>
            </div>

            {/* Title & Speech */}
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-heading font-extrabold border border-rose-300 mb-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>VI PHẠM KỶ LUẬT THÉP</span>
              </div>
              <h3 className="text-lg font-heading font-black text-[var(--ink)] leading-tight">
                Phiên Tập Trung Bị Hủy!
              </h3>
            </div>

            {/* Pet Blame Quote Bubble */}
            <div className="p-3 bg-[var(--bg)] border-2 border-[var(--ink)] rounded-2xl text-xs font-heading font-bold text-[var(--ink)] shadow-xs">
              "{penaltyModal.petQuote}"
            </div>

            {/* Penalty Breakdown */}
            <div className="w-full bg-[#FFF6E5] border border-[var(--ink)]/20 rounded-xl p-2.5 text-left text-xs space-y-1">
              <div className="flex justify-between items-center text-[var(--ink-soft)] font-semibold">
                <span>Thời gian rời app:</span>
                <span className="font-heading font-black text-[var(--coral-deep)]">{penaltyModal.awaySeconds} giây</span>
              </div>
              <div className="flex justify-between items-center text-[var(--ink-soft)] font-semibold">
                <span>Hạn mức cho phép:</span>
                <span className="font-heading font-black text-[var(--ink)]">10 giây</span>
              </div>
              <div className="flex justify-between items-center text-[var(--ink-soft)] font-semibold pt-1 border-t border-[var(--line)]">
                <span>Hình phạt áp dụng:</span>
                <span className="font-heading font-black text-rose-600">-15 Hạnh phúc & Chóng mặt @@</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                tg.haptic.impact('medium');
                setPenaltyModal(null);
              }}
              className="btn-chunky btn-chunky-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 shadow-[0_3px_0_var(--ink)]"
            >
              <span>Tôi hiểu rồi, bắt đầu lại nào! 🚀</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
