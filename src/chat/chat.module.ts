import { Module } from '@nestjs/common';
import { ChatGateway } from './gateway/chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from '@app/chat/conversation.entity';
import { ActiveConversationEntity } from '@app/chat/active-conversation.entity';
import { MessageEntity } from '@app/chat/message.entity';
import { AuthCacheService } from '@app/authentication/cache/authCache.service';
import { UserModule } from '@app/user/user.module';
import { ConversationNewService } from '@app/chat/services/conversation/conv.service';
import { ChatController } from '@app/chat/chat.controller';
import { UploadEntity } from '@app/files/Upload.entity';
import { ConfigModule } from '@nestjs/config';
import { ChatService } from '@app/chat/services/chat.service';
import { FilesService } from '@app/files/files.service';
import { FilesModule } from '@app/files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      ActiveConversationEntity,
      MessageEntity,
      UploadEntity,
    ]),
    UserModule,
    ConfigModule,
    FilesModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ConversationNewService,
    // ConversationService,
    AuthCacheService,
    ChatService,
  ],
})
export class ChatModule {}
