"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImages = exports.uploadImage = void 0;
const upload_service_1 = require("../services/upload.service");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.uploadImage = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const file = req.file;
    const result = await upload_service_1.uploadService.uploadImage(file);
    res.status(201).json(result);
});
exports.uploadImages = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const files = req.files;
    if (!files?.length) {
        res.status(400).json({
            error: { code: 'validation_error', message: 'No files provided' },
        });
        return;
    }
    const data = await Promise.all(files.map((f) => upload_service_1.uploadService.uploadImage(f)));
    res.status(201).json({ data });
});
