import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';

import { DocumentCategory } from '../../document-category/models/document-category.model';

export interface DocumentAttributes {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  expiryDate: Date | null;
  reminderDaysBefore: number;
  fileUrl: string;
  filePublicId: string;
  fileResourceType: 'image' | 'raw' | 'video';
}

export type DocumentCreationAttributes = Optional<
  DocumentAttributes,
  'id' | 'expiryDate'
>;

@Table({
  tableName: 'documents',
  timestamps: true,
  paranoid: true,
})
export class Document extends Model<
  DocumentAttributes,
  DocumentCreationAttributes
> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare userId: string;

  @ForeignKey(() => DocumentCategory)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare categoryId: string;

  @BelongsTo(() => DocumentCategory)
  declare category: DocumentCategory;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare expiryDate: Date | null;

  @Default(7)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare reminderDaysBefore: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare fileUrl: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare filePublicId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare fileResourceType: 'image' | 'raw' | 'video';

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare deletedAt: Date | null;
}
