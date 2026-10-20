import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Markup } from 'telegraf';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

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
        { command: 'feed', description: '🍖 Cho thú cưng ăn nạp năng lượng' },
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
            `🍖 /feed : Mở khay thức ăn công nghệ\n` +
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
              [Markup.button.callback('👋 Xoa Đầu (+3 💖)', 'pet_poke'), Markup.button.callback('🎁 Điểm Danh', 'pet_checkin')],
              [Markup.button.callback('⏱️ Focus 25 phút', 'pet_focus_25'), Markup.button.callback('📖 Trợ Giúp', 'pet_help')],
            ]),
          });
        } else {
          const msg =
            `🎮 <b>Chào mừng ${name} đến với DevGotchi!</b>\n` +
            `🐾 Nền tảng nuôi thú ảo 3D kết hợp tăng năng suất Pomodoro dành riêng cho Coder & Designer.\n\n` +
            `👉 <b>Bước 1:</b> Bấm nút <b>"Nuôi Pet 🐾"</b> ở góc dưới màn hình để nhận nuôi 1 trong 4 Linh Thú 3D (Dino DevOps, Mèo Lofi, Cá Nóc RAM, Bạch Tuộc Soi Bug) nhé!\n\n` +
            `📜 <b>DANH SÁCH LỆNH TƯƠNG TÁC:</b>\n` +
            `🐾 /pet : Xem hồ sơ & thanh sinh lực bé cưng\n` +
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

    // 7. /help command
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

    this.bot.action('pet_checkin', async (ctx) => {
      await ctx.answerCbQuery();
      await this.handleCheckin(ctx);
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

    // 8. Natural Language Text Chat with Pet Persona (AI Gemini)
    this.bot.on('text', async (ctx) => {
      const text = ctx.message.text.trim();
      if (text.startsWith('/')) return; // Ignore slash commands

      try {
        const from = ctx.from;
        if (!from) return;

        const user = await this.prisma.user.findUnique({
          where: { telegramId: BigInt(from.id) },
          include: { pet: true },
        });

        const pet = user?.pet;
        const petName = pet?.name || 'DevGotchi';
        const petType = pet?.type || 'GOLEMY';

        await ctx.sendChatAction('typing');

        const reply = await this.aiService.chatWithPet(petName, petType, text);
        const emoji = PET_EMOJIS[petType] || '🐾';

        await ctx.reply(`${emoji} <b>${petName}:</b> ${reply}`, { parse_mode: 'HTML' });
      } catch (err) {
        this.logger.error('Text chat error:', (err as Error).message);
      }
    });
  }

  // Sub-handler: Send Pet Status Card
  private async sendPetStatus(ctx: any) {
    try {
      const from = ctx.from;
      if (!from) return;

      const user = await this.prisma.user.findUnique({
        where: { telegramId: BigInt(from.id) },
        include: { pet: true },
      });

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

      const msg =
        `${emoji} <b>HỒ SƠ LINH THÚ: ${p.name.toUpperCase()}</b>\n` +
        `🏷️ Loài: <b>${species}</b> • Cấp: <b>Lv.${p.level}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💖 Hạnh phúc:  <b>${p.happiness}/100</b>\n${renderProgressBar(p.happiness)}\n\n` +
        `🍖 No bụng:     <b>${p.hunger}/100</b>\n${renderProgressBar(p.hunger)}\n\n` +
        `⚡ Năng lượng:  <b>${p.energy}/100</b>\n${renderProgressBar(p.energy)}\n\n` +
        `⭐ EXP: <b>${p.exp}/${p.maxExp}</b> • 🔥 Streak: <b>${user.streak} ngày</b>\n` +
        `⏱️ Tổng thời gian tập trung: <b>${p.totalFocusMinutes} phút</b>`;

      await ctx.reply(msg, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🍖 Cho Ăn', 'pet_feed'), Markup.button.callback('👋 Xoa Đầu (+3 💖)', 'pet_poke')],
          [Markup.button.callback('🎁 Điểm Danh Hàng Ngày', 'pet_checkin'), Markup.button.callback('⏱️ Focus 25p', 'pet_focus_25')],
        ]),
      });
    } catch (err) {
      this.logger.error('sendPetStatus error:', (err as Error).message);
    }
  }

  // Sub-handler: Poke Pet
  private async handlePoke(ctx: any) {
    try {
      const from = ctx.from;
      if (!from) return;

      const user = await this.prisma.user.findUnique({
        where: { telegramId: BigInt(from.id) },
        include: { pet: true },
      });

      if (!user?.pet) {
        await ctx.reply('🐾 Bạn chưa nhận nuôi linh thú nào! Hãy bấm "Nuôi Pet 🐾" ở góc dưới nhé.');
        return;
      }

      const newHappy = Math.min(100, user.pet.happiness + 3);
      await this.prisma.pet.update({
        where: { id: user.pet.id },
        data: { happiness: newHappy },
      });

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

  // Sub-handler: Show Feed Menu
  private async handleFeed(ctx: any) {
    try {
      const from = ctx.from;
      if (!from) return;

      const user = await this.prisma.user.findUnique({
        where: { telegramId: BigInt(from.id) },
        include: { pet: true, inventory: true },
      });

      if (!user?.pet) {
        await ctx.reply('🐾 Bạn chưa nhận nuôi linh thú nào! Hãy bấm "Nuôi Pet 🐾" ở góc dưới nhé.');
        return;
      }

      const foods = [
        { id: 'shrimp', name: '🦐 Tôm Debug (+25 no, +10 vui)' },
        { id: 'fish_ram', name: '🐟 Bánh Cá RAM (+25 no, +10 vui)' },
        { id: 'docker_jelly', name: '🐳 Thạch Docker (+25 no, +10 vui)' },
        { id: 'coffee_donut', name: '🍩 Donut Espresso (+25 no, +10 vui)' },
      ];

      const buttons = foods.map((f) => [Markup.button.callback(`Cho ăn ${f.name}`, `feed_item_${f.id}`)]);

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

  // Execute feeding an item
  private async executeFeedItem(ctx: any, foodId: string) {
    try {
      const from = ctx.from;
      if (!from) return;

      const user = await this.prisma.user.findUnique({
        where: { telegramId: BigInt(from.id) },
        include: { pet: true },
      });

      if (!user?.pet) return;

      const newHunger = Math.min(100, user.pet.hunger + 25);
      const newHappy = Math.min(100, user.pet.happiness + 10);

      await this.prisma.pet.update({
        where: { id: user.pet.id },
        data: {
          hunger: newHunger,
          happiness: newHappy,
          lastFedAt: new Date(),
        },
      });

      await ctx.answerCbQuery('😋 Măm măm ngon quá!');
      const emoji = PET_EMOJIS[user.pet.type] || '🐾';

      await ctx.reply(
        `${emoji} <b>${user.pet.name} đã được ăn no nê!</b>\n` +
        `🍖 No bụng: <b>${newHunger}/100</b> (+25)\n` +
        `💖 Hạnh phúc: <b>${newHappy}/100</b> (+10)\n` +
        `💬 <i>"Cảm ơn sen nhé, no bụng rồi chiến tiếp thôi nào!"</i>`,
        { parse_mode: 'HTML' },
      );
    } catch (err) {
      this.logger.error('executeFeedItem error:', (err as Error).message);
    }
  }

  // Daily Checkin
  private async handleCheckin(ctx: any) {
    try {
      const from = ctx.from;
      if (!from) return;

      const user = await this.prisma.user.findUnique({
        where: { telegramId: BigInt(from.id) },
        include: { pet: true },
      });

      if (!user?.pet) {
        await ctx.reply('🐾 Bạn chưa có linh thú! Hãy bấm nút "Nuôi Pet 🐾" ở góc dưới để nhận nuôi trước nhé!');
        return;
      }

      const newExp = user.pet.exp + 25;
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
        },
      });

      const emoji = PET_EMOJIS[user.pet.type] || '🐾';
      await ctx.reply(
        `🎁 <b>ĐIỂM DANH HÀNG NGÀY THÀNH CÔNG!</b>\n\n` +
        `⭐ Bạn nhận được <b>+25 EXP</b>!\n` +
        `🍱 Rơi thêm <b>1 Hộp Thức Ăn Công Nghệ</b> vào túi đồ!\n` +
        `${leveledUp ? `🎉 <b>CHÚC MỪNG: ${user.pet.name} ĐÃ LÊN CẤP ${newLevel}!</b> 👑\n` : ''}` +
        `📊 Cấp hiện tại: <b>Lv.${newLevel}</b> (${newExp}/${newMax} EXP)`,
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
        [Markup.button.callback('⏱️ Thử Focus 25 phút', 'pet_focus_25')],
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

    const user = await this.prisma.user.findUnique({
      where: { telegramId: BigInt(from.id) },
      include: { pet: true },
    });

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
            `⭐ Thưởng: <b>+${expGained} EXP</b> và <b>+10 Điểm Hạnh Phúc</b> cho ${petName}!\n` +
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
