import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  TableInheritance,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import { ObjectType, Field, ID, Int } from "type-graphql";
import { GenericEntity } from "./GenericEntity";
import { User } from "./User";
import { MessageType } from "./enums";

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

  @Column({ nullable: false })
  type: MessageType;

  @Field(() => String)
  @Column()
  content: string;

  @Field(() => Date)
  @Column()
  createdAt: Date;

  @Field(() => Date)
  @Column()
  updatedAt: Date;

  @ManyToOne(() => Message, (message) => message.children)
  parent: Message | string;

  @OneToMany(() => Message, (message) => message.parent)
  children: Message[];

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
