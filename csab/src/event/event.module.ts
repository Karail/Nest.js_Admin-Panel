import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { SequelizeModule } from '@nestjs/sequelize';
import Event from './cs/models/event.model';
import Platform from 'src/platform/cs/models/platform.model';
import EventsUnion from './cs/models/eventsUnion.model';
import Sport from 'src/sport/cs/models/sport.model';

@Module({
  imports: [SequelizeModule.forFeature([
    Event,
    Platform,
    EventsUnion,
  ])],
  controllers: [EventController],
  providers: [EventService]
})
export class EventModule {}
