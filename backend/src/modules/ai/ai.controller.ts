import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateSpeechDto } from './dto/generate-speech.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('speech')
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateSpeech(@Body() dto: GenerateSpeechDto) {
    return this.aiService.generatePetSpeech(dto);
  }
}
