import { Table, Column, DataType, Model, ForeignKey } from "sequelize-typescript";
import { Fee } from "./fee.model";

@Table({
  modelName: 'clicksportWallets',
})
export class ClicksportWallet extends Model<ClicksportWallet> {

  @ForeignKey(() => Fee)
  @Column
  feeId: number;

  @Column({
    type: DataType.DECIMAL(10,2),
    defaultValue: 0,
  })
  balance: number;

}

export default ClicksportWallet;
