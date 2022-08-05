import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadEntity } from '@app/files/Upload.entity';
import { FilesService } from '@app/files/files.service';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Express } from 'express';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(UploadEntity)
    private readonly uploadRepository: Repository<UploadEntity>,
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {}

  async uploadPublicFile(files: Express.Multer.File[]) {
    const s3 = new S3();

    const uploadedFiles: S3.ManagedUpload.SendData[] = [];

    for (let i = 0; i < files.length; i++) {
      const fileToUpload = files[i];
      const uploadResult = await s3
        .upload({
          Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
          Body: fileToUpload.buffer,
          Key: `${uuid()}-${fileToUpload.originalname}`,
          ContentType: fileToUpload.mimetype,
        })
        .promise();
      uploadedFiles.push(uploadResult);
    }
    const newUpload = new UploadEntity();
    Object.assign(newUpload, {
      files: uploadedFiles.map(({ Key, Location }) => ({
        key: Key,
        url: Location,
      })),
    });
    return await this.uploadRepository.save(newUpload);
  }
}
