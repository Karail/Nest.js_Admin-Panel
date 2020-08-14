import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { PlatformService } from './platform.service';
import { PlatformController } from './platform.controller';
import { Platform } from './cs/models/platform.model';
import { PlatformPlatformFlag } from './cs/models/platformPlatformFlag.model';
import PlatformFlag from 'src/platform-flag/cs/models/platformFlag.model';

@Module({
  imports: [SequelizeModule.forFeature([
    Platform,
    PlatformPlatformFlag,
    PlatformFlag
  ])
  ],
  providers: [PlatformService],
  controllers: [PlatformController]
})
export class PlatformModule { }