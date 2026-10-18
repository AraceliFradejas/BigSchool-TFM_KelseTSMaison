import { v2 as cloudinary } from 'cloudinary';
import { HttpError } from '../http.js';

export function cloudinaryImageUrl(publicId, cloudName, folder) {
  if (
    !/^[a-zA-Z0-9_-]+$/.test(cloudName || '') ||
    !/^kelsets-maison(?:\/[a-zA-Z0-9_-]+)*$/.test(folder || '') ||
    !publicId?.startsWith(`${folder}/`) ||
    !/^kelsets-maison\/[a-zA-Z0-9/_-]+$/.test(publicId)
  )
    throw new HttpError(404, 'not_found');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.webp`;
}
export function createCloudinaryStorage(config, uploader = cloudinary.uploader) {
  const credentials = {
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
  };
  return {
    async upload(buffer, publicId) {
      cloudinaryImageUrl(publicId, config.cloudName, config.folder);
      try {
        return await new Promise((resolve, reject) => {
          uploader
            .upload_stream(
              {
                ...credentials,
                public_id: publicId,
                resource_type: 'image',
                format: 'webp',
                overwrite: false,
              },
              (error, result) => {
                if (error || result?.public_id !== publicId)
                  reject(new Error('Cloudinary upload failed'));
                else resolve(result);
              },
            )
            .end(buffer);
        });
      } catch {
        throw new HttpError(503, 'media_unavailable');
      }
    },
    async destroy(publicId) {
      cloudinaryImageUrl(publicId, config.cloudName, config.folder);
      await uploader.destroy(publicId, { ...credentials, resource_type: 'image' });
    },
  };
}
export async function fetchCloudinaryImage(record, config, fetchImage = fetch) {
  const url = cloudinaryImageUrl(record.publicId, config.cloudName, config.folder);
  try {
    const response = await fetchImage(url, {
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });
    const type = response.headers.get('content-type')?.split(';')[0];
    if (!response.ok || !['image/webp', 'image/jpeg', 'image/png'].includes(type)) {
      await response.body?.cancel();
      throw new Error('Invalid image response');
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 4 * 1024 * 1024) throw new Error('Image too large');
      chunks.push(Buffer.from(chunk));
    }
    if (!size) throw new Error('Empty image');
    return { buffer: Buffer.concat(chunks), type };
  } catch {
    throw new HttpError(503, 'media_unavailable');
  }
}
