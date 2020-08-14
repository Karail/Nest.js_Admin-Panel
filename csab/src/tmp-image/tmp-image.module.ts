import { Module } from '@nestjs/common';
import { TmpImageController } from './tmp-image.controller';
import { TmpImageService } from './tmp-image.service';
import { SequelizeModule } from '@nestjs/sequelize';
import TmpImage from 'src/tmp-image/cs/models/tmpImage.model';

@Module({
  imports: [SequelizeModule.forFeature([
    TmpImage,
  ])],
  controllers: [TmpImageController],
  providers: [TmpImageService]
})
export class TmpImageModule {}
