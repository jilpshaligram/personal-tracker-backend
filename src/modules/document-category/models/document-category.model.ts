import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';

export interface DocumentCategoryAttributes {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  deletedAt?: Date;
}

export type DocumentCategoryCreationAttributes = Optional<
  DocumentCategoryAttributes,
  'id' | 'deletedAt'
>;

@Table({
  tableName: 'document_categories',
  timestamps: true,
  paranoid: true,
})
export class DocumentCategory extends Model<
  DocumentCategoryAttributes,
  DocumentCategoryCreationAttributes
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
  declare name: string;

  @Column({
    type: DataType.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  })
  declare status: 'active' | 'inactive';

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare deletedAt: Date;
}
