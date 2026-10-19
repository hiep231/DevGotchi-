import { IsNotEmpty, IsString } from 'class-validator';

export class FeedPetDto {
  @IsString()
  @IsNotEmpty()
  foodId: string;
}
