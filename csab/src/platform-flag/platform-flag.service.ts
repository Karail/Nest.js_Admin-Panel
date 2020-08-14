import { Injectable } from '@nestjs/common';
import { paginate, Paginatable } from 'src/event/cs/mixins/sequelizePaginate';
import PlatformFlag, { PlatformFlagType } from 'src/platform-flag/cs/models/platformFlag.model';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

export interface PlatformFlagListParams extends Paginatable {
    type: PlatformFlagType;
  }

  
@Injectable()
export class PlatformFlagService {

    constructor(
        @InjectModel(PlatformFlag)
        private readonly platformFlagModel: typeof PlatformFlag,
      ) { }

    async findFlagToPlatform(params: PlatformFlagListParams) {
        try {
    
          const { type, page, pageSize = 1000, order } = params; //! ПРОБЛЕМА
          
          const flags = await this.platformFlagModel.findAndCountAll({
            where: { type },
            attributes: ['id', 'value'],
            // order: [[Sequelize.col('createdAt'), order]],
            ...paginate(page, pageSize)
          });
    
          let totalCount = flags.count,
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
            data: {
              flags: flags.rows,
            },
          }
        }
        catch (ex) {
          console.log(ex);
          throw ex;
        }
      }
}
