import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
    ManyToOne,
    TableInheritance,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';
import { GenericEntity } from './GenericEntity';
import { User } from './User';
import { MessageType } from './enums';

@Entity()
@ObjectType()
@TableInheritance({
    column: {
        name: 'type',
        type: 'varchar',
    },
})
export class Message extends GenericEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => User)
    @ManyToOne(() => User)
    sender: string | User;

    @Column({ nullable: false })
    type: MessageType;

    @Field(() => String)
    @Column()
    content: string;

    @ManyToOne(
        () => Message,
        message => message.replies
    )
    parent: Message;

    @OneToMany(
        () => Message,
        message => message.parent
    )
    replies: Message[];

    @Field(() => Date)
    @Column()
    createdAt: Date;

    @Field(() => Date)
    @Column()
    updatedAt: Date;

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
