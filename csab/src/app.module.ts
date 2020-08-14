import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import * as config from 'config';
import { AuthModule } from './auth/auth.module';
import { PlatformModule } from './platform/platform.module';
import { Admins } from './admins/models/admins.model';
import { Platform } from './platform/cs/models/platform.model';
import City from './city/cs/models/city.model';
import Country from './platform/cs/models/country.model';
import Currency from './platform/cs/models/currency.model';
import Event from './event/cs/models/event.model';
import User from './platform/cs/models/user.model';
import Sport from './sport/cs/models/sport.model';
import Player from './platform/cs/models/player.model';
import EventsUnion from './event/cs/models/eventsUnion.model';
import ClaimedEvent from './event/cs/models/claimedEvent.model';
import EventRestriction from './event/cs/models/eventRestriction.moodel';
import PlatformFlag from './platform-flag/cs/models/platformFlag.model';
import UserPermission from './platform/cs/models/userPermission.model';
import { PlatformPlatformFlag } from './platform/cs/models/platformPlatformFlag.model';
import { TmpImage } from './tmp-image/cs/models/tmpImage.model';
import { TmpImageModule } from './tmp-image/tmp-image.module';
import { CityModule } from './city/city.module';
import { WalletsModule } from './wallets/wallets.module';
import ImageResolution from './tmp-image/cs/models/imageResolution.model';
import ClicksportWallet from './wallets/cs/models/clicksportWallet.model';
import Fee from './wallets/cs/models/fee.model';
import { HistoryWallet } from './wallets/cs/models/historyWallet.model';
import { EventModule } from './event/event.module';
import { SportModule } from './sport/sport.module';
import { PlatformFlagModule } from './platform-flag/platform-flag.module';
import { Dialect } from 'sequelize/types';

const uri: string = config.get('db.uri');
const [dialect, username, password, host, port, database] = (
  uri 
    ? uri.split(/[:@/]\/?\/?/) 
    : [
      config.get('db.details.dialect'),
      config.get('db.user'),
      config.get('db.password'),
      config.get('db.details.host'),
      config.get('db.details.port'),
      config.get('db.name')
    ]
) as string[];

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: dialect as Dialect,
      host,
      port: +port,
      username,
      password,
      database,
      models: [
        Admins,
        City,
        Country,
        Currency,
        Event,
        User,
        Sport,
        Player,
        EventsUnion,
        ClaimedEvent,
        EventRestriction,
        Platform,
        PlatformFlag,
        PlatformPlatformFlag,
        UserPermission,
        TmpImage,
        ImageResolution,
        ClicksportWallet,
        Fee,
        HistoryWallet,
      ],
      autoLoadModels: true
    }), 
    PlatformModule, 
    AuthModule, 
    TmpImageModule, 
    CityModule, 
    WalletsModule, 
    EventModule, 
    SportModule, PlatformFlagModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }