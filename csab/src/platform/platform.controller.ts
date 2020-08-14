import { Controller, Get, Put, Param, Body, NotFoundException, UseGuards, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PlatformService } from './platform.service';
import { Platform, PlatformStatus } from './cs/models/platform.model';
import { AuthGuard } from '@nestjs/passport';
import { UpdateStatusDto } from './dto/status.dto';
import { Op } from 'sequelize'
import PlatformFlag from '../platform-flag/cs/models/platformFlag.model';

@UseGuards(AuthGuard('jwt'))
@Controller('platform')
export class PlatformController {
    constructor(
        private readonly platformService: PlatformService,
        @InjectModel(Platform)
        private readonly platformModel: typeof Platform,
    ) { }

    @Get()
    getAllToDate(): Promise<Platform[]> {
        return this.platformService.findAllToDate();
    }

    @Get('search/:query')
    getByQuery(
        @Param('query') query: string
    ) {
        return this.platformService.search(query);
    }
    // @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    async getById(
        @Param('id') id: string,
        @Query('searchCandidate') searchCandidate
    ) {
        const where = (searchCandidate ? { id, candidateFor: id } : { id });

        const attributes: (keyof PlatformFlag)[] = ['id', 'value', 'type'];
        const foundPlatform = await this.platformModel.findOne({
            where: { [Op.or]: where },
            order: [['candidateFor', 'DESC']],
            include: [
                {
                    model: PlatformFlag,
                    attributes
                }
            ]
        });
        if (!foundPlatform.id)
            throw new NotFoundException('not exists!');

        return this.platformService.getById(foundPlatform);
    }

    // @UseGuards(AuthGuard('jwt'))
    @Get('get-status/:status')
    getByStatus(
        @Param('status') status: PlatformStatus
    ): Promise<Platform[]> {
        return this.platformService.findByStatus(status);
    }

    @Get('get-city/:cityId')
    getByCityId(
        @Param('cityId') cityId: string
    ): Promise<Platform[]> {
        return this.platformService.findByCityId(cityId);
    }

    //   @UseGuards(AuthGuard('jwt'))
    @Put('update-full/:id')
    async updateFullPlatform(
        @Param('id') id: string,
        @Body() params
    ) {
        console.log(params)
        const platform = await this.platformModel.findOne({
            where: { [Op.or]: ({ id, candidateFor: id }) },
            order: [['candidateFor', 'DESC']],
        });
        if (!platform)
            throw new NotFoundException('not exists');

        params.foundPrototype = platform;
        params.id = id;

        return this.platformService.updateFull(params);
    }

    // @UseGuards(AuthGuard('jwt'))
    @Put('update-status/:id')
    async updateStatusPlatform(
        @Param('id') id: string,
        @Body() { status }: UpdateStatusDto
    ): Promise<Platform> {

        const platform = await this.platformService.findOne(id);

        if (!platform)
            throw new NotFoundException('not exists');

        return this.platformService.updateStatus(status, id);
    }
}