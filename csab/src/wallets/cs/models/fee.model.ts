import {Table, Column, Model, AfterCreate, BelongsTo, HasMany} from 'sequelize-typescript';
import ClicksportWallet from './clicksportWallet.model';
import HistoryWallet from './historyWallet.model';

@Table({
  modelName: 'fees',
})
export class Fee extends Model<Fee> {
  @Column
  name: string;

  @Column({
    defaultValue: 0,
  })
  percent: number;

  @AfterCreate
  static async createWallet(fee: Fee) {
    console.log('Fee created: ', fee);
  
    const wallet = await ClicksportWallet.findOrCreate({
      where: {
        feeId: fee.id,
      },
      defaults: { // set the default properties if it doesn't exist
        feeId: fee.id,
      },
    });
  
    console.log('Wallet created: ', wallet[0]);
  }
}

export default Fee;