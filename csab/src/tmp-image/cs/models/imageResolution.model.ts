import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import TmpImage from "./tmpImage.model";


export enum ResolutionKey { Full, Thumbnail, Medium }

@Table
export class ImageResolution extends Model<ImageResolution> {
    @Column({
        allowNull: false,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @ForeignKey(() => TmpImage)
    tmpImageId!: number;

    @Column({
        allowNull: false,
        type: DataType.TINYINT({ unsigned: true }),
    })
    type!: ResolutionKey;

    @Column({
        allowNull: false,
    })
    url!: string;

    @Column({
        allowNull: false,
    })
    filename!: string;

    @BelongsTo(() => TmpImage, 'tmpImageId')
    tmpImage: TmpImage;
}

export default ImageResolution;