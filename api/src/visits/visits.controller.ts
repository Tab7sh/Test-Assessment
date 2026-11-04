import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RecordVisitDto } from './record-visit.dto';
import { VisitsService } from './visits.service';

@Controller()
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Post('visits')
  record(@Body() dto: RecordVisitDto) {
    return this.visits.record(dto);
  }

  @Get('people/:id/visits')
  history(@Param('id') id: string, @Query('before') before?: string, @Query('limit') limit?: string) {
    return this.visits.history(id, before || undefined, limit ? Number(limit) || 50 : 50);
  }
}

