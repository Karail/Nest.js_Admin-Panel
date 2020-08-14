import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Sport from './cs/models/sport.model';
import { paginate, Paginatable } from 'src/event/cs/mixins/sequelizePaginate';

export interface SportListParams extends Paginatable {};

@Injectable()
export class SportService {
    constructor(
        @InjectModel(Sport)
        private readonly sportModel: typeof Sport
    ) { }

    async list(page: number, pageSize: number) {
        try {
          
          const sports = await this.sportModel.findAndCountAll({
            ...paginate(page, pageSize),
          });
          
          const totalCount = sports.count,
                totalPages = Math.ceil(totalCount / pageSize),
                nextPage = page >= totalPages ? null : page + 1;
    
          return {
            meta: {
              success: true,
              message: 'Ok',
              
              currentPage: page,
              nextPage,
              pageSize,
              totalPages,
              totalCount
            },
            data: { sports: sports.rows },
          }
        } catch (ex) {
          console.log(ex);
          throw ex;
        }
      }

}
