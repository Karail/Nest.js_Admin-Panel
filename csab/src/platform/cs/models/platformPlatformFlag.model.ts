import {Table, Column, Model, ForeignKey, BelongsTo} from 'sequelize-typescript';
import PlatformFlag from '../../../platform-flag/cs/models/platformFlag.model';
import { Platform } from './platform.model';

@Table
export class PlatformPlatformFlag extends Model<PlatformPlatformFlag> {

    @ForeignKey(() => Platform)
    @Column
    platformId: number;
    
    @ForeignKey(() => PlatformFlag)
    @Column
    flagId: number;

    @BelongsTo(() => PlatformFlag, 'flagId')
    flag: PlatformFlag;

}

export default PlatformFlag;