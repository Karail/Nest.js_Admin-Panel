import { Controller, Get, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('wallets')
export class WalletsController {
    constructor(
        private readonly walletsService: WalletsService
    ) { }
    
    @Get()
    getAllToDate() {
        return this.walletsService.findAll();
    }
}
