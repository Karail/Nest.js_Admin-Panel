import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize'
import City from './cs/models/city.model';

@Injectable()
export class CityService {
    constructor(
        @InjectModel(City)
        private readonly cityModel: typeof City,
    ) { }

    findAllCities() {
        return this.cityModel.findAll();
    }

    search(query: string) {
        return this.cityModel.findAll({
            where: {
                name: {
                    [Op.like]: `%${query}%`,
                }
            }
        });
    }
}
