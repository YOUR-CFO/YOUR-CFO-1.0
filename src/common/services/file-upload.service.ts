import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FileUploadService {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('aws.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId'),
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey'),
      },
    });
    this.bucket = this.configService.get<string>('aws.s3Bucket');
  }

  async uploadFile(
    file: Express.Multer.File,
    organizationId: string,
    folder: string = 'documents',
  ): Promise<string> {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${crypto.randomUUID()}${fileExtension}`;
      const key = `${organizationId}/${folder}/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private',
      });

      await this.s3Client.send(command);
      return key;
    } catch (error) {
      throw new HttpException(
        `Failed to upload file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      throw new HttpException(
        `Failed to generate file URL: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new HttpException(
        `Failed to delete file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  validateFile(file: Express.Multer.File, allowedTypes: string[], maxSize: number): void {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    if (!allowedTypes.includes(file.mimetype)) {
      throw new HttpException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (file.size > maxSize) {
      throw new HttpException(
        `File size exceeds maximum allowed size of ${maxSize} bytes`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  generateFileKey(organizationId: string, folder: string, originalName: string): string {
    const fileExtension = path.extname(originalName);
    const fileName = `${crypto.randomUUID()}${fileExtension}`;
    return `${organizationId}/${folder}/${fileName}`;
  }
}