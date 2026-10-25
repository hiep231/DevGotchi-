import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Markup } from 'telegraf';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { calculatePetDecay } from '../pet/pet-decay.util';
import { evaluateAfkAdventure } from '../pet/pet-afk.util';

const PET_SPECIES_NAMES: Record<string, string> = {
  PUFFY: 'Cá Nóc Trí Thức',
  BYTEY: 'Mèo Lofi Sáng Tạo',
  GOLEMY: 'Khủng Long DevOps',
  OCTY: 'Bạch Tuộc Soi Bug',
};

const PET_EMOJIS: Record<string, string> = {
  PUFFY: '🐡',
  BYTEY: '🐱',
  GOLEMY: '🦕',
  OCTY: '🐙',
};

function renderProgressBar(value: number, max: number = 100, length: number = 8): string {
  const filled = Math.min(length, Math.max(0, Math.round((value / max) * length)));
  const empty = length - filled;
  return '🟩'.repeat(filled) + '⬜'.repeat(empty);
}

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot: Telegraf | null = null;
  private readonly activeTimers = new Map<number, NodeJS.Timeout>();
  private readonly chatCooldowns = new Map<number, number>();
  private readonly checkinCache = new Map<number, string>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token || token.trim().length < 10) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured. Bot service skipped.');
      return;
    }

    try {
      this.bot = new Telegraf(token);
      this.registerHandlers();

      // Register Slash Commands Menu with Telegram API
      await this.bot.telegram.setMyCommands([
        { command: 'start', description: '🎮 Khởi động & Mở menu DevGotchi' },
        { command: 'pet', description: '🐾 Xem hồ sơ & chỉ số sinh lực thú cưng' },
        { command: 'bag', description: '🎒 Xem túi đồ & kho thức ăn sẵn có' },
        { command: 'feed', description: '🍖 Cho thú cưng ăn nạp no bụng' },
        { command: 'sleep', description: '💤 Cho thú cưng đi ngủ sạc đầy Năng lượng (100% ⚡)' },
        { command: 'game', description: '🎮 Chơi Mini-game 30s bắt bug xả stress & kiếm đồ ăn' },
        { command: 'task', description: '📋 Mở Web Quản Lý Task (PSOI Task)' },
        { command: 'poke', description: '👋 Xoa đầu, cưng nựng bé cưng (+3 💖)' },
        { command: 'focus', description: '⏱️ Pomodoro tập trung (vd: /focus 25 Coding)' },
        { command: 'checkin', description: '🎁 Điểm danh nhận EXP hàng ngày' },
        { command: 'help', description: '📖 Hướng dẫn chi tiết tất cả câu lệnh' },
      ]);
      this.logger.log('✅ Telegram bot commands registered successfully with Telegram API');

      this.bot.launch(() => {
        this.logger.log('🤖 DevGotchi Telegram Bot launched successfully!');
      });
    } catch (err) {
      this.logger.error('Failed to launch Telegram Bot:', (err as Error).message);
    }
  }

  onModuleDestroy() {
    for (const timeout of this.activeTimers.values()) {
      clearTimeout(timeout);
    }
    this.activeTimers.clear();

    if (this.bot) {
      this.bot.stop('Server shutting down');
    }
  }

  private registerHandlers() {
    if (!this.bot) return;

    // 1. /start command
    this.bot.start(async (ctx) => {
      try {
        const from = ctx.from;
        if (!from) return;

        // Upsert user in database
        const user = await this.prisma.user.upsert({
          where: { telegramId: BigInt(from.id) },
          create: {
            telegramId: BigInt(from.id),
            username: from.username || `user_${from.id}`,
            firstName: from.first_name,
            streak: 1,
          },
          update: {
            username: from.username || undefined,
            firstName: from.first_name || undefined,
            lastActive: new Date(),
          },
          include: { pet: true },
        });

        const pet = user.pet;
        const name = from.first_name || 'bạn';

        if (pet) {
          const emoji = PET_EMOJIS[pet.type] || '🐾';
          const msg =
            `🎮 <b>Chào mừng ${name} trở lại với DevGotchi!</b>\n\n` +
            `${emoji} Bé cưng <b>${pet.name}</b> (Cấp ${pet.level}) đang vẫy tay chào bạn nè!\n\n` +
            `📜 <b>DANH SÁCH LỆNH TƯƠNG TÁC NHANH:</b>\n` +
            `🐾 /pet hoặc /status : Xem chỉ số & thanh sinh lực\n` +
            `🎒 /bag : Xem túi đồ & kho thức ăn sẵn có\n` +
            `🍖 /feed : Mở khay thức ăn công nghệ\n` +
            `💤 /sleep : Cho bé đi ngủ sạc đầy Năng lượng (100% ⚡)\n` +
            `📋 /task : Mở Web Quản Lý Task (PSOI Task)\n` +
            `👋 /poke : Xoa đầu, cưng nựng (+3 Hạnh phúc)\n` +
            `⏱️ /focus <code>25 [tag]</code> : Hẹn giờ Pomodoro tập trung\n` +
            `🎁 /checkin : Điểm danh hàng ngày nhận EXP & quà\n` +
            `📖 /help : Hướng dẫn chi tiết tất cả tính năng\n` +
            `💬 <b>Tâm sự AI:</b> Nhắn bất kỳ câu gì, bé sẽ rep bạn ngay!\n\n` +
            `<i>Hoặc bạn có thể chạm nhanh các nút bên dưới:</i>`;

          await ctx.reply(msg, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('🐾 Xem Thú Cưng', 'pet_status'), Markup.button.callback('🍖 Cho Ăn', 'pet_feed')],
              [Markup.button.callback('🎮 Bắt Bug (Mini-Game)', 'pet_game'), Markup.button.callback('🎒 Túi Đồ', 'pet_bag')],
              [Markup.button.callback('💤 Đi Ngủ (Sạc ⚡)', 'pet_sleep'), Markup.button.callback('🎁 Điểm Danh', 'pet_checkin')],
              [Markup.button.callback('⏱️ Focus 25 phút', 'pet_focus_25'), Markup.button.callback('📖 Trợ Giúp', 'pet_help')],
              [Markup.button.url('📋 Mở PSOI Task', 'https://psoitask.surge.sh/')],
            ]),
          });
        } else {
          const msg =
            `🎮 <b>Chào mừng ${name} đến với DevGotchi!</b>\n` +
            `🐾 Nền tảng nuôi thú ảo 3D kết hợp tăng năng suất Pomodoro dành riêng cho Coder & Designer.\n\n` +
            `👉 <b>Bước 1:</b> Bấm nút <b>"Nuôi Pet 🐾"</b> ở góc dưới màn hình để nhận nuôi 1 trong 4 Linh Thú 3D (Dino DevOps, Mèo Lofi, Cá Nóc RAM, Bạch Tuộc Soi Bug) nhé!\n\n` +
            `📜 <b>DANH SÁCH LỆNH TƯƠNG TÁC:</b>\n` +
            `🐾 /pet : Xem hồ sơ & thanh sinh lực bé cưng\n` +
            `📋 /task : Mở Web Quản Lý Task (PSOI Task)\n` +
            `🍖 /feed : Cho thú cưng ăn nạp năng lượng\n` +
            `👋 /poke : Xoa đầu cưng nựng (+3 Hạnh phúc)\n` +
            `⏱️ /focus <code>25 Coding</code> : Bắt đầu Pomodoro tập trung\n` +
            `🎁 /checkin : Điểm danh hàng ngày nhận EXP\n` +
            `📖 /help : Xem hướng dẫn chi tiết\n` +
            `💬 <b>Trò chuyện:</b> Nhắn bất kỳ câu gì vào chat để trò chuyện cùng AI của thú cưng!`;

          await ctx.reply(msg, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('🎁 Điểm Danh Hàng Ngày', 'pet_checkin')],
              [Markup.button.url('📋 Mở PSOI Task Board', 'https://psoitask.surge.sh/')],
              [Markup.button.callback('📖 Xem Trợ Giúp Lệnh', 'pet_help')],
            ]),
          });
        }
      } catch (err) {
        this.logger.error('/start error:', (err as Error).message);
      }
    });

    // 2. /pet or /status command
    this.bot.command(['pet', 'status'], async (ctx) => {
      await this.sendPetStatus(ctx);
    });

    // 2b. /task or /tasks command (Open PSOI Task Manager)
    this.bot.command(['task', 'tasks'], async (ctx) => {
      await ctx.reply(
        `📋 <b>PSOI TASK - HỆ THỐNG QUẢN LÝ CÔNG VIỆC</b>\n\n` +
        `Quản lý và kiểm tra danh sách nhiệm vụ, công việc của bạn tại đây:\n\n` +
        `🔗 <b>Địa chỉ:</b> https://psoitask.surge.sh/\n\n` +
        `<i>Bấm nút bên dưới để mở ngay trên trình duyệt:</i>`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.url('🚀 Mở PSOI Task Board ↗️', 'https://psoitask.surge.sh/')],
          ]),
        },
      );
    });

    // 2c. /sleep or /rest command (Restore 100% Energy)
    this.bot.command(['sleep', 'rest'], async (ctx) => {
      await this.handleSleep(ctx);
    });

    // 2d. /bag or /inventory command (View Food Bag)
    this.bot.command(['bag', 'inventory'], async (ctx) => {
      await this.handleInventory(ctx);
    });

    // 3. /poke command
    this.bot.command('poke', async (ctx) => {
      await this.handlePoke(ctx);
    });

    // 4. /feed command
    this.bot.command('feed', async (ctx) => {
      await this.handleFeed(ctx);
    });

    // 5. /checkin command
    this.bot.command('checkin', async (ctx) => {
      await this.handleCheckin(ctx);
    });

    // 6. /focus [minutes] [tag]
    this.bot.command('focus', async (ctx) => {
      await this.handleFocusCommand(ctx);
    });

    // 7. /game /play command
    this.bot.command(['game', 'play'], async (ctx) => {
      await this.handleGameCommand(ctx);
    });

    // 8. /help command
    this.bot.command('help', async (ctx) => {
      await this.sendHelpMessage(ctx);
    });
    this.bot.help(async (ctx) => {
      await this.sendHelpMessage(ctx);
    });

    // Inline Button Callbacks
    this.bot.action('pet_status', async (ctx) => {
      await ctx.answerCbQuery();
      await this.sendPetStatus(ctx);
    });

    this.bot.action('pet_poke', async (ctx) => {
      await ctx.answerCbQuery('🐾 Xoa đầu thích ghê!');
      await this.handlePoke(ctx);
    });

    this.bot.action('pet_feed', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleFeed(ctx);
    });

    this.bot.action('pet_bag', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleInventory(ctx);
    });

    this.bot.action('pet_checkin', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleCheckin(ctx);
    });

    this.bot.action('pet_game', async (ctx) => {
      await ctx.answerCbQuery('🎮 Mở Mini-game 30s!');
      await this.handleGameCommand(ctx);
    });

    // In-Chat Quick Smash Mini-game actions
    this.bot.action('quick_smash_start', async (ctx) => {
      await this.handleQuickSmash(ctx);
    });

    this.bot.action('quick_smash_hit', async (ctx) => {
      await this.handleQuickSmashHit(ctx);
    });

    this.bot.action('quick_smash_miss', async (ctx) => {
      await ctx.answerCbQuery('😅 Đập trúng code sạch rồi, hãy tìm con bọ nhé!');
    });

    this.bot.action('pet_sleep', async (ctx) => {
      await ctx.answerCbQuery('💤 Đang cho bé đi ngủ...');
      await this.handleSleep(ctx);
    });

    this.bot.action('pet_help', async (ctx) => {
      await ctx.answerCbQuery();
      await this.sendHelpMessage(ctx);
    });

    this.bot.action('pet_focus_25', async (ctx) => {
      await ctx.answerCbQuery('⏱️ Đã kích hoạt phiên Focus!');
      await this.startFocusSession(ctx, 25, 'Pomodoro');
    });

    this.bot.action(/^adopt_starter_(.+)$/, async (ctx) => {
      const type = ctx.match[1];
      const from = ctx.from;
      if (!from) return;

      const petNames: Record<string, string> = {
        GOLEMY: 'Dino',
        BYTEY: 'Bytey',
        PUFFY: 'Puffy',
        OCTY: 'Octy',
      };
      const name = petNames[type] || 'DevGotchi';

      const petType = type as any;

      const user = await this.prisma.user.upsert({
        where: { telegramId: BigInt(from.id) },
        create: {
          telegramId: BigInt(from.id),
          username: from.username || `user_${from.id}`,
          firstName: from.first_name,
        },
        update: {},
      });

      const pet = await this.prisma.pet.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          type: petType,
          name,
          level: 1,
          exp: 0,
          maxExp: 100,
          hunger: 70,
          energy: 85,
          happiness: 85,
        },
        update: {
          type: petType,
          name,
        },
      });

      await ctx.answerCbQuery('🎉 Nhận nuôi thành công!');
      const emoji = PET_EMOJIS[type] || '🐾';
      await ctx.reply(
        `🎉 <b>CHÚC MỪNG BẠN ĐÃ NHẬN NUÔI THÀNH CÔNG!</b>\n\n` +
        `${emoji} Bé cưng <b>${pet.name}</b> (${PET_SPECIES_NAMES[type]}) đã chính thức đồng hành cùng bạn!\n\n` +
        `Bạn có thể gõ <code>/pet</code> để xem trạng thái hoặc nhắn tin bất kỳ câu gì để trò chuyện nhé!`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🐾 Xem Thú Cưng', 'pet_status'), Markup.button.callback('🍖 Cho Ăn', 'pet_feed')],
            [Markup.button.callback('👋 Xoa Đầu (+3 💖)', 'pet_poke'), Markup.button.callback('🎁 Điểm Danh', 'pet_checkin')],
          ]),
        },
      );
    });

    this.bot.action(/^feed_item_(.+)$/, async (ctx) => {
      const foodId = ctx.match[1];
      await this.executeFeedItem(ctx, foodId);
    });

    // 8. Natural Language Text Chat with Pet Persona (AI Gemini) with Anti-Spam Rate Limit
    this.bot.on('text', async (ctx) => {
      const text = ctx.message.text.trim();
      if (text.startsWith('/')) return; // Ignore slash commands

      try {
        const from = ctx.from;
        if (!from) return;

        // Anti-Spam Rate Limiter: 4 seconds cooldown per user
        const now = Date.now();
        const lastChat = this.chatCooldowns.get(from.id) || 0;
        if (now - lastChat < 4000) {
          const remain = Math.ceil((4000 - (now - lastChat)) / 1000);
          await ctx.reply(
            `🐾 <b>Bé đang gõ phím suy nghĩ, đợi ${remain}s nữa hãy nhắn tiếp nhé sen!</b> ⏳`,
            { parse_mode: 'HTML' },
          );
          return;
        }
        this.chatCooldowns.set(from.id, now);

        // Sanitize and limit length
        const cleanText = text.slice(0, 250);

        const user = await this.getActiveUserWithPet(from.id);
        if (user?.pet) {
          await this.checkAndNotifyAfkAdventure(ctx, user);
        }

        const pet = user?.pet;
        const petName = pet?.name || 'DevGotchi';
        const petType = pet?.type || 'GOLEMY';

        await ctx.sendChatAction('typing');

        const reply = await this.aiService.chatWithPet(petName, petType, cleanText);
        const emoji = PET_EMOJIS[petType] || '🐾';

        await ctx.reply(`${emoji} <b>${petName}:</b> ${reply}`, { parse_mode: 'HTML' });
      } catch (err) {
        this.logger.error('Text chat error:', (err as Error).message);
      }
    });
  }

  // Helper to fetch user with pet and apply real-time vitals decay
  private async getActiveUserWithPet(telegramId: number) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: { pet: true, inventory: true },
    });

    if (user?.pet) {
      const decay = calculatePetDecay(user.pet);
      if (decay.hasDecayed) {
        user.pet = await this.prisma.pet.update({
          where: { id: user.pet.id },
          data: {
            hunger: decay.decayedHunger,
            happiness: decay.decayedHappiness,
            energy: decay.decayedEnergy,
            mood: decay.newMood as any,
            lastFedAt: decay.newLastFedAt,
          },
        });
      }
    }

    return user;
  }

  // Check and claim AFK exploration adventure loot when user returns (>= 4 hours)
  private async checkAndNotifyAfkAdventure(ctx: any, user: any) {
    if (!user?.pet) return;

    try {
      const afk = evaluateAfkAdventure(user, user.pet);
      if (!afk.hasReward) return;

      const newExp = user.pet.exp + afk.expGained;
      let newLevel = user.pet.level;
      let newMax = user.pet.maxExp;
      if (newExp >= newMax) {
        newLevel += 1;
        newMax = Math.round(newMax * 1.35);
      }

      const inventoryUpdates = afk.loot.map((lootItem: any) => {
        const existing = user.inventory.find((i: any) => i.foodId === lootItem.id);
        return existing
          ? this.prisma.inventoryItem.update({
              where: { id: existing.id },
              data: { count: existing.count + lootItem.count },
            })
          : this.prisma.inventoryItem.create({
              data: {
                userId: user.id,
                foodId: lootItem.id,
                count: lootItem.count,
              },
            });
      });

      await this.prisma.$transaction([
        this.prisma.pet.update({
          where: { id: user.pet.id },
          data: {
            exp: newExp >= newMax ? newExp - newMax : newExp,
            level: newLevel,
            maxExp: newMax,
            energy: 100,
            happiness: Math.min(100, user.pet.happiness + 15),
            mood: 'HAPPY',
          },
        }),
        this.prisma.user.update({
          where: { id: user.id },
          data: { lastActive: new Date() },
        }),
        ...inventoryUpdates,
      ]);

      // Update in-memory user reference
      user.pet.energy = 100;
      user.pet.exp = newExp >= newMax ? newExp - newMax : newExp;
      user.pet.level = newLevel;
      user.pet.maxExp = newMax;
      user.pet.happiness = Math.min(100, user.pet.happiness + 15);

      const emoji = PET_EMOJIS[user.pet.type] || '🐾';
      const lootList = afk.loot.map((l: any) => `• <b>${l.name}</b> x${l.count}`).join('\n');
      const msg =
        `🎒 <b>BÉ VỪA ĐI THÁM HIỂM KHI BẠN VẮNG NHÀ VỀ!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${emoji} <b>${user.pet.name}</b>: <i>"${afk.story}"</i>\n\n` +
        `⏰ Đã vắng nhà: <b>${afk.hoursAway} tiếng</b>\n` +
        `⚡ Năng lượng: <b>Hồi phục 100% đầy bình</b>\n` +
        `⭐ EXP nhận được: <b>+${afk.expGained} EXP</b>\n` +
        `🎁 Chiến lợi phẩm nhặt được:\n${lootList}\n\n` +
        `<i>Toàn bộ quà đã được cất cẩn thận vào túi đồ của bạn!</i>`;

      await ctx.reply(msg, { parse_mode: 'HTML' });
    } catch (err) {
      this.logger.error('checkAndNotifyAfkAdventure error:', (err as Error).message);
    }
  }

  // Sub-handler: Send Pet Status Card
  private async sendPetStatus(ctx: any) {
    try {
      const from = ctx.from;
      if (!from) return;

      const user = await this.getActiveUserWithPet(from.id);
      if (user?.pet) {
        await this.checkAndNotifyAfkAdventure(ctx, user);
      }

      if (!user?.pet) {
        await ctx.reply(
          `🐾 Bạn chưa có linh thú nào trong hồ sơ!\n\n` +
          `👉 Bạn có thể bấm nút <b>"Nuôi Pet 🐾"</b> ở thanh dưới để chọn trong 3D Web App, hoặc chọn nhanh 1 bé bên dưới:`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('🦕 Khủng Long DevOps (Dino)', 'adopt_starter_GOLEMY')],
              [Markup.button.callback('🐱 Mèo Lofi Sáng Tạo (Bytey)', 'adopt_starter_BYTEY')],
              [Markup.button.callback('🐡 Cá Nóc Trí Thức (Puffy)', 'adopt_starter_PUFFY')],
              [Markup.button.callback('🐙 Bạch Tuộc Soi Bug (Octy)', 'adopt_starter_OCTY')],
            ]),
          },
        );
        return;
      }

      const p = user.pet;
      const emoji = PET_EMOJIS[p.type] || '🐾';
      const species = PET_SPECIES_NAMES[p.type] || p.type;

      const hungerWarning =
        p.hunger <= 25
          ? `\n\n⚠️ <b>CẢNH BÁO:</b> Bụng ${p.name} đang đói cồn cào (${p.hunger}/100 🍖)! Hãy gõ <code>/feed</code> cho bé ăn ngay nhé sen!`
          : p.hunger <= 50
          ? `\n\n💡 <i>Bụng ${p.name} đang hơi đói (${p.hunger}/100 🍖), hãy nhớ cho bé ăn nhé!</i>`
          : '';

      const msg =
        `${emoji} <b>HỒ SƠ LINH THÚ: ${p.name.toUpperCase()}</b>\n` +
        `🏷️ Loài: <b>${species}</b> • Cấp: <b>Lv.${p.level}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💖 Hạnh phúc:  <b>${p.happiness}/100</b>\n${renderProgressBar(p.happiness)}\n\n` +
        `🍖 No bụng:     <b>${p.hunger}/100</b>\n${renderProgressBar(p.hunger)}\n\n` +
        `⚡ Năng lượng:  <b>${p.energy}/100</b>\n${renderProgressBar(p.energy)}\n\n` +
        `⭐ EXP: <b>${p.exp}/${p.maxExp}</b> • 🔥 Streak: <b>${user.streak} ngày</b>\n` +
        `⏱️ Tổng thời gian tập trung: <b>${p.totalFocusMinutes} phút</b>` +
        hungerWarning;

      await ctx.reply(msg, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🍖 Cho Ăn', 'pet_feed'), Markup.button.callback('🎮 Bắt Bug 30s', 'pet_game')],
          [Markup.button.callback('👋 Xoa Đầu (+3 💖)', 'pet_poke'), Markup.button.callback('🎒 Túi Đồ', 'pet_bag')],
          [Markup.button.callback('💤 Đi Ngủ (Sạc ⚡)', 'pet_sleep'), Markup.button.callback('🎁 Điểm Danh', 'pet_checkin')],
          [Markup.button.callback('⏱️ Focus 25p', 'pet_focus_25'), Markup.button.url('📋 PSOI Task', 'https://psoitask.surge.sh/')],
        ]),
      });
    } catch (err) {
      this.logger.error('sendPetStatus error:', (err as Error).message);
    }
  }

  // Sub-handler: Sleep & Rest Pet to restore 100% Energy
  private async handleSleep(ctx: any) {
    try {
      const from = ctx.from;
      if (!from) return;

      const user = await this.getActiveUserWithPet(from.id);

      if (!user?.pet) {
        await ctx.reply('🐾 Bạn chưa nhận nuôi linh thú nào! Hãy gõ /start để nhận nuôi bé nhé.');
        return;
      }

      await this.prisma.pet.update({
        where: { id: user.pet.id },
        data: {
          energy: 100,
          happiness: Math.min(100, user.pet.happiness + 5),
          mood: 'SLEEPING',
          isSleeping: true,
        },
      });

      const emoji = PET_EMOJIS[user.pet.type] || '🐾';
      await ctx.reply(
        `💤 <b>KHÒ KHÒ... BÉ ĐÃ ĐƯỢC ĐI NGỦ NGHỈ NGƠI!</b> 🌙\n\n` +
        `${emoji} Bé cưng <b>${user.pet.name}</b> đang cuộn tròn ngủ say sưa...\n` +
        `⚡ Năng lượng: <b>100/100</b> (Đã sạc đầy 100% pin 🔋)\n` +
        `💖 Hạnh phúc: <b>${Math.min(100, user.pet.happiness + 5)}/100</b>\n\n` +
        `💬 <i>"Oáp~ Ngủ một giấc sảng khoái quá sen ơi! Năng lượng tràn trề, sẵn sàng chiến tiếp thôi nào!"</i> 🚀`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🐾 Xem Trạng Thái', 'pet_status'), Markup.button.callback('⏱️ Focus 25 phút', 'pet_focus_25')],
          ]),
        },
      );
    } catch (err) {
      this.logger.error('handleSleep error:', (err as Error).message);
    }
  }

  // Sub-handler: Poke Pet with Cooldown & Max Happiness Cap
  private async handlePoke(ctx: any) {
    try {
      const from = ctx.from;
      if (!from) return;

      const user = await this.getActiveUserWithPet(from.id);

      if (!user?.pet) {
        await ctx.reply('🐾 Bạn chưa nhận nuôi linh thú nào! Hãy bấm "Nuôi Pet 🐾" ở góc dưới nhé.');
        return;
      }

      const now = new Date();
      const COOLDOWN_SECONDS = 15;

      // Check Poke Cooldown (15 seconds)
      if (user.lastPokedAt) {
        const diffSeconds = (now.getTime() - new Date(user.lastPokedAt).getTime()) / 1000;
        if (diffSeconds < COOLDOWN_SECONDS) {
          const remain = Math.ceil(COOLDOWN_SECONDS - diffSeconds);
          await ctx.reply(
            `🐾 <b>${user.pet.name} đang nghỉ ngơi một lát!</b>\n` +
            `Bé vừa được cưng nựng rồi, hãy đợi <b>${remain} giây</b> nữa hãy xoa tiếp nhé! 🥰`,
            { parse_mode: 'HTML' },
          );
          return;
        }
      }

      // Check Happiness Cap
      if (user.pet.happiness >= 100) {
        const emoji = PET_EMOJIS[user.pet.type] || '🐾';
        await ctx.reply(
          `${emoji} <b>${user.pet.name} đang hạnh phúc tối đa (100/100 💖)!</b>\n\n` +
          `Bé đang vui sướng tuyệt đối rồi! Hãy tập trung làm một phiên Pomodoro (<code>/focus 25</code>) để duy trì phong độ nhé!`,
          { parse_mode: 'HTML' },
        );
        return;
      }

      const newHappy = Math.min(100, user.pet.happiness + 3);

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: { lastPokedAt: now, lastActive: now },
        }),
        this.prisma.pet.update({
          where: { id: user.pet.id },
          data: { happiness: newHappy },
        }),
      ]);

      const emoji = PET_EMOJIS[user.pet.type] || '🐾';
      const pokeQuotes = [
        'Ái chà! Nhột quá đi mất haha! Tăng 3 điểm hạnh phúc nè! 🥰',
        'Được xoa đầu thích ghê, vào cày thêm 1 phiên Pomodoro nào sen ơi! ✨',
        'Meo meo... Ngoan ghê, trẫm ban cho bạn năng lượng tích cực hôm nay! 💖',
        'Gừ gừ... Thích quá! Cùng nhau tập trung code sạch không bug nhé! 🚀',
      ];
      const randomQuote = pokeQuotes[Math.floor(Math.random() * pokeQuotes.length)];

      await ctx.reply(
        `${emoji} <b>${user.pet.name}:</b> "${randomQuote}"\n💖 Hạnh phúc: <b>${newHappy}/100</b> (+3)`,
        { parse_mode: 'HTML' },
      );
    } catch (err) {
      this.logger.error('handlePoke error:', (err as Error).message);
    }
  }

  // Sub-handler: Show Feed Menu with real inventory stock
  private async handleFeed(ctx: any) {
    try {
      const from = ctx.from;
      if (!from) return;

      const user = await this.getActiveUserWithPet(from.id);

      if (!user?.pet) {
        await ctx.reply('🐾 Bạn chưa nhận nuôi linh thú nào! Hãy bấm "Nuôi Pet 🐾" ở góc dưới nhé.');
        return;
      }

      let inventory = user.inventory;
      const starterKeys = ['shrimp', 'fish_ram', 'docker_jelly', 'coffee_donut'];
      for (const key of starterKeys) {
        if (!inventory.some((i) => i.foodId === key)) {
          await this.prisma.inventoryItem.create({
            data: { userId: user.id, foodId: key, count: 3 },
          }).catch(() => {});
        }
      }
      inventory = await this.prisma.inventoryItem.findMany({ where: { userId: user.id } });

      const getCount = (id: string) => inventory.find((i) => i.foodId === id)?.count ?? 0;

      const foods = [
        { id: 'water', name: '💧 Nước Lọc Dev (Miễn phí ∞)' },
        { id: 'shrimp', name: `🦐 Tôm Debug (Còn x${getCount('shrimp')})` },
        { id: 'fish_ram', name: `🐟 Bánh Cá RAM (Còn x${getCount('fish_ram')})` },
        { id: 'docker_jelly', name: `🐳 Thạch Docker (Còn x${getCount('docker_jelly')})` },
        { id: 'coffee_donut', name: `🍩 Donut Espresso (Còn x${getCount('coffee_donut')})` },
      ];

      const buttons = foods.map((f) => [Markup.button.callback(`Cho ăn ${f.name}`, `feed_item_${f.id}`)]);
      buttons.push([Markup.button.callback('🎒 Xem Túi Đồ Chi Tiết', 'pet_bag')]);

      await ctx.reply(
        `🍱 <b>TÚI THỨC ĂN CÔNG NGHỆ</b>\n` +
        `Độ no hiện tại của <b>${user.pet.name}</b>: <b>${user.pet.hunger}/100</b>\n\n` +
        `Chọn một món ăn ngon lành để thưởng cho bé nhé:`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard(buttons),
        },
      );
    } catch (err) {
      this.logger.error('handleFeed error:', (err as Error).message);
    }
  }

  // Sub-handler: Show Inventory Bag
  private async handleInventory(ctx: any) {
    try {
      const from = ctx.from;
      if (!from) return;

      const user = await this.getActiveUserWithPet(from.id);
      if (!user) return;

      let inventory = user.inventory;
      const starterKeys = ['shrimp', 'fish_ram', 'docker_jelly', 'coffee_donut'];
      for (const key of starterKeys) {
        if (!inventory.some((i) => i.foodId === key)) {
          await this.prisma.inventoryItem.create({
            data: { userId: user.id, foodId: key, count: 3 },
          }).catch(() => {});
        }
      }
      inventory = await this.prisma.inventoryItem.findMany({ where: { userId: user.id } });

      const foodNames: Record<string, { name: string; desc: string }> = {
        shrimp: { name: '🦐 Tôm Debug', desc: '+30 No, +15 Hạnh phúc' },
        fish_ram: { name: '🐟 Bánh Cá RAM', desc: '+25 No, +15 ⚡ Năng lượng' },
        docker_jelly: { name: '🐳 Thạch Docker', desc: '+35 No, +10 Hạnh phúc' },
        coffee_donut: { name: '🍩 Donut Espresso', desc: '+20 No, +25 ⚡ Năng lượng' },
        bao: { name: '🥟 Bánh Bao Bug', desc: '+25 No, +15 Hạnh phúc' },
        noodle_cup: { name: '🍜 Mì Ly Coder', desc: '+30 No, +15 ⚡ Năng lượng' },
        bubble_tea: { name: '🧋 Trà Sữa Full Thạch', desc: '+15 No, +30 Hạnh phúc' },
        onigiri: { name: '🍙 Cơm Nắm Git', desc: '+20 No, +15 ⚡ Năng lượng' },
        ice_cream: { name: '🍦 Kem Ốc Quế CSS', desc: '+15 No, +25 Hạnh phúc' },
        pizza: { name: '🍕 Pizza Deadline', desc: '+35 No, +20 Hạnh phúc' },
        banh_mi: { name: '🥖 Bánh Mì Sài Gòn', desc: '+30 No, +20 ⚡ Năng lượng' },
        golden_apple: { name: '🍎 Táo Vàng Hackathon', desc: '+40 No, +40 💖, +30 ⚡' },
      };

      const ownedItems = inventory.filter((i) => i.count > 0);
      let itemsListText = '• 💧 <b>Nước Lọc Dev</b>: x<b>∞ (Vô hạn, Miễn phí)</b>\n  <i>(+10 No, +5 Hạnh phúc, +5 ⚡ Năng lượng)</i>\n\n';

      if (ownedItems.length === 0) {
        itemsListText += '<i>Các món ăn khác trong túi tạm thời đã hết! Hãy điểm danh hoặc làm Pomodoro để kiếm thêm sơn hào hải vị nhé.</i>\n';
      } else {
        itemsListText += ownedItems
          .map((i) => {
            const info = foodNames[i.foodId] || { name: `🍱 ${i.foodId}`, desc: '+20 No' };
            return `• <b>${info.name}</b>: x<b>${i.count} phần</b>\n  <i>(${info.desc})</i>`;
          })
          .join('\n\n');
      }

      const totalCount = inventory.reduce((sum, i) => sum + i.count, 0);

      const msg =
        `🎒 <b>TÚI ĐỒ CÔNG NGHỆ CỦA BẠN (INVENTORY)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        itemsListText + `\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 Tổng số phần ăn sẵn có: <b>${totalCount} món</b>\n\n` +
        `💡 <b>Cách kiếm thêm thức ăn:</b>\n` +
        `• Gõ <code>/checkin</code> mỗi ngày để nhận quà may mắn\n` +
        `• Hoàn thành phiên Pomodoro (<code>/focus 25</code>) để nhặt thức ăn rơi!`;

      await ctx.reply(msg, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🍖 Cho Ăn Ngay', 'pet_feed'), Markup.button.callback('🎁 Điểm Danh', 'pet_checkin')],
          [Markup.button.callback('🐾 Xem Thú Cưng', 'pet_status'), Markup.button.url('📋 Mở PSOI Task', 'https://psoitask.surge.sh/')],
        ]),
      });
    } catch (err) {
      this.logger.error('handleInventory error:', (err as Error).message);
    }
  }

  // Sub-handler: /game or /play Mini-game
  private async handleGameCommand(ctx: any) {
    try {
      const from = ctx.from;
      if (!from) return;
      const user = await this.getActiveUserWithPet(from.id);
      if (!user?.pet) {
        await ctx.reply('🐾 Bạn chưa có linh thú! Hãy nhận nuôi trước nhé.');
        return;
      }

      const msg =
        `🎮 <b>MINI-GAME 30s: BẮT BUG XẢ STRESS! 🐞</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Thú cưng <b>${user.pet.name}</b> đang rất hăng hái muốn cùng bạn đi săn bug xả stress!\n\n` +
        `⚡ <b>Luật chơi siêu nhanh (30 giây):</b>\n` +
        `• Các chú bọ lỗi (Bug 🐞, Worm 🐛, Exception ⚠️, NullPointer 💥) sẽ rơi xuống màn hình.\n` +
        `• Bạn chỉ cần chạm/tap liên tục để bé thú cưng đè bẹp bug và gom chuỗi combo!\n\n` +
        `🎁 <b>Bảng phần thưởng chiến lợi phẩm:</b>\n` +
        `• Bắt $\\ge$ 20 bug: <b>🐳 Thạch Docker / 🍩 Donut</b> + <b>+80 EXP</b> + <b>+25 💖</b>\n` +
        `• Bắt $\\ge$ 10 bug: <b>🐟 Bánh Cá RAM</b> + <b>+45 EXP</b> + <b>+15 💖</b>\n` +
        `• Bắt < 10 bug: <b>🦐 Tôm Debug</b> + <b>+25 EXP</b> + <b>+10 💖</b>\n\n` +
        `👉 <b>Chọn cách chơi bên dưới:</b>`;

      const webAppUrl = process.env.WEBAPP_URL;
      const launchAppButton = webAppUrl && webAppUrl.startsWith('https://')
        ? Markup.button.webApp('🚀 Mở Mini App Bắt Bug 30s 🕹️', webAppUrl)
        : Markup.button.url('🚀 Mở Mini App Bắt Bug 30s 🕹️', 'https://t.me/devgotchi_pet_bot/app');

      await ctx.reply(msg, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [launchAppButton],
          [Markup.button.callback('⚡ Đập Bug Nhanh Tại Chat', 'quick_smash_start')],
          [Markup.button.callback('🐾 Xem Thú Cưng', 'pet_status'), Markup.button.callback('🍖 Cho Ăn', 'pet_feed')],
          [Markup.button.callback('🎒 Xem Túi Đồ', 'pet_bag'), Markup.button.url('📋 Mở PSOI Task', 'https://psoitask.surge.sh/')],
        ]),
      });
    } catch (err) {
      this.logger.error('handleGameCommand error:', (err as Error).message);
    }
  }

  // Quick In-Chat Bug Smash Game (Randomized 3-button whack-a-mole)
  private async handleQuickSmash(ctx: any) {
    try {
      await ctx.answerCbQuery();
      const options = [
        Markup.button.callback('📦 Code Sạch', 'quick_smash_miss'),
        Markup.button.callback('🐞 ĐẬP BỌ LỖI!', 'quick_smash_hit'),
        Markup.button.callback('☕ Ly Cà Phê', 'quick_smash_miss'),
      ];
      // Shuffle buttons so the bug moves around
      options.sort(() => Math.random() - 0.5);

      const msg =
        `👀 <b>KÌA CON BUG VỪA XUẤT HIỆN! 🐞</b>\n\n` +
        `Nó đang chuẩn bị làm crash server production! Đập nhanh vào con bọ trước khi nó tẩu thoát:`;

      await ctx.reply(msg, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          options,
          [Markup.button.callback('🔙 Quay Lại Menu Game', 'pet_game')],
        ]),
      });
    } catch (err) {
      this.logger.error('handleQuickSmash error:', (err as Error).message);
    }
  }

  private async handleQuickSmashHit(ctx: any) {
    try {
      const from = ctx.from;
      if (!from) return;

      const user = await this.getActiveUserWithPet(from.id);
      if (!user?.pet) return;

      // Award +5 EXP and +3 Happiness
      const newExp = user.pet.exp + 5;
      let newLevel = user.pet.level;
      let newMax = user.pet.maxExp;
      if (newExp >= newMax) {
        newLevel += 1;
        newMax = Math.round(newMax * 1.35);
      }

      await this.prisma.pet.update({
        where: { id: user.pet.id },
        data: {
          exp: newExp >= newMax ? newExp - newMax : newExp,
          level: newLevel,
          maxExp: newMax,
          happiness: Math.min(100, user.pet.happiness + 3),
        },
      });

      await ctx.answerCbQuery('💥 BỐP! ĐÃ ĐÈ BẸP CON BUG!');

      const webAppUrl = process.env.WEBAPP_URL;
      const launchAppButton = webAppUrl && webAppUrl.startsWith('https://')
        ? Markup.button.webApp('🚀 Vào Mini App Bắt Bug 30s Cực Đã', webAppUrl)
        : Markup.button.url('🚀 Vào Mini App Bắt Bug 30s Cực Đã', 'https://t.me/devgotchi_pet_bot/app');

      const msg =
        `💥 <b>BỐP! BẠN ĐÃ TIÊU DIỆT THÀNH CÔNG CON BUG!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🐾 <b>${user.pet.name}</b> nhảy cẫng lên vì vui sướng!\n` +
        `⭐ Thưởng: <b>+5 EXP</b>\n` +
        `💖 Hạnh phúc: <b>+3 Điểm</b> (Hiện tại: <b>${Math.min(100, user.pet.happiness + 3)}/100</b>)\n\n` +
        `🏆 <i>Muốn chơi đã tay hơn với 30 giây liên hoàn bọ rơi, chuỗi Combo x3 và nhặt Thạch Docker/Bánh Cá RAM?</i>\n` +
        `👇 <b>Bấm mở Mini App bên dưới để chiến ngay:</b>`;

      if (ctx.callbackQuery?.message) {
        await ctx.editMessageText(msg, {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [launchAppButton],
            [Markup.button.callback('⚡ Đập Tiếp Con Khác', 'quick_smash_start')],
            [Markup.button.callback('🐾 Xem Thú Cưng', 'pet_status'), Markup.button.callback('🎒 Xem Túi Đồ', 'pet_bag')],
          ]),
        });
      } else {
        await ctx.reply(msg, {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [launchAppButton],
            [Markup.button.callback('⚡ Đập Tiếp Con Khác', 'quick_smash_start')],
          ]),
        });
      }
    } catch (err) {
      this.logger.error('handleQuickSmashHit error:', (err as Error).message);
    }
  }

  // Execute feeding an item with Full Hunger check & Inventory consumption
  private async executeFeedItem(ctx: any, foodId: string) {
    try {
      const from = ctx.from;
      if (!from) return;

      const user = await this.getActiveUserWithPet(from.id);

      if (!user?.pet) return;

      // 1. Check if Pet is already full (hunger >= 100)
      if (user.pet.hunger >= 100) {
        await ctx.answerCbQuery('Bé đã no căng bụng rồi!');
        const emoji = PET_EMOJIS[user.pet.type] || '🐾';
        await ctx.reply(
          `${emoji} <b>${user.pet.name} đã no căng bụng rồi (100/100 🍖)!</b>\n\n` +
          `Không nên ép bé ăn quá no nha sen! Hãy cùng làm một phiên Pomodoro (<code>/focus 25</code>) để tiêu hao calo và đói bụng rồi hãy ăn tiếp nhé!`,
          { parse_mode: 'HTML' },
        );
        return;
      }

      // 2. Water logic (Infinite free tier survival food)
      if (foodId === 'water') {
        const newHunger = Math.min(100, user.pet.hunger + 10);
        const newHappy = Math.min(100, user.pet.happiness + 5);
        const newEnergy = Math.min(100, user.pet.energy + 5);

        await this.prisma.pet.update({
          where: { id: user.pet.id },
          data: {
            hunger: newHunger,
            happiness: newHappy,
            energy: newEnergy,
            lastFedAt: new Date(),
          },
        });

        await ctx.answerCbQuery('💧 Nước lọc mát rượi!');
        const emoji = PET_EMOJIS[user.pet.type] || '🐾';

        await ctx.reply(
          `${emoji} <b>${user.pet.name} đã uống một cốc Nước Lọc Dev mát lành!</b>\n` +
          `🍖 No bụng: <b>${newHunger}/100</b> (+10)\n` +
          `⚡ Năng lượng: <b>${newEnergy}/100</b> (+5)\n` +
          `💖 Hạnh phúc: <b>${newHappy}/100</b> (+5)\n` +
          `💧 Nguồn nước sạch miễn phí vô hạn (x∞) luôn sẵn sàng!\n` +
          `💬 <i>"Đã khát quá sen ơi! Uống đủ nước là code bug nào cũng bay màu! Sen cũng nhớ uống nước nhé 🥤"</i>`,
          { parse_mode: 'HTML' },
        );
        return;
      }

      // 3. Check and consume inventory item
      const item = user.inventory.find((i) => i.foodId === foodId);
      if (!item || item.count <= 0) {
        await ctx.answerCbQuery('Món này đã hết!');
        await ctx.reply(
          `📦 <b>Món ăn này trong túi đồ của bạn đã hết!</b>\n\n` +
          `👉 Bạn hãy dùng lệnh <code>/checkin</code> để nhận quà mỗi ngày, hoặc hoàn thành các phiên Pomodoro (<code>/focus 25</code>) để nhặt thêm thức ăn nhé!`,
          { parse_mode: 'HTML' },
        );
        return;
      }

      // 3. Decrement inventory and boost hunger & energy
      const newHunger = Math.min(100, user.pet.hunger + 25);
      const newHappy = Math.min(100, user.pet.happiness + 10);
      const energyGain = foodId === 'coffee_donut' ? 25 : (foodId === 'fish_ram' ? 15 : 10);
      const newEnergy = Math.min(100, user.pet.energy + energyGain);

      await this.prisma.$transaction([
        this.prisma.inventoryItem.update({
          where: { id: item.id },
          data: { count: item.count - 1 },
        }),
        this.prisma.pet.update({
          where: { id: user.pet.id },
          data: {
            hunger: newHunger,
            happiness: newHappy,
            energy: newEnergy,
            lastFedAt: new Date(),
          },
        }),
      ]);

      await ctx.answerCbQuery('😋 Măm măm ngon quá!');
      const emoji = PET_EMOJIS[user.pet.type] || '🐾';

      await ctx.reply(
        `${emoji} <b>${user.pet.name} đã được ăn no nê!</b>\n` +
        `🍖 No bụng: <b>${newHunger}/100</b> (+25)\n` +
        `⚡ Năng lượng: <b>${newEnergy}/100</b> (+${energyGain})\n` +
        `💖 Hạnh phúc: <b>${newHappy}/100</b> (+10)\n` +
        `📦 Còn lại trong túi: <b>${item.count - 1} phần</b>\n` +
        `💬 <i>"Cảm ơn sen nhé, no bụng và đầy năng lượng rồi chiến tiếp thôi nào!"</i>`,
        { parse_mode: 'HTML' },
      );
    } catch (err) {
      this.logger.error('executeFeedItem error:', (err as Error).message);
    }
  }

  // Daily Checkin with strict Anti-Spam / Anti-Cheat
  private async handleCheckin(ctx: any) {
    try {
      const from = ctx.from;
      if (!from) return;

      const user = await this.prisma.user.findUnique({
        where: { telegramId: BigInt(from.id) },
        include: { pet: true, inventory: true },
      });

      if (!user?.pet) {
        await ctx.reply('🐾 Bạn chưa có linh thú! Hãy bấm nút "Nuôi Pet 🐾" ở góc dưới để nhận nuôi trước nhé!');
        return;
      }

      const now = new Date();
      // Vietnam timezone UTC+7 date key
      const vnDate = new Date(now.getTime() + 7 * 60 * 60 * 1000);
      const todayKey = vnDate.toISOString().slice(0, 10);

      // 1. Check in-memory cache first (instant block within the same process)
      const cachedKey = this.checkinCache.get(from.id);
      if (cachedKey === todayKey) {
        const [year, month, day] = todayKey.split('-').map(Number);
        const nextMidnightVn = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
        const diffMs = nextMidnightVn.getTime() - (now.getTime() + 7 * 60 * 60 * 1000);
        const hoursLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
        const minutesLeft = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

        await ctx.reply(
          `⏳ <b>BẠN ĐÃ ĐIỂM DANH HÔM NAY RỒI!</b>\n\n` +
          `🎁 Mỗi ngày bạn chỉ được điểm danh nhận quà <b>1 lần duy nhất</b>.\n` +
          `⏰ Lượt điểm danh tiếp theo sẽ mở sau <b>${hoursLeft} giờ ${minutesLeft} phút</b> nữa (00:00 sáng mai)!\n\n` +
          `🔥 Chuỗi Streak hiện tại: <b>${user.streak} ngày liên tục</b>\n` +
          `💡 Trong lúc chờ, hãy hoàn thành phiên Pomodoro (<code>/focus 25</code>) để cày EXP cho ${user.pet.name} nhé!`,
          { parse_mode: 'HTML' },
        );
        return;
      }

      // 2. Check Database lastCheckinAt
      if (user.lastCheckinAt) {
        const lastVn = new Date(new Date(user.lastCheckinAt).getTime() + 7 * 60 * 60 * 1000);
        const lastDateKey = lastVn.toISOString().slice(0, 10);

        if (lastDateKey === todayKey) {
          this.checkinCache.set(from.id, todayKey);
          const [year, month, day] = todayKey.split('-').map(Number);
          const nextMidnightVn = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
          const diffMs = nextMidnightVn.getTime() - (now.getTime() + 7 * 60 * 60 * 1000);
          const hoursLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
          const minutesLeft = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

          await ctx.reply(
            `⏳ <b>BẠN ĐÃ ĐIỂM DANH HÔM NAY RỒI!</b>\n\n` +
            `🎁 Mỗi ngày bạn chỉ được điểm danh nhận quà <b>1 lần duy nhất</b>.\n` +
            `⏰ Lượt điểm danh tiếp theo sẽ mở sau <b>${hoursLeft} giờ ${minutesLeft} phút</b> nữa (00:00 sáng mai)!\n\n` +
            `🔥 Chuỗi Streak hiện tại: <b>${user.streak} ngày liên tục</b>\n` +
            `💡 Trong lúc chờ, hãy hoàn thành phiên Pomodoro (<code>/focus 25</code>) để cày EXP cho ${user.pet.name} nhé!`,
            { parse_mode: 'HTML' },
          );
          return;
        }
      }

      // Mark in cache immediately
      this.checkinCache.set(from.id, todayKey);

      // Calculate streak
      const oneDayMs = 24 * 60 * 60 * 1000;
      let newStreak = user.streak;
      if (user.lastCheckinAt) {
        const diffDays = Math.floor((now.getTime() - new Date(user.lastCheckinAt).getTime()) / oneDayMs);
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1; // Streak broken
        }
      } else {
        newStreak = 1;
      }

      // Calculate EXP and Level Up with proper while loop
      let newExp = user.pet.exp + 25;
      let newLevel = user.pet.level;
      let newMax = user.pet.maxExp;
      let leveledUp = false;

      while (newExp >= newMax) {
        newExp -= newMax;
        newLevel += 1;
        newMax = Math.round(newMax * 1.35);
        leveledUp = true;
      }

      // Grant a random food item in inventory
      const foodKeys = ['shrimp', 'fish_ram', 'docker_jelly', 'coffee_donut'];
      const randomFood = foodKeys[Math.floor(Math.random() * foodKeys.length)];

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: {
            lastCheckinAt: now,
            streak: newStreak,
            lastActive: now,
          },
        }),
        this.prisma.pet.update({
          where: { id: user.pet.id },
          data: {
            exp: newExp,
            level: newLevel,
            maxExp: newMax,
            energy: 100, // Daily reset restores full energy
          },
        }),
        this.prisma.inventoryItem.upsert({
          where: {
            userId_foodId: {
              userId: user.id,
              foodId: randomFood,
            },
          },
          create: {
            userId: user.id,
            foodId: randomFood,
            count: 1,
          },
          update: {
            count: { increment: 1 },
          },
        }),
      ]);

      const emoji = PET_EMOJIS[user.pet.type] || '🐾';
      const foodNames: Record<string, string> = {
        shrimp: '🦐 Tôm Debug',
        fish_ram: '🐟 Bánh Cá RAM',
        docker_jelly: '🐳 Thạch Docker',
        coffee_donut: '🍩 Donut Espresso',
      };

      await ctx.reply(
        `🎁 <b>ĐIỂM DANH HÀNG NGÀY THÀNH CÔNG!</b>\n\n` +
        `⭐ Thưởng: <b>+25 EXP</b>\n` +
        `🍱 Quà tặng: Nhận thêm <b>1x ${foodNames[randomFood]}</b> vào túi đồ!\n` +
        `🔥 Chuỗi Streak: <b>${newStreak} ngày liên tục</b>\n` +
        `${leveledUp ? `👑 <b>CHÚC MỪNG: ${user.pet.name} ĐÃ LÊN CẤP ${newLevel}!</b> 🎉\n` : ''}` +
        `📊 Cấp hiện tại: <b>Lv.${newLevel}</b> (${newExp}/${newMax} EXP)\n\n` +
        `<i>Hẹn gặp lại bạn vào ngày mai để tiếp tục duy trì Streak nhé!</i>`,
        { parse_mode: 'HTML' },
      );
    } catch (err) {
      this.logger.error('handleCheckin error:', (err as Error).message);
    }
  }

  // Sub-handler: Send Help Message
  private async sendHelpMessage(ctx: any) {
    const msg =
      `📖 <b>HƯỚNG DẪN SỬ DỤNG DEVGOTCHI TELEGRAM BOT</b>\n\n` +
      `Bot giúp bạn chăm sóc thú cưng 3D và duy trì kỷ luật tập trung làm việc mọi lúc mọi nơi:\n\n` +
      `🐾 <b>/pet</b> hoặc <b>/status</b>\n` +
      `👉 Hiển thị thẻ sinh lực thú cưng: Độ no bụng, Hạnh phúc, Năng lượng, Cấp độ, EXP và Chuỗi ngày Streak.\n\n` +
      `🎒 <b>/bag</b> hoặc <b>/inventory</b>\n` +
      `👉 Mở túi đồ công nghệ: Kiểm tra số lượng tất cả các món ăn bạn đang sở hữu.\n\n` +
      `🍖 <b>/feed</b>\n` +
      `👉 Mở khay chọn món ăn công nghệ để cho bé ăn hồi phục độ no và hạnh phúc.\n\n` +
      `💤 <b>/sleep</b> hoặc <b>/rest</b>\n` +
      `👉 Cho thú cưng chợp mắt đi ngủ nghỉ ngơi để sạc đầy 100% thanh Năng lượng (⚡).\n\n` +
      `📋 <b>/task</b> hoặc <b>/tasks</b>\n` +
      `👉 Mở nhanh Web quản lý công việc cá nhân PSOI Task (https://psoitask.surge.sh/).\n\n` +
      `🍖 <b>/feed</b>\n` +
      `👉 Mở khay chọn món ăn công nghệ (Tôm Debug, Bánh Cá RAM, Thạch Docker, Donut Espresso) để hồi phục độ no và hạnh phúc.\n\n` +
      `👋 <b>/poke</b>\n` +
      `👉 Xoa đầu, cưng nựng bé cưng (+3 Điểm Hạnh phúc).\n\n` +
      `⏱️ <b>/focus [số phút] [chủ đề]</b>\n` +
      `👉 Khởi chạy phiên Pomodoro tập trung ngay trên Telegram.\n` +
      `<i>Ví dụ:</i> <code>/focus 25 FixBug</code> hoặc <code>/focus 45 HọcReact</code>.\n` +
      `Bot sẽ đếm ngược và reo chuông thông báo khi hoàn thành kèm thưởng EXP!\n\n` +
      `🎁 <b>/checkin</b>\n` +
      `👉 Điểm danh nhận thưởng EXP và tăng chuỗi Streak liên tục.\n\n` +
      `💬 <b>Trò chuyện tâm sự:</b>\n` +
      `👉 Nhắn bất kỳ câu hỏi hoặc tâm sự gì, bé cưng của bạn (trợ lý Gemini AI) sẽ lắng nghe và trả lời ngay!`;

    await ctx.reply(msg, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🐾 Xem Thú Cưng', 'pet_status'), Markup.button.callback('🍖 Cho Ăn', 'pet_feed')],
        [Markup.button.callback('⏱️ Thử Focus 25 phút', 'pet_focus_25'), Markup.button.url('📋 PSOI Task ↗️', 'https://psoitask.surge.sh/')],
      ]),
    });
  }

  // Handle Focus Pomodoro Session in Chat
  private async handleFocusCommand(ctx: any) {
    try {
      const from = ctx.from;
      if (!from) return;

      const parts = ctx.message.text.trim().split(/\s+/);
      let minutes = 25;
      let tag = 'DeepWork';

      if (parts.length >= 2 && !isNaN(parseInt(parts[1], 10))) {
        minutes = Math.min(120, Math.max(1, parseInt(parts[1], 10)));
      }
      if (parts.length >= 3) {
        tag = parts.slice(2).join(' ');
      }

      await this.startFocusSession(ctx, minutes, tag);
    } catch (err) {
      this.logger.error('handleFocusCommand error:', (err as Error).message);
    }
  }

  // Helper to start focus session
  private async startFocusSession(ctx: any, minutes: number, tag: string) {
    const from = ctx.from;
    if (!from) return;

    const user = await this.getActiveUserWithPet(from.id);

    const petName = user?.pet?.name || 'Linh thú';
    const petType = user?.pet?.type || 'GOLEMY';
    const emoji = PET_EMOJIS[petType] || '🐾';

    if (this.activeTimers.has(from.id)) {
      await ctx.reply('⚠️ Bạn đang có một phiên tập trung đang chạy! Hãy hoàn thành phiên này trước nhé.');
      return;
    }

    await ctx.reply(
      `⏱️ <b>BẮT ĐẦU PHIÊN TẬP TRUNG POMODORO</b>\n\n` +
      `🎯 Mục tiêu: <b>#${tag}</b>\n` +
      `⏳ Thời gian: <b>${minutes} phút</b>\n` +
      `${emoji} <b>${petName}</b> sẽ giữ trật tự và canh chừng cho bạn tập trung.\n\n` +
      `🔥 <i>Cố lên nhé! Sau ${minutes} phút tôi sẽ báo chuông cho bạn!</i>`,
      { parse_mode: 'HTML' },
    );

    // Schedule timer completion
    const timer = setTimeout(async () => {
      this.activeTimers.delete(from.id);
      const expGained = minutes * 4;

      try {
        if (user?.pet) {
          let newExp = user.pet.exp + expGained;
          let newLevel = user.pet.level;
          let newMax = user.pet.maxExp;
          let leveledUp = false;

          if (newExp >= newMax) {
            newLevel += 1;
            newMax = Math.round(newMax * 1.35);
            leveledUp = true;
          }

          await this.prisma.pet.update({
            where: { id: user.pet.id },
            data: {
              exp: newExp,
              level: newLevel,
              maxExp: newMax,
              totalFocusMinutes: user.pet.totalFocusMinutes + minutes,
              happiness: Math.min(100, user.pet.happiness + 10),
              energy: Math.min(100, user.pet.energy + 15),
            },
          });

          await this.prisma.focusSession.create({
            data: {
              userId: user.id,
              durationMin: minutes,
              tag,
              expGained,
            },
          });

          await ctx.reply(
            `🔔 <b>DING DING DING! HẾT GIỜ RỒI!</b> 🎉\n\n` +
            `🏆 Chúc mừng bạn đã hoàn thành <b>${minutes} phút Deep Work (#${tag})</b> xuất sắc!\n` +
            `⭐ Thưởng: <b>+${expGained} EXP</b>, <b>+10 Điểm Hạnh Phúc</b> và <b>+15 Điểm Năng Lượng ⚡</b> cho ${petName}!\n` +
            `${leveledUp ? `👑 <b>ĐẲNG CẤP: ${petName} ĐÃ THĂNG LÊN CẤP ${newLevel}!</b> 👑\n` : ''}` +
            `Hãy đứng dậy vươn vai, uống một ngụm nước và nghỉ ngơi 5 phút nhé! ☕`,
            { parse_mode: 'HTML' },
          );
        } else {
          await ctx.reply(
            `🔔 <b>DING DING! Hết giờ ${minutes} phút tập trung!</b> Bạn làm tốt lắm! Nghỉ ngơi 5 phút nhé! ☕`,
            { parse_mode: 'HTML' },
          );
        }
      } catch (err) {
        this.logger.error('Error completing focus timer:', (err as Error).message);
      }
    }, minutes * 60 * 1000);

    this.activeTimers.set(from.id, timer);
  }
}
