import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FileDto } from '@app/user/dto/file.dto';
import { MessageEntity } from '@app/chat/message.entity';

@Entity('uploadEntity')
export class UploadEntity {
  @PrimaryGeneratedColumn('uuid')
  @Index({ unique: true })
  id: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  deletedAt: Date;

  @Column('jsonb', {
    nullable: true,
  })
  files: FileDto[];

  @OneToMany(() => MessageEntity, (message) => message.attachment, {
    eager: true,
  })
  message: MessageEntity;
}
