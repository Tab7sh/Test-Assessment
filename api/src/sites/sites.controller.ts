import { Body, Controller, Get, Param, ParseIntPipe, PayloadTooLargeException, Post, Query } from '@nestjs/common';
import { PublishDto } from './publish.dto';
import { SitesService } from './sites.service';
import { PreviewDto } from './preview.dto';
import { cleanPage, MAX_HTML_BYTES } from './sanitize';

@Controller()
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  @Get('sites')
  directory() {
    return this.sites.directory();
  }

  /** The page currently published at an address. 404 means "nowhere". */
  @Get('sites/:address')
  current(@Param('address') address: string) {
    return this.sites.current(address);
  }

  /** A specific revision — how "back" shows the page that was left, not the page as it is now. */
  @Get('sites/:address/revisions/:n')
  revision(@Param('address') address: string, @Param('n', ParseIntPipe) n: number) {
    return this.sites.atRevision(address, n);
  }

  @Post('sites')
  publish(@Body() dto: PublishDto) {
    return this.sites.publish(dto);
  }

  @Post('preview')
  preview(@Body() dto: PreviewDto) {
    if (Buffer.byteLength(dto.html, 'utf8') > MAX_HTML_BYTES) {
      throw new PayloadTooLargeException('Page HTML is too large');
    }
    return { html: cleanPage(dto.html).html };
  }

  @Get('search')
  search(@Query('q') q = '', @Query('limit') limit?: string) {
    return this.sites.search(q, limit ? Number(limit) || 25 : 25);
  }
}

