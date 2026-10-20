import { Test, TestingModule } from '@nestjs/testing';
import { PetService } from './pet.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PetTypeEnum } from './dto/adopt-pet.dto';
import { NotFoundException } from '@nestjs/common';

describe('PetService', () => {
  let service: PetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetService,
        {
          provide: PrismaService,
          useValue: {
            pet: null,
            user: null,
          },
        },
      ],
    }).compile();

    service = module.get<PetService>(PetService);
    await service.resetPet();
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
    await service.resetPet();
    await expect(service.feedPet({ foodId: 'shrimp' })).rejects.toThrow(NotFoundException);
  });
});
