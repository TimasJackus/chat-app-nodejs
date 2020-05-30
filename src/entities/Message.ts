import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  TableInheritance,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { ObjectType, Field, ID, Int, Ctx } from "type-graphql";
import { GenericEntity } from "./GenericEntity";
import { User } from "./User";
import { MessageType } from "./enums";
import { Context } from "../graphql/types";
import { getMetadataStorage } from "type-graphql/dist/metadata/getMetadataStorage";
import { Reaction } from "./Reaction";

@Entity({ orderBy: { updatedAt: "ASC" } })
@ObjectType(MessageType.Reply)
@TableInheritance({
  column: {
    name: "type",
    type: "varchar",
    default: MessageType.Reply,
  },
})
export class Message extends GenericEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => User)
  @ManyToOne(() => User)
  sender: string | User;

  @Field(() => MessageType)
  @Column({ nullable: false })
  type: MessageType;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  content: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  imageUrl: string;

  @Field(() => Date)
  @Column()
  createdAt: Date;

  @Field(() => Date)
  @Column()
  updatedAt: Date;

  @ManyToOne(() => Message, (message) => message.children, {
    onDelete: "CASCADE",
  })
  parent: Message | string;

  @OneToMany(() => Message, (message) => message.parent)
  children: Message[];

  @ManyToMany(() => User)
  @JoinTable({ name: "messages_viewed" })
  viewedUsers: User[] | string[];

  @Field(() => Boolean)
  viewed: boolean;

  @Field(() => [Reaction], { nullable: true })
  @OneToMany(() => Reaction, (reaction) => reaction.message)
  reactions: Reaction[];

  @ManyToMany(() => User)
  @JoinTable({ name: "messages_pinned" })
  pinnedUsers: string[] | User[];

  @Field(() => Boolean)
  pinned: boolean;

  @Field(() => Int, { nullable: true })
  replyCount: number;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.updatedAt = new Date();
  }
}
