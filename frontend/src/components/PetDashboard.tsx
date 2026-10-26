import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Moon,
  Sun,
  Hand,
  RotateCcw,
  Heart,
  Utensils,
  Smile,
  Timer,
  Sparkles,
  Share2,
  Gamepad2,
  AlertTriangle,
} from 'lucide-react';
import { usePetStore } from '../store/usePetStore';
import { STARTER_PETS } from '../data/petConfigs';
import { PetCanvas, MASCOT_IMAGES } from './3d/PetCanvas';
import { FoodTray } from './FoodTray';
import { PomodoroTimer } from './PomodoroTimer';
import { CatchBugGame } from './minigame/CatchBugGame';
import { AfkAdventureModal } from './afk/AfkAdventureModal';
import { useResetPetMutation } from '../hooks/usePetQueries';
import { tg } from '../utils/telegram';
import { petApi } from '../api/petApi';
import { StarterSelection } from './StarterSelection';
import { MascotDemo } from './mascot/MascotDemo';
import { MascotType } from './mascot/types';
import { PetType } from '../types/pet';
import { IconButton } from './ui/IconButton';
import { ProgressBar } from './ui/ProgressBar';
import { spawnFloatingReaction } from './ui/TapEffectOverlay';
import { Toast } from './ui/Toast';

interface RoleTheme {
  defaultGreeting: string;
  wakeQuote: string;
}

const ROLE_THEMES: Record<PetType, RoleTheme> = {
  BYTEY: {
    defaultGreeting: 'Chào sen designer! Hôm nay chúng ta sẽ nắn pixel hay vẽ prototype nào? ✨',
    wakeQuote: 'Oa... đã ngủ dậy rồi, sẵn sàng vẽ tiếp prototype nào! ✨',
  },
  PUFFY: {
    defaultGreeting: 'Chào sếp PO/PM! Hôm nay chúng ta sẽ chốt sprint hay tối ưu roadmap nào? 📊',
    wakeQuote: 'Oa... đã ngủ dậy rồi, sẵn sàng chốt sprint mới nào! 📊',
  },
  OCTY: {
    defaultGreeting: 'Chào dũng sĩ QA! Hôm nay chúng ta sẽ rà soát và săn lùng con bug nào đây? 🔍',
    wakeQuote: 'Oa... đã ngủ dậy rồi, sẵn sàng săn lùng bug tiếp nào! 🔍',
  },
  GOLEMY: {
    defaultGreeting: 'Chào người anh em coder! Hôm nay chúng ta sẽ refactor hay code tính năng nào đây? 💻',
    wakeQuote: 'Oa... đã ngủ dậy rồi, sẵn sàng code tiếp thôi! 💻',
  },
};

type ActiveTab = 'PET' | 'GAME' | 'FOCUS' | 'FOOD';

export const PetDashboard: React.FC = () => {
  const resetMutation = useResetPetMutation();
  const {
    pet,
    isFeeding,
    activeFoodFeeding,
    feedAnimKey,
    pokeAnimKey,
    pokePet,
    setMood,
    toggleSleep,
    afkAdventure,
    setAfkAdventure,
  } = usePetStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'game' || tabParam === 'minigame') return 'GAME';
      if (tabParam === 'focus' || tabParam === 'pomodoro') return 'FOCUS';
      if (tabParam === 'food' || tabParam === 'bag') return 'FOOD';
      const startParam = tg.initDataUnsafe?.start_param || urlParams.get('tgWebAppStartParam');
      if (startParam === 'game' || startParam === 'minigame') return 'GAME';
    }
    return 'PET';
  });
  const [showStudio, setShowStudio] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const lastPokeTimeRef = useRef<number>(0);
  const [speechQuote, setSpeechQuote] = useState<string>(() =>
    pet ? (ROLE_THEMES[pet.type]?.defaultGreeting || ROLE_THEMES.GOLEMY.defaultGreeting) : ROLE_THEMES.GOLEMY.defaultGreeting
  );

  useEffect(() => {
    if (pet) {
      setSpeechQuote(ROLE_THEMES[pet.type]?.defaultGreeting || ROLE_THEMES.GOLEMY.defaultGreeting);
    }
  }, [pet?.type]);

  if (showStudio) {
    const STUDIO_TYPE: Record<string, MascotType> = { PUFFY: 'puffer', GOLEMY: 'dino', BYTEY: 'cat', OCTY: 'octo' };
    return (
      <MascotDemo
        initialType={pet ? STUDIO_TYPE[pet.type] : undefined}
        onClose={() => setShowStudio(false)}
      />
    );
  }

  if (!pet) return <StarterSelection />;

  const config = STARTER_PETS.find((p) => p.id === pet.type) || STARTER_PETS[0];
  const roleTheme = ROLE_THEMES[pet.type] || ROLE_THEMES.GOLEMY;

  // Quick interactions with Haptic Feedback & Anti-Spam Cooldown
  const handlePoke = async () => {
    const now = Date.now();
    if (now - lastPokeTimeRef.current < 1500) {
      // Ignore rapid spam clicks (< 1.5s)
      return;
    }
    lastPokeTimeRef.current = now;

    if (pet.happiness >= 100) {
      tg.haptic.notification('warning');
      setSpeechQuote('Trẫm đang hạnh phúc 100% rồi, sen tập trung code đi nhé! 💖');
      return;
    }

    tg.haptic.impact('medium');
    pokePet();

    // Spawn lively floating reward reaction in the center of the pet
    if (typeof window !== 'undefined') {
      const reactions = ['+3 💖', '+5 EXP ✨', '🐾 Nhột quá!', '🥰 Yêu sen!', '💖 Ngoan ghê!'];
      const text = reactions[Math.floor(Math.random() * reactions.length)];
      const x = window.innerWidth / 2 + (Math.random() - 0.5) * 60;
      const y = 290 + (Math.random() - 0.5) * 40;
      spawnFloatingReaction(x, y, text, '#FF6B8B', '💖');
    }

    const roleQuotes: Record<string, string[]> = {
      BYTEY: [
        'Auto-layout đỉnh chóp, căn lề 8pt grid mượt mà sen ơi!',
        'Giao diện ngọt ngào như kẹo, user nhìn là mê liền!',
        'Nghe lofi và vẽ prototype nào, cảm hứng đang ngập tràn!',
        'Được xoa đầu thích ghê, tăng 3 điểm hạnh phúc nè!',
      ],
      OCTY: [
        'Kính lúp Octy rà soát: Test case pass 100%!',
        'Mọi edge case đều không thoát khỏi 4 xúc tu của trẫm!',
        'Log bug văn minh, fix bug nhiệt tình nào sen ơi!',
        'Zero regression bug hôm nay, chuẩn bị release thôi!',
      ],
      GOLEMY: [
        'Clean code thơm tho, commit liền tay không lo conflict!',
        'Server êm như nhung, không một lỗi 500 nào lọt qua!',
        'Thêm 1 Pomodoro nữa là xong tính năng này rồi!',
        'Ái chà! Nhột quá haha, gõ code tiếp đi nào!',
      ],
      PUFFY: [
        'Sprint này velocity vượt chỉ tiêu, tiến độ đẹp mỹ mãn!',
        'Requirement rõ ràng, user story chuẩn mực 10/10!',
        'Data metrics tuần này tăng trưởng vượt bậc sen ơi!',
        'Nạp thêm caffeine và cùng lên kế hoạch bứt phá nào!',
      ],
    };

    const quotes = roleQuotes[pet.type] || [
      'Được xoa đầu thích ghê, thêm 1 Pomodoro nào!',
      'Hôm nay bạn làm việc đỉnh thật đấy!',
      'Tập trung cao độ, hoàn thành mục tiêu ngày hôm nay nha!',
    ];
    setSpeechQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    try {
      const aiQuote = await petApi.generateSpeech(pet.customName, pet.type, pet.mood);
      if (aiQuote) setSpeechQuote(aiQuote);
    } catch {
      // Fallback preserved
    }
  };

  const handleToggleSleep = () => {
    tg.haptic.impact('light');
    toggleSleep();
    if (typeof window !== 'undefined') {
      const x = window.innerWidth / 2;
      const y = 280;
      spawnFloatingReaction(x, y, pet.isSleeping ? '☀️ Thức dậy làm việc!' : '🌙 Khò khò Zzz...', '#8E7CFF', '💤');
    }
    setSpeechQuote(
      pet.isSleeping
        ? roleTheme.wakeQuote
        : 'Khò khò... trẫm đi ngủ nạp năng lượng đây Zzz'
    );
  };

  const handleShare = async () => {
    tg.haptic.impact('medium');
    const petName = pet.customName || config.name;
    const shareText = `🎮 Mình đang nuôi linh thú ${petName} (Cấp ${pet.level}) trên DevGotchi! Cùng vào cày Pomodoro và nuôi pet công nghệ với mình nhé! 👇`;
    const shareUrl = 'https://t.me/devgotchi_pet_bot';

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.2 },
    });

    tg.share(shareText, shareUrl);

    const copied = await tg.copyToClipboard(`${shareText} ${shareUrl}`);
    if (copied) {
      setShareToast('✨ Đã sao chép link mời! Đang mở Telegram để chia sẻ...');
    }
  };

  const handleResetPet = () => {
    tg.haptic.notification('warning');
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    setShowResetConfirm(false);
    tg.haptic.impact('heavy');
    resetMutation.mutate();
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 select-none relative pb-24">
      {/* ===================================================================
          4.0 USER PROFILE & SHARE BAR
          =================================================================== */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-1 border-b-2 border-[var(--ink)]/10">
        {/* User Info from Telegram (or fallback) */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--ink)] bg-[var(--primary)] text-[var(--ink)] flex items-center justify-center overflow-hidden shrink-0 shadow-[0_1.5px_0_var(--ink)]">
            {tg.user?.photo_url ? (
              <img
                src={tg.user.photo_url}
                alt={tg.user.first_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-heading font-black text-xs">
                {(tg.user?.first_name?.[0] || 'D').toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-heading font-black text-[var(--ink)] truncate">
                {tg.user
                  ? `${tg.user.first_name}${tg.user.last_name ? ' ' + tg.user.last_name : ''}`
                  : 'Developer'}
              </span>
              <span className="w-2 h-2 rounded-full bg-[var(--mint)] shrink-0 shadow-xs animate-pulse" title="Đang online" />
            </div>
            <span className="text-[10px] text-[var(--ink-soft)] font-bold truncate">
              {tg.user?.username ? `@${tg.user.username}` : 'DevGotchi TWA'}
            </span>
          </div>
        </div>

        {/* Share Button (Telegram Mini App Share) */}
        <button
          onClick={handleShare}
          className="btn-chunky py-1.5 px-3 text-xs flex items-center gap-1.5 bg-gradient-to-r from-[var(--sky)] to-[var(--grape)] text-white border-2 border-[var(--ink)] shadow-[0_2.5px_0_var(--ink)] active:translate-y-0.5 cursor-pointer shrink-0"
          title="Chia sẻ linh thú với bạn bè trên Telegram"
        >
          <Share2 className="w-3.5 h-3.5 text-white" />
          <span>Chia sẻ</span>
        </button>
      </div>
      {/* ===================================================================
          4.1 HEADER (Hồ sơ + Chỉ số chuẩn Playful Sticker UI)
          =================================================================== */}
      <header className="flex items-center justify-between gap-2 pt-1 pb-3">
        {/* Left: Avatar + Badge + Name */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            {/* 48px Avatar with 2px Ink Sticker Border */}
            <div
              className="w-12 h-12 rounded-full border-2 border-[var(--ink)] overflow-hidden flex items-center justify-center shadow-[0_3px_0_var(--ink)] p-1"
              style={{ backgroundColor: `${config.primaryColor}25` }}
            >
              <img
                src={MASCOT_IMAGES[pet.type] || '/mascots/puffy_clean.svg'}
                alt={pet.customName || config.name}
                className="w-9 h-9 object-contain drop-shadow-xs"
              />
            </div>
            {/* Level Badge Overlapping Bottom Right */}
            <div className="absolute -bottom-1 -right-1 bg-[var(--grape)] text-white font-heading font-extrabold text-[11px] px-1.5 py-0.2 rounded-full border-2 border-[var(--ink)] shadow-[0_1.5px_0_var(--ink)] leading-none">
              Lv.{pet.level ?? 1}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-heading font-black text-[var(--ink)] leading-tight truncate">
              {pet.customName || config.name}
            </h2>
            <span className="mt-0.5 inline-block max-w-full truncate whitespace-nowrap align-top text-[10px] font-heading font-black px-2 py-0.5 rounded-full bg-[var(--primary-tint)] text-[var(--ink)] border border-[#E09A00]/40 shadow-xs">
              {config.roleBadge}
            </span>
            <div className="hidden min-[380px]:block text-[11px] font-semibold text-[var(--ink-soft)] truncate leading-tight mt-0.5">
              {config.archetype}
            </div>
          </div>
        </div>

        {/* Right: Flat Streak Chip & Reset Icon Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Flat Streak Chip */}
          <div className="chip-sticker bg-[var(--primary-tint)] text-[var(--ink)] py-1 px-2 whitespace-nowrap shrink-0">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
            <span className="tabular-nums text-xs font-black whitespace-nowrap">{pet.streak ?? 1}<span className="hidden min-[380px]:inline"> ngày</span></span>
          </div>

          {/* Studio Playground Button */}
          <IconButton
            variant="sticker"
            size={36}
            onClick={() => setShowStudio(true)}
            title="Mở Studio Thử Nghiệm Animation"
            className="bg-[var(--grape-tint)] text-[var(--grape-deep)] border-2 border-[var(--ink)] shadow-xs shrink-0"
          >
            <Sparkles className="w-4 h-4 text-[var(--grape-deep)]" />
          </IconButton>

          {/* Reset Pet 40px Icon Button */}
          <IconButton
            variant="flat"
            size={36}
            onClick={handleResetPet}
            disabled={resetMutation.isPending}
            title="Đổi thú cưng khác"
            className="shadow-sm shrink-0"
          >
            <RotateCcw className="w-4 h-4 text-[var(--ink-soft)]" />
          </IconButton>
        </div>
      </header>

      {/* ===================================================================
          4.2 THANH EXP (Nhựa bóng + Sticker 2px Ink)
          =================================================================== */}
      <div className="my-1.5 space-y-1">
        <div className="flex justify-between items-center text-xs font-heading font-bold text-[var(--ink)] px-1">
          <span>Kinh nghiệm</span>
          <span className="tabular-nums font-extrabold text-[var(--ink-soft)]">
            {pet.exp ?? 0} / {pet.maxExp ?? 100} EXP
          </span>
        </div>
        <div className="exp-bar-container shadow-[0_2px_0_var(--ink)]">
          <div
            className="exp-bar-fill"
            style={{ width: `${Math.min(100, ((pet.exp ?? 0) / (pet.maxExp ?? 100)) * 100)}%` }}
          />
        </div>
      </div>

      {/* ===================================================================
          TAB CONTENT AREA
          =================================================================== */}
      <main className="my-auto py-2">
        {activeTab === 'PET' && (
          <div className="flex flex-col items-center">
            {/* Speech Bubble (Sticker Card) */}
            <div className="relative mb-2 max-w-xs px-4 py-2.5 bg-white border-2 border-[var(--ink)] rounded-2xl shadow-[0_3px_0_var(--ink)] text-xs font-bold text-[var(--ink)] text-center animate-float-gentle z-20">
              💬 {speechQuote}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-[var(--ink)] rotate-45" />
            </div>

            {/* ===================================================================
                4.3 SÂN KHẤU THÚ CƯNG (Sky Gradient, Flat Clouds, Grassy Platform)
                =================================================================== */}
            <div
              onClick={handlePoke}
              className="relative w-full h-[290px] rounded-3xl border-2 border-[var(--ink)] shadow-[0_4px_0_var(--ink)] overflow-hidden flex flex-col items-center justify-between p-3 select-none cursor-pointer"
              style={{
                background: 'linear-gradient(180deg, var(--bg-sky) 0%, #FFF6E5 100%)',
              }}
            >
              {/* Floating Flat Cloud 1 */}
              <div className="absolute top-4 left-4 animate-cloud-left pointer-events-none opacity-80">
                <svg width="68" height="28" viewBox="0 0 68 28" fill="none">
                  <path
                    d="M14 26H54C60.6 26 66 21 66 15C66 9.4 61.4 4.8 56 4.2C54 1.6 50.8 0 47 0C41.2 0 36.4 3.8 35 9C33.8 8.4 32.4 8 31 8C26 8 22 12 22 17C17.6 17 14 20.6 14 25"
                    fill="#FFFFFF"
                    stroke="#2D2A4A"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              {/* Floating Flat Cloud 2 */}
              <div className="absolute top-8 right-6 animate-cloud-right pointer-events-none opacity-80">
                <svg width="56" height="24" viewBox="0 0 56 24" fill="none">
                  <path
                    d="M12 22H44C49 22 53 18 53 13C53 8.5 49.5 5 45 4.5C43.5 2 40.5 0.5 37 0.5C32.5 0.5 28.5 3.5 27.5 7.5C26.5 7 25.5 6.5 24 6.5C20 6.5 17 9.5 17 13.5C13.5 13.5 10.5 16.5 10.5 20"
                    fill="#FFFFFF"
                    stroke="#2D2A4A"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              {/* 3D Pet WebGL Canvas */}
              <div className="relative w-full h-[220px] flex items-center justify-center z-10 mt-1">
                <PetCanvas
                  type={pet.type}
                  mood={pet.mood}
                  isFeeding={isFeeding}
                  pokeTrigger={pokeAnimKey}
                  feedTrigger={feedAnimKey}
                  className="w-full h-full"
                />

                {/* Feeding Float Animation Banner */}
                {isFeeding && activeFoodFeeding && (
                  <div className="absolute bottom-2 flex flex-col items-center pointer-events-none animate-bounce z-30">
                    <span className="text-sm font-heading font-black text-[var(--mint-deep)] bg-[var(--mint-tint)] border-2 border-[var(--ink)] shadow-[0_3px_0_var(--ink)] px-3 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> +{activeFoodFeeding.hungerRestored} No bụng!
                    </span>
                  </div>
                )}
              </div>

              {/* Grassy Island Pedestal & Shadow Ellipse */}
              <div className="relative w-44 h-8 flex items-center justify-center -mt-4 z-0">
                {/* Soft ground shadow ellipse */}
                <div className="absolute w-36 h-5 bg-[#2D2A4A]/15 rounded-full blur-[2px]" />
                {/* Cute Grassy Island Pedestal */}
                <div className="w-40 h-6 bg-[#A7E8BD] border-2 border-[var(--ink)] rounded-full shadow-[0_3px_0_var(--ink)] flex items-center justify-center">
                  <div className="w-32 h-2.5 bg-[#84D8A2] rounded-full" />
                </div>
              </div>
            </div>

            {/* Quick Action Physical Buttons */}
            <div className="flex items-center gap-2.5 mt-3 flex-wrap justify-center">
              <button
                onClick={handlePoke}
                className="btn-chunky btn-chunky-secondary px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <Hand className="w-4 h-4 text-[var(--coral)]" />
                <span>Chọc bé</span>
              </button>

              <button
                onClick={handleToggleSleep}
                className="btn-chunky btn-chunky-secondary px-4 py-2 text-xs flex items-center gap-1.5"
              >
                {pet.isSleeping ? (
                  <>
                    <Sun className="w-4 h-4 text-[var(--primary)]" />
                    <span>Thức dậy</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-[var(--grape)]" />
                    <span>Cho ngủ</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  tg.haptic.impact('medium');
                  setActiveTab('FOCUS');
                  if (typeof window !== 'undefined') {
                    const x = window.innerWidth / 2;
                    const y = 280;
                    spawnFloatingReaction(x, y, '⏱️ Bắt đầu tập trung!', '#FFB703', '🚀');
                  }
                  setSpeechQuote('Cùng bắt đầu phiên tập trung nào! Cố lên sen ơi! 🚀');
                }}
                className="btn-chunky btn-chunky-primary px-4 py-2 text-xs flex items-center gap-1.5"
                title="Bắt đầu phiên Pomodoro tập trung"
              >
                <Timer className="w-4 h-4 text-[var(--ink)]" />
                <span>Vào việc ⏱️</span>
              </button>
            </div>

            {/* Quick Mini-game 30s Banner */}
            <div
              onClick={() => {
                tg.haptic.impact('medium');
                setActiveTab('GAME');
              }}
              className="w-full mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-100 via-rose-100 to-pink-100 border-2 border-[var(--ink)] shadow-[0_3px_0_var(--ink)] flex items-center justify-between cursor-pointer active:translate-y-[1px] active:shadow-[0_1.5px_0_var(--ink)] hover:border-[var(--primary-deep)] transition-all select-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[var(--primary)] border-2 border-[var(--ink)] flex items-center justify-center text-xl shadow-[0_2px_0_var(--ink)] animate-bounce shrink-0">
                  🎮
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-heading font-black text-[var(--ink)]">
                      Bắt Bug Xả Stress
                    </span>
                    <span className="text-[9px] font-heading font-black bg-rose-500 text-white px-1.5 py-0.2 rounded-full shadow-xs">
                      30s
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--ink-soft)] font-medium line-clamp-1">
                    Nhặt Thạch Docker & Bánh Cá RAM tức thì!
                  </span>
                </div>
              </div>
              <span className="text-xs font-heading font-black px-2.5 py-1 rounded-xl bg-white border border-[var(--ink)] text-[var(--ink)] shadow-xs shrink-0">
                Chơi 🕹️
              </span>
            </div>

            {/* Two Horizontal Vitals Chips (No & Vui with Mini 8px Bar) */}
            <div className="w-full grid grid-cols-2 gap-3 mt-3">
              {/* No Bụng Chip */}
              <div className="card-sticker p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-heading font-extrabold text-[var(--ink)] mb-1.5">
                  <div className="flex items-center gap-1.5 text-[var(--mint-deep)]">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>No bụng</span>
                  </div>
                  <span className="tabular-nums text-[var(--ink)]">{pet.hunger ?? 70}/100</span>
                </div>
                <ProgressBar
                  value={pet.hunger ?? 70}
                  max={100}
                  variant="mint"
                  height={10}
                  showGloss={false}
                />
              </div>

              {/* Vui Vẻ Chip */}
              <div className="card-sticker p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-heading font-extrabold text-[var(--ink)] mb-1.5">
                  <div className="flex items-center gap-1.5 text-[var(--coral-deep)]">
                    <Heart className="w-3.5 h-3.5" />
                    <span>Hạnh phúc</span>
                  </div>
                  <span className="tabular-nums text-[var(--ink)]">{pet.happiness ?? 85}/100</span>
                </div>
                <ProgressBar
                  value={pet.happiness ?? 85}
                  max={100}
                  variant="coral"
                  height={10}
                  showGloss={false}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'GAME' && (
          <div className="animate-pop-in">
            <CatchBugGame onBackToPet={() => setActiveTab('PET')} />
          </div>
        )}

        {activeTab === 'FOCUS' && (
          <div className="animate-pop-in">
            <PomodoroTimer />
          </div>
        )}

        {activeTab === 'FOOD' && (
          <div className="animate-pop-in">
            <FoodTray />
          </div>
        )}
      </main>

      {/* ===================================================================
          4.4 THANH ĐIỀU HƯỚNG DƯỚI (White Sticker Bar with Chunky Sliding Pill)
          =================================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t-2 border-[var(--ink)] rounded-t-[24px] px-3 py-2 shadow-[0_-4px_16px_rgba(45,42,74,0.06)] z-50 flex items-center justify-between gap-1">
        <button
          onClick={() => {
            tg.haptic.selection();
            setActiveTab('PET');
          }}
          className={`cursor-pointer transition-all duration-200 select-none flex-1 flex items-center justify-center ${
            activeTab === 'PET'
              ? 'btn-chunky btn-chunky-primary py-2 px-2 gap-1.5 shadow-[0_2.5px_0_var(--ink)]'
              : 'py-2 flex flex-col items-center text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          <Smile className={`w-5 h-5 ${activeTab === 'PET' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="font-heading font-extrabold text-[11px] whitespace-nowrap">
            {activeTab === 'PET' ? 'Linh Thú' : ''}
          </span>
        </button>

        <button
          onClick={() => {
            tg.haptic.selection();
            setActiveTab('GAME');
          }}
          className={`cursor-pointer transition-all duration-200 select-none flex-1 flex items-center justify-center ${
            activeTab === 'GAME'
              ? 'btn-chunky btn-chunky-primary py-2 px-2 gap-1.5 shadow-[0_2.5px_0_var(--ink)]'
              : 'py-2 flex flex-col items-center text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          <Gamepad2 className={`w-5 h-5 ${activeTab === 'GAME' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="font-heading font-extrabold text-[11px] whitespace-nowrap">
            {activeTab === 'GAME' ? 'Bắt Bug' : ''}
          </span>
        </button>

        <button
          onClick={() => {
            tg.haptic.selection();
            setActiveTab('FOCUS');
          }}
          className={`cursor-pointer transition-all duration-200 select-none flex-1 flex items-center justify-center ${
            activeTab === 'FOCUS'
              ? 'btn-chunky btn-chunky-primary py-2 px-2 gap-1.5 shadow-[0_2.5px_0_var(--ink)]'
              : 'py-2 flex flex-col items-center text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          <Timer className={`w-5 h-5 ${activeTab === 'FOCUS' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="font-heading font-extrabold text-[11px] whitespace-nowrap">
            {activeTab === 'FOCUS' ? 'Focus' : ''}
          </span>
        </button>

        <button
          onClick={() => {
            tg.haptic.selection();
            setActiveTab('FOOD');
          }}
          className={`cursor-pointer transition-all duration-200 select-none flex-1 flex items-center justify-center ${
            activeTab === 'FOOD'
              ? 'btn-chunky btn-chunky-primary py-2 px-2 gap-1.5 shadow-[0_2.5px_0_var(--ink)]'
              : 'py-2 flex flex-col items-center text-[var(--ink-soft)] hover:text-[var(--ink)]'
          }`}
        >
          <Utensils className={`w-5 h-5 ${activeTab === 'FOOD' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="font-heading font-extrabold text-[11px] whitespace-nowrap">
            {activeTab === 'FOOD' ? 'Túi Đồ' : ''}
          </span>
        </button>
      </nav>

      {/* Share Toast */}
      {shareToast && (
        <Toast
          message={shareToast}
          type="reward"
          isOpen={!!shareToast}
          onClose={() => setShareToast(null)}
        />
      )}

      {/* ===================================================================
          RESET PET CONFIRMATION MODAL
          =================================================================== */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="card-sticker bg-white max-w-[320px] w-full p-5 flex flex-col items-center text-center gap-3 animate-pop-in shadow-[0_8px_24px_rgba(45,42,74,0.18)]">
            {/* Warning Mascot / Icon */}
            <div className="w-14 h-14 rounded-3xl bg-amber-100 border-2 border-[var(--ink)] shadow-[0_3px_0_var(--ink)] flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-7 h-7 text-amber-600 stroke-[2.5px]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-heading font-black text-[var(--ink)]">
                Đổi thú cưng khác?
              </h3>
              <p className="text-xs text-[var(--ink-soft)] font-medium leading-relaxed">
                Bạn có chắc muốn chia tay bé <b>{pet.customName}</b> (Level {pet.level}) để nhận nuôi thú cưng khác không? Toàn bộ chỉ số sẽ được đặt lại.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex items-center gap-2 mt-2">
              <button
                onClick={() => {
                  tg.haptic.selection();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 px-3 rounded-2xl border-2 border-[var(--ink)] bg-white text-xs font-heading font-black text-[var(--ink)] shadow-[0_2.5px_0_var(--ink)] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5 fill-[var(--coral-deep)] text-[var(--coral-deep)]" />
                <span>Giữ lại bé</span>
              </button>

              <button
                onClick={handleConfirmReset}
                disabled={resetMutation.isPending}
                className="flex-1 py-2.5 px-3 rounded-2xl border-2 border-[var(--ink)] bg-[var(--coral)] text-xs font-heading font-black text-white shadow-[0_2.5px_0_var(--ink)] active:translate-y-[1px] active:shadow-none hover:bg-[var(--coral-deep)] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {resetMutation.isPending ? (
                  <span>Đang đổi...</span>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 stroke-[2.5px]" />
                    <span>Đồng ý đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          AFK ADVENTURE OFFLINE REWARD MODAL
          =================================================================== */}
      {afkAdventure && pet && (
        <AfkAdventureModal
          afkData={afkAdventure}
          pet={pet}
          onClose={() => setAfkAdventure(null)}
        />
      )}
    </div>
  );
};
