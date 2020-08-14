import { body, ValidationChain } from "express-validator";
import User from "../models/user.model";
import { UpdateCityByGeonameIdParams } from "../controllers/user";
import City from "../../../city/cs/models/city.model";
import Country from "../models/country.model";
import * as config from 'config';
import { GeoPoint } from "../types";

const GeocoderGeonames = require('geocoder-geonames');

export interface GeonameEntityName {
    name: string;
    lang?: string;
    isPreferredName?: boolean;
}

export interface GeonameCountryInfo {
    geonameId: number;
    languages: string;
    currencyCode: string;
}

export interface GeonameCountryInfoResult {
    geonames: GeonameCountryInfo[];
}

export interface GeonameEntity {
    geonameId: string;
    name: string;
    countryId: string;
    countryCode: string;
    countryName: string;
    adminName1: string;
    fcl: string;
    lat: string;
    lng: string;
    alternateNames: GeonameEntityName[];
}

export interface GeonameCity extends GeonameEntity {}
export interface GeonameCountry extends GeonameEntity {
    lang: string;
    currencyCode: string;
}

export interface GeonameSearchResult {
    totalResultsCount: number;
    geonames: GeonameEntity[];
}

export interface GeonameFindNearbyPlaceResult {
    geonames: GeonameEntity[];
}

/**
 * Количество элементов на странице в автокомплите.
 */
export const AUTOCOMPLETE_PAGE_SIZE = 30;

/**
 * Максимальный лимит вывода в поиске в бесплатной версии.
 */
export const FREE_PLAN_MAX_ITEMS = 5000; 

/**
 * Возвращает ValidationChain, который проверяет @paramName на правильность и изменяет req.body.
 * @returns ValidationChain
 */
export function cityGeonameIdCheck(paramName: string = 'geonameId', optional = false): ValidationChain {
    
    let chain = body(paramName);
    if(optional)
        chain = chain.optional();
    else
        chain = chain.exists().bail().withMessage('required');

    return chain
        .not().isEmpty().bail().withMessage('notValid')
        .isInt({gt: 0}).bail().withMessage('notValid')
        .custom(async (geonameId, {req}) => {
            const user = req.user as User;
            if(user) {
                const city = await City.findOne({ where: { id: user.cityId } });

                if(city && (geonameId == city.geonameId))
                    throw new Error;
            }

        }).bail().withMessage('sameValue')
        .custom(async (geonameId, {req}) => {
            try {
                const params: UpdateCityByGeonameIdParams = req.body;

                const city = await City.findOne({ 
                    where: { geonameId },
                    include: [ { model: Country } ]
                });
                if(city) {
                    params.foundCity = city;
                }
                else {
                    try {
                        const data = await getCity(geonameId);
                        if(data.fcl !== 'P') { // Если не город
                            throw new Error(`geonameId: ${geonameId} - это не город. (${data.name})`);
                        }

                        params.validatedGeonameCity = data;
                    }
                    catch(e) {
                        console.log(e);
                        // Надежность не должна зависеть от стороннего сервиса!
                    }
                }
        
            } catch (err) {
                console.log(err);
                throw new Error(err);
            }

        }).bail().withMessage('notCity');

};

export async function findCountry(countryCode: string): Promise<GeonameCountry> {
    const geocoder = new GeocoderGeonames({
        username: config.get('services.geonames.username'),
    });

    const info: GeonameCountryInfoResult = await geocoder.get('countryInfo', { country: countryCode });
    const { languages, geonameId, currencyCode } = info.geonames[0];
    const lang = extractLanguage(languages);

    const res = await geocoder.get('get', { geonameId, lang });
    

    return {...res, ...{ lang, currencyCode }};
}

export async function getCity(geonameId: number, lang: string = 'local'): Promise<GeonameCity> {
    const geocoder = new GeocoderGeonames({
        username: config.get('services.geonames.username'),
    });

    const city: GeonameCity =  await geocoder.get('get', { geonameId, lang });

    if(city.fcl !== 'P')
        throw new Error('Объект с указанным geonameId не является городом');

    return city;
}

export async function findByGeoPoint({ lat, lng }: GeoPoint, lang: string = ''): Promise<GeonameFindNearbyPlaceResult> {
    const geocoder = new GeocoderGeonames({
        username: config.get('services.geonames.username'),
    });

    const args = { lang, lat, lng, maxRows: 1, cities: 'cities500' };
    const data: GeonameFindNearbyPlaceResult = await geocoder.get('findNearbyPlaceName', args);
    
    
    if(!data.geonames || !data.geonames.length)
        throw new Error('Не удалось определить город');

    return data;
}

function extractLanguage(langsStr: string) {

    const langs = langsStr.split(',');
    let lang = langs ? langs[0].trim() : null;
    const pos = lang.indexOf('-');
    if(pos !== -1)
        lang = lang.substring(0, pos);

    return lang;
}