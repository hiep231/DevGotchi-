import { Module } from '@nestjs/common';
import { BadgeController } from './badge.controller';
import { PetModule } from '../pet/pet.module';

@Module({
  imports: [PetModule],
  controllers: [BadgeController],
})
export class BadgeModule {}
