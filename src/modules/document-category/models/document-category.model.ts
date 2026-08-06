import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';

export interface DocumentCategoryAttributes {
  id: number;
  name: string;
}

export type DocumentCategoryCreationAttributes = Optional<
  DocumentCategoryAttributes,
  'id'
>;

@Table({
  tableName: 'document_categories',
  timestamps: true,
})
export class DocumentCategory extends Model<
  DocumentCategoryAttributes,
  DocumentCategoryCreationAttributes
> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare name: string;
}
