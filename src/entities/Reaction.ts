import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";
import { GenericEntity } from "./GenericEntity";
import { User } from "./User";
import { Message } from "./Message";

@Entity()
@ObjectType()
export class Reaction extends GenericEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => String)
  @Column()
  react: string;

  @Field(() => User)
  @ManyToOne(() => User)
  user: User | string;

  @ManyToOne(() => Message, (message) => message.reactions)
  message: Message | string;
}
