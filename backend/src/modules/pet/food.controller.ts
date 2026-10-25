import { Controller, Get, Query } from '@nestjs/common';
import { PetService } from './pet.service';

@Controller('foods')
export class FoodController {
  constructor(private readonly petService: PetService) {}

  @Get()
  async getFoods(@Query('telegramId') telegramId?: string) {
    const tid = telegramId ? parseInt(telegramId, 10) : undefined;
    return this.petService.getFoods(tid);
  }
}
