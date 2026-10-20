import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdoptPetDto, PetTypeEnum } from './dto/adopt-pet.dto';
import { FeedPetDto } from './dto/feed-pet.dto';

const FAVORITE_FOOD_MAP: Record<PetTypeEnum, string> = {
  [PetTypeEnum.PUFFY]: 'shrimp',
  [PetTypeEnum.BYTEY]: 'fish_ram',
  [PetTypeEnum.GOLEMY]: 'docker_jelly',
  [PetTypeEnum.OCTY]: 'coffee_donut',
};

const FOOD_NUTRITION: Record<string, { hunger: number; happiness: number }> = {
  shrimp: { hunger: 30, happiness: 15 },
  fish_ram: { hunger: 25, happiness: 20 },
  docker_jelly: { hunger: 35, happiness: 10 },
  coffee_donut: { hunger: 20, happiness: 25 },
};

@Injectable()
export class PetService {
  constructor(private readonly prisma: PrismaService) {}

  // In-memory fallback if Database is not yet running
  private inMemoryPet: any = null;

  async getMyPet(telegramId?: number) {
    try {
      if (this.prisma.pet) {
        let user;
        if (telegramId) {
          user = await this.prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) },
            include: { pet: true },
          });
        }

        if (user?.pet) {
          return { success: true, data: user.pet };
        }
      }
    } catch {
      // Fallback
    }

    return { success: true, data: this.inMemoryPet };
  }

  async adoptPet(dto: AdoptPetDto, telegramId?: number) {
    const updated = {
      id: `pet_${Date.now()}`,
      userId: 'user_default',
      type: dto.type,
      name: dto.name.trim(),
      customName: dto.name.trim(),
      level: 1,
      exp: 0,
      maxExp: 100,
      hunger: 70,
      energy: 85,
      happiness: 90,
      streak: 1,
      mood: 'HAPPY',
      isSleeping: false,
      totalFocusMinutes: 0,
      lastFedAt: new Date(),
    };
    this.inMemoryPet = updated;

    try {
      if (this.prisma.pet) {
        // Find or create user
        const user = await this.prisma.user.upsert({
          where: { telegramId: telegramId ? BigInt(telegramId) : BigInt(123456) },
          create: {
            telegramId: telegramId ? BigInt(telegramId) : BigInt(123456),
            username: 'dev_hero',
          },
          update: { lastActive: new Date() },
        });

        const pet = await this.prisma.pet.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            type: dto.type,
            name: dto.name,
          },
          update: {
            type: dto.type,
            name: dto.name,
            level: 1,
            exp: 0,
            hunger: 70,
            happiness: 90,
          },
        });

        return { success: true, data: pet };
      }
    } catch {
      // Fallback
    }

    return { success: true, data: updated };
  }

  async feedPet(dto: FeedPetDto) {
    if (!this.inMemoryPet) {
      throw new NotFoundException('No pet found to feed. Please adopt a pet first.');
    }

    const nutrition = FOOD_NUTRITION[dto.foodId] || { hunger: 20, happiness: 10 };
    const isFav = FAVORITE_FOOD_MAP[this.inMemoryPet.type] === dto.foodId;

    const hungerBoost = isFav ? nutrition.hunger + 15 : nutrition.hunger;
    const happyBoost = isFav ? nutrition.happiness + 15 : nutrition.happiness;

    this.inMemoryPet.hunger = Math.min(100, this.inMemoryPet.hunger + hungerBoost);
    this.inMemoryPet.happiness = Math.min(100, this.inMemoryPet.happiness + happyBoost);
    this.inMemoryPet.lastFedAt = new Date();

    return {
      success: true,
      data: this.inMemoryPet,
      message: isFav ? 'Khoái khẩu! Thưởng thêm 15 điểm no & vui vẻ!' : 'Bé pet đã được ăn no!',
    };
  }

  async resetPet() {
    this.inMemoryPet = null;
    return { success: true, message: 'Pet reset successfully' };
  }
}
