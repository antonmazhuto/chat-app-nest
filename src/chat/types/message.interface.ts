import { Conversation } from '@app/chat/types/conversation.interface';
import { UserEntity } from '@app/user/user.entity';

export interface Message {
  id?: number;
  message?: string;
  user?: UserEntity;
  conversation?: Conversation;
  createdAt?: Date;
}
