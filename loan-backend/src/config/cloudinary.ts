import { v2 as cloudinary } from 'cloudinary';

import { env, requireEnv } from './env';

let configured = false;

function ensureConfigured() {
  if (configured) return;

  cloudinary.config({
    cloud_name: requireEnv('CLOUDINARY_CLOUD_NAME'),
    api_key: requireEnv('CLOUDINARY_API_KEY'),
    api_secret: requireEnv('CLOUDINARY_API_SECRET'),
    secure: true,
  });

  configured = true;
}

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

export async function uploadKycImage(args: {
  userId: string;
  kind: 'id_front' | 'id_back' | 'selfie';
  buffer: Buffer;
  mimetype?: string;
}): Promise<CloudinaryUploadResult> {
  ensureConfigured();

  const folder = `${env.CLOUDINARY_FOLDER}/${args.userId}`;
  const publicId = `${args.kind}_${Date.now()}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url || !result?.public_id) return reject(new Error('Cloudinary upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    stream.end(args.buffer);
  });
}

export default cloudinary;
