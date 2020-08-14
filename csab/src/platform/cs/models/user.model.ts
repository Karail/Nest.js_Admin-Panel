import *as config from 'config';
import {DataType, Table, Column, Model, BeforeValidate, ForeignKey, BelongsTo, HasMany} from 'sequelize-typescript';
import * as bcrypt from 'bcrypt';
import City from '../../../city/cs/models/city.model';
import UserPermission from './userPermission.model';
import Currency from './currency.model';

export enum UserRole {
  User = 1,
}
export enum AccessLevel {
  User = 1,
}

@Table({
  modelName: 'user',
})
export class User extends Model<User> {

  @ForeignKey(() => City)
  @Column
  cityId: number;

  @BelongsTo(() => City, 'cityId')
  city: City;

  @ForeignKey(() => Currency)
  @Column({
    allowNull: false,
    defaultValue: 1
  })
  currencyId!: number;

  @Column
  /** ISO-3166 название страны, к которой относится город пользователя. */
  countryCode: string;

  @Column
  /** ISO-639 2-буквенный код языка страны; en,de,fr,it,es,... */
  countryLang: string;

  @Column
  /** 
   * Язык, выбранный пользователем вручную.
   * ISO-639 2-буквенный код языка страны; en,de,fr,it,es,... 
   * */
  lang: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: UserRole.User,
  })
  userType: UserRole;

  @Column
  photo: string;

  @Column
  photoThumb: string

  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column
  phone: string;

  @Column
  email: string;

  @Column
  emailConfirmation: string;

  @Column
  reset: string;

  @Column
  password: string;

  @Column
  socialVk: string;

  @Column
  socialGoogle: string;

  @Column({
    type: DataType.DECIMAL(10,2),
    defaultValue: config.get('defaultUserBalance'),
  })
  balance: number;

  @Column
  invitedBy: number;

  @BelongsTo(() => Currency, 'currencyId')
  currency: Currency;

  @HasMany(() => UserPermission, 'userId')
  permissions: UserPermission[];

  comparePasswords(password: string, compare: string) {
    return bcrypt.compare(password, compare);
  }

  @BeforeValidate
  static encryptPassword(user: User) {
    if (user.changed('password')) {
      return bcrypt.hash(user.password, 10).then(password => {
        user.password = password;
      });
    }
  }

}
export default User;