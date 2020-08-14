import { Controller, Query, Get, UseGuards } from '@nestjs/common';
import { SportService, SportListParams } from './sport.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('sport')
export class SportController {

    constructor(
        private readonly sportService: SportService
    ) { }

    @Get()
    getList(
        @Query() query: SportListParams,
    ) {
        const { page, pageSize } = query 
        return this.sportService.list(page, pageSize || 100); //! ПРОБЛЕМА
    }

}
