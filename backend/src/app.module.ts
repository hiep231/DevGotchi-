import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PetModule } from './modules/pet/pet.module';
import { SessionModule } from './modules/session/session.module';
import { AiModule } from './modules/ai/ai.module';
import { BadgeModule } from './modules/badge/badge.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PetModule,
    SessionModule,
    AiModule,
    BadgeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
