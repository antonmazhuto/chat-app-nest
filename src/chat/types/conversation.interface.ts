import { UserEntity } from '@app/user/user.entity';

export interface Conversation {
  id?: number;
  users?: UserEntity[];
  lastUpdated?: Date;
}
