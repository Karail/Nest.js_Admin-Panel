import {Table, Column, Model, ForeignKey, BelongsTo} from 'sequelize-typescript';
import User from './user.model';
import ClaimedEvent from '../../../event/cs/models/claimedEvent.model';

@Table({
  modelName: 'players',
})
export class Player extends Model<Player> {
  @Column
  type: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @ForeignKey(() => ClaimedEvent)
  @Column
  claimedEventId: number;

  @Column({ defaultValue: 0, allowNull: false })
  /** Сколько человек идет вместе с ним */
  comeWith: number;

  @BelongsTo(() => User, 'userId')
  user: User;

  @BelongsTo(() => ClaimedEvent, 'claimedEventId')
  claimedEvent: ClaimedEvent;

}

export default Player;