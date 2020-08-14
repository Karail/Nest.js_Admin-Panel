import {Table, Column, Model, ForeignKey, BelongsTo} from 'sequelize-typescript';
import ClaimedEvent from './claimedEvent.model';
import Event from './event.model';

@Table({
  modelName: 'eventsUnions',
})
export class EventsUnion extends Model<EventsUnion> {
  @Column
  type: string;

  @Column
  eventId: number;

  @ForeignKey(() => ClaimedEvent)
  @Column
  claimedEventId: number;

  @BelongsTo(
    () => Event, { 
      foreignKey: 'eventId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })
  event: Event;

  @BelongsTo(() => ClaimedEvent, 'claimedEventId')
  claimedEvent: ClaimedEvent;
}

export default EventsUnion;