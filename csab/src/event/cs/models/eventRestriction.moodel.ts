import {Table, Column, Model, ForeignKey, DataType} from 'sequelize-typescript';
import { Platform } from '../../../platform/cs/models/platform.model';
import { ClaimedEvent } from './claimedEvent.model';
import Event from './event.model';
import * as moment from 'moment';


@Table
export class EventRestriction extends Model<EventRestriction> {

    @ForeignKey(() => Platform)
    @Column
    platformId: number;

    @Column
    date: Date;
    
    @Column({
        type: DataType.TIME
    })
    timeStart: string;

    @Column
    durationSeconds: number;


    static async createByClaimedEvent(claimedEvent: ClaimedEvent) {
        if(!claimedEvent.event)
            throw new Error('К ClaimedEvent должен быть подключен Event!');
            
        const { platformId } = claimedEvent.event;
        const { timeStart, date } = claimedEvent;
        const durationSeconds = claimedEvent.event.duration / 1000;

        const args: any = {
            platformId,
            date: new Date(date),
            timeStart,
            durationSeconds
        } as EventRestriction;

        return await EventRestriction.create(args);
    }

    static async createByEvent(event: Event, date: Date) {

        const weekDay = moment(date).utc().weekday();

        if(event.weekDay !== weekDay)
            throw new Error('Дни недели даты и события не совпадают!');
            
        const { platformId, timeStart, duration } = event;
        
        const durationSeconds = duration / 1000;

        const args = {
            platformId,
            date,
            timeStart,
            durationSeconds
        } as EventRestriction;

        return await EventRestriction.create(args);
    }

}

export default EventRestriction;