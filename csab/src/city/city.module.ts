import { Module } from '@nestjs/common';
import { CityController } from './city.controller';
import { CityService } from './city.service';
import City from './cs/models/city.model';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [SequelizeModule.forFeature([
    City,
  ])],
  controllers: [CityController],
  providers: [CityService]
})
export class CityModule {}
