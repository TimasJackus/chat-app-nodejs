import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, Unique, Index } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";

@Entity()
@ObjectType()
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String)
  @Column()
  @Index({ unique: true })
  email: string;

  @Field(() => String)
  @Column()
  displayName: string;

  @Column({ length: 64 })
  password: string;

  @Field(() => String, { nullable: true })
  @Column({ length: 50, nullable: true })
  phoneNumber: string;

  @Field(() => String, { nullable: true })
  @Column({ length: 100, nullable: true })
  description: string;

  @Field(() => String, { nullable: true })
  @Column({ length: 256, nullable: true })
  imageUrl: string;

  static mapNullObjectsToList<T extends BaseEntity>(ids: string[], list: T[]) {
    return ids.map((id: string) => list.find((item: any) => item.id === id) || null);
  }

  // static findAndSelectByIds<T extends BaseEntity>(this: ObjectType<T>, ids: string[], options?: FindManyOptions<T>): Promise<T[]>;
  static async findAndSelectByIds<T extends BaseEntity>(ids: string[], select: (keyof T)[]) {
    const entities = await this.findByIds(ids, { select });
    return this.mapNullObjectsToList(ids, entities);
  };
}
