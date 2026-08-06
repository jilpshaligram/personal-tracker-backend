import { Injectable, BadRequestException } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  uploadPdf(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'documents',
          resource_type: 'raw', // Required for PDFs and non-image files
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
      // Convert buffer to stream and pipe to Cloudinary
      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async deletePdf(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (error) {
      console.error('Failed to delete file from Cloudinary:', error);
      // We don't throw here to prevent breaking document deletion if Cloudinary fails
    }
  }
}
