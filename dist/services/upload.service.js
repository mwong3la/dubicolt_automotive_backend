"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadService = exports.UploadService = void 0;
const AppError_1 = require("../errors/AppError");
const azureBlob_1 = require("../lib/azureBlob");
const uploadToAzure_1 = require("../utils/uploadToAzure");
class UploadService {
    async uploadImage(file) {
        if (!file) {
            throw new AppError_1.AppError(400, 'validation_error', 'No file provided', {
                file: ['Upload a file'],
            });
        }
        if (!(0, azureBlob_1.isAzureConfigured)()) {
            throw new AppError_1.AppError(503, 'storage_unavailable', 'Azure Blob storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING and AZURE_STORAGE_CONTAINER_NAME.');
        }
        const url = await (0, uploadToAzure_1.uploadBufferToAzure)(file);
        return { url, name: file.originalname, size: file.size, mime_type: file.mimetype };
    }
}
exports.UploadService = UploadService;
exports.uploadService = new UploadService();
