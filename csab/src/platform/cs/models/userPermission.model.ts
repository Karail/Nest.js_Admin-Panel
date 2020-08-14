import {DataType, Table, Column, Model, ForeignKey, BelongsTo} from 'sequelize-typescript';
import User from './user.model';

export enum UserPermissionType {
    MessagesEmail, MessagesVk, PromoNews,
    LENGTH
}

@Table
export class UserPermission extends Model<UserPermission> {

    @Column({
        type: DataType.SMALLINT,
        allowNull: false,
        defaultValue: false
    })
    type!: UserPermissionType;

    @ForeignKey(() => User)
    @Column({
        allowNull: false,
        defaultValue: false
    })
    userId!: number;

    @Column({
        allowNull: false,
        defaultValue: false
    })
    value!: boolean;

    @BelongsTo(() => User, 'userId')
    user: User;

}
export default UserPermission;