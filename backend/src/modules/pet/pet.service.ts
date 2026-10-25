import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdoptPetDto, PetTypeEnum } from './dto/adopt-pet.dto';
import { FeedPetDto } from './dto/feed-pet.dto';
import { MinigameRewardDto } from './dto/minigame-reward.dto';
import { calculatePetDecay } from './pet-decay.util';
import { evaluateAfkAdventure } from './pet-afk.util';

const FAVORITE_FOOD_MAP: Record<PetTypeEnum, string> = {
  [PetTypeEnum.PUFFY]: 'shrimp',
  [PetTypeEnum.BYTEY]: 'fish_ram',
  [PetTypeEnum.GOLEMY]: 'docker_jelly',
  [PetTypeEnum.OCTY]: 'coffee_donut',
};

export const ALL_FOODS_META = [
  {
    id: 'water',
    name: 'Nước Lọc Dev',
    icon: '💧',
    color: 'from-sky-400 to-blue-500',
    hungerRestored: 10,
    happinessBonus: 5,
    energyBonus: 5,
    isInfinite: true,
    description: 'Nước lọc mát lành miễn phí vô hạn, uống đủ 2 lít mỗi ngày để luôn tràn đầy sinh lực!',
  },
  {
    id: 'shrimp',
    name: 'Tôm Debug',
    icon: '🦐',
    color: 'from-orange-400 to-rose-500',
    hungerRestored: 30,
    happinessBonus: 15,
    energyBonus: 10,
    description: 'Khoái khẩu của Puffy, vừa béo vừa giòn giúp tiêu hóa hết bug!',
  },
  {
    id: 'fish_ram',
    name: 'Bánh Cá RAM',
    icon: '🐟',
    color: 'from-blue-400 to-cyan-500',
    hungerRestored: 25,
    happinessBonus: 20,
    energyBonus: 15,
    description: 'Giòn rụm vị silicon, nạp đầy bộ nhớ tức thì cho Bytey.',
  },
  {
    id: 'docker_jelly',
    name: 'Thạch Docker',
    icon: '🧊',
    color: 'from-emerald-400 to-teal-500',
    hungerRestored: 35,
    happinessBonus: 10,
    energyBonus: 10,
    description: 'Mát lạnh, đóng gói nguyên vẹn dinh dưỡng cho Dino.',
  },
  {
    id: 'coffee_donut',
    name: 'Donut Espresso',
    icon: '🍩',
    color: 'from-amber-400 to-amber-700',
    hungerRestored: 20,
    happinessBonus: 25,
    energyBonus: 25,
    description: 'Nạp caffeine cực mạnh kéo mood tỉnh táo cho Octy.',
  },
  {
    id: 'bao',
    name: 'Bánh Bao Bug',
    icon: '🥟',
    color: 'from-yellow-300 to-amber-500',
    hungerRestored: 25,
    happinessBonus: 15,
    energyBonus: 10,
    description: 'Bánh bao nóng hổi, nhân thịt đầy đặn xua tan mọi bug logic.',
  },
  {
    id: 'noodle_cup',
    name: 'Mì Ly Coder',
    icon: '🍜',
    color: 'from-red-400 to-orange-500',
    hungerRestored: 30,
    happinessBonus: 15,
    energyBonus: 15,
    description: 'Món ăn cứu cánh cho những đêm thức trắng fix deadline.',
  },
  {
    id: 'bubble_tea',
    name: 'Trà Sữa Full Thạch',
    icon: '🧋',
    color: 'from-purple-400 to-pink-500',
    hungerRestored: 15,
    happinessBonus: 30,
    energyBonus: 10,
    description: 'Ngọt ngào béo ngậy, nạp dopamine cho buổi chiều uể oải.',
  },
  {
    id: 'onigiri',
    name: 'Cơm Nắm Git',
    icon: '🍙',
    color: 'from-emerald-300 to-green-600',
    hungerRestored: 20,
    happinessBonus: 15,
    energyBonus: 15,
    description: 'Gói gọn tinh hoa, commit chắc chắn từng hạt cơm dẻo.',
  },
  {
    id: 'ice_cream',
    name: 'Kem Ốc Quế CSS',
    icon: '🍦',
    color: 'from-pink-300 to-rose-400',
    hungerRestored: 15,
    happinessBonus: 25,
    energyBonus: 10,
    description: 'Mát lạnh ngọt lịm, giải nhiệt tức thì sau khi vật lộn với flexbox.',
  },
  {
    id: 'pizza',
    name: 'Pizza Deadline',
    icon: '🍕',
    color: 'from-amber-500 to-red-600',
    hungerRestored: 35,
    happinessBonus: 20,
    energyBonus: 15,
    description: 'Một lát pizza phô mai kéo sợi tiếp sức cho cả sprint.',
  },
  {
    id: 'banh_mi',
    name: 'Bánh Mì Sài Gòn',
    icon: '🥖',
    color: 'from-yellow-500 to-orange-600',
    hungerRestored: 30,
    happinessBonus: 20,
    energyBonus: 15,
    description: 'Giòn rụm đậm đà, đặc sản tiếp lửa cho dev Việt.',
  },
  {
    id: 'golden_apple',
    name: 'Táo Vàng Hackathon',
    icon: '🍎',
    color: 'from-yellow-300 to-amber-400',
    hungerRestored: 40,
    happinessBonus: 40,
    energyBonus: 30,
    description: 'Vật phẩm huyền thoại! Hồi phục toàn bộ sinh lực và may mắn.',
  },
];

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
        let currentPet = user.pet;
        if (decay.hasDecayed) {
          currentPet = await this.prisma.pet.update({
            where: { id: user.pet.id },
            data: {
              hunger: decay.decayedHunger,
              happiness: decay.decayedHappiness,
              energy: decay.decayedEnergy,
              mood: decay.newMood as any,
              lastFedAt: decay.newLastFedAt,
            },
          });
        }

        // Check if pet was on an AFK adventure (>= 4 hours offline)
        const afk = evaluateAfkAdventure(user, currentPet);

        return {
          success: true,
          data: currentPet,
          afkAdventure: afk.hasReward ? afk : undefined,
        };
      }
    } catch (err) {
      console.error('getMyPet error:', err);
    }

    // New user with no pet yet -> always return null
    return { success: true, data: null };
  }

  async getFoods(telegramId?: number) {
    const tid = telegramId ? BigInt(telegramId) : BigInt(123456);

    try {
      const user = await this.prisma.user.upsert({
        where: { telegramId: tid },
        create: { telegramId: tid, username: `user_${tid}` },
        update: {},
        include: { inventory: true },
      });

      // Ensure starter pack items exist (3 of each starter item)
      const starterKeys = ['shrimp', 'fish_ram', 'docker_jelly', 'coffee_donut'];
      for (const key of starterKeys) {
        if (!user.inventory.some((i) => i.foodId === key)) {
          await this.prisma.inventoryItem.create({
            data: { userId: user.id, foodId: key, count: 3 },
          }).catch(() => {});
        }
      }

      // Re-fetch inventory
      const inventory = await this.prisma.inventoryItem.findMany({
        where: { userId: user.id },
      });

      const countMap = new Map(inventory.map((item) => [item.foodId, item.count]));

      const result = ALL_FOODS_META.map((meta) => ({
        ...meta,
        count: meta.id === 'water' ? 999 : (countMap.get(meta.id) ?? 0),
      }));

      return { success: true, data: result };
    } catch (err) {
      console.error('getFoods error:', err);
      return { success: true, data: ALL_FOODS_META.map((f) => ({ ...f, count: 0 })) };
    }
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
      include: { pet: true, inventory: true },
    });

    if (!user?.pet) {
      throw new NotFoundException('Chưa tìm thấy thú cưng! Hãy nhận nuôi trước nhé.');
    }

    const pet = user.pet;

    // 1. Check if pet is full
    if (pet.hunger >= 100) {
      throw new BadRequestException('Bé cưng đã no căng bụng rồi (100/100 🍖)! Không nên ép bé ăn thêm nhé.');
    }

    const foodMeta = ALL_FOODS_META.find((f) => f.id === dto.foodId);
    const hungerRestored = foodMeta?.hungerRestored ?? 25;
    const happinessBonus = foodMeta?.happinessBonus ?? 15;
    const energyBonus = foodMeta?.energyBonus ?? 10;

    const isFav = FAVORITE_FOOD_MAP[pet.type] === dto.foodId;
    const hungerGain = isFav ? hungerRestored + 15 : hungerRestored;
    const happyGain = isFav ? happinessBonus + 15 : happinessBonus;

    const newHunger = Math.min(100, pet.hunger + hungerGain);
    const newHappy = Math.min(100, pet.happiness + happyGain);
    const newEnergy = Math.min(100, pet.energy + energyBonus);

    // 2. If drinking water: free & infinite tier, no inventory deduction needed
    if (dto.foodId === 'water') {
      const updatedPet = await this.prisma.pet.update({
        where: { id: pet.id },
        data: {
          hunger: newHunger,
          happiness: newHappy,
          energy: newEnergy,
          mood: newHunger > 25 && pet.mood === 'HUNGRY' ? 'HAPPY' : pet.mood,
          lastFedAt: new Date(),
        },
      });

      return {
        success: true,
        data: updatedPet,
        remainingCount: 999,
        message: 'Bé đã uống một cốc nước lọc mát lành (+10 🍖, +5 💖)! Nguồn nước miễn phí luôn sẵn sàng.',
      };
    }

    // 3. Regular foods: check and consume inventory item
    const item = user.inventory.find((i) => i.foodId === dto.foodId);
    if (!item || item.count <= 0) {
      throw new BadRequestException('Món ăn này trong túi đồ của bạn đã hết!');
    }

    const [updatedItem, updatedPet] = await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { id: item.id },
        data: { count: item.count - 1 },
      }),
      this.prisma.pet.update({
        where: { id: pet.id },
        data: {
          hunger: newHunger,
          happiness: newHappy,
          energy: newEnergy,
          mood: newHunger > 25 && pet.mood === 'HUNGRY' ? 'HAPPY' : pet.mood,
          lastFedAt: new Date(),
        },
      }),
    ]);

    return {
      success: true,
      data: updatedPet,
      remainingCount: updatedItem.count,
      message: isFav ? 'Khoái khẩu! Thưởng thêm 15 điểm no & vui vẻ!' : 'Bé pet đã được ăn no!',
    };
  }

  async claimMinigameReward(dto: MinigameRewardDto, telegramId?: number) {
    const tid = telegramId ? BigInt(telegramId) : 100000001n;

    const user = await this.prisma.user.findUnique({
      where: { telegramId: tid },
      include: { pet: true, inventory: true },
    });

    if (!user?.pet) {
      throw new NotFoundException('Chưa tìm thấy thú cưng! Hãy nhận nuôi trước nhé.');
    }

    const pet = user.pet;

    // 1. Calculate rewards based on score
    const expGained = Math.min(80, Math.max(15, dto.score * 3));
    const happinessGain = Math.min(25, Math.max(10, Math.floor(dto.score / 2)));
    const energyGain = 5;

    // Determine reward food item
    let rewardFood = 'shrimp';
    let rewardFoodName = '🦐 Tôm Debug';
    if (dto.score >= 20) {
      const topPicks = [
        { id: 'docker_jelly', name: '🐳 Thạch Docker' },
        { id: 'coffee_donut', name: '🍩 Donut Espresso' },
      ];
      const pick = topPicks[Math.floor(Math.random() * topPicks.length)];
      rewardFood = pick.id;
      rewardFoodName = pick.name;
    } else if (dto.score >= 10) {
      rewardFood = 'fish_ram';
      rewardFoodName = '🐟 Bánh Cá RAM';
    }

    // 2. EXP & Level Progression
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

    const newHappy = Math.min(100, pet.happiness + happinessGain);
    const newEnergy = Math.min(100, pet.energy + energyGain);

    // 3. Upsert inventory item & update Pet
    const existingItem = user.inventory.find((i) => i.foodId === rewardFood);

    const [updatedPet] = await this.prisma.$transaction([
      this.prisma.pet.update({
        where: { id: pet.id },
        data: {
          exp: newExp,
          level: newLevel,
          maxExp: newMaxExp,
          happiness: newHappy,
          energy: newEnergy,
          mood: 'HAPPY',
        },
      }),
      existingItem
        ? this.prisma.inventoryItem.update({
            where: { id: existingItem.id },
            data: { count: existingItem.count + 1 },
          })
        : this.prisma.inventoryItem.create({
            data: {
              userId: user.id,
              foodId: rewardFood,
              count: 1,
            },
          }),
    ]);

    return {
      success: true,
      data: {
        pet: updatedPet,
        expGained,
        happinessGained: happinessGain,
        energyGained: energyGain,
        rewardFood,
        rewardFoodName,
        leveledUp,
      },
      message: `Bắt được ${dto.score} bug! Nhận được ${rewardFoodName} và +${expGained} EXP!`,
    };
  }

  async claimAfkReward(telegramId?: number) {
    const tid = telegramId ? BigInt(telegramId) : 100000001n;

    const user = await this.prisma.user.findUnique({
      where: { telegramId: tid },
      include: { pet: true, inventory: true },
    });

    if (!user?.pet) {
      throw new NotFoundException('Chưa tìm thấy thú cưng!');
    }

    const afk = evaluateAfkAdventure(user, user.pet);
    if (!afk.hasReward) {
      return { success: false, message: 'Bé chưa đi thám hiểm đủ lâu (cần ít nhất 4 tiếng vắng nhà)!' };
    }

    // EXP & Level Progression
    let newExp = user.pet.exp + afk.expGained;
    let newLevel = user.pet.level;
    let newMaxExp = user.pet.maxExp;
    let leveledUp = false;

    while (newExp >= newMaxExp) {
      newExp -= newMaxExp;
      newLevel += 1;
      newMaxExp = Math.round(newMaxExp * 1.35);
      leveledUp = true;
    }

    // Upsert loot items into user's inventory
    const inventoryUpdates = afk.loot.map((lootItem) => {
      const existing = user.inventory.find((i) => i.foodId === lootItem.id);
      return existing
        ? this.prisma.inventoryItem.update({
            where: { id: existing.id },
            data: { count: existing.count + lootItem.count },
          })
        : this.prisma.inventoryItem.create({
            data: {
              userId: user.id,
              foodId: lootItem.id,
              count: lootItem.count,
            },
          });
    });

    // Update Pet (100% energy recharge, EXP gained, happy) & update user.lastActive
    const [updatedPet] = await this.prisma.$transaction([
      this.prisma.pet.update({
        where: { id: user.pet.id },
        data: {
          exp: newExp,
          level: newLevel,
          maxExp: newMaxExp,
          energy: 100,
          happiness: Math.min(100, user.pet.happiness + 15),
          mood: 'HAPPY',
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() },
      }),
      ...inventoryUpdates,
    ]);

    return {
      success: true,
      data: {
        pet: updatedPet,
        afk,
        leveledUp,
      },
      message: `Nhận thành công quà thám hiểm: +${afk.expGained} EXP, sạc đầy 100% ⚡ Năng lượng và ${afk.loot.map((l) => `${l.name} x${l.count}`).join(', ')}!`,
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
          await this.prisma.pet.delete({
            where: { id: user.pet.id },
          });
        }
      } catch (err) {
        console.error('resetPet error:', err);
      }
    }

    return { success: true, message: 'Pet reset successfully' };
  }
}
