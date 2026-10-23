import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdoptPetDto, PetTypeEnum } from './dto/adopt-pet.dto';
import { FeedPetDto } from './dto/feed-pet.dto';
import { calculatePetDecay } from './pet-decay.util';

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

  async getMyPet(telegramId?: number) {
    if (!telegramId) {
      return { success: true, data: null };
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { telegramId: BigInt(telegramId) },
        include: { pet: true },
      });

      if (user?.pet) {
        const decay = calculatePetDecay(user.pet);
        if (decay.hasDecayed) {
          const updatedPet = await this.prisma.pet.update({
            where: { id: user.pet.id },
            data: {
              hunger: decay.decayedHunger,
              happiness: decay.decayedHappiness,
              energy: decay.decayedEnergy,
              mood: decay.newMood as any,
              lastFedAt: decay.newLastFedAt,
            },
          });
          return { success: true, data: updatedPet };
        }
        return { success: true, data: user.pet };
      }
    } catch (err) {
      console.error('getMyPet error:', err);
    }

    // New user with no pet yet -> always return null
    return { success: true, data: null };
  }

  async adoptPet(dto: AdoptPetDto, telegramId?: number) {
    const tid = telegramId ? BigInt(telegramId) : BigInt(123456);

    try {
      // Find or create user strictly by telegramId
      const user = await this.prisma.user.upsert({
        where: { telegramId: tid },
        create: {
          telegramId: tid,
          username: `user_${tid}`,
        },
        update: { lastActive: new Date() },
      });

      const pet = await this.prisma.pet.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          type: dto.type,
          name: dto.name.trim(),
          level: 1,
          exp: 0,
          maxExp: 100,
          hunger: 70,
          energy: 85,
          happiness: 90,
        },
        update: {
          type: dto.type,
          name: dto.name.trim(),
        },
      });

      return { success: true, data: pet };
    } catch (err) {
      console.error('adoptPet error:', err);
      throw err;
    }
  }

  async feedPet(dto: FeedPetDto, telegramId?: number) {
    const tid = telegramId ? BigInt(telegramId) : BigInt(123456);

    const user = await this.prisma.user.findUnique({
      where: { telegramId: tid },
      include: { pet: true },
    });

    if (!user?.pet) {
      throw new NotFoundException('No pet found to feed. Please adopt a pet first.');
    }

    const pet = user.pet;
    const nutrition = FOOD_NUTRITION[dto.foodId] || { hunger: 20, happiness: 10 };
    const isFav = FAVORITE_FOOD_MAP[pet.type] === dto.foodId;

    const hungerBoost = isFav ? nutrition.hunger + 15 : nutrition.hunger;
    const happyBoost = isFav ? nutrition.happiness + 15 : nutrition.happiness;

    const newHunger = Math.min(100, pet.hunger + hungerBoost);
    const newHappy = Math.min(100, pet.happiness + happyBoost);

    const updated = await this.prisma.pet.update({
      where: { id: pet.id },
      data: {
        hunger: newHunger,
        happiness: newHappy,
        lastFedAt: new Date(),
      },
    });

    return {
      success: true,
      data: updated,
      message: isFav ? 'Khoái khẩu! Thưởng thêm 15 điểm no & vui vẻ!' : 'Bé pet đã được ăn no!',
    };
  }

  async resetPet(telegramId?: number) {
    if (telegramId) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { telegramId: BigInt(telegramId) },
          include: { pet: true },
        });
        if (user?.pet) {
          await this.prisma.pet.delete({ where: { id: user.pet.id } });
        }
      } catch (err) {
        console.error('resetPet error:', err);
      }
    }
    return { success: true, message: 'Pet reset successfully' };
  }
}
