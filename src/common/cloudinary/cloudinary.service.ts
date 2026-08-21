import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    const cloudName =
      this.configService.get<string>('cloudinary.cloudName') ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      '';
    const apiKey =
      this.configService.get<string>('cloudinary.apiKey') ||
      process.env.CLOUDINARY_API_KEY ||
      '';
    const apiSecret =
      this.configService.get<string>('cloudinary.apiSecret') ||
      process.env.CLOUDINARY_API_SECRET ||
      '';

    const config: Record<string, unknown> = {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    };

    if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
      config.api_proxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
    }

    if (process.env.NODE_EXTRA_CA_CERTS) {
      config.agent_options = { ca: process.env.NODE_EXTRA_CA_CERTS };
    }

    cloudinary.config(config);
  }

  uploadFile(
    file: Express.Multer.File,
    folder: string = 'documents',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      if (!file || !file.buffer) {
        return reject(new BadRequestException('No file buffer provided'));
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return reject(
              new BadRequestException(
                `Cloudinary Error: ${error.message || 'Upload failed'}`,
              ),
            );
          }
          if (!result) {
            return reject(
              new BadRequestException(
                'Cloudinary upload returned empty response',
              ),
            );
          }
          resolve(result);
        },
      );

      uploadStream.on('error', (err) => {
        console.error('Cloudinary stream error:', err);
        reject(
          new BadRequestException(`Cloudinary stream error: ${err.message}`),
        );
      });

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

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
          error instanceof Error ? error.message : String(error);
        console.warn(
          `Cloudinary upload attempt ${attempt} failed:`,
          errorMessage,
        );

        if (attempt === maxRetries) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }

    throw lastError;
  }

  getViewUrl(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' = 'image',
    fallbackUrl?: string,
  ): string {
    if (
      fallbackUrl &&
      typeof fallbackUrl === 'string' &&
      fallbackUrl.startsWith('http')
    ) {
      return fallbackUrl;
    }
    if (!publicId) return fallbackUrl || '';
    if (publicId.startsWith('http')) return publicId;

    return cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'upload',
      secure: true,
    });
  }

  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'image',
  ): Promise<void> {
    if (!publicId) return;
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
