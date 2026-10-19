import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { PetService } from '../pet/pet.service';
import { PetTypeEnum } from '../pet/dto/adopt-pet.dto';

const FOOD_DROPS = ['shrimp', 'fish_ram', 'docker_jelly', 'coffee_donut'];

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petService: PetService
  ) {}

  async completeSession(dto: CompleteSessionDto) {
    const baseExp = dto.durationMinutes * 4;
    const petRes = await this.petService.getMyPet();
    const pet = petRes.data;

    let bonusMultiplier = 0;
    if (pet.type === PetTypeEnum.PUFFY && dto.durationMinutes <= 25) {
      bonusMultiplier = 0.2;
    } else if (pet.type === PetTypeEnum.GOLEMY && dto.durationMinutes >= 45) {
      bonusMultiplier = 0.25;
    }

    const expGained = Math.round(baseExp * (1 + bonusMultiplier));
    let newExp = pet.exp + expGained;
    let newLevel = pet.level;
    let newMaxExp = pet.maxExp;
    let leveledUp = false;

    while (newExp >= newMaxExp) {
      newExp -= newMaxExp;
      newLevel += 1;
      newMaxExp = Math.round(newMaxExp * 1.35);
      leveledUp = true;
    }

    // Award food drop
    const droppedFood = FOOD_DROPS[Math.floor(Math.random() * FOOD_DROPS.length)];

    // Update in-memory pet stats
    pet.level = newLevel;
    pet.exp = newExp;
    pet.maxExp = newMaxExp;
    pet.totalFocusMinutes = (pet.totalFocusMinutes || 0) + dto.durationMinutes;
    pet.energy = Math.max(10, pet.energy - 10);
    pet.happiness = Math.min(100, pet.happiness + 15);
    pet.mood = 'HAPPY';

    try {
      if (this.prisma.focusSession) {
        // Record session in DB if available
      }
    } catch {
      // Fallback
    }

    return {
      success: true,
      data: {
        pet,
        expGained,
        leveledUp,
        droppedFood,
        message: leveledUp
          ? `🎉 Chúc mừng! Bé pet đã lên cấp ${newLevel} và nhận rương đồ ăn!`
          : `Tuyệt vời! Hoàn thành ${dto.durationMinutes} phút tập trung (#${dto.tag})!`,
      },
    };
  }
}
