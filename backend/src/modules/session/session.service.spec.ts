import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { PetService } from '../pet/pet.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PetTypeEnum } from '../pet/dto/adopt-pet.dto';

describe('SessionService', () => {
  let sessionService: SessionService;
  let petService: PetService;
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
          inventory: [],
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
    focusSession: {
      create: jest.fn().mockResolvedValue({ id: 'sess_1' }),
    },
    inventoryItem: {
      findFirst: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({ id: 'inv_1', count: 1 }),
      update: jest.fn().mockResolvedValue({ id: 'inv_1', count: 2 }),
    },
  };

  beforeEach(async () => {
    currentPet = null;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        PetService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    sessionService = module.get<SessionService>(SessionService);
    petService = module.get<PetService>(PetService);
  });

  it('should be defined', () => {
    expect(sessionService).toBeDefined();
  });

  it('should auto-adopt pet and grant EXP upon session completion', async () => {
    const res = await sessionService.completeSession({
      durationMinutes: 25,
      tag: 'feature',
    });

    expect(res.success).toBe(true);
    // 25 mins * 4 base = 100. Puffy passive bonus (+20%) = +20 => total 120 EXP.
    // Level 1 threshold is 100 maxExp, so pet levels up to 2!
    expect(res.data.expGained).toBe(120);
    expect(res.data.leveledUp).toBe(true);
    expect(res.data.pet.level).toBe(2);
    // newExp = 120 - 100 = 20
    expect(res.data.pet.exp).toBe(20);
    // newMaxExp = round(100 * 1.35) = 135
    expect(res.data.pet.maxExp).toBe(135);
    // Verify Phase 4 dropped food
    expect(res.data.droppedFood).toBeDefined();
    expect(res.data.droppedFoodName).toBeDefined();
  });
});
