import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { PetService } from './pet.service';
import { AdoptPetDto } from './dto/adopt-pet.dto';
import { FeedPetDto } from './dto/feed-pet.dto';
import { MinigameRewardDto } from './dto/minigame-reward.dto';

@Controller('pets')
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Get('me')
  async getMyPet(@Query('telegramId') telegramId?: string) {
    const tid = telegramId ? parseInt(telegramId, 10) : undefined;
    return this.petService.getMyPet(tid);
  }

  @Post('adopt')
  @UsePipes(new ValidationPipe({ transform: true }))
  async adoptPet(@Body() dto: AdoptPetDto, @Query('telegramId') telegramId?: string) {
    const tid = telegramId ? parseInt(telegramId, 10) : undefined;
    return this.petService.adoptPet(dto, tid);
  }

  @Post('feed')
  @UsePipes(new ValidationPipe({ transform: true }))
  async feedPet(@Body() dto: FeedPetDto, @Query('telegramId') telegramId?: string) {
    const tid = telegramId ? parseInt(telegramId, 10) : undefined;
    return this.petService.feedPet(dto, tid);
  }

  @Post('minigame-reward')
  @UsePipes(new ValidationPipe({ transform: true }))
  async claimMinigameReward(@Body() dto: MinigameRewardDto, @Query('telegramId') telegramId?: string) {
    const tid = telegramId ? parseInt(telegramId, 10) : undefined;
    return this.petService.claimMinigameReward(dto, tid);
  }

  @Post('claim-afk')
  async claimAfkReward(@Query('telegramId') telegramId?: string) {
    const tid = telegramId ? parseInt(telegramId, 10) : undefined;
    return this.petService.claimAfkReward(tid);
  }

  @Post('reset')
  async resetPet(@Query('telegramId') telegramId?: string) {
    const tid = telegramId ? parseInt(telegramId, 10) : undefined;
    return this.petService.resetPet(tid);
  }
}
