import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateSpeechDto {
  @IsString()
  @IsNotEmpty()
  petName: string;

  @IsString()
  @IsNotEmpty()
  petType: string;

  @IsString()
  @IsNotEmpty()
  mood: string;

  @IsString()
  @IsOptional()
  lastTag?: string;
}
