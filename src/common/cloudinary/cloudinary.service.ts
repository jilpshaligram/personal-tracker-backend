import { Injectable, BadRequestException } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  uploadFile(
    file: Express.Multer.File,
    folder: string = 'documents',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);

            return reject(
              new BadRequestException(`Cloudinary Error: ${error.message}`),
            );
          }

          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  getViewUrl(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' = 'image',
  ): string {
    if (resourceType === 'raw') {
      return cloudinary.url(publicId, {
        resource_type: 'raw',
        type: 'upload',
        secure: true,
        flags: 'inline',
        format: 'pdf',
      });
    }

    return cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'upload',
      secure: true,
      flags: 'inline',
    });
  }

  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'image',
  ): Promise<void> {
    try {
      if (resourceType === 'auto') {
        await Promise.allSettled([
          cloudinary.uploader.destroy(publicId, { resource_type: 'image' }),
          cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }),
          cloudinary.uploader.destroy(publicId, { resource_type: 'video' }),
        ]);
        return;
      }
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch (error) {
      console.error('Failed to delete file from Cloudinary:', error);
    }
  }
}
