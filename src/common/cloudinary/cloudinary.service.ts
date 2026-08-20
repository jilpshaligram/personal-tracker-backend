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

            // Handle SSL certificate errors specifically
            if (
              error.message.includes('unable to verify the first certificate')
            ) {
              return reject(
                new BadRequestException(
                  'Cloudinary SSL certificate verification failed. ' +
                    'This is likely due to missing system certificates or proxy/firewall settings. ' +
                    'Try setting NODE_TLS_REJECT_UNAUTHORIZED=0 (development only) or ' +
                    'adding --use-system-ca flag when starting Node.js.',
                ),
              );
            }

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

  /**
   * Alternative upload method that handles SSL issues
   */
  async uploadFileWithRetry(
    file: Express.Multer.File,
    folder: string = 'documents',
    maxRetries: number = 2,
  ): Promise<UploadApiResponse> {
    let lastError: unknown = new BadRequestException(
      'Cloudinary upload failed',
    );

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploadFile(file, folder);
      } catch (error: unknown) {
        lastError = error;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.warn(
          `Cloudinary upload attempt ${attempt} failed:`,
          errorMessage,
        );

        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }

    throw lastError;
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

  extractPublicId(url: string): string | null {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
      return null;
    }
    try {
      const parts = url.split('/upload/');
      if (parts.length < 2) return null;
      let path = parts[1];
      const versionMatch = path.match(/(?:v\d+\/)(.+)$/);
      if (versionMatch) {
        path = versionMatch[1];
      }
      path = path.split('?')[0].split('#')[0];
      const lastDotIndex = path.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        path = path.substring(0, lastDotIndex);
      }
      return path || null;
    } catch {
      return null;
    }
  }

  async deleteByUrl(
    url: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'image',
  ): Promise<void> {
    const publicId = this.extractPublicId(url);
    if (publicId) {
      await this.deleteFile(publicId, resourceType);
    }
  }
}
