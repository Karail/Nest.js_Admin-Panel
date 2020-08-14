import { Injectable } from '@nestjs/common';
import TmpImage, { TmpImageStorage } from './cs/models/tmpImage.model';
import { InjectModel } from '@nestjs/sequelize';
import { Request, Response } from 'express';
import ImageResolution from './cs/models/imageResolution.model';

export interface TmpImageUploadParams {
    buffer: Buffer;
    content: string;
    storage: TmpImageStorage;
}
export interface TmpImageListParams {
    storage: TmpImageStorage;
}
export interface TmpImageDeleteParams {
    id: number;
    foundTmpImage: TmpImage;
}
export const StorageQuota: { [storage: number]: number } = {
    [TmpImageStorage.PlatformAdd]: 10,
    [TmpImageStorage.UserAvatar]: 1,
    [TmpImageStorage.PlatformUpdate]: 10,
};

@Injectable()
export class TmpImageService {
    constructor(
        @InjectModel(TmpImage)
        private readonly tmpImageModel: typeof TmpImage,
    ) { }

    async list({ storage }: TmpImageListParams) {

        try {

            const where: any = { storage, isLoading: false } as TmpImage;
            const attributes: (keyof TmpImage)[] = [ 'id' ];
            const images = await this.tmpImageModel.findAll({ 
                where, attributes,
                include: [
                    { 
                        model: ImageResolution,
                        attributes: ([ 'type', 'url' ] as (keyof ImageResolution)[])
                    }
                ]
            });

            return {
                meta: {
                    success: true,
                    message: 'Tmp image uploaded',
                },
                data: { images },
            };

        }
        catch(ex) {
            throw ex;
        }
    }
    async upload({ buffer, storage }: TmpImageUploadParams) {
        try {

            const ownerId = null;
            
            const tmpImage = await this.tmpImageModel.uploadBuffer({ buffer, storage, ownerId });

            const where: any = { ownerId, storage } as TmpImage;
            const count = await this.tmpImageModel.count({ where });
            if(count > StorageQuota[storage]) { 
                // Если, пока загружалось это изображение, клиенту удалось пропихнуть еще, минуя квоту, то сразу
                // же удаляем это изображение.
                await tmpImage.fullDelete();
            }

            return {
                meta: {
                    success: true,
                    message: 'Tmp image uploaded',
                },
                data: {
                    tmpImage
                },
            };

        }
        catch(ex) {
            throw ex;
        }

    }
    async delete({ foundTmpImage: tmpImage }: TmpImageDeleteParams) {
        try {

            await tmpImage.destroy();

            return {
                meta: {
                    success: true,
                    message: 'Tmp image deleted',
                },
                data: null,
            };

        }
        catch(ex) {
            throw ex;
        }

    }

}
