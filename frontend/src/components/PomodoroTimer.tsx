import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Play, Pause, RotateCcw, Clock, Sparkles } from 'lucide-react';
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
  const { pet, setMood, foods: fallbackFoods } = usePetStore();
  const { data: foods = fallbackFoods } = useFoodsQuery();
  const sessionMutation = useCompleteSessionMutation();

  const [activeRoleCategory, setActiveRoleCategory] = useState('ALL');
  const [mode, setMode] = useState<'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'>('FOCUS');
  const [selectedTag, setSelectedTag] = useState('DeepWork');
  const [duration, setDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [rewardToast, setRewardToast] = useState<{ exp: number; leveledUp: boolean } | null>(null);

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
    </div>
  );
};
