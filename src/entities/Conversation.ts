import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  TableInheritance,
  BeforeInsert,
} from "typeorm";
import {
  ObjectType,
  Field,
  ID,
  FieldResolver,
  Resolver,
  Root,
} from "type-graphql";
import { GenericEntity } from "./GenericEntity";
import { ConversationType } from "./enums/ConversationType";
import { User } from "./User";
import { Message } from "./Message";
import { ConversationMessage } from "./ConversationMessage";

@Entity()
@ObjectType()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Conversation extends GenericEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => ConversationType)
  @Column({ default: ConversationType.Group })
  type: ConversationType;

  @ManyToMany(() => User)
  @JoinTable({ name: "conversation_starred" })
  starredUsers: string[] | User[];

  @Field(() => Boolean)
  starred: boolean;

  @Field(() => Date)
  @Column()
  createdAt: Date;

  @Field(() => [User])
  @ManyToMany(() => User)
  @JoinTable({ name: "conversation_members" })
  members: User[] | string[];

  @OneToMany(() => ConversationMessage, (message) => message.conversation)
  messages: Message[];

  @BeforeInsert()
  setCreatedDate() {
    this.createdAt = new Date();
  }
}
