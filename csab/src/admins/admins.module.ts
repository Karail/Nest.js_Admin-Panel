import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Admins } from './models/admins.model';

@Module({
  imports: [SequelizeModule.forFeature([Admins])],
  providers: [AdminsService],
  controllers: [],
  exports: [AdminsService]
})
export class AdminsModule { };
