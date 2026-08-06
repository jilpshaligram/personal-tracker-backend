import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';

import { DocumentCategory } from '../../document-category/models/document-category.model';

export interface DocumentAttributes {
  id: number;
  userId: string;
  categoryId: number;
  title: string;
  expiryDate: Date;
  reminderDaysBefore: number;
  fileUrl: string;
  filePublicId: string;
}

export type DocumentCreationAttributes = Optional<DocumentAttributes, 'id'>;

@Table({
  tableName: 'documents',
  timestamps: true,
})
export class Document extends Model<
  DocumentAttributes,
  DocumentCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare userId: string;

  @ForeignKey(() => DocumentCategory)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare categoryId: number;

  @BelongsTo(() => DocumentCategory)
  declare category: DocumentCategory;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare expiryDate: Date;

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
}
