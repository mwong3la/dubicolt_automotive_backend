import { AppError } from '../errors/AppError';
import { isAzureConfigured } from '../lib/azureBlob';
import { uploadBufferToAzure } from '../utils/uploadToAzure';

export class UploadService {
  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new AppError(400, 'validation_error', 'No file provided', {
        file: ['Upload a file'],
      });
    }
    if (!isAzureConfigured()) {
      throw new AppError(
        503,
        'storage_unavailable',
        'Azure Blob storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING and AZURE_STORAGE_CONTAINER_NAME.',
      );
    }
    const url = await uploadBufferToAzure(file);
    return { url, name: file.originalname, size: file.size, mime_type: file.mimetype };
  }
}

export const uploadService = new UploadService();
