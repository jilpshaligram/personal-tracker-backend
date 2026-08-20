import { v2 as cloudinary } from 'cloudinary';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider: Provider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),

      secure: true,
      api_proxy: process.env.HTTP_PROXY || process.env.HTTPS_PROXY,

      agent_options: process.env.NODE_EXTRA_CA_CERTS
        ? {
            ca: process.env.NODE_EXTRA_CA_CERTS,
          }
        : undefined,
    });
  },
};
