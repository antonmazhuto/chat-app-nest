import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ChatService } from '@app/chat/services/chat.service';
import { PaginationParams } from '@app/common/paginations-params';
import { ConversationNewService } from '@app/chat/services/conversation/conv.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly conversationService: ConversationNewService,
  ) {}

  @Post('file')
  @UseInterceptors(FilesInterceptor('files'))
  async addFile(@UploadedFiles() files: Express.Multer.File[]) {
    return this.chatService.uploadPublicFile(files);
  }

  @Post('messages')
  async getMessages(
    @Body('id') conversationId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return this.conversationService.getMessages({
      conversationId,
      options: { page, limit },
    });
  }
}
