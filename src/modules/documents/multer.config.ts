// import { memoryStorage } from 'multer';
// import { BadRequestException } from '@nestjs/common';
// import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

// export const multerDocumentOptions: MulterOptions = {
//   storage: memoryStorage(),
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10 MB
//   },
//   fileFilter: (_req, file, callback) => {
//     if (file.mimetype !== 'application/pdf') {
//       return callback(
//         new BadRequestException('Only PDF files are allowed'),
//         false,
//       );
//     }
//     callback(null, true);
//   },
// };
import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

const allowedMimeTypes = [
  // PDF
  'application/pdf',

  // Images
  'image/jpeg',
  'image/png',
  'image/webp',

  // Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  // Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  // PowerPoint
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Text
  'text/plain',
  'text/csv',
];

export const multerDocumentOptions: MulterOptions = {
  storage: memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Unsupported file type. Allowed: PDF, JPG, JPEG, PNG, WEBP, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV',
        ),
        false,
      );
    }

    callback(null, true);
  },
};
