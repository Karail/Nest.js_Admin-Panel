import { Controller, Post, Delete, Get, Param, Req, Res, UseGuards, Body, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { TmpImageService, StorageQuota, TmpImageUploadParams, TmpImageListParams, TmpImageDeleteParams } from './tmp-image.service';
import { InjectModel } from '@nestjs/sequelize';
import TmpImage, { TmpImageStorage } from './cs/models/tmpImage.model';
import { base64ToBuffer } from './cs/mixins/base64ToBuffer';
import { AuthGuard } from '@nestjs/passport';
import { WhereOptions } from 'sequelize';

@UseGuards(AuthGuard('jwt'))
@Controller('tmp-image')
export class TmpImageController {
    constructor(
        @InjectModel(TmpImage)
        private readonly tmpImageModel: typeof TmpImage,
        private readonly tmpImageService: TmpImageService
    ) { }
    @Post()
    async upload(
        @Body() params: TmpImageUploadParams
    ) {
        const storage = params.storage
        const quota = StorageQuota[storage];

        /** Нельзя не устанавливать квоту на хранилище! Установите ее выше в структуре! */
        if (!quota || quota <= 0) {
            throw new HttpException('Нельзя не устанавливать квоту на временное хранилище!', HttpStatus.FORBIDDEN);
        }

        const where = { storage } as WhereOptions;
        const num = await this.tmpImageModel.count({ where });

        if (num >= quota)
            throw new HttpException('num >= quota', HttpStatus.FORBIDDEN);

        const buffer = base64ToBuffer(params.content);
        params.buffer = buffer;

        return this.tmpImageService.upload(params)
    }
    @Delete(':id')
    async delete(
        @Param('id') id: string,
        @Body() params: TmpImageDeleteParams
    ) {

        const where = { id, isLoading: false } as WhereOptions;
        const tmpImage = await this.tmpImageModel.findOne({ where });
        if (!tmpImage)
            throw new NotFoundException('tmpImage not exists');

        params.foundTmpImage = tmpImage;

        return this.tmpImageService.delete(params)
    }
    @Get('/list/:storage')
    list(
        @Param('storage') storage: TmpImageStorage,
        @Body() params: TmpImageListParams
    ) {
        params.storage = storage;

        return this.tmpImageService.list(params)
    }
}
