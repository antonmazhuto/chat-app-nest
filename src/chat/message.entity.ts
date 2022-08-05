import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ConversationEntity } from '@app/chat/conversation.entity';
import { UserEntity } from '@app/user/user.entity';
import { UploadEntity } from '@app/files/Upload.entity';

@Entity('message')
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.messages)
  user: UserEntity;

  @ManyToOne(
    () => ConversationEntity,
    (conversationEntity) => conversationEntity.messages,
  )
  conversation: ConversationEntity;

  @ManyToOne(() => UploadEntity, (upload) => upload.id, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  attachment: UploadEntity;

  @CreateDateColumn()
  createdAt: Date;
}
