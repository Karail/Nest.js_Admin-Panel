import { Table, Column, Model, ForeignKey, DataType, BelongsTo } from "sequelize-typescript";
import { Fee } from "./fee.model";
@Table({
    modelName: 'historyWallet',
})
export class HistoryWallet extends Model<HistoryWallet> {

    @ForeignKey(() => Fee)
    @Column
    feeId: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0,
    })
    balance: number;
}

export default HistoryWallet;
