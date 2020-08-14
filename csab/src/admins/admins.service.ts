import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Admins } from './models/admins.model';

@Injectable()
export class AdminsService {
    constructor(
        @InjectModel (Admins)
        private readonly adminsModel: typeof Admins
    ) { }

    findByEmail(email: string): Promise<Admins> {
        return this.adminsModel.findOne({ where: { email } });
    }

    findById(id: number): Promise<Admins> {
        return this.adminsModel.findByPk(id);
    }
}
