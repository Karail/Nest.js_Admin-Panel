import { Sequelize } from 'sequelize-typescript';
import * as config from 'config';

let uri:string = config.get('db.uri');
if(!uri) {
  const host: string = config.get('db.details.host');
  const user: string = config.get('db.user');
  const password: string = config.get('db.password');
  const name: string = config.get('db.name');
  const port: number = config.get('db.details.port');
  const dialect: string = config.get('db.details.dialect');

  uri = `${dialect}://${user}:${password}@${host}:${port}/${name}`
}

const db = new Sequelize(
  uri, {
    ...config.get('db.details'),
    retry: {
      max: 10,
    }
  },
);

export default db;