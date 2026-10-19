import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CompleteSessionDto {
  @IsInt()
  @Min(1)
  @Max(180)
  durationMinutes: number;

  @IsString()
  @IsNotEmpty()
  tag: string;
}
