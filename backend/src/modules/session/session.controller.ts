import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { SessionService } from './session.service';
import { CompleteSessionDto } from './dto/complete-session.dto';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('complete')
  @UsePipes(new ValidationPipe({ transform: true }))
  async completeSession(@Body() dto: CompleteSessionDto) {
    return this.sessionService.completeSession(dto);
  }
}
