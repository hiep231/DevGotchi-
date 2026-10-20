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
    private readonly petService: PetService,
  ) {}

  async completeSession(dto: CompleteSessionDto, telegramId?: number) {
    const tid = telegramId ? BigInt(telegramId) : BigInt(123456);

    const user = await this.prisma.user.upsert({
      where: { telegramId: tid },
      create: { telegramId: tid, username: `user_${tid}` },
      update: { lastActive: new Date() },
      include: { pet: true },
    });

    let pet = user.pet;
    if (!pet) {
      const defaultAdopt = await this.petService.adoptPet(
        { type: PetTypeEnum.PUFFY, name: 'Puffy' },
        telegramId,
      );
      pet = defaultAdopt.data;
    }

    const baseExp = dto.durationMinutes * 4;
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

    const droppedFood = FOOD_DROPS[Math.floor(Math.random() * FOOD_DROPS.length)];

    const updatedPet = await this.prisma.pet.update({
      where: { id: pet.id },
      data: {
        level: newLevel,
        exp: newExp,
        maxExp: newMaxExp,
        totalFocusMinutes: pet.totalFocusMinutes + dto.durationMinutes,
        energy: Math.max(10, pet.energy - 10),
        happiness: Math.min(100, pet.happiness + 15),
        mood: 'HAPPY',
      },
    });

    await this.prisma.focusSession.create({
      data: {
        userId: user.id,
        durationMin: dto.durationMinutes,
        tag: dto.tag,
        expGained,
      },
    });

    // Award food drop in user's inventory
    await this.prisma.inventoryItem.upsert({
      where: {
        userId_foodId: {
          userId: user.id,
          foodId: droppedFood,
        },
      },
      create: {
        userId: user.id,
        foodId: droppedFood,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });

    return {
      success: true,
      data: {
        pet: updatedPet,
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
