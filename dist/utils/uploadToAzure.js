"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBufferToAzure = uploadBufferToAzure;
const azureBlob_1 = require("../lib/azureBlob");
const uuid_1 = require("uuid");
async function uploadBufferToAzure(file) {
    if (!azureBlob_1.containerClient) {
        throw new Error('Azure Blob storage is not configured');
    }
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blobName = `uploads/${(0, uuid_1.v4)()}-${safeName}`;
    const blockBlobClient = azureBlob_1.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
    });
    return blockBlobClient.url;
}
