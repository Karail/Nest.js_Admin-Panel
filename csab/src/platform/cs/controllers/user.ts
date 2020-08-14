
import City from '../../../city/cs/models/city.model';
import {GeonameCity} from '../services/geonames';

export interface UpdateCityByGeonameIdParams {
  geonameId: number;

  foundCity?: City;
  validatedGeonameCity?: GeonameCity;

  /** Созданный инстанс геокодера */
  geocoder?: any;
}
