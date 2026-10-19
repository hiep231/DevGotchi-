import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Play, Pause, RotateCcw, Clock, CheckCircle2, Award } from 'lucide-react';
import { usePetStore } from '../store/usePetStore';
import { useCompleteSessionMutation, useFoodsQuery } from '../hooks/usePetQueries';

const TAGS = ['Frontend', 'Backend', 'Bugfix', 'LeetCode', 'Design'];

export const PomodoroTimer: React.FC = () => {
  const { pet, setMood, foods: fallbackFoods } = usePetStore();
  const { data: foods = fallbackFoods } = useFoodsQuery();
  const sessionMutation = useCompleteSessionMutation();

  const [mode, setMode] = useState<'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'>('FOCUS');
  const [selectedTag, setSelectedTag] = useState('Frontend');
  const [duration, setDuration] = useState(25 * 60); // 25 mins in seconds
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [lastReward, setLastReward] = useState<{ exp: number; leveledUp: boolean } | null>(null);

  // Switch modes
  const handleModeChange = (newMode: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK') => {
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

  // Complete session handler
  const handleCompleteSession = () => {
    if (mode === 'FOCUS' && pet) {
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
    if (!isRunning && mode === 'FOCUS') {
      setMood('FOCUSING');
    } else if (isRunning && mode === 'FOCUS') {
      setMood('HAPPY');
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    if (mode === 'FOCUS') setMood('HAPPY');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
      {/* Header & Modes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white font-['Fredoka']">Focus Pomodoro</h3>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => handleModeChange('FOCUS')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mode === 'FOCUS' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Focus 25m
            </button>
            <button
              onClick={() => handleModeChange('SHORT_BREAK')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mode === 'SHORT_BREAK' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nghỉ 5m
            </button>
            <button
              onClick={() => handleModeChange('LONG_BREAK')}
              className={`px-3 py-1 rounded-lg transition-all ${
                mode === 'LONG_BREAK' ? 'bg-indigo-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nghỉ 15m
            </button>
          </div>
        </div>

        {/* Tags Selection */}
        {mode === 'FOCUS' && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <span className="text-[11px] text-slate-400 mr-1">Chủ đề:</span>
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  selectedTag === tag
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Timer Display */}
      <div className="flex flex-col items-center justify-center my-4 py-2 relative">
        {/* Circular Progress Bar Background */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-slate-800"
              strokeWidth="6"
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
              strokeWidth="6"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-4xl md:text-5xl font-black text-white font-['Fredoka'] tracking-tight">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
              {isRunning ? '🔥 Đang tập trung' : 'Sẵn sàng'}
            </span>
          </div>
        </div>

        {/* Congratulation Toast */}
        {lastReward && (
          <div className="absolute -bottom-2 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
            <Award className="w-4 h-4" />
            + {lastReward.exp} EXP & Nhận thức ăn mới! {lastReward.leveledUp ? '🎉 LEVEL UP!' : ''}
          </div>
        )}
      </div>

      {/* Timer Controls */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <button
          onClick={handleReset}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-all active:scale-95 cursor-pointer"
          title="Đặt lại"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={togglePlay}
          className={`px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer font-['Fredoka'] text-base ${
            isRunning
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
              : 'bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-110 text-slate-950 shadow-cyan-400/25'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" /> Tạm dừng
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" /> Bắt đầu ngay
            </>
          )}
        </button>

        <button
          onClick={handleCompleteSession}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-all active:scale-95 cursor-pointer"
          title="Hoàn thành sớm phiên này"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </button>
      </div>
    </div>
  );
};
