import { Injectable } from '@nestjs/common';
import { Cron, Scheduled } from 'nestjs-cron';
import { InjectModel } from '@nestjs/sequelize';
import ClicksportWallet from './cs/models/clicksportWallet.model';
import HistoryWallet from './cs/models/historyWallet.model';
import Fee from './cs/models/fee.model';

export interface IhistoryWallet {
    feeName: string
    wallet: any[]
}

@Scheduled()
@Injectable()
export class WalletsService {
    constructor(
        @InjectModel(ClicksportWallet)
        private readonly clicksportWalletModel: typeof ClicksportWallet,
        @InjectModel(HistoryWallet)
        private readonly historyWalletModel: typeof HistoryWallet,
        @InjectModel(Fee)
        private readonly feeModel: typeof Fee,
    ) { }

    async findAll(): Promise<IhistoryWallet[]> {

        let historyWallet: IhistoryWallet[] = [];

        const fees = await this.feeModel.findAll();

        for (let fee of fees) {
            let wallets = await this.historyWalletModel.findAll({
                where: { feeId: fee.id }
            });

            historyWallet.push({
                feeName: fee.name,
                wallet: wallets
            });
            console.log({
                feeName: fee.name,
                wallet: wallets.map(el => el.get())
            })
        }

        return historyWallet;
    }
    @Cron('* * * 1 * *', {
        sync: true,
    })
    async getHistoryWallet() {
        const arr = await this.clicksportWalletModel.findAll();
        for (let el of arr) {
            const newHistory = <ClicksportWallet>el.get();
            delete newHistory.id;
            delete newHistory.createdAt;
            delete newHistory.updatedAt;
            await this.historyWalletModel.create(newHistory);
        }
    }
}
