import { Controller, Get, NotFoundException, Post, Put, Delete, Param, Body, Query, HttpException, HttpStatus, UseGuards, Res } from '@nestjs/common';
import * as moment from 'moment';
import {
  EventService,
  EventAddParams,
  EventListParams,
  EventUpdateParams
} from './event.service';
import { InjectModel } from '@nestjs/sequelize';
import Platform from 'src/platform/cs/models/platform.model';
import Country from 'src/platform/cs/models/country.model';
import City from 'src/city/cs/models/city.model';
import eventCalc from './cs/services/eventCalc';
import ClaimedEvent from './cs/models/claimedEvent.model';
import Event from './cs/models/event.model';
import Currency from 'src/platform/cs/models/currency.model';
import PlatformFlag from 'src/platform-flag/cs/models/platformFlag.model';
import EventsUnion from './cs/models/eventsUnion.model';
import formatDayOfWeek from './cs/mixins/dayOfWeek';
import { Sequelize, Op } from 'sequelize';
import Sport from 'src/sport/cs/models/sport.model';
import { AuthGuard } from '@nestjs/passport';

export interface GetEventParams {
  claimedEventId: number;
  foundEvent: Event;
}

@UseGuards(AuthGuard('jwt'))
@Controller('event')
export class EventController {
  constructor(
    @InjectModel(Platform)
    private readonly platformModel: typeof Platform,
    @InjectModel(EventsUnion)
    private readonly eventsUnionModel: typeof EventsUnion,
    @InjectModel(Event)
    private readonly eventModel: typeof Event,
    private readonly eventService: EventService
  ) { }

  @Get('all')
  async getAllEvents() {
    return this.eventService.AllList();
  }

  @Get()
  async getEvents(
    @Query('platformId') platformId: string,
    @Query('page') page: string,
    @Query('onceOnly') onceOnly: string,
    @Body() params: EventListParams
  ) {
    const id = platformId;

    const platform = await this.platformModel.findOne({
      where: {
        id,
        candidateFor: null
      }
    });
    if (!platform)
      throw new NotFoundException('not exists');
    params.platformId = +id;
    params.page = +page;
    params.onceOnly = !!onceOnly;

    return this.eventService.list(params);
  }

  @Get('/get-city/:id')
  async getEventsByCityId(
    @Param('id') id: number,
  ) {
    return this.eventService.listByCityId(id);
  }

  @Get('/get-platform/:id')
  async getEventsByPlatformId(
    @Param('id') id: number,
  ) {
    return this.eventService.listByPlatformId(id);
  }

  @Post()
  async addEvent(
    @Body() params: EventAddParams
  ) {
    const platformId = params.platformId;
    const onceOnly = params.onceOnly;

    let platform = await this.platformModel.findOne({
      where: { id: platformId, candidateFor: null },
      include: [
        {
          model: City,
          include: [
            { model: Country }
          ]
        }
      ]
    });
    if (!platform)
      throw new NotFoundException('not exists');

    params.foundPlatform = platform;

    // params.midnight = dateIsClientsTodayOrAfter(params.midnight)
    // params.onceOnlyDate = dateIsClientsTodayOrAfter(params.onceOnlyDate)

    if (onceOnly && 'weekDay' in params) return Promise.reject(`weekDayNotNeeded`);
    if (onceOnly && !params.onceOnlyDate) return Promise.reject(`dateRequired`);

    if (!onceOnly && !('weekDay' in params)) return Promise.reject(`weekDayRequired`);
    if (!onceOnly && !('midnight' in params)) return Promise.reject(`midnight обязателен`);
    if (!onceOnly && params.onceOnlyDate) return Promise.reject(`dateNotNeeded`);

    const data = eventCalc.calculateIntersectionData(params);
    const intersection = await eventCalc.countIntersections({ ...params, ...data }, [Event, ClaimedEvent]);
    const hasIntersections = !!intersection.total;

    if (hasIntersections) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        error: {
          message: "Событие пересекается с уже существующим",
          data: {
            total: intersection.total,
            details: intersection.details.map(({ model, count }) => ({ type: model.tableName, count }))
          }
        },
      }, HttpStatus.BAD_REQUEST);
    } 

    Object.assign(params, data as EventAddParams);

    return this.eventService.add(params)

  }

  @Put(':id')
  async updateEvent(
    @Param('id') id: number,
    @Body() params: EventUpdateParams,
  ) {

    const event = await this.eventModel.findOne({
      where: { id },
      include: [{ model: Platform }]
    });

    if (!event)
      throw new NotFoundException('not exists');

    params.id = id;
    params.foundEvent = event;

    if (params.onceOnlyDate && params.foundEvent) {

      let { weekDay, onceOnlyDate, foundEvent } = params;

      if (weekDay && foundEvent.onceOnlyDate || onceOnlyDate && !foundEvent.onceOnlyDate) {
        throw new HttpException({
          status: HttpStatus.BAD_REQUEST,
          error: {
            message: "Нельзя менять тип Event!"
          },
        }, HttpStatus.BAD_REQUEST);
      }
    }
    if (params.durationMinutes && params.foundEvent) {
      const { id, foundEvent } = params;
      const { platformId } = foundEvent;
      let { durationMinutes, timeStart, midnight, onceOnlyDate, weekDay } = params;
      durationMinutes = durationMinutes || foundEvent.durationMinutes;
      timeStart = timeStart || foundEvent.timeStart;
      onceOnlyDate = onceOnlyDate || foundEvent.onceOnlyDate;
      weekDay = weekDay || foundEvent.weekDay;

      const data = eventCalc.calculateIntersectionData({ durationMinutes, timeStart, midnight, onceOnlyDate, weekDay });
      const intersection = await eventCalc.countIntersections(
        { ...(params as Required<EventUpdateParams>), ...data, platformId, id },
        [Event, ClaimedEvent]
      );
      const hasIntersections = !!intersection.total;


      if (hasIntersections) {
        throw new HttpException({
          status: HttpStatus.BAD_REQUEST,
          error: {
            message: "Событие пересекается с уже существующим",
            data: {
              total: intersection.total,
              details: intersection.details.map(({ model, count }) => ({ type: model.tableName, count }))
            }
          },
        }, HttpStatus.BAD_REQUEST);
      }

      Object.assign(params, data as EventUpdateParams);
    }

   return this.eventService.update(params);
  }

  @Delete(':id')
  async deleteEvent(
    @Param('id') id: number,
  ) {
    const event = await this.eventModel.findOne({
      where: { id },
      include: [{
        model: Platform
      }]
    });
    if (!event)
      throw new NotFoundException('not exists');

    return this.eventService.delete(id);
  }

  @Get(':id')
  async getById(
    @Param('id') id: number,
    @Body() params: GetEventParams,
    @Query('date') date: any,
  ) {
    const event = await this.eventModel.findOne({
      where: { id },
      attributes: <(keyof Event)[]>[
        'id', 'weekDay', 'timeStart', 'timeEnd', 'duration', 'onceOnlyDate',
        'priceForOrg', 'priceOwner', 'durationMinutes', 'currencyId'
      ],
      include: [
        {
          model: Platform,
          include: [
            { model: City },
            { model: PlatformFlag },
          ]
        },
        {
          model: Currency,
          attributes: <(keyof Currency)[]>['id', 'isoCode', 'course', 'symbol']
        }
      ]
    });

    if (!event)
      throw new NotFoundException('not exists');

    params.foundEvent = event;

    if (date) {
      let weekDay = moment(date).utc().weekday();
      weekDay = formatDayOfWeek(weekDay);
      const dateOnly = date.split('t')[0];

      const ceU = await this.eventsUnionModel.findOne({
        include: [{
          required: true,
          model: ClaimedEvent,
          include: [{ model: Event }],
        }],
        where: {
          eventId: id,
          [Op.or]: {
            ['$claimedEvent.dateTimeStart$']: {
              [Op.gte]: dateOnly,
              [Op.lt]: Sequelize.literal(`('${dateOnly}' + INTERVAL 1 DAY)`),
            },
            ['$claimedEvent.event.onceOnlyDate$']: {
              [Op.gte]: dateOnly,
              [Op.lt]: Sequelize.literal(`('${dateOnly}' + INTERVAL 1 DAY)`),
            }
          }
        }
      })

      params.claimedEventId = ceU ? ceU.claimedEventId : null;

      const event = await this.eventModel.findOne({
        where: {
          id,
          [Op.or]: [
            { weekDay },
            {
              onceOnlyDate: {
                [Op.gte]: dateOnly,
                [Op.lt]: Sequelize.literal(`('${dateOnly}' + INTERVAL 1 DAY)`),
              }
            }
          ]
        },
        include: [
          {
            model: Platform,
            include: [
              { model: City },
              {
                model: PlatformFlag,
                attributes: ['id', 'type', 'value']
              }
            ]
          },
          {
            model: Currency,
            attributes: <(keyof Currency)[]>['id', 'isoCode', 'course', 'symbol']
          },
          { model: Sport }
        ],
      });

      if (!event)
        throw new NotFoundException('not exists');

      params.foundEvent = event;
    }

    return this.eventService.get(params);
  }
  @Get('/schedule/:id')
  async getScheduleEvent(
    @Param('id') id: number,
    @Body() params: GetEventParams,
    @Query('date') date: any,
  ) {

    const event = await this.eventModel.findOne({
      where: { id },
      attributes: <(keyof Event)[]>[
        'id', 'weekDay', 'timeStart', 'timeEnd', 'duration', 'onceOnlyDate',
        'priceForOrg', 'priceOwner', 'durationMinutes', 'currencyId'
      ],
      include: [
        {
          model: Platform,
          include: [
            { model: City },
            { model: PlatformFlag },
          ]
        },
        {
          model: Currency,
          attributes: <(keyof Currency)[]>['id', 'isoCode', 'course', 'symbol']
        }
      ]
    });

    if (!event)
      throw new NotFoundException('not exists');

    params.foundEvent = event;

    if (date) {
      let weekDay = moment(date).utc().weekday();
      weekDay = formatDayOfWeek(weekDay);
      const dateOnly = date.split('t')[0];

      const ceU = await this.eventsUnionModel.findOne({
        include: [{
          required: true,
          model: ClaimedEvent,
          include: [{ model: Event }],
        }],
        where: {
          eventId: id,
          [Op.or]: {
            ['$claimedEvent.dateTimeStart$']: {
              [Op.gte]: dateOnly,
              [Op.lt]: Sequelize.literal(`('${dateOnly}' + INTERVAL 1 DAY)`),
            },
            ['$claimedEvent.event.onceOnlyDate$']: {
              [Op.gte]: dateOnly,
              [Op.lt]: Sequelize.literal(`('${dateOnly}' + INTERVAL 1 DAY)`),
            }
          }
        }
      });

      params.claimedEventId = ceU ? ceU.claimedEventId : null;

      const event = await this.eventModel.findOne({
        where: {
          id,
          [Op.or]: [
            { weekDay },
            {
              onceOnlyDate: {
                [Op.gte]: dateOnly,
                [Op.lt]: Sequelize.literal(`('${dateOnly}' + INTERVAL 1 DAY)`),
              }
            }
          ]
        },
        include: [
          {
            model: Platform,
            include: [
              { model: City },
              {
                model: PlatformFlag,
                attributes: ['id', 'type', 'value']
              }
            ]
          },
          { model: Sport }
        ],
      });

      if (!event)
        throw new NotFoundException('not exists');

      params.foundEvent = event;
    }

    return this.eventService.getScheduleEvent(params);
  }
}
