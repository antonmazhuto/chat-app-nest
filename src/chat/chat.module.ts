import { Module } from '@nestjs/common';
import { ChatGateway } from './gateway/chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from '@app/chat/conversation.entity';
import { ActiveConversationEntity } from '@app/chat/active-conversation.entity';
import { MessageEntity } from '@app/chat/message.entity';
import { AuthCacheService } from '@app/authentication/cache/authCache.service';
import { UserModule } from '@app/user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { ChatWsGuard } from '@app/chat/guards/chat-ws.guard';
import { ConversationNewService } from '@app/chat/services/conversation/conv.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationEntity,
      ActiveConversationEntity,
      MessageEntity,
    ]),
    UserModule,
  ],
  providers: [
    ChatGateway,
    ConversationNewService,
    // ConversationService,
    AuthCacheService,
    {
      provide: APP_GUARD,
      useClass: ChatWsGuard,
    },
  ],
})
export class ChatModule {}
