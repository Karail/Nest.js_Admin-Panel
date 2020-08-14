import { Table, Column, DataType, Model } from "sequelize-typescript";
import cbr from "../services/cbr";
import currency from "../services/currency";

@Table
export class Currency extends Model<Currency> {

    @Column({
        allowNull: false
    })
    /** Буквенный ISO код */
    isoCode!: string;

    @Column({
        allowNull: false
    })
    /** Числовой ISO код */
    isoNumericCode!: number;

    @Column({
        allowNull: false
    })
    name!: string;

    @Column({
        allowNull: false
    })
    localName!: string;

    @Column({
        allowNull: false
    })
    symbol!: string;

    @Column({
        type: DataType.DECIMAL(7, 4),
        allowNull: false
    })
    /**
     * Курс для обмена российских рублей на эту валюту.
     */
    course!: number;

    @Column({
        defaultValue: 1,
        allowNull: false
    })
    nominal!: number;


    static async refreshCourses() {
        const courses = await cbr.getCourses();

        for(const item of courses) {
            const { isoCode, value: course, nominal, name, numCode: isoNumericCode } = item;
            try {
                await Currency.update(
                    { course, nominal, name, localName: name, isoNumericCode }, 
                    { where: { isoCode } }
                )
            }
            catch(e) {
                console.error(e);
            }
        }


        const items = await Currency.findAll();
        currency.updateCourses(items);
    }

}
export default Currency;