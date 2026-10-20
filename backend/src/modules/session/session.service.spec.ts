import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { PetService } from '../pet/pet.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PetTypeEnum } from '../pet/dto/adopt-pet.dto';

describe('SessionService', () => {
  let sessionService: SessionService;
  let petService: PetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        PetService,
        {
          provide: PrismaService,
          useValue: {
            pet: null,
            user: null,
            focusSession: null,
          },
        },
      ],
    }).compile();

    sessionService = module.get<SessionService>(SessionService);
    petService = module.get<PetService>(PetService);
    await petService.resetPet();
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
  });
});
