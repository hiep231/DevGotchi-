import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Play, Pause, RotateCcw, Clock, CheckCircle2, Award } from 'lucide-react';
import { usePetStore } from '../store/usePetStore';
import { useCompleteSessionMutation, useFoodsQuery } from '../hooks/usePetQueries';
import { tg } from '../utils/telegram';

const TAGS = ['Frontend', 'Backend', 'Bugfix', 'LeetCode', 'Design'];

export const PomodoroTimer: React.FC = () => {
  const { pet, setMood, foods: fallbackFoods } = usePetStore();
  const { data: foods = fallbackFoods } = useFoodsQuery();
  const sessionMutation = useCompleteSessionMutation();

  const [mode, setMode] = useState<'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'>('FOCUS');
  const [selectedTag, setSelectedTag] = useState('Frontend');
  const [duration, setDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [lastReward, setLastReward] = useState<{ exp: number; leveledUp: boolean } | null>(null);

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
            setLastReward({ exp: data.expGained, leveledUp: data.leveledUp });
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
            });
            setTimeout(() => setLastReward(null), 6000);
          },
        }
      );
    }
  };

  const togglePlay = () => {
    tg.haptic.impact('medium');
    if (!isRunning && mode === 'FOCUS') {
      setMood('FOCUSING');
    } else if (isRunning && mode === 'FOCUS') {
      setMood('HAPPY');
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    tg.haptic.selection();
    setIsRunning(false);
    setTimeLeft(duration);
    if (mode === 'FOCUS') setMood('HAPPY');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="soft-card p-4 md:p-5 space-y-3.5">
      {/* Header & Modes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-black text-white font-['Fredoka']">Focus Pomodoro</h3>
        </div>

        {/* Tactile Mode Switcher */}
        <div className="flex p-1 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] font-black">
          <button
            onClick={() => handleModeChange('FOCUS')}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              mode === 'FOCUS'
                ? 'bg-cyan-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            25m Focus
          </button>
          <button
            onClick={() => handleModeChange('SHORT_BREAK')}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              mode === 'SHORT_BREAK'
                ? 'bg-emerald-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5m Nghỉ
          </button>
          <button
            onClick={() => handleModeChange('LONG_BREAK')}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
              mode === 'LONG_BREAK'
                ? 'bg-indigo-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            15m
          </button>
        </div>
      </div>

      {/* Tags Carousel */}
      {mode === 'FOCUS' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0 mr-1">Tag:</span>
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                tg.haptic.selection();
                setSelectedTag(tag);
              }}
              className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                selectedTag === tag
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-xs'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Circular Progress & Time Display */}
      <div className="flex flex-col items-center justify-center py-1 relative">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-slate-950/80"
              strokeWidth="7"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`${
                mode === 'FOCUS'
                  ? 'text-cyan-400'
                  : mode === 'SHORT_BREAK'
                  ? 'text-emerald-400'
                  : 'text-indigo-400'
              } transition-all duration-300`}
              strokeWidth="7"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-black text-white font-['Fredoka'] tracking-tight">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
              {isRunning ? '🔥 Đang tập trung' : 'Sẵn sàng'}
            </span>
          </div>
        </div>

        {/* Celebration Toast */}
        {lastReward && (
          <div className="absolute -bottom-1 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black text-[11px] px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce z-20">
            <Award className="w-3.5 h-3.5" />
            + {lastReward.exp} EXP & Nhận quà! {lastReward.leveledUp ? '🎉 LEVEL UP!' : ''}
          </div>
        )}
      </div>

      {/* 3D Tactile Action Controls */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={handleReset}
          className="w-12 h-12 btn-3d-slate rounded-2xl"
          title="Đặt lại"
        >
          <RotateCcw className="w-4 h-4 text-slate-300" />
        </button>

        <button
          onClick={togglePlay}
          className={`flex-1 py-3.5 ${
            isRunning ? 'btn-3d-amber' : 'btn-3d-cyan'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-slate-950" /> Tạm dừng
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-slate-950" /> Bắt đầu Focus
            </>
          )}
        </button>

        <button
          onClick={handleCompleteSession}
          className="w-12 h-12 btn-3d-slate rounded-2xl"
          title="Hoàn thành sớm"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </button>
      </div>
    </div>
  );
};
