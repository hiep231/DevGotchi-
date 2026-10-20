import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('version')
  getVersion() {
    return {
      version: '1.0.3',
      features: ['daily_checkin_utc7', 'psoitask_button', 'bot_commands'],
      deployedAt: new Date().toISOString(),
    };
  }
}
