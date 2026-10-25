import { Test, TestingModule } from '@nestjs/testing';
import { PetService } from './pet.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PetTypeEnum } from './dto/adopt-pet.dto';
import { NotFoundException } from '@nestjs/common';

describe('PetService', () => {
  let service: PetService;
  let currentPet: any = null;

  const mockPrisma = {
    user: {
      upsert: jest.fn().mockImplementation(async () => ({
        id: 'user_1',
        telegramId: BigInt(123456),
        username: 'user_123456',
        pet: currentPet,
      })),
      findUnique: jest.fn().mockImplementation(async () => {
        if (!currentPet) return null;
        return {
          id: 'user_1',
          telegramId: BigInt(123456),
          username: 'user_123456',
          pet: currentPet,
          inventory: [{ foodId: 'shrimp', count: 5 }],
        };
      }),
      update: jest.fn().mockResolvedValue({ id: 'user_1' }),
    },
    pet: {
      upsert: jest.fn().mockImplementation(async ({ create }) => {
        currentPet = {
          id: 'pet_1',
          userId: 'user_1',
          type: create.type,
          name: create.name,
          level: 1,
          exp: 0,
          maxExp: 100,
          hunger: 70,
          energy: 85,
          happiness: 90,
          streak: 1,
          totalFocusMinutes: 0,
          lastFedAt: new Date(),
        };
        return currentPet;
      }),
      update: jest.fn().mockImplementation(async ({ data }) => {
        currentPet = { ...currentPet, ...data };
        return currentPet;
      }),
      delete: jest.fn().mockImplementation(async () => {
        currentPet = null;
        return null;
      }),
    },
    inventoryItem: {
      findFirst: jest.fn().mockResolvedValue({ id: 'inv_1', foodId: 'shrimp', count: 5 }),
      findUnique: jest.fn().mockResolvedValue({ id: 'inv_1', foodId: 'shrimp', count: 5 }),
      update: jest.fn().mockResolvedValue({ id: 'inv_1', foodId: 'shrimp', count: 4 }),
      upsert: jest.fn().mockResolvedValue({ id: 'inv_1', foodId: 'shrimp', count: 1 }),
    },
    $transaction: jest.fn().mockImplementation(async (promises) => Promise.all(promises)),
  };

  beforeEach(async () => {
    currentPet = null;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PetService>(PetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should adopt a pet and initialize stats correctly', async () => {
    const res = await service.adoptPet({
      type: PetTypeEnum.PUFFY,
      name: 'Puff',
    });

    expect(res.success).toBe(true);
    expect(res.data.name).toBe('Puff');
    expect(res.data.type).toBe(PetTypeEnum.PUFFY);
    expect(res.data.level).toBe(1);
    expect(res.data.exp).toBe(0);
    expect(res.data.maxExp).toBe(100);
    expect(res.data.hunger).toBe(70);
  });

  it('should feed a pet with favorite food bonus', async () => {
    await service.adoptPet({
      type: PetTypeEnum.PUFFY,
      name: 'Puff',
    });

    // Puffy's favorite is shrimp
    const feedRes = await service.feedPet({ foodId: 'shrimp' });
    expect(feedRes.success).toBe(true);
    // Nutrition: shrimp gives 30 + 15 bonus = 45 hunger. 70 + 45 = 115 => clamped to 100
    expect(feedRes.data.hunger).toBe(100);
    expect(feedRes.message).toContain('Khoái khẩu');
  });

  it('should throw NotFoundException if feeding with no adopted pet', async () => {
    currentPet = null;
    await expect(service.feedPet({ foodId: 'shrimp' })).rejects.toThrow(NotFoundException);
  });
});
