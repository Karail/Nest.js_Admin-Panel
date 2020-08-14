import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CityService } from './city.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('cities')
export class CityController {
    constructor(
        private readonly CityService: CityService
    ) { }

    @Get()
    getAllToDate() {
        return this.CityService.findAllCities();
    }
    @Get('search/:query')
    getByQuery(
        @Param('query') query: string
    ) {
        return this.CityService.search(query);
    }
}
