import { IsInt, Min } from 'class-validator';

export class MinigameRewardDto {
  @IsInt()
  @Min(0)
  score!: number;
}
