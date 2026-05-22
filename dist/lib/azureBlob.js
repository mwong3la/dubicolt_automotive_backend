"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.containerClient = void 0;
exports.isAzureConfigured = isAzureConfigured;
const storage_blob_1 = require("@azure/storage-blob");
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
let containerClient;
if (connectionString && containerName) {
    const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
    exports.containerClient = containerClient = blobServiceClient.getContainerClient(containerName);
}
else {
    console.warn('[Azure Blob] AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_CONTAINER_NAME missing');
}
function isAzureConfigured() {
    return !!containerClient;
}
