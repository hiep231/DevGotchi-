import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
