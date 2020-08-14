import { Injectable } from '@nestjs/common';
import { paginate, Paginatable } from './cs/mixins/sequelizePaginate';
import Currency from 'src/platform/cs/models/currency.model';
import { InjectModel } from '@nestjs/sequelize';
import Event from './cs/models/event.model';
import Platform from 'src/platform/cs/models/platform.model';
import { Transaction } from 'sequelize';
import db from 'src/platform/cs/services/database';
import calculateFeesAndPriceForOrgForEvent from './cs/mixins/calculateFeesAndPriceForOrgForEvent';
import { GetEventParams } from './event.controller';
import City from 'src/city/cs/models/city.model';

export interface EventListParams extends Paginatable {
  platformId: number;
  onceOnly?: boolean;
}
export interface EventAddParams {
  platformId: number;
  priceOwner: number;
  onceOnlyDate?: Date;
  onceOnlyDateTimeStart?: Date;
  onceOnlyDateTimeEnd?: Date;
  weekDay: number;
  midnight?: Date;
  timeStart: string;
  timeEnd: string;
  weekDayStart: number;
  weekDayDeltaEnd: number;
  durationMinutes: number;
  onceOnly?: any
  foundPlatform: Platform;
}
export interface EventUpdateParams {
  id: number;
  priceOwner?: number;
  onceOnlyDate?: Date;
  onceOnlyDateTimeStart?: Date;
  onceOnlyDateTimeEnd?: Date;
  weekDay: number;
  midnight?: Date;
  timeStart: string;
  timeEnd: string;
  weekDayStart: number;
  weekDayDeltaEnd: number;
  durationMinutes?: number;

  foundEvent: Event;
}

@Injectable()
export class EventService {

  constructor(
    @InjectModel(Event)
    private readonly eventModel: typeof Event
  ) { }

  async AllList() {
    return this.eventModel.findAll({
      include: [{
        model: Platform,
        attributes: <(keyof Platform)[]>['cityId', 'name'],
        include: [{
          model: City,
          attributes: <(keyof City)[]>['name']
        }]
      }],
    });
  }
  async listByCityId(id: number) {
    return this.eventModel.findAll({
      include: [{
        model: Platform,
        where: {
          cityId: id
        }
      }]
    });
  }

  async listByPlatformId(id: number) {
    return this.eventModel.findAll({
      include: [{
        model: Platform,
        where: {
          id
        }
      }]
    });
  }
  async list(params: EventListParams) {
    try {

      const {
        page,
        pageSize = 1000,
        onceOnly,
        platformId
      } = params;

      const events = await this.eventModel.findAndCountAll({
        where: { platformId, onceOnly },
        attributes: [
          'id', 'weekDay', 'timeStart', 'duration', 'onceOnlyDate',
          'priceForOrg', 'priceOwner', 'durationMinutes',
        ],
        include: [
          {
            model: Currency,
            attributes: <(keyof Currency)[]>['isoCode', 'symbol']
          }
        ],
        ...paginate(page, pageSize),
      });

      //////////////
      // RESPONSE //
      //////////////

      const items = events.rows.map(e => ({
        ...e.get(),
        localPriceForOrg: e.priceForOrg,
        localCurrency: e.currency,
      }));


      const totalCount = events.count,
        totalPages = Math.ceil(totalCount / pageSize),
        nextPage = page >= totalPages ? null : page + 1;

      return {
        meta: {
          success: true,
          message: 'Ok',
          currentPage: page,
          nextPage,
          pageSize,
          totalPages,
          totalCount
        },
        data: {
          events: items,
        },
      }
    } catch (ex) {
      console.error(ex);
      throw ex;
    }

  }

  async get(params: GetEventParams) {
    try {
      const { foundEvent: event, claimedEventId } = params;
      const data = {
        event,
        claimedEvent: null,
        type: 'events',
        claimedEventId,
        localCurrency: event.currency,
        localPriceForOrg: event.priceForOrg
      };

      return {
        meta: {
          success: true,
          message: 'You got event info',
        },
        data,
      }
    } catch (ex) {
      console.log(ex);
      throw ex;
    }
  }

  async add(params: EventAddParams) {
    let transaction: Transaction;
    try {
      const {
        durationMinutes, onceOnlyDate,
        platformId, timeStart, timeEnd,
        weekDayStart, weekDayDeltaEnd,
        onceOnlyDateTimeStart, onceOnlyDateTimeEnd,
        weekDay, foundPlatform: platform, priceOwner
      } = params;
      const { currencyId } = platform.city.country;

      ///////////////////////////////////////////////////////////////////////////////

      const {
        feesAmount,
        priceForOrg,
        clicksportFee,
        ownersPartnerFee,
        paymentSystemFee,
        feesHash
      } = await calculateFeesAndPriceForOrgForEvent(priceOwner);

      ///////////////////////////////////////////////////////////////////////////////

      transaction = await db.transaction();

      const createdEvent = await this.eventModel.create(<Event>{
        priceOwner,
        durationMinutes,
        onceOnly: !!onceOnlyDate,
        onceOnlyDate,
        platformId,
        currencyId,
        timeStart, timeEnd, weekDay,
        weekDayStart, weekDayDeltaEnd,
        feesAmount, priceForOrg,
        clicksportFee, ownersPartnerFee,
        onceOnlyDateTimeStart,
        onceOnlyDateTimeEnd,
        paymentSystemFee,
        feesHash
      }, { transaction });

      const newEventId = createdEvent.id;
      await transaction.commit();

      return {
        meta: {
          success: true,
          message: 'Event added!',
        },
        data: {
          id: newEventId
        }
      }
    } catch (ex) {
      console.log(ex);
      if (transaction && (transaction as any).finished != 'commit') transaction.rollback();
      throw ex;
    }
  }

  async update(params: EventUpdateParams) {
    try {
      const { id } = params;
      let { weekDay, timeStart, durationMinutes, onceOnlyDate, priceOwner } = params;

      let fields = <Event>{};

      if (timeStart || durationMinutes || weekDay || onceOnlyDate) {
        const {
          timeEnd, weekDayStart, weekDayDeltaEnd,
          onceOnlyDateTimeStart, onceOnlyDateTimeEnd
        } = params;

        fields = <Event>{
          ...fields,
          onceOnlyDate,
          timeStart, timeEnd,
          durationMinutes,
          weekDay,
          weekDayStart, weekDayDeltaEnd,
          onceOnlyDateTimeStart,
          onceOnlyDateTimeEnd,
        };
      }

      if (typeof priceOwner == 'number') {

        const {
          feesAmount,
          priceForOrg,
          clicksportFee,
          ownersPartnerFee,
          paymentSystemFee,
          feesHash
        } = await calculateFeesAndPriceForOrgForEvent(priceOwner);

        fields = <Event>{
          ...fields,
          priceOwner,
          feesAmount,
          priceForOrg,
          clicksportFee,
          ownersPartnerFee,
          paymentSystemFee,
          feesHash,
        };
      }

      await this.eventModel.update(fields, { where: { id } });

      return {
        meta: {
          success: true,
          message: 'Event data updated',
        },
        data: null,
      }

    } catch (ex) {
      console.log(ex);
      throw ex;
    }
  }

  async delete(id: number) {
    try {
      await Event.destroy({ where: { id } });

      return {
        meta: {
          success: true,
          message: 'Event removed!',
        },
        data: null,
      }
    } catch (ex) {
      console.log(ex);
      throw ex;
    }
  }

  async getScheduleEvent(params: GetEventParams) {
    try {
      const { foundEvent: event, claimedEventId } = params;
      const data = {
        event,
        claimedEvent: null,
        type: 'events',
        claimedEventId,
      };

      return {
        meta: {
          success: true,
          message: 'You got event info',
        },
        data,
      }
    } catch (ex) {
      console.log(ex);
      throw ex;
    }
  }
}
