import { Table, Column, DataType, Model, ForeignKey, BelongsTo, AfterCreate } from "sequelize-typescript";
import Sport from "src/sport/cs/models/sport.model";
import Platform from "src/platform/cs/models/platform.model";
import Currency from "src/platform/cs/models/currency.model";
import EventsUnion from "./eventsUnion.model";

export type eventType = 'events' | 'claimedEvents';

@Table({
  modelName: 'events',
  paranoid: true,
})
export class Event extends Model<Event> {

  /** @deprecated Используйте onceOnlyDate для проверки */
  @Column({ defaultValue: false })
  onceOnly: boolean;

  /** 
   * Хэш обновления комиссий у этого события.
   * Служит для синхронизации комиссий, устанавливаемых в модели Fee.
   * При изменении комиссий соответствующая JOB периодически сравнивает хэши для обнаружения разницы.
   */
  @Column({
    type: DataType.INTEGER({ unsigned: true })
  })
  feesHash: number;

  @Column
  onceOnlyDate: Date;
  @Column
  onceOnlyDateTimeStart: Date;
  @Column
  onceOnlyDateTimeEnd: Date;

  @Column
  type: number;

  @ForeignKey(() => Platform)
  @Column
  platformId: number;

  @ForeignKey(() => Sport)
  @Column
  sportId: number;

  @Column
  get weekDay(): number {
    if (!this.getDataValue('weekDay')) {
      return null;
    }

    return this.getDataValue('weekDay') - 1 ;
  };
  set weekDay(weekDay) {
    this.setDataValue('weekDay', weekDay + 1);
  }

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
    allowNull: false
  })
  duration: number;

  @Column(DataType.VIRTUAL)
  get durationMinutes() {
    try {
      if (!this.getDataValue('duration')){
        return 0;
      }

      const result = this.getDataValue('duration') / 1000 / 60;
      return result;
    }
    catch(err){
      console.log(err);
      return 0;
    }
  }
  set durationMinutes(durationMinutes) {
    this.setDataValue('duration', durationMinutes * 60 * 1000);
  }

  @Column({
    type: DataType.TIME,
  })
  get timeStart(): string {
    const time = this.getDataValue('timeStart');
    if(!time) return time;

    return time.substring(0, time.lastIndexOf(':'));
  }
  set timeStart(time) {
    this.setDataValue('timeStart', `${time}:00`);
  }

  @Column({
    type: DataType.TIME,
  })
  get timeEnd(): string {
    const time = this.getDataValue('timeEnd');
    if(!time) return time;

    return time.substring(0, time.lastIndexOf(':'));
  }
  //! set timeEnd(time) {
  //!  this.setDataValue('timeEnd', `${time}:00`);
  //! }

  @Column({
    type: DataType.DECIMAL(10,2),
  })
  priceOwner: number;

  @Column({
    type: DataType.DECIMAL(10,2),
  })
  priceForOrg: number;

  //////////
  // FEES //

  @Column({
    type: DataType.DECIMAL(10,2),
  })
  feesAmount: number;

  @Column({
    type: DataType.DECIMAL(10,2),
  })
  clicksportFee: number;

  @Column({
    type: DataType.DECIMAL(10,2),
  })
  ownersPartnerFee: number;

  @Column({
    type: DataType.DECIMAL(10,2),
  })
  paymentSystemFee: number;

  // FEES //
  //////////

  @Column
  ownerId: number;

  @BelongsTo(() => Platform, 'platformId')
  platform: Platform;

  @BelongsTo(() => Sport, 'sportId')
  sport: Sport;

  @ForeignKey(() => Currency)
  @Column({
    allowNull: false,
    defaultValue: 1,
  })
  currencyId!: number;

  @BelongsTo(() => Currency, 'currencyId')
  currency: Currency;


  @AfterCreate
  static async unionDuplicate(event: Event, options: any) { 
    const eventsUnionData = {
      type: `events`,
      eventId: event.id
    } as EventsUnion;

    await EventsUnion.create(eventsUnionData, { transaction: options.transaction });
  }

}

export default Event;