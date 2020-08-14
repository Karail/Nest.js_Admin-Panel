import { Module } from '@nestjs/common';
import { PlatformFlagService } from './platform-flag.service';
import { PlatformFlagController } from './platform-flag.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import PlatformFlag from 'src/platform-flag/cs/models/platformFlag.model';

@Module({
  imports: [SequelizeModule.forFeature([
    PlatformFlag
  ])],
  providers: [PlatformFlagService],
  controllers: [PlatformFlagController]
})
export class PlatformFlagModule {}
