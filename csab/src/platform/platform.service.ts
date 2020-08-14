import { Injectable } from '@nestjs/common';
import { Platform, PlatformStatus, PlatformPhoto } from './cs/models/platform.model';
import { InjectModel } from '@nestjs/sequelize';
import PlatformFlag, { PlatformPlatformFlag } from './cs/models/platformPlatformFlag.model';
import { Transaction, Op } from 'sequelize';
import db from './cs/services/database';


export enum PlatformFlagType {
  Requirement, Included,

  /** Длина перечисления. Должна быть всегда в конце! */
  LENGTH,
}

@Injectable()
export class PlatformService {
  constructor(
    @InjectModel(Platform)
    private readonly platformModel: typeof Platform,
    @InjectModel(PlatformPlatformFlag)
    private readonly platformPlatformFlagModel: typeof PlatformPlatformFlag
  ) { }

  findOne(id: string): Promise<Platform> {
    return this.platformModel.findByPk(id);
  }

  getById(foundPlatform: Platform) {
    try {
      return {
        meta: {
          success: true,
          message: 'You got the platform',
        },
        data: {
          platform: {
            ...foundPlatform.get({ plain: true }),
            id: foundPlatform.candidateFor || foundPlatform.id,
            sports: foundPlatform.sports.map((id: number) => ({ id })),
          },
        },
      }
    } catch (ex) {
      console.log(ex);
      throw ex;
    }
  }

  findAllToDate(): Promise<Platform[]> {
    return this.platformModel.findAll({
      order: [
        ['updatedAt', 'DESC']
      ],
    });
  }

  findByStatus(status: PlatformStatus): Promise<Platform[]> {
    return this.platformModel.findAll({
      where: {
        status,
      }
    });
  }

  findByCityId(cityId: string): Promise<Platform[]> {
    return this.platformModel.findAll({
      where: {
        cityId
      }
    });
  }


  async updateStatus(status: PlatformStatus, id: string): Promise<Platform> {
    try {
      await this.platformModel.update({ status }, { where: { id } });
      return this.platformModel.findByPk(id);
    } catch (ex) {
      console.log(ex)
    }
  }

  async updateFull(params) {

    let transaction: Transaction;
    try {
      const prototype = params.foundPrototype;

      const { photos } = params;
      const { candidateFor, id: originalId } = prototype;

      let candidate: Platform;
      if (candidateFor)
        candidate = prototype;
      else {
        const data = prototype.get({ plain: true });
        delete data.id;
        candidate = new Platform({
          ...data,
          candidateFor: null,
          status: PlatformStatus.Pending,
          approved: false
        });
      }

      Object.assign(candidate, {
        ...params,
        foundPrototype: undefined,
        foundTmpPhotos: undefined
      });


      ///////////////////////
      // processing photos //
      ///////////////////////

      if (photos) {
        const oldPhotos = [...prototype.photos];
        const newPhotos: PlatformPhoto[] = [];

        for (const it of photos)
          newPhotos.push(oldPhotos.splice(it.index, 1)[0]);
        candidate.photos = newPhotos;
      }
      else
        candidate.photos = prototype.photos;

      ///////////////////////

      transaction = await db.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ });

      const candidateValue = <Platform>candidate.get()
      delete candidateValue.id;
      delete candidateValue.createdAt;
      delete candidateValue.updatedAt;
      console.log(candidateValue)
      console.log('------------------')
      console.log(params.id)
      await this.platformModel.update(candidateValue, { where: { id: params.id } });

      if (params.foundReqs || params.foundIncluded) {
        const types: PlatformFlagType[] = [];
        if (params.foundReqs)
          types.push(PlatformFlagType.Requirement);
        if (params.foundIncluded)
          types.push(PlatformFlagType.Included);

        const reqs = await this.platformPlatformFlagModel.findAll({
          where: ({ platformId: candidate.id }),
          include: [
            {
              model: PlatformFlag,
              where: ({ type: types })
            }
          ]
        });
        await this.platformPlatformFlagModel.destroy({
          where: ({
            flagId: reqs.map(r => r.flagId),
            platformId: candidate.id
          }),
          transaction
        });

        const flags = [...(params.foundReqs || []), ...(params.foundIncluded || [])].map(f => ({ id: f.id }));

        await this.platformPlatformFlagModel.bulkCreate(flags.map(({ id: flagId }) => ({
          platformId: candidate.id, flagId
        })), { transaction });

      }

      //   messager.sendMessage(MessageGroup.Admin, messageText.create(MessageType.PlatformUpdateRequest), { 
      //     bypassPermissions: true,
      //     gateways: [ MessageGateway.Vkontakte ]
      //   });

      await transaction.commit();

      return {
        meta: {
          success: true,
          message: 'Platform data updated',
        },
        data: null,
      };
    }
    catch (ex) {
      console.log(ex);
      if (transaction && (transaction as any).finished != 'commit') transaction.rollback();
      throw ex;
    }
  }

  search(query: string) {
    return this.platformModel.findAll({
      where: {
        name: {
          [Op.like]: `%${query}%`,
        }
      }
    });
  }

}
