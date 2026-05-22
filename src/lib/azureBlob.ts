import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

let containerClient: ContainerClient | undefined;

if (connectionString && containerName) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);
} else {
  console.warn('[Azure Blob] AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_CONTAINER_NAME missing');
}

export function isAzureConfigured(): boolean {
  return !!containerClient;
}

export { containerClient };
