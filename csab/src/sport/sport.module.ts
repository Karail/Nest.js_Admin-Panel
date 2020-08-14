import { Module } from '@nestjs/common';
import { SportController } from './sport.controller';
import { SportService } from './sport.service';
import { SequelizeModule } from '@nestjs/sequelize';
import Sport from './cs/models/sport.model';

@Module({
  imports: [SequelizeModule.forFeature([
    Sport
  ])],
  controllers: [SportController],
  providers: [SportService]
})
export class SportModule {}
