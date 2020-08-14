import {DataType, Table, Column, Model, ForeignKey, BelongsTo, HasMany, AfterCreate} from 'sequelize-typescript';
import Event from './event.model';
import User from '../../../platform/cs/models/user.model';
import Sport from '../../../sport/cs/models/sport.model';
import Player from '../../../platform/cs/models/player.model';
import EventsUnion from './eventsUnion.model';
import { PlayerSnapshot } from '../../../platform/cs/controllers/player';
import { Currency } from '../../../platform/cs/models/currency.model';


// TODO: Добавить индекс на date

export type status = 
  `created` | 
  `coming` | 
  `started` | 
  `finished` | 
  `verification` | 
  `verificationFailed` | 
  `verificationSucceed` | 
  `autocancelled` | 
  `cancelled`;


@Table({
  modelName: 'claimedEvents',
  indexes: [
    { 
      unique: false,
      fields:['date']
    }
  ]
})
export class ClaimedEvent extends Model<ClaimedEvent> {

  @ForeignKey(() => Event)
  @Column
  eventId: number;

  @ForeignKey(() => User)
  @Column
  orgId: number;

  @ForeignKey(() => Sport)
  @Column
  sportId: number;

  @Column
  level: string;

  @Column({
    type: DataType.STRING(255)
  })
  cancelReason: string;

  /** максимально возможное количество участников в событии */
  @Column
  maxParticipants: number;

  /** максимально возможное количество участников для регистрации на сайте */
  @Column
  maxParticipantsFromClicksport: number;

  /** текущее количество заявивших намерение учавствовать */
  @Column
  currentParticipantsNumber: number;
  
  /** принимает ли участие в событии организатор */
  @Column
  isOrgParticipate: boolean;

  @Column({ defaultValue: false, allowNull: false })
  /** Является ли организатор тренером */
  isOrgCoach: boolean;

  /** участники, приведенные организатором (не с сайта) */
  @Column
  participantsWhoWillComeWithOrg: number;

  @Column
  orgComment: string;

  @Column({
    type: DataType.DECIMAL(10,2)
  })
  priceOrg: number;

  @Column({
    type: DataType.DECIMAL(10,2)
  })
  totalPrice: number;

  @Column({
    type: DataType.DECIMAL(10,2)
  })
  priceForOneParticipant: number;

  //////////
  // fees //

  @Column({
    type: DataType.DECIMAL(10,2)
  })
  clicksportFee: number;

  @Column({
    type: DataType.DECIMAL(10,2)
  })
  orgsPartnerFee: number;

  @Column({
    type: DataType.DECIMAL(10,2)
  })
  participantsPartnerFee: number;

  @Column({
    type: DataType.DECIMAL(10,2)
  })
  paymentSystemFee: number;

  // fees //
  //////////

  @Column
  get weekDayStart(): number {
    if (!this.getDataValue('weekDayStart')) {
      return null;
    }

    return this.getDataValue('weekDayStart') - 1 ;
  };
  set weekDayStart(weekDayStart) {
    this.setDataValue('weekDayStart', weekDayStart + 1);
  }
  @Column
  get weekDayDeltaEnd(): number {
    if (!this.getDataValue('weekDayDeltaEnd')) {
      return null;
    }

    return this.getDataValue('weekDayDeltaEnd') - 1 ;
  };
  set weekDayDeltaEnd(weekDayDeltaEnd) {
    this.setDataValue('weekDayDeltaEnd', weekDayDeltaEnd + 1);
  }

  @Column({
    type: DataType.TIME
  })
  timeStart: string;

  @Column({
    type: DataType.TIME
  })
  timeEnd: string;

  @Column({
    type: DataType.DATE
  })
  date: string;

  @Column
  dateTimeEnd: Date;

  @Column
  dateTimeStart: Date;
  
  @Column({
    defaultValue: false
  })
  lackOfParticipantsNotificationSent: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: `coming`
  })
  currentStatus: status;

  @Column({
    type: DataType.STRING,
    defaultValue: `created`
  })
  previousStatus: status;

  @Column
  failedByOrg: boolean;

  @Column({
    type: DataType.JSON
  })
  playersSnapshot: PlayerSnapshot[];
  

  @BelongsTo(() => Event, 'eventId')
  event: Event;

  @BelongsTo(() => User, 'orgId')
  org: User;

  @BelongsTo(() => Sport, 'sportId')
  sport: Sport;

  @HasMany(() => Player)
  players: Player[];

  @ForeignKey(() => Currency)
  @Column({
    allowNull: false,
    defaultValue: 1,
  })
  currencyId!: number;

  @BelongsTo(() => Currency, 'currencyId')
  currency: Currency;

  @AfterCreate
  static async unionDuplicate(claimedEvent: ClaimedEvent, options: any) {
    const eventsUnionData = {
      type: `claimedEvents`,
      eventId: claimedEvent.eventId,
      claimedEventId: claimedEvent.id
    } as EventsUnion;

    await EventsUnion.create(eventsUnionData, { transaction: options.transaction });
  }

}

export default ClaimedEvent;