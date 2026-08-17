import { Injectable, BadRequestException } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { Readable } from 'stream';

export type CloudinaryResourceType = 'image' | 'raw' | 'video' | 'auto';

@Injectable()
export class CloudinaryService {
  uploadFile(
    file: Express.Multer.File,
    folder: string = 'documents',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      let resourceType: 'image' | 'raw' | 'video' = 'raw';

      if (file.mimetype === 'application/pdf') {
        resourceType = 'image';
      } else if (file.mimetype.startsWith('image/')) {
        resourceType = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        resourceType = 'video';
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
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
    resourceType: CloudinaryResourceType = 'raw',
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
    resourceType: CloudinaryResourceType = 'raw',
  ): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch (error) {
      console.error('Failed to delete file from Cloudinary:', error);
    }
  }
}
