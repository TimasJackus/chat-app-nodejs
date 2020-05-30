import { Entity, Column, Index, PrimaryGeneratedColumn } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { GenericEntity } from "./GenericEntity";
@Entity()
@ObjectType()
export class User extends GenericEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
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

  @Field(() => Number)
  unreadCount: number;
}
