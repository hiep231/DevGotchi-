import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { PetService } from '../pet/pet.service';
import { PetTypeEnum } from '../pet/dto/adopt-pet.dto';

const FOOD_NAMES_MAP: Record<string, string> = {
  golden_apple: '🍎 Táo Vàng Hackathon',
  coffee_donut: '🍩 Donut Espresso',
  docker_jelly: '🐳 Thạch Docker',
  fish_ram: '🐟 Bánh Cá RAM',
  shrimp: '🦐 Tôm Debug',
  bao: '🥟 Bánh Bao Bug',
  noodle_cup: '🍜 Mì Ly Terminal',
  pizza: '🍕 Pizza Deadline',
  banh_mi: '🥖 Bánh Mì Sài Gòn',
  bubble_tea: '🧋 Trà Sữa Sét',
  onigiri: '🍙 Cơm Nắm Git',
  ice_cream: '🍦 Kem Ốc Quế CSS',
};

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

    // Phase 4 Loot Table: Pomodoro as Expedition for High-tier & Legendary foods
    let droppedFood = 'shrimp';
    let foodTier: 'COMMON' | 'GOURMET' | 'RARE' | 'LEGENDARY' = 'COMMON';

    if (dto.durationMinutes >= 45) {
      // Deep Work Expedition: Guaranteed High Tier or Legendary!
      const deepWorkDrops = ['golden_apple', 'coffee_donut', 'docker_jelly'];
      droppedFood = deepWorkDrops[Math.floor(Math.random() * deepWorkDrops.length)];
      foodTier = droppedFood === 'golden_apple' ? 'LEGENDARY' : 'RARE';
    } else if (dto.durationMinutes >= 25) {
      // 25m Focus Expedition: 45% chance of High Tier / Legendary, 55% Gourmet
      const rand = Math.random();
      if (rand < 0.20) {
        droppedFood = 'golden_apple'; // Táo vàng Hackathon (+40 EXP, +40 💖, +30 ⚡)
        foodTier = 'LEGENDARY';
      } else if (rand < 0.50) {
        droppedFood = Math.random() > 0.5 ? 'coffee_donut' : 'docker_jelly';
        foodTier = 'RARE';
      } else {
        const gourmetDrops = ['bao', 'noodle_cup', 'pizza', 'fish_ram'];
        droppedFood = gourmetDrops[Math.floor(Math.random() * gourmetDrops.length)];
        foodTier = 'GOURMET';
      }
    } else {
      // Short focus (< 25m)
      const lightDrops = ['shrimp', 'fish_ram', 'bao'];
      droppedFood = lightDrops[Math.floor(Math.random() * lightDrops.length)];
      foodTier = 'COMMON';
    }

    // Pomodoro does not drain pet brutally anymore!
    // Energy gains +5, and Happiness increases +20!
    const newEnergy = Math.min(100, pet.energy + 5);

    const updatedPet = await this.prisma.pet.update({
      where: { id: pet.id },
      data: {
        level: newLevel,
        exp: newExp,
        maxExp: newMaxExp,
        totalFocusMinutes: pet.totalFocusMinutes + dto.durationMinutes,
        energy: newEnergy,
        happiness: Math.min(100, pet.happiness + 20),
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

    const droppedFoodName = FOOD_NAMES_MAP[droppedFood] || droppedFood;

    return {
      success: true,
      data: {
        pet: updatedPet,
        expGained,
        leveledUp,
        droppedFood,
        droppedFoodName,
        foodTier,
        message: leveledUp
          ? `🎉 Chúc mừng! Bé pet đã lên cấp ${newLevel} và nhặt được ${droppedFoodName}!`
          : `Tuyệt vời! Hoàn thành ${dto.durationMinutes} phút tập trung (#${dto.tag}), nhặt được ${droppedFoodName}!`,
      },
    };
  }
}
