import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { hash } from 'bcrypt';
import { ApiProperty } from '@nestjs/swagger';
import { PublicFile } from '../files/publicFile.entity';
import { Location } from '@app/location/location.entity';
import { ConversationEntity } from '@app/chat/conversation.entity';
import { MessageEntity } from '@app/chat/message.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ default: null })
  firstName: string;

  @Column({ default: null })
  lastName: string;

  @JoinColumn()
  @OneToOne(() => PublicFile, {
    eager: true,
    nullable: true,
  })
  public avatar?: PublicFile;

  @JoinColumn()
  @OneToOne(() => Location, {
    eager: true,
    nullable: true,
  })
  public location?: Location;

  @Column({ select: false, nullable: true })
  password: string;

  @BeforeInsert()
  async hashPassword() {
    this.password = await hash(this.password, 10);
  }

  @Column({ default: false })
  public isRegisteredWithGoogle: boolean;

  @ManyToMany(
    () => ConversationEntity,
    (conversationEntity) => conversationEntity.users,
  )
  conversations: ConversationEntity[];

  @OneToMany(() => MessageEntity, (messageEntity) => messageEntity.user)
  messages: MessageEntity[];
}
