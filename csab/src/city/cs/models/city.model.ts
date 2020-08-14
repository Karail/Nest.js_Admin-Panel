import {DataType, Table, Column, Model, ForeignKey, BelongsTo} from 'sequelize-typescript';
import { Country } from '../../../platform/cs/models/country.model';
import { getCity, GeonameCity } from '../../../platform/cs/services/geonames';

@Table({
  modelName: 'cities',
})
export class City extends Model<City> {
  
  @Column
  name: string;

  @Column
  adminName1: string;

  @Column
  geonameId: number;
  
  @Column({
    type: DataType.DECIMAL(10, 8),
  })
  lat: number;

  @Column({
    type: DataType.DECIMAL(11, 8),
  })
  lng: number;

  @ForeignKey(() => Country)
  @Column
  countryId: number;

  @BelongsTo(() => Country, 'countryId')
  country: Country;

  /**
   * ВНИМАНИЕ! Не выполняет проверку на существование города в базе!!!
   * Создает новый город по указанному geonameId.
   * Если страна для него существует, ассоциирует его с ней.
   * Если не существует, то создает ее и ассоциирует.
   * @param cityGeonameId Идентификатор города в сервисе geonames.
   * @returns Созданный город со связью.
   */
  public static async createWithGeonameId(cityGeonameId: number) {

    return await this.createWithGeonameData(
      await getCity(cityGeonameId)
    );
  }

  /**
   * ВНИМАНИЕ! Не выполняет проверку на существование города в базе!!!
   * Создает новый город по указанному geonameId.
   * Если страна для него существует, ассоциирует его с ней.
   * Если не существует, то создает ее и ассоциирует.
   * @param city Полученные данные о городе из сервиса Geonames.
   * @returns Созданный город со связью.
   */
  public static async createWithGeonameData(city: GeonameCity) {

    let { name } = city;
    const {adminName1, lat, lng, alternateNames, geonameId, countryCode} = city;
    
    const country = 
      await Country.findOne({ where: { countryCode } })
      || await Country.createWithCountryCode(countryCode);
    const {lang, id: countryId} = country;

    if(alternateNames) {
      const suitable = alternateNames.filter(it => it.lang === lang);
      if(suitable.length != 0)
        name = (suitable.find(it => it.isPreferredName) || suitable[0]).name;
    }

    const res = await City.create({ name, lat, lng, adminName1, geonameId, countryId } );
    res.country = country;

    return res;
  }
  
}

export default City;