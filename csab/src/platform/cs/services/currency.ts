import { Currency } from "../models/currency.model";

type CurrencyObj = { [id: number]: Currency };

export interface CurrencyConvertArgs {
    sum: number;
    fromCurrencyId: number;
    toCurrencyId: number;
}

class CurrencyService {
    private currencies: CurrencyObj;

    /**
     * Функция преобразования банковского курса к курсу, выгодному ClickSport.
     * @param course Актуальный банковский курс. Например, с cbr.ru
     * @param digits Количество разрядов после запятой
     * @returns Объект с тремя курсами. 
     * inCourse - курс на приобретение клиентом услуг не в своей валюте.
     * outCourse - курс выплаты на кошелек не в валюте кошелька.
     * refundCourse - курс выплаты при возврате средств за услугу.
     */
    transformCourse(course: number, digits = 4): { inCourse: number, outCourse: number, refundCourse: number } {
        const safetyPercent = 7;
        const accuracy = Math.pow(10, Math.round(digits));

        return {
            inCourse:     Math.round(course * (100 - safetyPercent) / 100 * accuracy) / accuracy,
            outCourse:    Math.round(course * (100 + safetyPercent) / 100 * accuracy) / accuracy,
            /**
             * Стоимость услуги формируется как inCourse, а это course - {safetyPercent}%.
             * Если мы хотим сделать возврат по outCourse, то нам надо прибавить к курсу {safetyPercent}% * 2.
             * Если прибавить просто {safetyPercent}%, то мы получим оригинальный курс без корректировок.
             */
            refundCourse: Math.round(course * (100 + safetyPercent * 2) / 100 * accuracy) / accuracy
        };
    }
    
    convertRefund({ sum, fromCurrencyId, toCurrencyId }: CurrencyConvertArgs) {
        if(!this.currencies)
            throw new Error('Курс валют не сформирован');

        if(
            isNaN(sum) || sum < 0 ||
            isNaN(fromCurrencyId) || fromCurrencyId <= 0 ||
            isNaN(toCurrencyId)   || toCurrencyId   <= 0
        )
            throw new Error('Неправильные аргументы конвертирования валют');

        const fromCurrency = this.currencies[fromCurrencyId];
        const toCurrency = this.currencies[toCurrencyId];

        if(!fromCurrency || !toCurrency)
            throw new Error('Валюта не найдена');

        
        if(fromCurrencyId === toCurrencyId)
            return sum;
        
        if(
            fromCurrency.nominal <= 0 || toCurrency.nominal <= 0 ||
            fromCurrency.course <= 0 || fromCurrency.course <= 0 ||
            toCurrency.course <= 0 || toCurrency.course <= 0
        )
            throw new Error('Курсы одной или обеих указанных валют невалидны');
        
        const course = toCurrency.course / toCurrency.nominal / fromCurrency.course * fromCurrency.nominal;
        const { refundCourse } = this.transformCourse(course);

        return Math.round(sum / refundCourse * 100) / 100;
    }
    
    convertOut(args: CurrencyConvertArgs) {
        const { sum, fromCurrency, toCurrency } = this.checkConvertArgs(args);

        if(sum === 0)
            return 0;

        if(fromCurrency.id === toCurrency.id)
            return sum;
        
        const course = this.calculateCourse(fromCurrency, toCurrency);
        const { outCourse } = this.transformCourse(course);

        return this.roundSum(sum / outCourse);
    }

    convertIn(args: CurrencyConvertArgs) {
        const { sum, fromCurrency, toCurrency } = this.checkConvertArgs(args);

        if(sum === 0)
            return 0;
        
        if(fromCurrency.id === toCurrency.id)
            return sum;

        const course = this.calculateCourse(fromCurrency, toCurrency);
        const { inCourse } = this.transformCourse(course);

        return this.roundSum(sum / inCourse);
    }

    private roundSum(sum: number) {
        const digits = 2;
        const pow = Math.pow(10, digits);
        return Math.round(sum * pow) / pow;
    }

    private calculateCourse(fromCurrency: Currency, toCurrency: Currency) {
        return toCurrency.course / toCurrency.nominal / fromCurrency.course * fromCurrency.nominal;
    }

    private checkConvertArgs({ sum, fromCurrencyId, toCurrencyId }: CurrencyConvertArgs) {
        if(!this.currencies)
            throw new Error('Курс валют не сформирован');

        if(
            typeof sum != 'number' || isNaN(sum) || sum < 0 ||
            typeof fromCurrencyId != 'number' || isNaN(fromCurrencyId) || fromCurrencyId <= 0 ||
            typeof toCurrencyId != 'number' || isNaN(toCurrencyId)   || toCurrencyId   <= 0
        )
            throw new Error('Неправильные аргументы конвертирования валют');
        
        const fromCurrency = this.currencies[fromCurrencyId];
        const toCurrency = this.currencies[toCurrencyId];

        if(!fromCurrency || !toCurrency)
            throw new Error("Указанная валюта не найдена");
        
        
        if(
            typeof fromCurrency.course != 'number' || isNaN(fromCurrency.course) || fromCurrency.course <= 0 ||
            typeof toCurrency.course != 'number' || isNaN(toCurrency.course) || toCurrency.course <= 0
        )
            throw new Error('Курсы одной или обеих указанных валют невалидны');

        return { sum, fromCurrency, toCurrency };
    }

    getCurrencyByIso(code: string): Currency {
        for(const currencyId in this.currencies) {
            if(this.currencies[currencyId].isoCode == code)
                return this.currencies[currencyId];
        }

        throw new Error(`Валюты с кодом ${code} не найдено`);
    }

    getCurrency(id: number): Currency {
        if(!this.currencies)
            throw new Error('Курс валют не сформирован');
        if(!this.currencies[id])
            throw new Error('Валюта не найдена');

        return this.currencies[id];
    }
    
    async updateCourses(courses: Currency[]) {
        const currs: CurrencyObj = {};
        courses.forEach(cur => currs[cur.id] = cur);

        this.currencies = currs;
    }

}

export default new CurrencyService;