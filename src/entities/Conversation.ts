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
} from 'typeorm';
import { ObjectType, Field, ID } from 'type-graphql';
import { GenericEntity } from './GenericEntity';
import { ConversationType } from './enums/ConversationType';
import { User } from './User';
import { Message } from './Message';
import { ConversationMessage } from './ConversationMessage';

@Entity()
@ObjectType()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class Conversation extends GenericEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => ConversationType)
    @Column({ default: ConversationType.Group })
    type: ConversationType;

    @Field(() => Boolean)
    @Column({ default: false })
    starred: boolean;

    @Field(() => Date)
    @Column()
    createdAt: Date;

    @ManyToMany(() => User)
    @JoinTable({ name: 'conversation_members' })
    members: User[];

    @Field(() => [ConversationMessage])
    @OneToMany(
        () => ConversationMessage,
        message => message.conversation
    )
    messages: Message[];
}
