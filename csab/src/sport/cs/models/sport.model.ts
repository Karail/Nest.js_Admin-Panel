import {Table, Column, Model} from 'sequelize-typescript';

 // TODO: Сделать нормальную связь видов спорта с платформой. Многие ко многим.
@Table({
  modelName: 'sports',
})
export class Sport extends Model<Sport> {
  @Column
  name: string;
}

export default Sport;