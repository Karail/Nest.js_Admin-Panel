import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import ClicksportWallet from './cs/models/clicksportWallet.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { HistoryWallet } from './cs/models/historyWallet.model';
import Fee from './cs/models/fee.model';

@Module({
  imports: [SequelizeModule.forFeature([
    ClicksportWallet,
    HistoryWallet,
    Fee
  ])],
  controllers: [WalletsController],
  providers: [WalletsService]
})
export class WalletsModule { }
