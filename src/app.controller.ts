import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check / Hello Endpoint', description: 'Returns a welcome greeting.' })
  @ApiResponse({ status: 200, description: 'Welcome greeting message returned successfully.' })
  getHello(): string {
    return this.appService.getHello();
  }
}
