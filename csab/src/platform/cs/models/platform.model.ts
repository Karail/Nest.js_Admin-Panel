import {Table, Column, Model, DataType, HasMany, ForeignKey, BelongsToMany, BelongsTo} from 'sequelize-typescript';
import User from './user.model';
import Event from '../../../event/cs/models/event.model';
import ClaimedEvent from '../../../event/cs/models/claimedEvent.model';
import { Sequelize, Op } from 'sequelize';
import PlatformFlag from '../../../platform-flag/cs/models/platformFlag.model';
import { PlatformPlatformFlag } from './platformPlatformFlag.model';
import { EventRestriction } from '../../../event/cs/models/eventRestriction.moodel';
import { City } from '../../../city/cs/models/city.model';



export type videoPrivacy = 'public' | 'org' | 'members-org';
export const VideoPrivacyKeys:{[key: string]: videoPrivacy} = {
  Public: 'public', OrgOnly: 'org', MembersAndOrg: 'members-org'
};
const defalutPrivacy: videoPrivacy = 'public';

export type PlatformPhoto = { [key: number]: string };

export enum PlatformStatus {
  Pending, Approved, Rejected, Checking
};

@Table({
  modelName: 'platforms',
  paranoid: true,
})
export class Platform extends Model<Platform> {

  @Column({
    defaultValue: false,
    allowNull: false,
  })
  approved: boolean;

  @Column({
    type: DataType.TINYINT({ unsigned: true }),
    allowNull: false,
    defaultValue: PlatformStatus.Pending
  })
  status: PlatformStatus;

  @ForeignKey(() => Platform)
  @Column
  /** 
   * ID записи, для которой эта запись является кандидатом на перезапись при модерации.
   * Если здесь ничего не указано, то это оригинал, который можно включить к отображению или выключить.
   * Формально запись является платформой только в том случае, если она не является кандидатом.
   * В остальных случаях - это слепок состояния, предложенный к модерации и последующей публикации.
   * Это поле может указывать и на другой слепок, так что его нельзя использовать для получения
   * платформы напрямую. Нужно пройти по цепочке до самой платформы и убедиться, что она - оригинал.
   */
  candidateFor: number;

  @Column
  name: string;

  @Column
  address: string;

  @ForeignKey(() => City)
  @Column
  cityId: number;

  @ForeignKey(() => User)
  @Column
  ownerId: number;

  @Column
  avatar: string;

  @Column({
    type: DataType.JSON,
    defaultValue: []
  })
  photos: PlatformPhoto[];

   // TODO: Сделать нормальную связь видов спорта с платформой. Многие ко многим.
  @Column({
    type: DataType.JSON,
  })
  sports: any;

  @Column({ type: DataType.JSON })
  sportsSuggest: string[];

  @Column({ type: DataType.JSON })
  reqsSuggest: string[];

  @Column({ type: DataType.JSON })
  includedSuggest: string[];

  @Column({
    type: DataType.DOUBLE,
  })
  rating: number;

  @Column
  video: string;
  
  @Column({
    type: DataType.STRING,
    defaultValue: defalutPrivacy
  })
  videoPrivacy: videoPrivacy;

  @Column({allowNull: false})
  phone: string;

  @Column({
    type: DataType.DECIMAL(10, 8)
  })
  lat: number;

  @Column({
    type: DataType.DECIMAL(11, 8)
  })
  lng: number;
  
  @HasMany(() => Event, 'platformId')
  events: Event[];

  @Column({ defaultValue: 0, allowNull: false })
  /** Количество успешно организованных на площадке событий, которые уже прошли */
  organizedEventsCount: number;

  @BelongsToMany(() => PlatformFlag, () => PlatformPlatformFlag)
  flags: PlatformFlag[];

  @HasMany(() => EventRestriction)
  restrictions: EventRestriction[];

  @BelongsTo(() => City, 'cityId')
  city: City;

  /**
   * TODO: Засунуть в соответствующий JOB.
   * Выполняет расчет количества успешно организованных на площадке событий,
   * которые уже прошли.
   * Не производит обновление поля organizedEventsCount!
   * @param platformId Идентификатор площадки.
   */
  static async calculateOrganizedEvents(platformId: number) {

    const res = await ClaimedEvent.findAndCountAll({
      include: [
        {
          model: Event,
          attributes: [ 'id' ],
          where: { platformId }
        }
      ],
      where: {
        currentStatus: 'finished',
        dateEnd: { [Op.lt]: Sequelize.literal(`CURRENT_TIME()`) }
      }
    });

    return res.count;
  }

}

export default Platform;