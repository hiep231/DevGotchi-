import { Module } from '@nestjs/common';
import { PetController } from './pet.controller';
import { FoodController } from './food.controller';
import { PetService } from './pet.service';

@Module({
  controllers: [PetController, FoodController],
  providers: [PetService],
  exports: [PetService],
})
export class PetModule {}
