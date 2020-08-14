import { Controller, Query, Get, UseGuards } from '@nestjs/common';
import { PlatformFlagListParams, PlatformFlagService } from './platform-flag.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('platform-flag')
export class PlatformFlagController {

    constructor(
        private readonly platformFlagService: PlatformFlagService
    ) { }

    @Get()
    getFlagsToPlatform(
        @Query() query: PlatformFlagListParams
    ) {
        return this.platformFlagService.findFlagToPlatform(query);
    }

}
