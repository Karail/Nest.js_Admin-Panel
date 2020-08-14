import { Table, Column, DataType, Model, ForeignKey, BelongsTo } from "sequelize-typescript";
import { findCountry } from "../services/geonames";
import Currency from "./currency.model";
import config from "../services/config";
import cbr from "../services/cbr";
import db from "../services/database";
import { Transaction } from "sequelize";

@Table({
  modelName: 'countries',
})
export class Country extends Model<Country> {
  @Column
  name: string;

  @Column
  /** ISO-639 2-буквенный код языка; en,de,fr,it,es,... */
  lang: string;

  @Column
  /** ISO-3166 код страны. */
  countryCode: string;

  @Column
  geonameId: number;

  @Column({
    type: DataType.DECIMAL(10, 8),
  })
  lat: number;

  @Column({
    type: DataType.DECIMAL(11, 8)
  })
  lng: number;

  @ForeignKey(() => Currency)
  @Column({
    allowNull: false,
    defaultValue: 1,
  })
  currencyId!: number;

  @BelongsTo(() => Currency, 'currencyId')
  currency: Currency;


  /**
   * ВНИМАНИЕ! Не выполняет проверку на существование страны в базе!!!
   * Создает новую страну по указанному countryCode.
   * Также создает валюту для этой страны (если нет).
   * Поиск данных выполняется по базе geonames.
   * @returns Созданная страна
   */
  public static async createWithCountryCode(countryCode: string) {

    let transaction: Transaction;
    try {
      const geoCountry = await findCountry(countryCode);

      const defaultIso = config.get('currency.default') || 'USD';
      const enabled = config.get('currency.enabled') || [];

      const { name, lat, lng, lang, geonameId } = geoCountry;
      const currencyCode = geoCountry.currencyCode.toUpperCase();
      const isoCode = enabled.includes(currencyCode) ? currencyCode : defaultIso;

      transaction = await db.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ });

      let [ currency ] = await Currency.findOrCreate({
        where: <any><Currency> {
          isoCode
        },
        defaults: <Currency> {
          isoCode,
          isoNumericCode: 0,
          name: isoCode,
          localName: isoCode,
          symbol: isoCode,
          nominal: 0,
          course: 0,
        },
        transaction,
      });

      if(!currency.isoNumericCode) { // Если мы только что создали валюту
        const courses = await cbr.getCourses();
        let cbrCourse = courses.find(it => it.isoCode == isoCode);
        if(!cbrCourse) { // Если не нашли курс на CBR
          console.error('Для новой валюты нет курса! Ставим валюту по умолчанию');
          
          [ currency ] = await Currency.findOrCreate({
            where: <any><Currency>{
              isoCode: defaultIso
            },
            defaults: <Currency> {
              isoCode: defaultIso,
              isoNumericCode: 0,
              name: isoCode,
              localName: isoCode,
              symbol: isoCode,
              nominal: 0,
              course: 0,
            },
            transaction,
          });
          if(!currency.isoNumericCode) { // Если только что создали валюту по умолчанию
            cbrCourse = courses.find(it => it.isoCode == defaultIso);
            if(!cbrCourse) // Если и для валюты по умолчачанию нет курса, то это фиаско
              throw new Error('Даже для валюты по умолчанию нет курса!!!');
          }
        }

        const { isoCode: isoCodeCbr, name, nominal, numCode, value: course } = cbrCourse;

        await currency.update(<Currency> {
          isoNumericCode: numCode,
          name, localName: name, course,
          nominal, isoCode: isoCodeCbr
        }, { transaction });
      }
      
      const country = await Country.create({ name, lat, lng, lang, countryCode, geonameId, currencyId: currency.id }, { transaction });

      await transaction.commit();

      return country;
    }
    catch(e) {
      console.error(e);
      if(transaction)
        await transaction.rollback();
    }

  }
}

export default Country;