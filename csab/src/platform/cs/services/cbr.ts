import { Parser } from 'xml2js';
import axios from 'axios';

export interface CbrCourse {
    isoCode: string;
    numCode: number;
    nominal: number;
    name: string;
    value: number;
}

export class Cbr {

    async getCourses() {

        const xml = (await axios.get('http://www.cbr.ru/scripts/XML_daily_eng.asp')).data;
        const data = await new Parser().parseStringPromise(xml);

        const courses: CbrCourse[] = [];
        const { Valute } = data.ValCurs;
        for(const item of Valute) {
            courses.push({
                numCode: +item.NumCode[0],
                isoCode: item.CharCode[0],
                nominal: +item.Nominal[0],
                name: item.Name[0],
                value: +(item.Value[0]).replace(',', '.'),
            });
        }

        console.log('COURSES', courses);
        
        
        return courses;
    }

}

export default new Cbr;