import {Table, Model, Column, DataType, HasMany} from "sequelize-typescript";
import {Transaction, Op, WhereOptions} from 'sequelize';
import db from "../../../platform/cs/services/database";
import * as crypto from 'crypto';
import Storage, {StorageBulkDeleteError} from "../services/storage";
import * as fileType from "file-type";
import * as sharp from "sharp";
import getBufferFileFromUrl from "../mixins/getBufferFileFromUrl";
import ImageResolution, { ResolutionKey } from "./imageResolution.model";

// НЕЛЬЗЯ ПЕРЕСТАВЛЯТЬ МЕСТАМИ
export enum TmpImageStorage {
    /** Фотографии добавляемой площадки */
    PlatformAdd,
    /** Аватар пользователя */
    UserAvatar,
    /** Фотографии обновляемой площадки */
    PlatformUpdate,

    LENGTH,
}

export interface UploadBufferArgs {
    buffer: Buffer;
    storage: TmpImageStorage;
    ownerId: number;
}

export interface UploadUrlArgs {
    url: string;
    storage: TmpImageStorage;
    ownerId: number;
}

interface TmpImageResolutionMeta {
    width: number,
    height: number
}

const RESOLUTION_SETTINGS: { [k in ResolutionKey]: TmpImageResolutionMeta } = {
    [ResolutionKey.Full]: {
        width: 1024,
        height: 1024
    },
    [ResolutionKey.Medium]: {
        width: 320,
        height: 240,
    },
    [ResolutionKey.Thumbnail]: {
        width: 100,
        height: 100,
    },
};

const PREFIX = 'image';

@Table({paranoid: true})
export class TmpImage extends Model<TmpImage> {

    @Column
    ownerId: number;

    @Column
    isLoading: boolean;

    @Column({
        type: DataType.TINYINT,
        allowNull: false
    })
    storage: TmpImageStorage;

    @HasMany(() => ImageResolution)
    resolutions: ImageResolution[];

    static async uploadUrl({url, storage, ownerId}: UploadUrlArgs): Promise<TmpImage> {

        const buffer = await getBufferFileFromUrl(url);

        return await TmpImage.uploadBuffer({buffer, storage, ownerId});
    }

    static async uploadBuffer({buffer, storage, ownerId}: UploadBufferArgs): Promise<TmpImage> {

        let tmpImage: TmpImage, transaction: Transaction;
        try {
            /** Создаем запись сражу же, чтобы отсечь превышение квоты во время длительной загрузки */
            tmpImage = await TmpImage.create({ownerId, storage, isLoading: true} as TmpImage);
            const { id: tmpImageId } = tmpImage;


            const { ext } = fileType(buffer);
            /** Соль нужна, чтобы третье лицо не смогло получить доступ к чьим-то временным фото */
            const salt = crypto.pseudoRandomBytes(5).toString('hex');

            transaction = await db.transaction();
            const $buffer = sharp(buffer);
            // const $buffer = null;
            const resolutions: ImageResolution[] = [];
            for(const key in RESOLUTION_SETTINGS) {
                const type: ResolutionKey = +key;
                const { width, height } = RESOLUTION_SETTINGS[type];
                const resBuffer = await $buffer.resize(width, height).toBuffer();
                const filename = `${PREFIX}_${tmpImage.id}_type${type}_${salt}.${ext}`;

                const stor = new Storage();
                const url = await stor.upload(resBuffer, filename);
                const res = await ImageResolution.create({ tmpImageId, type, url, filename } as ImageResolution, { transaction });
                resolutions.push(res);
            }

            tmpImage.isLoading = false;
            await tmpImage.save({ transaction });

            await transaction.commit();
            tmpImage.resolutions = resolutions;
            tmpImage.setDataValue('resolutions', resolutions);

            return tmpImage;
        } catch (e) {
            if(transaction)
                await transaction.rollback();
            if (tmpImage)
                await tmpImage.destroy();

            console.error(e);
            throw e;
        }
    }

    async fullDelete() {

        let resolutions: ImageResolution[];
        try {
            const resolutions = await ImageResolution.findAll({ 
                where: ({ tmpImageId: this.id } as ImageResolution) as any
            });
            if (resolutions.length) {
                const storage = new Storage();
                if (resolutions.length == 1)
                    await storage.delete(resolutions[0].filename);
                else
                    await storage.bulkDelete(resolutions.map(res => res.filename));
            }
            this.resolutions = null;

            // Все связанные разрешения тоже удалятся по CASCADE
            await this.destroy({ force: true });
        } catch (e) {
            if (e instanceof StorageBulkDeleteError) {
                for (const file of e.successKeys) {
                    const res = resolutions.find(r => r.filename == file);
                    if(res)
                        res.destroy({ force: true });
                }
            }

            console.error(e);
            throw e;
        }
    }

    static async deleteDestroyedFromStorage(limit = 100) {

        let transaction: Transaction;
        const pairs: { [filename: string]: { type: ResolutionKey, img: TmpImage } } = {};
        try {
            const attributes: (keyof TmpImage)[] = ['id'];
            const where: WhereOptions = { deletedAt: { [Op.ne]: null } };
            const images = await TmpImage.findAll({
                where, limit, attributes, paranoid: false,
                include: [ { 
                    model: ImageResolution,
                    attributes: [ 'id', 'filename' ] as (keyof ImageResolution)[]
                } ]
            });
            if (!images.length) return;

            const files: string[] = [];
            const ids: number[] = [];
            for (const img of images) {
                for(const res of img.resolutions) {
                    pairs[res.filename] = { type: res.type, img };
                    files.push(res.filename);
                }
                ids.push(img.id);
            }

            transaction = await db.transaction();
            if (files.length)
                await new Storage().bulkDelete(files);         
            // Все связанные разрешения тоже удалятся по CASCADE
            await TmpImage.destroy({ where: {id: ids}, transaction, force: true });

            await transaction.commit();
        } catch (e) {
            if (e instanceof StorageBulkDeleteError) {
                for (const filename of e.successKeys) {
                    const obj = pairs[filename];
                    if (!obj) {
                        console.error('Неверный ключ в ошибке множественного удаления из хранилища!');
                        continue;
                    }
                    const {type, img} = obj;

                    const res = img.resolutions.find(r => r.type == type);
                    if(res) 
                        await res.destroy({ force: true, transaction });
                }

                await transaction.commit();
                return;
            }

            if (transaction)
                await transaction.rollback();

            console.error(e);
            throw e;
        }
    }

}

export default TmpImage;
