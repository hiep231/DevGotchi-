import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export enum PetTypeEnum {
  PUFFY = 'PUFFY',
  BYTEY = 'BYTEY',
  GOLEMY = 'GOLEMY',
  OCTY = 'OCTY',
}

export class AdoptPetDto {
  @IsEnum(PetTypeEnum, { message: 'Type must be PUFFY, BYTEY, GOLEMY, or OCTY' })
  type: PetTypeEnum;

  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  name: string;
}
