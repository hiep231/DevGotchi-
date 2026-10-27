import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { BotService } from './bot.service';

@Controller('bot')
export class BotController {
  private readonly logger = new Logger(BotController.name);

  constructor(private readonly botService: BotService) {}

  @Get('status')
  getStatus() {
    return this.botService.getStatus();
  }

  @Post('webhook')
  async handleWebhook(@Body() update: any) {
    if (this.botService.botInstance) {
      try {
        await this.botService.botInstance.handleUpdate(update);
      } catch (err: any) {
        this.logger.error('Error handling webhook update:', err.message);
      }
    }
    return { ok: true };
  }
}
