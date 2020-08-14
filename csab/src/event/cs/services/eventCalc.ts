import * as moment from "moment";
import { Moment } from "moment";
import { fn, Op, Includeable, WhereOptions } from "sequelize";
import formatDayOfWeek from '../mixins/dayOfWeek';
import Fee from "src/wallets/cs/models/fee.model";
import ClaimedEvent from "../models/claimedEvent.model";
import Event from "../models/event.model";

export interface ClaimedEventEconomics {
    clicksportFee: number
    orgsPartnerFee: number;
    participantsPartnerFee: number;
    paymentSystemFee: number;
    priceForOneParticipant: number;
    totalPrice: number;

    feeObjects: {
        paymentSystem: Fee;
        clicksport: Fee;
        orgsPartner: Fee;
        participantsPartner: Fee;
    }
}

export interface ClaimedEventFeesArgs {
    orgIsOwner: boolean;
    priceForOrg: number;
    priceOrg: number;
    priceOwner: number;
    maxParticipants: number;
    isOrgParticipate: boolean;

    feeObjects?: {
        clicksport: Fee,
        orgsPartner: Fee,
        participantsPartner: Fee,
        paymentSystem: Fee
    }
}

interface EventIntersectionData {
    timeEnd: string;
    weekDayStart: number;
    weekDayDeltaEnd: number;
    onceOnlyDateTimeStart: Date;
    onceOnlyDateTimeEnd: Date;
    weekDay?: number;
}

interface EventCountIntersectionArgs extends EventIntersectionData {
    id?: number;
    platformId: number;
    onceOnlyDate?: Date;
    midnight?: Date;
    weekDay: number;
    timeStart: string;
    durationMinutes: number;
}
type IntersectionDetails = {
    model: IntersectionModel;
    count: number;
}[];
interface EventCountIntersectionResult {
    total: number;
    details: IntersectionDetails;
}

export type IntersectionModel = typeof Event | typeof ClaimedEvent;

export default {

    calculateIntersectionData({ onceOnlyDate, midnight, weekDay, timeStart, durationMinutes }: {
        onceOnlyDate?: Date;
        midnight?: Date;
        weekDay?: number;
        timeStart: string;
        durationMinutes: number;
    }): EventIntersectionData {

        const [hours, minutes] = timeStart.split(':').map(Number);
        const timeEnd = moment().hours(hours).minutes(minutes).add(durationMinutes, 'minutes').format('HH:mm:00');
        let weekDayStart: number, weekDayDeltaEnd: number, $dateStartMidnightUTC: Moment, $dateStartUTC: Moment, $dateEndUTC: Moment;
        let onceOnlyDateTimeStart: Date, onceOnlyDateTimeEnd: Date;

        let res = {} as EventIntersectionData;

        if (onceOnlyDate) {
            const $clientMidnightUTC = moment(onceOnlyDate).utc();
            weekDay = $clientMidnightUTC.weekday();
            $dateStartUTC = $clientMidnightUTC.clone().hours(hours).minutes(minutes);
            /**
             * // если получившаяся дата раньше полуночи у клиента по UTC 0, значит событие начинается на следующий календарный день по UTC 0 
             * и к заготовке нужно прибавить 1 сутки, чтобы получить правильное начало события по UTC
             */
            if ($dateStartUTC < $clientMidnightUTC)
                $dateStartUTC.add(1, 'day');

            $dateEndUTC = $dateStartUTC.clone().add(durationMinutes, 'minutes');
            $dateStartMidnightUTC = $dateStartUTC.clone().startOf('day');

            onceOnlyDateTimeStart = $dateStartUTC.toDate();
            onceOnlyDateTimeEnd = $dateEndUTC.toDate();

            res.weekDay = weekDay;
        }
        else {
            const $clientMidnightUTC = moment(midnight).utc().weekday(weekDay);
            $dateStartUTC = $clientMidnightUTC.clone().hours(hours).minutes(minutes).seconds(0);
            if ($dateStartUTC < $clientMidnightUTC)
                $dateStartUTC.add(1, 'day');

            $dateStartMidnightUTC = $dateStartUTC.clone().startOf('day');
            $dateEndUTC = $dateStartUTC.clone().add(durationMinutes, 'minutes');
        }
        weekDayStart = $dateStartUTC.weekday();
        weekDayDeltaEnd = weekDayStart + $dateEndUTC.diff($dateStartMidnightUTC, 'days');

        res = {
            ...res,
            timeEnd,
            weekDayStart,
            weekDayDeltaEnd,
            onceOnlyDateTimeStart,
            onceOnlyDateTimeEnd
        };

        return res;

    },

    async countIntersections(
        {
            platformId, weekDayDeltaEnd, weekDay, weekDayStart,
            timeStart, timeEnd, onceOnlyDate, onceOnlyDateTimeStart,
            onceOnlyDateTimeEnd, id
        }: EventCountIntersectionArgs, 
        models: IntersectionModel[] = [ Event ]
    ): Promise<EventCountIntersectionResult> {
        const weekOverflown = weekDayDeltaEnd > 6;

        /////////////////////////////////////////
        /// Преобразуем дни и выполняем поиск ///
        /////////////////////////////////////////
        weekDay = formatDayOfWeek(weekDay);
        weekDayStart = formatDayOfWeek(weekDayStart);
        weekDayDeltaEnd = formatDayOfWeek(weekDayDeltaEnd);

        const leftOrRightIntersection = (model: IntersectionModel) => fn(
            'IF', (
                weekOverflown
                ? {
                    [Op.or]: [
                        { [`$${model.tableName}.weekDayStart$`]: weekDayDeltaEnd },
                        { [`$${model.tableName}.weekDayStart$`]: weekDayDeltaEnd - 7 }
                    ]
                }
                : { [`$${model.tableName}.weekDayStart$`]: weekDayDeltaEnd }
            ),
            /*THEN*/ { [`$${model.tableName}.timeStart$`]: { [Op.lt]: timeEnd } },
            /*ELSE*/ { [`$${model.tableName}.timeEnd$`]: { [Op.gt]: timeStart } }
        );
        const periodicSearch = (model: IntersectionModel) => { // Периодичное
            if (weekDayStart != weekDayDeltaEnd)
                return leftOrRightIntersection(model);

            return fn(
                'IF', { [`$${model.tableName}.weekDayStart$`]: weekDayStart, [`$${model.tableName}.weekDayDeltaEnd$`]: weekDayDeltaEnd },
                /*THEN*/ {
                        [`$${model.tableName}.timeStart$`]: { [Op.lt]: timeEnd },
                        [`$${model.tableName}.timeEnd$`]: { [Op.gt]: timeStart }
                    },
                /*ELSE*/ leftOrRightIntersection(model)
            );
        };
        const onceOnlySearch = (model: IntersectionModel) => {

            switch(model) {
                case Event:
                    return { 
                        onceOnlyDateTimeStart: { [Op.lt]: onceOnlyDateTimeEnd },
                        onceOnlyDateTimeEnd: { [Op.gt]: onceOnlyDateTimeStart }
                    };
                default:
                    return { 
                        dateTimeStart: { [Op.lt]: onceOnlyDateTimeEnd },
                        dateTimeEnd: { [Op.gt]: onceOnlyDateTimeStart }
                    };
            }

        };
        const conditionalSearch = (model: IntersectionModel) => {
            switch(model) {
                case Event:
                    if (onceOnlyDate)
                        return fn('IF', { [`$${model.tableName}.onceOnlyDate$`]: null }, periodicSearch(model), onceOnlySearch(model));
                    break;
                default:
                    if (onceOnlyDate)
                        onceOnlySearch(model);
                    break;
            }

            return periodicSearch(model);
        };

        const roughSearch = () => {
            if (weekOverflown) {
                return {
                    [Op.and]: [
                        { weekDayStart: { [Op.lte]: weekDayDeltaEnd } },
                        {
                            [Op.or]: [
                                { weekDayDeltaEnd: { [Op.gte]: weekDayStart } },
                                { weekDayStart: { [Op.lte]: weekDayDeltaEnd - 7 } }
                            ]
                        }
                    ]
                };
            }

            return {
                [Op.or]: [
                    {
                        weekDayStart: { [Op.lte]: weekDayDeltaEnd },
                        weekDayDeltaEnd: { [Op.gte]: weekDayStart },
                    },
                    {
                        weekDayStart: { [Op.lte]: weekDayDeltaEnd + 7 },
                        weekDayDeltaEnd: { [Op.gte]: weekDayStart + 7 },
                    }
                ]
            };
        };

        const strictSearch = (model: IntersectionModel) => {
            const daysSearch = {
                [Op.and]: [
                    { weekDayStart: { [Op.lt]: weekDayDeltaEnd } },
                    {
                        [Op.or]: [
                            { weekDayDeltaEnd: { [Op.gt]: weekDayStart } },
                            { weekDayStart: { [Op.lt]: weekDayDeltaEnd - 7 } }
                        ]
                    },
                ]
            };
            const overflownDaysSearch = {
                weekDayDeltaEnd: { [Op.gt]: weekDayStart + 7 },
                weekDayStart: { [Op.lt]: weekDayDeltaEnd + 7 },
            };

            if (weekOverflown) {
                return {
                    [Op.or]: [
                        daysSearch,
                        conditionalSearch(model)
                    ]
                };
            }

            return {
                [Op.or]: [
                    {
                        weekDayDeltaEnd: { [Op.gt]: weekDayStart },
                        weekDayStart: { [Op.lt]: weekDayDeltaEnd },
                    },
                    overflownDaysSearch,
                    conditionalSearch(model)
                ]
            };

        };
        const search = async (model: IntersectionModel) => {

            let include: Includeable[], where: WhereOptions;
            switch(model) {
                case Event:
                    where = id ? { platformId, id: { [Op.ne]: id } } : { platformId };
                    break;
                case ClaimedEvent:
                    where = ({ currentStatus: 'coming' } as ClaimedEvent) as any;
                    include = [
                        {
                            model: Event,
                            paranoid: false,
                            required: true,
                            where: ({ platformId } as Event) as any,
                        }
                    ];
                    break;
                default:
                    where = {};
                    break;
            }

            return await model.count({
                where: {
                    [Op.and]: [
                        where,
                        {
                            [Op.and]: [
                                roughSearch(),
                                strictSearch(model),
                            ]
                        }
                    ]
                },
                include
            });

        };
        
        let details: IntersectionDetails = [];
        const tasks: Promise<number>[] = [];
        for(const model of models) {
            details.push({ model, count: 0 });
            tasks.push(search(model));
        }

        const total = (await Promise.all(tasks)).reduce((total, count, i) => {
            if(count)
                details[i].count = count;
            return total + count;
        }, 0);
        details = details.filter(d => !!d.count)
        
        return { total, details };
    },

    async claimEconomics(args: ClaimedEventFeesArgs): Promise<ClaimedEventEconomics> {
        const { orgIsOwner, isOrgParticipate, maxParticipants, priceForOrg, priceOrg, priceOwner } = args;
        const maxParticipantsMinusOrg = maxParticipants - (isOrgParticipate ? 1 : 0);

        // Fees objs
        let feeObjects = args.feeObjects && {...args.feeObjects};
        
        if(!feeObjects) {
            feeObjects = {
                paymentSystem: await Fee.findOne({ where: { name: 'payment system' } }),
                clicksport: await Fee.findOne({ where: { name: 'clicksport' } }),
                orgsPartner: await Fee.findOne({ where: { name: 'org partner' } }),
                participantsPartner: await Fee.findOne({ where: { name: 'participant partner' } }),
            };
            
        }

        // In percents

        const paymentSystemFee_Percent = feeObjects.paymentSystem.percent || 8;
        const clicksportFee_Percent = feeObjects.clicksport.percent || 10;
        const orgsPartnerFee_Percent = feeObjects.orgsPartner.percent || 10;
        const participantsPartnerFee_Percent = feeObjects.participantsPartner.percent || 10;

        // In currency
        const price = orgIsOwner ? priceOrg + priceOwner : priceOrg;

        let clicksportFee = (price / 100) * clicksportFee_Percent;
        let orgsPartnerFee = (price / 100) * orgsPartnerFee_Percent;

        const preTotalPrice =
            (orgIsOwner ? priceOwner : priceForOrg)
            +
            priceOrg
            +
            clicksportFee
            +
            orgsPartnerFee;

        const absoluteFeesPercentsSum = participantsPartnerFee_Percent + paymentSystemFee_Percent;
        const participantsPartnerFee = preTotalPrice / (100 - absoluteFeesPercentsSum) * participantsPartnerFee_Percent;
        const paymentSystemFee = preTotalPrice / (100 - absoluteFeesPercentsSum) * paymentSystemFee_Percent;

        let totalPrice =
            preTotalPrice
            +
            participantsPartnerFee
            +
            paymentSystemFee;
        let priceForOneParticipant = totalPrice / maxParticipantsMinusOrg;
        const priceForOneParticipantFraction = priceForOneParticipant % 1;
        if (priceForOneParticipantFraction) {
            const amount = 1 - priceForOneParticipantFraction;
            clicksportFee += amount * maxParticipantsMinusOrg;
            totalPrice += amount * maxParticipantsMinusOrg;
            priceForOneParticipant = Math.ceil(priceForOneParticipant);
        }

        return {
            clicksportFee: clicksportFee / maxParticipantsMinusOrg,
            orgsPartnerFee: orgsPartnerFee / maxParticipantsMinusOrg,
            participantsPartnerFee: participantsPartnerFee / maxParticipantsMinusOrg,
            paymentSystemFee: paymentSystemFee / maxParticipantsMinusOrg,
            priceForOneParticipant,
            totalPrice,

            feeObjects
        };
    }

};
