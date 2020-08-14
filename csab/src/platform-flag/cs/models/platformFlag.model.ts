import {Table, Column, Model, DataType, BelongsToMany} from 'sequelize-typescript';
import { Platform } from '../../../platform/cs/models/platform.model';
import { PlatformPlatformFlag } from '../../../platform/cs/models/platformPlatformFlag.model';

export enum PlatformFlagType {
  Requirement, Included,

  /** Длина перечисления. Должна быть всегда в конце! */
  LENGTH,
}

@Table({
  modelName: 'platformFlags',
})
export class PlatformFlag extends Model<PlatformFlag> {

  @Column({
      type: DataType.TINYINT,
      allowNull: false,
  })
  type: PlatformFlagType;

  @Column({
    type: DataType.TEXT
  })
  value: string;

  @BelongsToMany(() => Platform, () => PlatformPlatformFlag)
  platforms: Platform[];

}

export default PlatformFlag;