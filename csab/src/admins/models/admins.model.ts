import { Column, Model, Table } from 'sequelize-typescript';

@Table({
  modelName: 'admins',
  timestamps: false
})
export class Admins extends Model<Admins> {

  @Column
  email: string;

  @Column
  password: string;

}