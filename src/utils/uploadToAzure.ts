import { containerClient } from '../lib/azureBlob';
import { v4 as uuidv4 } from 'uuid';

export async function uploadBufferToAzure(file: Express.Multer.File): Promise<string> {
  if (!containerClient) {
    throw new Error('Azure Blob storage is not configured');
  }
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const blobName = `uploads/${uuidv4()}-${safeName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  return blockBlobClient.url;
}
